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
  FRONTEND_URL=your-frontend-url  
  STRIPE_SECRET_KEY=your-stripe-secret-key  
  STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-key  
  THREE_MONTHS_SUBSCRIPTION_PRICE=stripe-price-id  
  SIX_MONTHS_SUBSCRIPTION_PRICE=stripe-price-id  
  TWELVE_MONTHS_SUBSCRIPTION_PRICE=stripe-price-id  

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


## 4. Payment Integration

Integrate Stripe payments into your application by following these steps.

---

### 1. Set Up Stripe
1. Create an account on **[Stripe](https://stripe.com)**.  
2. In the Stripe dashboard, obtain your **Stripe Secret Key** (`STRIPE_SECRET_KEY`).
3. Create product and get the **stripe price ids** (`THREE_MONTHS_SUBSCRIPTION_PRICE, SIX_MONTHS_SUBSCRIPTION_PRICE, TWELVE_MONTHS_SUBSCRIPTION_PRICE`).

---

### 2. Configure Stripe Webhook
1. In your Stripe dashboard, create a **Webhook Endpoint**.  
2. Subscribe the endpoint to these events:  
   - `checkout.session.completed`  
   - `checkout.session.expired`  
3. Set the **Destination URL** to  

   ```
   https://your-domain/webhook
   ```
4. Obtain your **Stripe webhook secret** (`STRIPE_WEBHOOK_SECRET`)

   > When testing locally, replace `your-domain` with your **ngrok** URL (see next section).

---

### 3. Local Development with ngrok
If you are running the application on your local machine:

1. Sign up for a free account at **[ngrok](https://ngrok.com)**.  
2. Install ngrok.
3. On a free ngrok account, you can reserve one static domain.Go to the "Domains" section in your ngrok dashboard and reserve a subdomain.
4. Authenticate ngrok with your authtoken:

   ```bash
   ngrok config add-authtoken $YOUR_AUTHTOKEN
   ```

---

### 4. Configure `traffic-policy.yml`
1. Open the file `traffic-policy.yml`.  
2. Set the `Origin` to your ngrok URL, e.g.:

   ```yaml
   Origin:  https://hawk.ngrok-free.app
   ```

---

### 5. Start ngrok with Traffic Policy
Navigate to the directory containing `traffic-policy.yml`, then run:

```bash
ngrok http --url=your-ngrok-domain 28765 --traffic-policy-file traffic-policy.yml
```

- `28765` is the local port your application listens on-adjust if necessary.  

---

> **Reminder**  
> After ngrok is running, update your Stripe webhook's destination URL to match the active ngrok URL whenever it changes. e.g.:

   ```yaml
     https://hawk.ngrok-free.app/webhook
   ```

