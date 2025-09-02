# Production Server Setup Guide for Flow Motion Application

This guide provides comprehensive instructions for setting up production servers to deploy the Flow Motion application. It covers server requirements, operating system configuration, Docker setup, security hardening, and essential services configuration.

## Table of Contents

1. [Server Requirements and Specifications](#server-requirements-and-specifications)
2. [Operating System Setup](#operating-system-setup)
3. [Docker and Docker Compose Installation](#docker-and-docker-compose-installation)
4. [Security Hardening Procedures](#security-hardening-procedures)
5. [Firewall Configuration](#firewall-configuration)
6. [User Management and SSH Setup](#user-management-and-ssh-setup)

## Server Requirements and Specifications

### Minimum Hardware Requirements

- **CPU**: 2 vCPUs (4 vCPUs recommended for production)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 50GB SSD minimum (100GB recommended)
- **Network**: 1Gbps connection minimum

### Recommended Production Specifications

- **CPU**: 4-8 vCPUs
- **RAM**: 16-32GB
- **Storage**: 200GB+ SSD with RAID 1/10 configuration
- **Network**: 1-10Gbps connection

### Supported Operating Systems

- Ubuntu 20.04 LTS or later
- Ubuntu 22.04 LTS (recommended)
- Debian 11 or later
- CentOS 8 Stream or later
- RHEL 8 or later

## Operating System Setup

### Ubuntu/Debian Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop vim nano ufw fail2ban unattended-upgrades

# Configure automatic security updates
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Set timezone
sudo timedatectl set-timezone UTC

# Configure NTP for time synchronization
sudo apt install -y ntp
sudo systemctl enable ntp
sudo systemctl start ntp
```

### CentOS/RHEL Setup

```bash
# Update system packages
sudo yum update -y

# Install essential packages
sudo yum install -y curl wget git htop vim nano firewalld fail2ban

# Enable and start firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Configure automatic updates
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron

# Set timezone
sudo timedatectl set-timezone UTC

# Configure NTP
sudo yum install -y chrony
sudo systemctl enable chronyd
sudo systemctl start chronyd
```

## Docker and Docker Compose Installation

### Docker Installation

```bash
# Remove any existing Docker installations
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional, but recommended for development)
sudo usermod -aG docker $USER
```

### Docker Compose Installation

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Create symbolic link
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker-compose --version
```

## Security Hardening Procedures

### System Hardening

```bash
# Disable root login via SSH
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication (use key-based auth only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Configure SSH to use only protocol 2
sudo sed -i 's/#Protocol 2/Protocol 2/' /etc/ssh/sshd_config

# Set SSH client alive interval
sudo sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 60/' /etc/ssh/sshd_config
sudo sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 3/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart sshd

# Install and configure fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure fail2ban for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo sed -i 's/enabled = false/enabled = true/' /etc/fail2ban/jail.local

# Restart fail2ban
sudo systemctl restart fail2ban
```

### Kernel Hardening

```bash
# Configure sysctl for security
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF
# Disable IP forwarding
net.ipv4.ip_forward = 0

# Enable SYN cookies
net.ipv4.tcp_syncookies = 1

# Disable ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0

# Enable reverse path filtering
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Ignore ICMP broadcasts
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Enable logging of spoofed packets
net.ipv4.conf.all.log_martians = 1

# Disable IPv6 if not needed
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
EOF

# Apply sysctl changes
sudo sysctl -p
```

## Firewall Configuration

### UFW (Ubuntu/Debian)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (change port if using non-standard)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application-specific ports (adjust as needed)
sudo ufw allow 3000/tcp  # API Gateway
sudo ufw allow 5432/tcp  # PostgreSQL (if external access needed)
sudo ufw allow 6379/tcp  # Redis (if external access needed)

# Deny all other incoming traffic by default
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Reload firewall rules
sudo ufw reload

# Check status
sudo ufw status verbose
```

### firewalld (CentOS/RHEL)

```bash
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow application-specific ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --permanent --add-port=6379/tcp

# Reload firewall rules
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## User Management and SSH Setup

### Create Application User

```bash
# Create dedicated user for application
sudo useradd -m -s /bin/bash flowmotion
sudo usermod -aG docker flowmotion

# Set password for the user
sudo passwd flowmotion

# Create sudo group access (optional, for maintenance)
sudo usermod -aG sudo flowmotion
```

### SSH Key Setup

```bash
# Generate SSH key pair on your local machine
ssh-keygen -t rsa -b 4096 -C "flowmotion@production"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub flowmotion@your-server-ip

# Or manually add to authorized_keys
echo "your-public-key-here" | sudo tee -a /home/flowmotion/.ssh/authorized_keys

# Set proper permissions
sudo chown -R flowmotion:flowmotion /home/flowmotion/.ssh
sudo chmod 700 /home/flowmotion/.ssh
sudo chmod 600 /home/flowmotion/.ssh/authorized_keys
```

### SSH Configuration for Application User

```bash
# Switch to application user
su - flowmotion

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add authorized keys (if not done above)
echo "your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Disable Password Authentication

After confirming key-based authentication works:

```bash
# Edit SSH configuration
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart sshd
```

## Next Steps

After completing the server setup:

1. Proceed to [Cloud Provider Deployments](../docs/CLOUD_PROVIDER_DEPLOYMENTS.md)
2. Configure [Production Environment](../docs/PRODUCTION_ENVIRONMENT_CONFIG.md)
3. Set up [Deployment Automation](../scripts/README.md)

## Troubleshooting

### Common Issues

1. **SSH Connection Refused**: Check firewall rules and SSH service status
2. **Docker Permission Denied**: Ensure user is in docker group and restart session
3. **Firewall Blocking Traffic**: Verify UFW/firewalld rules and reload configuration

### Logs to Check

- SSH: `/var/log/auth.log` (Ubuntu) or `/var/log/secure` (CentOS)
- Docker: `docker logs <container_name>`
- System: `journalctl -u sshd` or `journalctl -u docker`

## Security Checklist

- [ ] Root login disabled
- [ ] Password authentication disabled
- [ ] SSH key authentication configured
- [ ] Firewall enabled with minimal ports open
- [ ] Fail2ban configured and running
- [ ] Automatic updates enabled
- [ ] Sysctl security parameters applied
- [ ] Docker installed and configured
- [ ] Application user created with proper permissions