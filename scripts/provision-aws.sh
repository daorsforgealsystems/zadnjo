#!/bin/bash
# AWS Server Provisioning Script for Flow Motion
# Provisions EC2 instances and configures them for production deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.medium}
REGION=${REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}
SSH_KEY_NAME=${SSH_KEY_NAME:-flowmotion-prod}
SECURITY_GROUP_NAME=${SECURITY_GROUP_NAME:-flowmotion-sg}
INSTANCE_NAME=${INSTANCE_NAME:-flowmotion-prod}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Validation functions
validate_aws_cli() {
    log_info "Validating AWS CLI configuration..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured or credentials are invalid"
        exit 1
    fi

    log_success "AWS CLI is configured correctly"
}

validate_ssh_key() {
    log_info "Validating SSH key..."

    if ! aws ec2 describe-key-pairs --key-names "$SSH_KEY_NAME" &> /dev/null; then
        log_error "SSH key '$SSH_KEY_NAME' not found in AWS"
        log_info "Please create the key pair first:"
        log_info "  aws ec2 create-key-pair --key-name $SSH_KEY_NAME --query 'KeyMaterial' --output text > ~/.ssh/${SSH_KEY_NAME}.pem"
        log_info "  chmod 400 ~/.ssh/${SSH_KEY_NAME}.pem"
        exit 1
    fi

    log_success "SSH key '$SSH_KEY_NAME' found"
}

# Provisioning functions
create_vpc() {
    log_info "Creating VPC..."

    local vpc_id=$(aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --region "$REGION" \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=flowmotion-vpc},{Key=Environment,Value=$ENVIRONMENT}]" \
        --query 'Vpc.VpcId' \
        --output text)

    log_success "Created VPC: $vpc_id"

    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute \
        --vpc-id "$vpc_id" \
        --enable-dns-hostnames

    # Create and attach internet gateway
    local igw_id=$(aws ec2 create-internet-gateway \
        --region "$REGION" \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=flowmotion-igw}]" \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)

    aws ec2 attach-internet-gateway \
        --vpc-id "$vpc_id" \
        --internet-gateway-id "$igw_id"

    # Create subnet
    local subnet_id=$(aws ec2 create-subnet \
        --vpc-id "$vpc_id" \
        --cidr-block 10.0.1.0/24 \
        --availability-zone "${REGION}a" \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=flowmotion-subnet}]" \
        --query 'Subnet.SubnetId' \
        --output text)

    # Create route table
    local route_table_id=$(aws ec2 create-route-table \
        --vpc-id "$vpc_id" \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=flowmotion-rt}]" \
        --query 'RouteTable.RouteTableId' \
        --output text)

    # Create route to internet gateway
    aws ec2 create-route \
        --route-table-id "$route_table_id" \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id "$igw_id"

    # Associate route table with subnet
    aws ec2 associate-route-table \
        --subnet-id "$subnet_id" \
        --route-table-id "$route_table_id"

    echo "$vpc_id:$subnet_id"
}

create_security_group() {
    local vpc_id=$1

    log_info "Creating security group..."

    local sg_id=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for Flow Motion production" \
        --vpc-id "$vpc_id" \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=$SECURITY_GROUP_NAME}]" \
        --query 'GroupId' \
        --output text)

    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --description "SSH access"

    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --description "HTTP access"

    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --description "HTTPS access"

    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp \
        --port 3000 \
        --cidr 10.0.0.0/16 \
        --description "API Gateway"

    log_success "Created security group: $sg_id"
    echo "$sg_id"
}

launch_ec2_instance() {
    local subnet_id=$1
    local sg_id=$2

    log_info "Launching EC2 instance..."

    # Get latest Ubuntu 22.04 AMI
    local ami_id=$(aws ec2 describe-images \
        --owners 099720109477 \
        --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
        --output text)

    log_info "Using AMI: $ami_id"

    # Create user data script
    local user_data_file=$(mktemp)
    cat > "$user_data_file" << 'EOF'
#!/bin/bash
# Cloud-init script for Flow Motion server setup

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git htop vim ufw fail2ban unattended-upgrades

# Configure firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/flowmotion
chown ubuntu:ubuntu /opt/flowmotion

# Configure automatic updates
dpkg-reconfigure --priority=low unattended-upgrades

# Install monitoring agent (CloudWatch)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb

# Create CloudWatch config
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "flowmotion-syslog",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
CWEOF

# Start CloudWatch agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

echo "Server setup completed successfully"
EOF

    # Launch instance
    local instance_id=$(aws ec2 run-instances \
        --image-id "$ami_id" \
        --count 1 \
        --instance-type "$INSTANCE_TYPE" \
        --key-name "$SSH_KEY_NAME" \
        --security-group-ids "$sg_id" \
        --subnet-id "$subnet_id" \
        --associate-public-ip-address \
        --user-data "file://$user_data_file" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Environment,Value=$ENVIRONMENT}]" \
        --query 'Instances[0].InstanceId' \
        --output text)

    # Clean up user data file
    rm "$user_data_file"

    log_success "Launched EC2 instance: $instance_id"
    echo "$instance_id"
}

