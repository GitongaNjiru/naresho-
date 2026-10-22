<?php
require_once __DIR__ . '/bootstrap.php';
requireAuth();

$type = $_GET['type'] ?? 'image'; // image or logo

$field = ($type === 'logo') ? 'logo' : 'image';

if (empty($_FILES[$field])) {
    jsonResponse(['error' => 'No file uploaded'], 400);
}

$file = $_FILES[$field];
$allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

if (!in_array($file['type'], $allowed)) {
    jsonResponse(['error' => 'Only image files are allowed'], 400);
}

if ($file['size'] > 10 * 1024 * 1024) {
    jsonResponse(['error' => 'File too large (max 10MB)'], 400);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if ($type === 'logo') {
    $filename = 'logo.' . $ext;
    $target = ROOT . '/' . $filename;
    move_uploaded_file($file['tmp_name'], $target);

    // Update content.json logo path
    $content = readContent();
    $content['site']['logo'] = $filename;
    writeContent($content);

    jsonResponse(['success' => true, 'logo' => $filename]);
} else {
    $filename = 'upload_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $target = UPLOAD_DIR . '/' . $filename;
    move_uploaded_file($file['tmp_name'], $target);
    jsonResponse(['success' => true, 'path' => '/uploads/' . $filename]);
}
