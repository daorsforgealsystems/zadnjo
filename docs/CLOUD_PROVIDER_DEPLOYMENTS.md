# Cloud Provider Deployments for Flow Motion Application

This guide provides detailed instructions for deploying the Flow Motion application across major cloud providers. Each section includes setup procedures, security configurations, and automated provisioning scripts.

## Table of Contents

1. [AWS EC2 Setup](#aws-ec2-setup)
2. [DigitalOcean Droplet Configuration](#digitalocean-droplet-configuration)
3. [Google Cloud Compute Engine](#google-cloud-compute-engine)
4. [Azure Virtual Machines](#azure-virtual-machines)
5. [Automated Server Provisioning](#automated-server-provisioning)

## AWS EC2 Setup

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- SSH key pair

### EC2 Instance Setup

```bash
# Configure AWS CLI (if not already done)
aws configure

# Create VPC (if needed)
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=flowmotion-vpc}]'

# Create subnet
aws ec2 create-subnet --vpc-id vpc-xxxxxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a

# Create Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxxxxxxx --internet-gateway-id igw-xxxxxxxx

# Create security group
aws ec2 create-security-group --group-name flowmotion-sg --description "Flow Motion Security Group" --vpc-id vpc-xxxxxxxx

# Add security group rules
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 22 --cidr 0.0.0.0/0 --description "SSH"
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0 --description "HTTP"
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0 --description "HTTPS"
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxx --protocol tcp --port 3000 --cidr 10.0.0.0/16 --description "API Gateway"

# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --count 1 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=flowmotion-prod}]' \
  --user-data file://ec2-userdata.sh
```

### EC2 User Data Script (ec2-userdata.sh)

```bash
#!/bin/bash
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
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/flowmotion
chown ubuntu:ubuntu /opt/flowmotion

# Configure automatic updates
dpkg-reconfigure --priority=low unattended-upgrades
```

### AWS Security Best Practices

```bash
# Create IAM role for EC2
aws iam create-role --role-name FlowMotionEC2Role --assume-role-policy-document file://ec2-trust-policy.json

# Attach policies
aws iam attach-role-policy --role-name FlowMotionEC2Role --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess
aws iam attach-role-policy --role-name FlowMotionEC2Role --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Create instance profile
aws iam create-instance-profile --instance-profile-name FlowMotionInstanceProfile
aws iam add-role-to-instance-profile --instance-profile-name FlowMotionInstanceProfile --role-name FlowMotionEC2Role
```

## DigitalOcean Droplet Configuration

### Prerequisites

- DigitalOcean account
- doctl CLI installed and authenticated

### Droplet Setup

```bash
# Create SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -C "flowmotion@digitalocean"

# Add SSH key to DigitalOcean
doctl compute ssh-key create flowmotion-key --public-key "$(cat ~/.ssh/id_rsa.pub)"

# Create droplet
doctl compute droplet create flowmotion-prod \
  --region nyc3 \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --ssh-keys flowmotion-key \
  --user-data-file droplet-userdata.sh \
  --wait

# Get droplet IP
doctl compute droplet list
```

### User Data Script (droplet-userdata.sh)

```bash
#!/bin/bash
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
usermod -aG docker root

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/flowmotion

# Configure automatic updates
dpkg-reconfigure --priority=low unattended-upgrades

# Install monitoring agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | bash
```

### DigitalOcean Security Features

```bash
# Enable monitoring
doctl compute droplet-action enable-monitoring <droplet-id>

# Create firewall
doctl compute firewall create \
  --name flowmotion-fw \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0 protocol:tcp,ports:80,address:0.0.0.0/0 protocol:tcp,ports:443,address:0.0.0.0/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0 protocol:udp,ports:all,address:0.0.0.0/0 protocol:icmp,address:0.0.0.0/0"

# Assign firewall to droplet
doctl compute firewall add-droplets <firewall-id> --droplet-ids <droplet-id>
```

## Google Cloud Compute Engine

### Prerequisites

- Google Cloud Project
- gcloud CLI installed and authenticated
- Service account with appropriate permissions

### GCE Instance Setup

```bash
# Set project
gcloud config set project your-project-id

# Create VPC network
gcloud compute networks create flowmotion-network --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create flowmotion-subnet \
  --network flowmotion-network \
  --region us-central1 \
  --range 10.0.0.0/24

# Create firewall rules
gcloud compute firewall-rules create allow-ssh \
  --network flowmotion-network \
  --allow tcp:22 \
  --source-ranges 0.0.0.0/0

gcloud compute firewall-rules create allow-http \
  --network flowmotion-network \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0

gcloud compute firewall-rules create allow-https \
  --network flowmotion-network \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0

# Create VM instance
gcloud compute instances create flowmotion-prod \
  --zone us-central1-a \
  --machine-type e2-medium \
  --network flowmotion-network \
  --subnet flowmotion-subnet \
  --maintenance-policy MIGRATE \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 100GB \
  --boot-disk-type pd-standard \
  --boot-disk-device-name flowmotion-prod \
  --metadata-from-file startup-script=gce-startup.sh \
  --tags flowmotion-server
```

### Startup Script (gce-startup.sh)

```bash
#!/bin/bash
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
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/flowmotion
chown $USER:$USER /opt/flowmotion

# Configure automatic updates
dpkg-reconfigure --priority=low unattended-upgrades

# Install Google Cloud monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
bash add-monitoring-agent-repo.sh
apt install -y stackdriver-agent
```

### Google Cloud Security

```bash
# Create service account
gcloud iam service-accounts create flowmotion-sa \
  --description="Service account for Flow Motion application" \
  --display-name="Flow Motion Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:flowmotion-sa@your-project-id.iam.gserviceaccount.com" \
  --role="roles/monitoring.metricWriter"

# Create instance template with service account
gcloud compute instance-templates create flowmotion-template \
  --machine-type e2-medium \
  --network flowmotion-network \
  --subnet flowmotion-subnet \
  --maintenance-policy MIGRATE \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 100GB \
  --service-account flowmotion-sa@your-project-id.iam.gserviceaccount.com \
  --scopes https://www.googleapis.com/auth/cloud-platform \
  --metadata-from-file startup-script=gce-startup.sh \
  --tags flowmotion-server
```

## Azure Virtual Machines

### Prerequisites

- Azure subscription
- Azure CLI installed and authenticated

### Azure VM Setup

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name flowmotion-rg --location eastus

# Create virtual network
az network vnet create \
  --resource-group flowmotion-rg \
  --name flowmotion-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name flowmotion-subnet \
  --subnet-prefix 10.0.0.0/24

# Create NSG (Network Security Group)
az network nsg create \
  --resource-group flowmotion-rg \
  --name flowmotion-nsg

# Add NSG rules
az network nsg rule create \
  --resource-group flowmotion-rg \
  --nsg-name flowmotion-nsg \
  --name allow-ssh \
  --priority 100 \
  --destination-port-ranges 22 \
  --access Allow \
  --protocol Tcp

az network nsg rule create \
  --resource-group flowmotion-rg \
  --nsg-name flowmotion-nsg \
  --name allow-http \
  --priority 101 \
  --destination-port-ranges 80 \
  --access Allow \
  --protocol Tcp

az network nsg rule create \
  --resource-group flowmotion-rg \
  --nsg-name flowmotion-nsg \
  --name allow-https \
  --priority 102 \
  --destination-port-ranges 443 \
  --access Allow \
  --protocol Tcp

# Create VM
az vm create \
  --resource-group flowmotion-rg \
  --name flowmotion-prod \
  --image Ubuntu2204 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --vnet-name flowmotion-vnet \
  --subnet flowmotion-subnet \
  --nsg flowmotion-nsg \
  --size Standard_B2s \
  --custom-data azure-userdata.sh \
  --storage-sku Standard_LRS
```

### Custom Data Script (azure-userdata.sh)

```bash
#!/bin/bash
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
usermod -aG docker azureuser

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/flowmotion
chown azureuser:azureuser /opt/flowmotion

# Configure automatic updates
dpkg-reconfigure --priority=low unattended-upgrades

# Install Azure monitoring agent
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
apt update
apt install -y azure-monitor-agent
```

### Azure Security Features

```bash
# Enable Azure Security Center
az security pricing create \
  --name VirtualMachines \
  --tier Standard

# Create managed identity
az identity create \
  --name flowmotion-identity \
  --resource-group flowmotion-rg

# Assign role to VM
az vm identity assign \
  --resource-group flowmotion-rg \
  --name flowmotion-prod \
  --identities flowmotion-identity

# Enable backup
az backup protection enable-for-vm \
  --resource-group flowmotion-rg \
  --vault-name flowmotion-backup-vault \
  --vm flowmotion-prod \
  --policy-name DefaultPolicy
```

## Automated Server Provisioning

### Terraform Configuration

Create a `terraform/` directory with the following files:

#### main.tf

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# AWS Provider
provider "aws" {
  region = var.aws_region
}

# DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Google Cloud Provider
provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

# Azure Provider
provider "azurerm" {
  features {}
}

# Modules for each provider
module "aws_ec2" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  source = "./modules/aws"
  
  instance_type = var.instance_type
  key_name      = var.ssh_key_name
}

module "digitalocean_droplet" {
  count  = var.cloud_provider == "digitalocean" ? 1 : 0
  source = "./modules/digitalocean"
  
  droplet_size = var.droplet_size
  ssh_key_name = var.ssh_key_name
}

module "gcp_compute" {
  count  = var.cloud_provider == "gcp" ? 1 : 0
  source = "./modules/gcp"
  
  machine_type = var.machine_type
  zone         = var.gcp_zone
}

module "azure_vm" {
  count  = var.cloud_provider == "azure" ? 1 : 0
  source = "./modules/azure"
  
  vm_size = var.vm_size
  location = var.azure_location
}
```

#### variables.tf

```hcl
variable "cloud_provider" {
  description = "Cloud provider to use (aws, digitalocean, gcp, azure)"
  type        = string
  default     = "aws"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "gcp_project" {
  description = "Google Cloud project ID"
  type        = string
}

variable "gcp_region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "Google Cloud zone"
  type        = string
  default     = "us-central1-a"
}

variable "azure_location" {
  description = "Azure location"
  type        = string
  default     = "East US"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "droplet_size" {
  description = "DigitalOcean droplet size"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "machine_type" {
  description = "GCP machine type"
  type        = string
  default     = "e2-medium"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_B2s"
}

variable "ssh_key_name" {
  description = "SSH key name"
  type        = string
}
```

### Ansible Playbook for Configuration

Create `ansible/` directory with the following files:

#### inventory.ini

```ini
[flowmotion_servers]
server1 ansible_host=your-server-ip ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[all:vars]
ansible_python_interpreter=/usr/bin/python3
```

#### playbook.yml

```yaml
---
- name: Configure Flow Motion Production Server
  hosts: flowmotion_servers
  become: yes
  vars:
    app_name: flowmotion
    app_dir: /opt/flowmotion
    docker_compose_version: v2.18.1

  tasks:
    - name: Update system packages
      apt:
        update_cache: yes
        upgrade: dist

    - name: Install essential packages
      apt:
        name:
          - curl
          - wget
          - git
          - htop
          - vim
          - ufw
          - fail2ban
          - unattended-upgrades
        state: present

    - name: Configure UFW firewall
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - 22
        - 80
        - 443

    - name: Enable UFW
      ufw:
        state: enabled

    - name: Install Docker
      include_role:
        name: docker

    - name: Create application directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ ansible_user }}"
        group: "{{ ansible_user }}"
        mode: '0755'

    - name: Configure automatic updates
      command: dpkg-reconfigure --priority=low unattended-upgrades

    - name: Copy application files
      copy:
        src: "{{ item.src }}"
        dest: "{{ item.dest }}"
        owner: "{{ ansible_user }}"
        group: "{{ ansible_user }}"
      loop:
        - { src: "docker-compose.yml", dest: "{{ app_dir }}/docker-compose.yml" }
        - { src: ".env.prod", dest: "{{ app_dir }}/.env" }

    - name: Start application
      docker_compose:
        project_src: "{{ app_dir }}"
        state: present
      become_user: "{{ ansible_user }}"
```

### Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

# Configuration
CLOUD_PROVIDER=${1:-aws}
ENVIRONMENT=${2:-production}
SSH_KEY_PATH=${3:-~/.ssh/id_rsa}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Flow Motion deployment to $CLOUD_PROVIDER...${NC}"

# Validate inputs
if [[ ! -f "$SSH_KEY_PATH" ]]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY_PATH${NC}"
    exit 1
fi

# Provision infrastructure
echo -e "${YELLOW}Provisioning infrastructure...${NC}"
cd terraform
terraform init
terraform plan -var="cloud_provider=$CLOUD_PROVIDER" -out=tfplan
terraform apply tfplan

# Get server IP
SERVER_IP=$(terraform output -json | jq -r '.server_ip.value')

# Wait for server to be ready
echo -e "${YELLOW}Waiting for server to be ready...${NC}"
sleep 60

# Configure server with Ansible
echo -e "${YELLOW}Configuring server...${NC}"
cd ../ansible
ansible-playbook -i inventory.ini playbook.yml --extra-vars "server_ip=$SERVER_IP"

# Deploy application
echo -e "${YELLOW}Deploying application...${NC}"
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ubuntu@$SERVER_IP << EOF
cd /opt/flowmotion
docker-compose pull
docker-compose up -d
docker-compose logs -f
EOF

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is running at: http://$SERVER_IP${NC}"
```

## Next Steps

After completing cloud provider setup:

1. Configure [Production Environment](../docs/PRODUCTION_ENVIRONMENT_CONFIG.md)
2. Set up [Monitoring and Logging](../docs/MONITORING_SETUP.md)
3. Configure [SSL Certificates](../docs/SSL_CERTIFICATE_SETUP.md)

## Cost Optimization

### AWS Cost Optimization

- Use Reserved Instances for predictable workloads
- Implement Auto Scaling groups
- Use Spot Instances for non-critical workloads
- Enable Cost Allocation Tags

### DigitalOcean Cost Optimization

- Choose appropriate droplet sizes
- Use monitoring to right-size instances
- Take advantage of volume discounts
- Use DigitalOcean's cost calculator

### Google Cloud Cost Optimization

- Use Committed Use Discounts
- Implement sustained use discounts
- Choose appropriate machine types
- Use preemptible VMs for batch workloads

### Azure Cost Optimization

- Use Reserved VM Instances
- Implement Azure Hybrid Benefit
- Choose appropriate VM sizes
- Use Azure Cost Management tools

## Monitoring and Alerting

Each cloud provider offers monitoring solutions:

- **AWS**: CloudWatch
- **DigitalOcean**: DigitalOcean Monitoring
- **Google Cloud**: Cloud Monitoring
- **Azure**: Azure Monitor

Configure alerts for:
- CPU utilization > 80%
- Memory usage > 85%
- Disk space < 10% available
- Application response time > 5 seconds
- Error rates > 5%

## Backup and Disaster Recovery

### Automated Backups

```bash
# AWS Backup
aws backup create-backup-plan --backup-plan file://backup-plan.json

# DigitalOcean Snapshots
doctl compute droplet-action snapshot <droplet-id> --name "flowmotion-backup-$(date +%Y%m%d)"

# Google Cloud Snapshots
gcloud compute disks snapshot flowmotion-disk --snapshot-names "flowmotion-backup-$(date +%Y%m%d)"

# Azure Backup
az backup protection backup-now --resource-group flowmotion-rg --vault-name flowmotion-backup-vault --container-name flowmotion-vm --item-name flowmotion-prod
```

### Disaster Recovery

- Implement multi-region deployments
- Set up automated failover
- Regular backup testing
- Document recovery procedures