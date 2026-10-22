# Deployment Guide — Truehost

## Files Prepared
- `ecosystem.config.js` — PM2 config for VPS
- `.htaccess` — Apache proxy for cPanel shared hosting
- `.env.example` — Environment variables template

---

## OPTION A: Shared Hosting (cPanel)

### Step 1 — Buy Hosting
- Go to https://truehost.co.ke/hosting
- Buy any Business or Premium shared hosting plan
- Make sure it includes **Node.js App Manager** in cPanel

### Step 2 — Upload Your Files
- Log in to cPanel
- Open **File Manager** → go to `public_html`
- Upload ALL project files EXCEPT: `node_modules/`, `data/admin.json`, `.env`

### Step 3 — Set Up Node.js App in cPanel
- In cPanel, find **Setup Node.js App**
- Click **Create Application**
- Set:
  - Node.js version: **18.x or 20.x**
  - Application mode: **Production**
  - Application root: `public_html` (or your folder)
  - Application URL: your domain
  - Application startup file: `server/app.js`
- Click **Create**

### Step 4 — Install Dependencies
- In the Node.js App Manager, click **Run NPM Install**
- Or SSH in and run: `npm install --production`

### Step 5 — Create data folder and uploads folder
- In File Manager, create folders: `data/` and `uploads/`
- Upload your `data/content.json` file into `data/`

### Step 6 — Set Environment Variables
- In Node.js App Manager, add environment variables:
  - `SESSION_SECRET` = any long random string (e.g. `narresho2026secretkey!xK9mP`)
  - `NODE_ENV` = `production`
  - `PORT` = `3000`

### Step 7 — Start the App
- Click **Start App** in Node.js App Manager
- Visit your domain — site should be live

---

## OPTION B: VPS

### Step 1 — Buy VPS
- Go to https://truehost.co.ke/vps-hosting
- Buy Managed VPS (cheapest plan is fine to start)

### Step 2 — Connect via SSH
```bash
ssh root@YOUR_SERVER_IP
```

### Step 3 — Install Node.js and PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### Step 4 — Upload Project Files
Option A — via Git:
```bash
git clone https://github.com/GitongaNjiru/naresho-solar-ranches.git
cd naresho-solar-ranches
```

Option B — via FileZilla (SFTP):
- Host: your server IP
- Username: root
- Password: your VPS password
- Port: 22
- Upload all files to `/var/www/narresho/`

### Step 5 — Install Dependencies
```bash
cd /var/www/narresho
npm install --production
```

### Step 6 — Create .env file
```bash
nano .env
```
Add:
```
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-long-random-secret-here
```

### Step 7 — Create required folders
```bash
mkdir -p data uploads
```
Upload your `data/content.json` to the `data/` folder.

### Step 8 — Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 9 — Point Your Domain
- In Truehost domain settings, point your domain's A record to your VPS IP
- Wait 5–10 minutes for DNS to propagate

### Step 10 — Set Up Nginx (optional but recommended)
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/narresho
```
Add:
```nginx
server {
    listen 80;
    server_name yourdomain.co.ke www.yourdomain.co.ke;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/narresho /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 11 — Free SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.co.ke -d www.yourdomain.co.ke
```

---

## After Deployment — First Login
- Go to yourdomain.co.ke/admin
- Login: **admin** / **admin123**
- **IMMEDIATELY** go to Settings → Change Password

## Files NOT to Upload
- `node_modules/` — run npm install on server instead
- `.env` — create it manually on the server
- `data/admin.json` — will be auto-created on first run
