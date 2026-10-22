const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load .env if present
try { require('dotenv').config(); } catch(e) {}

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'narresho-solar-secret-key-2026';

// --- Data paths ---
const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// --- Admin credentials (stored in data/admin.json) ---
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Initialize admin credentials on first run
function initAdmin() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const hash = bcrypt.hashSync('admin123', 10);
    fs.writeFileSync(ADMIN_FILE, JSON.stringify({ username: 'admin', password: hash }, null, 2));
    console.log('Admin account created — username: admin, password: admin123');
  }
}
initAdmin();

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..')));

// --- Auth middleware ---
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// --- Helper: read/write content ---
function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}
function writeContent(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
}

// --- Multer config for image uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = 'upload_' + Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime.split('/')[1])) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
    }
  }
});

// ====== AUTH ROUTES ======

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  if (username === admin.username && bcrypt.compareSync(password, admin.password)) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth-check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

// ====== CONTENT API ======

// Get all content (public — used by public site)
app.get('/api/content', (req, res) => {
  res.json(readContent());
});

// Get all content (admin only)
app.get('/api/admin/content', requireAuth, (req, res) => {
  res.json(readContent());
});

// Update a specific section
app.put('/api/admin/content/:section', requireAuth, (req, res) => {
  const { section } = req.params;
  const content = readContent();
  if (!content[section]) {
    return res.status(404).json({ error: 'Section not found' });
  }
  content[section] = req.body;
  writeContent(content);
  res.json({ success: true, content: content[section] });
});

// Update entire content (full save)
app.put('/api/admin/content', requireAuth, (req, res) => {
  writeContent(req.body);
  res.json({ success: true });
});

// ====== IMAGE UPLOAD ======

app.post('/api/admin/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, path: '/uploads/' + req.file.filename });
});

// Upload logo (replaces logo.png)
app.post('/api/admin/upload-logo', requireAuth, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const ext = path.extname(req.file.originalname);
  const targetPath = path.join(__dirname, '..', 'logo' + ext);
  // If extension differs from .png, also save as the uploaded extension
  fs.renameSync(req.file.path, targetPath);
  // Update content logo path
  const content = readContent();
  content.site.logo = 'logo' + ext;
  writeContent(content);
  res.json({ success: true, logo: 'logo' + ext });
});

// ====== TEAM CRUD ======

app.get('/api/admin/team', requireAuth, (req, res) => {
  const content = readContent();
  res.json(content.team || []);
});

app.post('/api/admin/team', requireAuth, upload.single('photo'), (req, res) => {
  const content = readContent();
  if (!content.team) content.team = [];
  const member = {
    id: Date.now().toString(),
    name: req.body.name || '',
    role: req.body.role || '',
    bio: req.body.bio || '',
    photo: req.file ? '/uploads/' + req.file.filename : ''
  };
  content.team.push(member);
  writeContent(content);
  res.json({ success: true, member });
});

app.put('/api/admin/team/:id', requireAuth, upload.single('photo'), (req, res) => {
  const content = readContent();
  const team = content.team || [];
  const idx = team.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Team member not found' });
  
  team[idx].name = req.body.name || team[idx].name;
  team[idx].role = req.body.role || team[idx].role;
  team[idx].bio = req.body.bio || team[idx].bio;
  if (req.file) team[idx].photo = '/uploads/' + req.file.filename;
  
  content.team = team;
  writeContent(content);
  res.json({ success: true, member: team[idx] });
});

app.delete('/api/admin/team/:id', requireAuth, (req, res) => {
  const content = readContent();
  const team = content.team || [];
  content.team = team.filter(m => m.id !== req.params.id);
  writeContent(content);
  res.json({ success: true });
});

// ====== GALLERY CRUD ======

// Public: get all gallery images
app.get('/api/gallery', (req, res) => {
  const content = readContent();
  res.json(content.gallery || []);
});

