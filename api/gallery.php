<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
preg_match('/\/api\/(?:admin\/)?gallery\/?([^?\/]*)/', $uri, $matches);
$id = trim($matches[1] ?? '', '/');

$content = readContent();
if (!isset($content['gallery'])) $content['gallery'] = [];

// GET — public
if ($method === 'GET') {
    jsonResponse($content['gallery']);
}

// POST — upload image
if ($method === 'POST') {
    requireAuth();
    if (empty($_FILES['image']) || $_FILES['image']['error'] !== 0) {
        jsonResponse(['error' => 'No image uploaded'], 400);
    }
    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    $filename = 'gallery_' . time() . '_' . rand(100,999) . '.' . $ext;
    move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $filename);

    $item = [
        'id'       => (string)time(),
        'image'    => '/uploads/' . $filename,
        'caption'  => trim($_POST['caption'] ?? ''),
        'category' => trim($_POST['category'] ?? 'General'),
        'date'     => trim($_POST['date'] ?? date('Y-m-d'))
    ];

    array_unshift($content['gallery'], $item);
    writeContent($content);
    jsonResponse(['success' => true, 'item' => $item]);
}

// PUT — update caption/category
if ($method === 'PUT' && $id) {
    requireAuth();
    $body = json_decode(file_get_contents('php://input'), true);
    $idx = -1;
    foreach ($content['gallery'] as $i => $g) {
        if ($g['id'] === $id) { $idx = $i; break; }
    }
    if ($idx === -1) jsonResponse(['error' => 'Not found'], 404);

    $content['gallery'][$idx]['caption']  = $body['caption']  ?? $content['gallery'][$idx]['caption'];
    $content['gallery'][$idx]['category'] = $body['category'] ?? $content['gallery'][$idx]['category'];
    $content['gallery'][$idx]['date']     = $body['date']     ?? $content['gallery'][$idx]['date'];

    writeContent($content);
    jsonResponse(['success' => true, 'item' => $content['gallery'][$idx]]);
}

// DELETE
if ($method === 'DELETE' && $id) {
    requireAuth();
    $content['gallery'] = array_values(array_filter($content['gallery'], fn($g) => $g['id'] !== $id));
    writeContent($content);
    jsonResponse(['success' => true]);
}