wait_for_instance_ready() {
    local instance_id=$1

    log_info "Waiting for instance to be running..."

    aws ec2 wait instance-running --instance-ids "$instance_id"

    # Get public IP
    local public_ip=$(aws ec2 describe-instances \
        --instance-ids "$instance_id" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)

    log_success "Instance is running with public IP: $public_ip"

    # Wait for SSH to be available
    log_info "Waiting for SSH to be available..."
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if nc -z -w5 "$public_ip" 22; then
            log_success "SSH is available on $public_ip"
            break
        fi

        log_info "Waiting for SSH... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    if [[ $attempt -gt $max_attempts ]]; then
        log_error "SSH did not become available within timeout"
        exit 1
    fi

    echo "$public_ip"
}

configure_instance() {
    local public_ip=$1
    local instance_id=$2

    log_info "Configuring instance..."

    # Copy SSH key for easier access
    local ssh_key_file="$HOME/.ssh/${SSH_KEY_NAME}.pem"
    if [[ ! -f "$ssh_key_file" ]]; then
        log_error "SSH key file not found: $ssh_key_file"
        exit 1
    fi

    # Test SSH connection and run configuration
    ssh -i "$ssh_key_file" \
        -o StrictHostKeyChecking=no \
        -o ConnectTimeout=30 \
        "ubuntu@$public_ip" << 'EOF'
        echo "Testing SSH connection..."
        whoami
        pwd
        docker --version
        docker-compose --version
        echo "Instance configuration completed"
EOF

    log_success "Instance configured successfully"
}

create_dns_record() {
    local public_ip=$1
    local domain_name=${DOMAIN_NAME:-}

    if [[ -z "$domain_name" ]]; then
        log_info "No domain name specified, skipping DNS configuration"
        return 0
    fi

    log_info "Creating DNS record for $domain_name..."

    # This would typically use Route 53 or another DNS provider
    # For now, just log the required configuration
    log_info "Please create the following DNS records:"
    log_info "  A record: $domain_name -> $public_ip"
    log_info "  A record: www.$domain_name -> $public_ip"
}

generate_inventory() {
    local instance_id=$1
    local public_ip=$2

    log_info "Generating Ansible inventory..."

    local inventory_file="inventory/aws"
    mkdir -p "$(dirname "$inventory_file")"

    cat > "$inventory_file" << EOF
[flowmotion_servers]
flowmotion-prod ansible_host=$public_ip ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/${SSH_KEY_NAME}.pem

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF

    log_success "Ansible inventory created: $inventory_file"
}

# Main provisioning function
main() {
    log_info "Starting AWS server provisioning for Flow Motion..."
    log_info "Region: $REGION"
    log_info "Instance Type: $INSTANCE_TYPE"
    log_info "Environment: $ENVIRONMENT"

    # Validate prerequisites
    validate_aws_cli
    validate_ssh_key

    # Create VPC and networking
    log_info "Setting up networking..."
    IFS=':' read -r vpc_id subnet_id <<< "$(create_vpc)"

    # Create security group
    sg_id=$(create_security_group "$vpc_id")

    # Launch EC2 instance
    instance_id=$(launch_ec2_instance "$subnet_id" "$sg_id")

    # Wait for instance to be ready
    public_ip=$(wait_for_instance_ready "$instance_id")

    # Configure instance
    configure_instance "$public_ip" "$instance_id"

    # Create DNS records if domain specified
    create_dns_record "$public_ip"

    # Generate Ansible inventory
    generate_inventory "$instance_id" "$public_ip"

    # Output results
    log_success "AWS server provisioning completed successfully! 🎉"
    echo ""
    echo "Provisioned Resources:"
    echo "  Instance ID: $instance_id"
    echo "  Public IP: $public_ip"
    echo "  VPC ID: $vpc_id"
    echo "  Subnet ID: $subnet_id"
    echo "  Security Group: $sg_id"
    echo ""
    echo "Next Steps:"
    echo "1. Update your DNS records to point to $public_ip"
    echo "2. Run Ansible playbook: ansible-playbook -i inventory/aws playbook.yml"
    echo "3. Deploy application: scp -i ~/.ssh/${SSH_KEY_NAME}.pem docker-compose.yml ubuntu@$public_ip:/opt/flowmotion/"
    echo "4. SSH into server: ssh -i ~/.ssh/${SSH_KEY_NAME}.pem ubuntu@$public_ip"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --instance-type=*)
            INSTANCE_TYPE="${1#*=}"
            shift
            ;;
        --region=*)
            REGION="${1#*=}"
            shift
            ;;
        --environment=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        --ssh-key=*)
            SSH_KEY_NAME="${1#*=}"
            shift
            ;;
        --domain=*)
            DOMAIN_NAME="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --instance-type=TYPE   EC2 instance type (default: t3.medium)"
            echo "  --region=REGION        AWS region (default: us-east-1)"
            echo "  --environment=ENV      Environment name (default: production)"
            echo "  --ssh-key=KEYNAME      SSH key pair name (default: flowmotion-prod)"
            echo "  --domain=DOMAIN        Domain name for DNS configuration"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run provisioning
main "$@"