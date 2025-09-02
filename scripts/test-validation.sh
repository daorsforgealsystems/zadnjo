#!/bin/bash

# Test script for validation functions

# Function to validate UUID format
validate_uuid() {
    if [[ $1 =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate URL format
validate_url() {
    if [[ $1 =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate SSH key format
validate_ssh_key() {
    if [[ $1 =~ ^-----BEGIN ]]; then
        return 0
    else
        return 1
    fi
}

echo "Testing validation functions..."

# Test UUID validation
echo "UUID Tests:"
validate_uuid "12345678-1234-1234-1234-123456789abc" && echo "✅ Valid UUID" || echo "❌ Invalid UUID"
validate_uuid "invalid-uuid" && echo "✅ Valid UUID" || echo "❌ Invalid UUID"

# Test URL validation
echo -e "\nURL Tests:"
validate_url "https://example.com" && echo "✅ Valid URL" || echo "❌ Invalid URL"
validate_url "http://example.com" && echo "✅ Valid URL" || echo "❌ Invalid URL"
validate_url "not-a-url" && echo "✅ Valid URL" || echo "❌ Invalid URL"

# Test SSH key validation
echo -e "\nSSH Key Tests:"
validate_ssh_key "-----BEGIN OPENSSH PRIVATE KEY-----" && echo "✅ Valid SSH key" || echo "❌ Invalid SSH key"
validate_ssh_key "not-an-ssh-key" && echo "✅ Valid SSH key" || echo "❌ Invalid SSH key"

echo -e "\n✅ All validation tests completed!"