// Admin: upload gallery image(s)
app.post('/api/admin/gallery', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const content = readContent();
  if (!content.gallery) content.gallery = [];
  const item = {
    id: Date.now().toString(),
    image: '/uploads/' + req.file.filename,
    caption: req.body.caption || '',
    category: req.body.category || 'General',
    date: req.body.date || new Date().toISOString().split('T')[0]
  };
  content.gallery.push(item);
  writeContent(content);
  res.json({ success: true, item });
});

// Admin: update gallery item (caption/category)
app.put('/api/admin/gallery/:id', requireAuth, (req, res) => {
  const content = readContent();
  const gallery = content.gallery || [];
  const idx = gallery.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Gallery item not found' });
  gallery[idx].caption = req.body.caption !== undefined ? req.body.caption : gallery[idx].caption;
  gallery[idx].category = req.body.category !== undefined ? req.body.category : gallery[idx].category;
  gallery[idx].date = req.body.date !== undefined ? req.body.date : gallery[idx].date;
  content.gallery = gallery;
  writeContent(content);
  res.json({ success: true, item: gallery[idx] });
});

// Admin: delete gallery item
app.delete('/api/admin/gallery/:id', requireAuth, (req, res) => {
  const content = readContent();
  content.gallery = (content.gallery || []).filter(g => g.id !== req.params.id);
  writeContent(content);
  res.json({ success: true });
});

// ====== BLOG/NEWS CRUD ======

// Public: get all blog posts (sorted by date, newest first)
app.get('/api/blog', (req, res) => {
  const content = readContent();
  const posts = (content.blog || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(posts);
});

// Public: get single blog post by id
app.get('/api/blog/:id', (req, res) => {
  const content = readContent();
  const post = (content.blog || []).find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Admin: create blog post
app.post('/api/admin/blog', requireAuth, upload.single('image'), (req, res) => {
  const content = readContent();
  if (!content.blog) content.blog = [];
  const post = {
    id: Date.now().toString(),
    title: req.body.title || 'Untitled',
    excerpt: req.body.excerpt || '',
    content: req.body.content || '',
    author: req.body.author || 'Admin',
    date: req.body.date || new Date().toISOString().split('T')[0],
    image: req.file ? '/uploads/' + req.file.filename : '',
    published: req.body.published === 'true' || req.body.published === true
  };
  content.blog.push(post);
  writeContent(content);
  res.json({ success: true, post });
});

// Admin: update blog post
app.put('/api/admin/blog/:id', requireAuth, upload.single('image'), (req, res) => {
  const content = readContent();
  const posts = content.blog || [];
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Blog post not found' });

  posts[idx].title = req.body.title || posts[idx].title;
  posts[idx].excerpt = req.body.excerpt || posts[idx].excerpt;
  posts[idx].content = req.body.content || posts[idx].content;
  posts[idx].author = req.body.author || posts[idx].author;
  posts[idx].date = req.body.date || posts[idx].date;
  posts[idx].published = req.body.published === 'true' || req.body.published === true;
  if (req.file) posts[idx].image = '/uploads/' + req.file.filename;

  content.blog = posts;
  writeContent(content);
  res.json({ success: true, post: posts[idx] });
});

// Admin: delete blog post
app.delete('/api/admin/blog/:id', requireAuth, (req, res) => {
  const content = readContent();
  content.blog = (content.blog || []).filter(p => p.id !== req.params.id);
  writeContent(content);
  res.json({ success: true });
});

// ====== PASSWORD CHANGE ======

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  admin.password = bcrypt.hashSync(newPassword, 10);
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2));
  res.json({ success: true });
});

// ====== ADMIN ROUTE FALLBACK ======
// Serve admin.html for /admin and /admin/
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Blog listing page
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'blog.html'));
});

// Individual blog article page
app.get('/blog/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'article.html'));
});

// Gallery page
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'gallery.html'));
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`\n  Naresho Solar Ranches server running on http://localhost:${PORT}`);
  console.log(`  Admin panel: http://localhost:${PORT}/admin`);
  console.log(`  Default login: admin / admin123\n`);
});
