#!/usr/bin/env bash
set -e

if [ -z "$PUSHPLUS_TOKEN" ]; then
  echo "Error: PUSHPLUS_TOKEN is required" >&2
  echo "Usage: PUSHPLUS_TOKEN=your_token bash deploy.sh" >&2
  exit 1
fi

INSTALL_DIR="/root/cex-deposit-withdraw"

# Install Bun if not present
if ! command -v bun &>/dev/null; then
  apt-get update -qq && apt-get install -y -qq unzip
  curl -fsSL https://bun.sh/install | bash
  export PATH="/root/.bun/bin:$PATH"
fi

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" pull
else
  git clone https://github.com/21Hzzzz/cex-deposit-withdraw.git "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
bun install

# Write .env
cat > .env <<EOF
PUSHPLUS_TOKEN=$PUSHPLUS_TOKEN
HTTPS_PROXY=${HTTPS_PROXY:-}
EOF

# Write systemd service
cat > /etc/systemd/system/cex-deposit-withdraw.service <<EOF
[Unit]
Description=cex-deposit-withdraw
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$HOME/.bun/bin/bun $INSTALL_DIR/index.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now cex-deposit-withdraw
systemctl status cex-deposit-withdraw --no-pager
