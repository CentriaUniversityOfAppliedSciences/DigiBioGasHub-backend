How to use

1. Add **.env** file\
  SERVER_PORT=28765\
  POSTGRES_USER=username\
  POSTGRES_DB=database\
  POSTGRES_PASSWORD=password\
  DB_HOST=localhost\
  DB_PORT=5432\
  JWT_KEY=your-secret-jwt-key\
  MML_API_KEY=your-mml-api-key https://www.maanmittauslaitos.fi/en/rajapinnat/api-avaimen-ohje\
  MINIO_ROOT_USER=your-minio-user\
  MINIO_ROOT_PASSWORD=your-minio-password\  
  CHAT_SERVER_API_KEY=your-chatserver-api-key

2. Install min.io (https://github.com/minio/minio) file storage\
for Ubuntu\
wget https://dl.min.io/server/minio/release/linux-amd64/minio\
chmod +x minio\
npm install -g dotenv-cli\
dotenv -e .env -- ./minio server /your/path/to/minio/data\
open port on firewall or vm settings\

3. start docker with **docker compose up**\
