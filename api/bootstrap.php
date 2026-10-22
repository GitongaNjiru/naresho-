<?php
// ===== BOOTSTRAP =====
// Common setup for all API endpoints

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Paths
define('ROOT', dirname(__DIR__));
define('DATA_DIR', ROOT . '/data');
define('UPLOAD_DIR', ROOT . '/uploads');
define('CONTENT_FILE', DATA_DIR . '/content.json');
define('ADMIN_FILE', DATA_DIR . '/admin.json');

// Ensure data and uploads directories exist
if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

// Initialize admin credentials on first run
if (!file_exists(ADMIN_FILE)) {
    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    file_put_contents(ADMIN_FILE, json_encode(['username' => 'admin', 'password' => $hash], JSON_PRETTY_PRINT));
}

// JSON response helper
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Cache-Control: no-cache');
    echo json_encode($data);
    exit;
}

// Read content.json
function readContent() {
    if (!file_exists(CONTENT_FILE)) return [];
    return json_decode(file_get_contents(CONTENT_FILE), true);
}

// Write content.json
function writeContent($data) {
    file_put_contents(CONTENT_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

// Auth check helper
function requireAuth() {
    if (empty($_SESSION['is_admin'])) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
}

// CORS headers (for local dev)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (!empty($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
