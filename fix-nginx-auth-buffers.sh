#!/bin/bash
# Fix Nginx "Request Header Or Cookie Too Large" (400 Bad Request) and "upstream sent too big header" (502 Bad Gateway)

echo "Adding client and proxy buffer configurations to Nginx..."

# 1. Update http block in /etc/nginx/nginx.conf
if ! grep -q "large_client_header_buffers" /etc/nginx/nginx.conf; then
  sed -i '/http {/a \    large_client_header_buffers 4 64k;\n    client_header_buffer_size 16k;\n    proxy_buffer_size 128k;\n    proxy_buffers 4 256k;\n    proxy_busy_buffers_size 256k;' /etc/nginx/nginx.conf
  echo "Added large_client_header_buffers and proxy_buffer_size to /etc/nginx/nginx.conf"
fi

# 2. Add directives directly inside location blocks in conf files
for f in $(find /etc/nginx -type f -name "*.conf"); do
  if grep -q "location.*mdz" "$f"; then
    if ! grep -q "proxy_buffer_size" "$f"; then
      sed -i '/location.*mdz.*{/a \        proxy_buffer_size 128k;\n        proxy_buffers 4 256k;\n        proxy_busy_buffers_size 256k;' "$f"
      echo "Added proxy buffers to $f"
    fi
  fi
done

# 3. Test configuration and reload Nginx
nginx -t && systemctl reload nginx
echo "Nginx successfully reloaded with updated buffers!"
