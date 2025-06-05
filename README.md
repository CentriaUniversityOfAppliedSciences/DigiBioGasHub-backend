How to use

1. Add **.env** file \
  SERVER_PORT=28765 \
  POSTGRES_USER=username \
  POSTGRES_DB=database \
  POSTGRES_PASSWORD=password \
  DB_HOST=localhost \
  DB_PORT=5432 \
  JWT_KEY=your-secret-jwt-key \
  MML_API_KEY=your-mml-api-key https://www.maanmittauslaitos.fi/en/rajapinnat/api-avaimen-ohje \
  MINIO_ROOT_USER=your-minio-user \
  MINIO_ROOT_PASSWORD=your-minio-password \  
  CHAT_SERVER_API_KEY=your-chatserver-api-key \
  MINIO_DEV=false \
  MINIO_ADDRESS=your_web_server_behind_nginx \
  EMAIL_SENDER=sender_email_address \ 
  EMAIL_PASS=sender_email_password \
  SERVER_ADDRESS=address_to_frontend \

2. Install min.io (https://github.com/minio/minio) file storage \
for Ubuntu \
wget https://dl.min.io/server/minio/release/linux-amd64/minio \
chmod +x minio \
mv minio /usr/local/bin/ \
groupadd -r minio-user \
useradd -M -r -g minio-user minio-user \
mkdir -p /mnt/data/disk1 \
chown minio-user:minio-user /mnt/data/disk1 \
**change user and password in minio -file to match .env**
cp minio /etc/default/minio \
cp minio.service /etc/systemd/system/minio.service \
systemctl enable minio.service \
systemctl start minio.service \
open port on firewall or vm settings \

3. start docker with **docker compose up**\
