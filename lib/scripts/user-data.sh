#!/bin/bash

# Update OS
apt-get update
apt-get -y upgrade

# Install Tinyproxy and tmux
apt-get install tinyproxy tmux
echo "Allow ${INGRESS_IP}" >> /etc/tinyproxy/tinyproxy.conf

# Enable Tinyproxy
systemctl enable tinyproxy
systemctl restart tinyproxy