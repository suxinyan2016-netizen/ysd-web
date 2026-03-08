#!/usr/bin/env bash
set -euo pipefail

# 简单的服务器初始化脚本（在 Ubuntu 24 上运行）
# 用法（在服务器上运行或通过 SSH 执行）：
#   sudo bash setup-server.sh

echo "Updating apt and installing nginx + certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx rsync

# 创建网站目录并设置权限
sudo mkdir -p /var/www/parcel-web
sudo chown -R $USER:$USER /var/www/parcel-web

# 将本脚本旁的 nginx 配置复制到 /etc/nginx/sites-available/parcel-web
# 如果你从本地上传了 deploy/nginx.parcel-web.conf，可以使用 scp 将其放到服务器上，然后运行下面的命令
if [ -f "./deploy/nginx.parcel-web.conf" ]; then
  echo "Installing nginx config from ./deploy/nginx.parcel-web.conf"
  sudo cp ./deploy/nginx.parcel-web.conf /etc/nginx/sites-available/parcel-web
  sudo ln -sf /etc/nginx/sites-available/parcel-web /etc/nginx/sites-enabled/parcel-web
  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "Notice: ./deploy/nginx.parcel-web.conf not found. Please scp the config to the server and enable it."
fi

echo "Setup complete. Next: upload build to /var/www/parcel-web and run certbot if you have a domain."

# 提示使用 certbot（如果有域名）
cat <<'EOF'
If you have a real domain pointing to this server, run:
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
If using IP only, HTTPS via Let's Encrypt is not applicable; use a reverse proxy/terminating LB with a domain.
EOF
