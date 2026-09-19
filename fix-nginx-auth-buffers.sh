#!/bin/bash
# Fix Nginx "upstream sent too big header while reading response header from upstream" (502 Bad Gateway on NextAuth login)

echo "Adding proxy buffer configuration to Nginx..."

# 1. Ensure buffer settings are in http block of /etc/nginx/nginx.conf
if ! grep -q "proxy_buffer_size" /etc/nginx/nginx.conf; then
  sed -i '/http {/a \    proxy_buffer_size 128k;\n    proxy_buffers 4 256k;\n    proxy_busy_buffers_size 256k;' /etc/nginx/nginx.conf
  echo "Added proxy_buffer_size (128k/256k) to /etc/nginx/nginx.conf"
fi

# 2. Add buffer directives directly inside location blocks in conf files
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
echo "Nginx successfully reloaded with large proxy buffers!"
