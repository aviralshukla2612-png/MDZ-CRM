#!/bin/bash
# Increase Nginx client_max_body_size to 1024M and timeout for large uploads

echo "Checking Nginx configuration..."

# 1. Add client_max_body_size 1024M to /etc/nginx/nginx.conf if not already present
if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
  sed -i '/http {/a \    client_max_body_size 1024M;' /etc/nginx/nginx.conf
  echo "Added client_max_body_size 1024M to /etc/nginx/nginx.conf"
else
  sed -i 's/client_max_body_size.*/client_max_body_size 1024M;/g' /etc/nginx/nginx.conf
  echo "Updated client_max_body_size in /etc/nginx/nginx.conf to 1024M"
fi

# 2. Update any conf files in /etc/nginx/conf.d/ or /etc/nginx/sites-available/
for f in $(find /etc/nginx -type f -name "*.conf"); do
  if grep -q "location.*mdz" "$f"; then
    if ! grep -q "client_max_body_size" "$f"; then
      sed -i '/location.*mdz.*{/a \        client_max_body_size 1024M;\n        proxy_read_timeout 600s;\n        proxy_send_timeout 600s;' "$f"
      echo "Added upload limits and timeouts to $f"
    fi
  fi
done

# 3. Test and reload Nginx
nginx -t && systemctl reload nginx
echo "Nginx successfully reloaded with 1024M upload support!"
