#!/usr/bin/env bash
# UFW firewall rules draft for Dualens.
# Review allowed SSH source ranges before use. Do not run blindly.

set -euo pipefail

ADMIN_CIDR="${ADMIN_CIDR:-203.0.113.10/32}"

ufw default deny incoming
ufw default allow outgoing

# Restrict SSH to trusted admin networks only.
ufw allow from "${ADMIN_CIDR}" to any port 22 proto tcp

# Public web entry points.
ufw allow 80/tcp
ufw allow 443/tcp

# Do not expose Next.js directly.
ufw deny 3000/tcp

ufw status verbose
