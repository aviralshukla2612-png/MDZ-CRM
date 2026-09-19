#!/bin/bash
# Comprehensive Nginx Buffer Fix for "400 Bad Request: Request Header Or Cookie Too Large" and "502 Bad Gateway"

echo "Applying massive header and proxy buffer limits to Nginx..."

# 1. Clean previous occurrences to prevent duplication
sed -i '/large_client_header_buffers/d' /etc/nginx/nginx.conf
sed -i '/client_header_buffer_size/d' /etc/nginx/nginx.conf
sed -i '/proxy_buffer_size/d' /etc/nginx/nginx.conf
sed -i '/proxy_buffers /d' /etc/nginx/nginx.conf
sed -i '/proxy_busy_buffers_size/d' /etc/nginx/nginx.conf

# 2. Add to http { block in /etc/nginx/nginx.conf
sed -i '/http {/a \    large_client_header_buffers 8 128k;\n    client_header_buffer_size 64k;\n    proxy_buffer_size 128k;\n    proxy_buffers 8 256k;\n    proxy_busy_buffers_size 256k;' /etc/nginx/nginx.conf

# 3. Add to all server blocks in /etc/nginx/
for f in $(find /etc/nginx -type f -name "*.conf" -o -name "*default*" -o -name "*site*"); do
  if grep -q "server {" "$f"; then
    sed -i '/large_client_header_buffers/d' "$f"
    sed -i '/client_header_buffer_size/d' "$f"
    sed -i '/server {/a \    large_client_header_buffers 8 128k;\n    client_header_buffer_size 64k;' "$f"
    echo "Updated server block in $f"
  fi
done

# 4. Test and hard restart nginx
nginx -t && systemctl restart nginx
echo "Nginx successfully restarted with 128KB header/cookie buffer capacity!"
