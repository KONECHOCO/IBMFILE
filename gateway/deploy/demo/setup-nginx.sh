#!/bin/bash
# Activates plexa.ikonetsolutions.com -> container plexa-demo (127.0.0.1:8097).
# Run on the VPS with:  sudo bash /home/choco/apps/plexa-demo/setup-nginx.sh
set -e
DOMAIN=plexa.ikonetsolutions.com
DIR=/home/choco/apps/plexa-demo
SERVER_IP=23.88.32.156

RESOLVED=$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')
if [ "$RESOLVED" != "$SERVER_IP" ]; then
  echo "ERRORE: $DOMAIN non punta ancora a $SERVER_IP (risolve a: '${RESOLVED:-nessuno}')."
  echo "Aggiungi il record DNS A 'plexa' -> $SERVER_IP su Namecheap e riprova tra qualche minuto."
  exit 1
fi

mkdir -p /var/www/certbot
# 1) HTTP only, for the Let's Encrypt check
cat > /etc/nginx/sites-available/$DOMAIN <<CONF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { proxy_pass http://127.0.0.1:8097; }
}
CONF
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t && systemctl reload nginx

# 2) Certificate
certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --non-interactive --agree-tos -m konechocoproduction@gmail.com

# 3) Final HTTPS configuration
cp $DIR/nginx-$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN
nginx -t && systemctl reload nginx
curl -s https://$DOMAIN/api/health | head -c 200; echo
echo "OK: https://$DOMAIN attivo"
