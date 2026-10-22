<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$password = trim($body['password'] ?? '');

$admin = json_decode(file_get_contents(ADMIN_FILE), true);

if ($username === $admin['username'] && password_verify($password, $admin['password'])) {
    $_SESSION['is_admin'] = true;
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Invalid credentials'], 401);
}
