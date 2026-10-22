# Deployment Guide — Truehost Shared Hosting (PHP)

## This site uses PHP — no Node.js or database required
All you need is standard shared hosting with PHP 7.4+ (Truehost includes this).

---

## Step-by-Step Deployment

### Step 1 — Log into Truehost cPanel
Go to your Truehost account → cPanel

### Step 2 — Open File Manager
- In cPanel → File Manager
- Navigate to `public_html`
- Delete or clear any existing default files

### Step 3 — Upload Your Files
Upload ALL these files/folders to `public_html`:
```
index.html
style.css
logo.png
blog.html
article.html
gallery.html
.htaccess
admin/
api/
data/
uploads/   ← create this empty folder if it doesn't exist
```

**Do NOT upload:**
- `node_modules/`
- `server/`
- `package.json`
- `package-lock.json`
- `ecosystem.config.js`
- `.env.example`

### Step 4 — Set Folder Permissions
In File Manager, right-click these folders → Permissions → set to 755:
- `data/`
- `uploads/`

This lets PHP read/write the content.json and save uploaded images.

### Step 5 — Visit Your Site
Go to `https://nareshosolarranches.co.ke`
- Public site should load with all content
- Admin panel: `https://nareshosolarranches.co.ke/admin`

### Step 6 — First Admin Login
- Username: `admin`
- Password: `admin123`
- **IMMEDIATELY** go to Settings → Change Password

---

## Troubleshooting

**403 error on /api/content** → Check .htaccess uploaded correctly and Apache mod_rewrite is enabled (it is on Truehost by default)

**Content not saving** → Check `data/` folder has write permissions (755)

**Images not uploading** → Check `uploads/` folder exists and has write permissions (755)

**Blank page** → Check PHP error logs in cPanel → Error Logs

---

## File Structure on Server
```
public_html/
├── index.html
├── style.css
├── logo.png
├── blog.html
├── article.html
├── gallery.html
├── .htaccess
├── admin/
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin.js
├── api/
│   ├── bootstrap.php
│   ├── login.php
│   ├── logout.php
│   ├── auth_check.php
│   ├── content.php
│   ├── upload.php
│   ├── team.php
│   ├── blog.php
│   ├── gallery.php
│   └── change_password.php
├── data/
│   └── content.json
└── uploads/
    └── (uploaded images go here)
```
