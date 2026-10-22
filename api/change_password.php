<?php
require_once __DIR__ . '/bootstrap.php';
requireAuth();

$body = json_decode(file_get_contents('php://input'), true);
$current = $body['currentPassword'] ?? '';
$new     = $body['newPassword'] ?? '';

$admin = json_decode(file_get_contents(ADMIN_FILE), true);

if (!password_verify($current, $admin['password'])) {
    jsonResponse(['error' => 'Current password is incorrect'], 400);
}
if (strlen($new) < 6) {
    jsonResponse(['error' => 'New password must be at least 6 characters'], 400);
}

$admin['password'] = password_hash($new, PASSWORD_BCRYPT);
file_put_contents(ADMIN_FILE, json_encode($admin, JSON_PRETTY_PRINT));
jsonResponse(['success' => true]);
