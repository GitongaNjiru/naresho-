<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
// Support _method override for PUT/DELETE from multipart forms
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

// Extract ID from URL — matches /api/blog/123 OR /api/admin/blog/123
$uri = $_SERVER['REQUEST_URI'];
preg_match('/\/api\/(?:admin\/)?blog\/?([^?\/]*)/', $uri, $matches);
$id = trim($matches[1] ?? '', '/');

$content = readContent();
if (!isset($content['blog'])) $content['blog'] = [];

// ===== GET =====
if ($method === 'GET') {
    if ($id) {
        $post = null;
        foreach ($content['blog'] as $p) {
            if ($p['id'] === $id) { $post = $p; break; }
        }
        if (!$post) jsonResponse(['error' => 'Not found'], 404);
        jsonResponse($post);
    } else {
        $posts = $content['blog'];
        usort($posts, fn($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));
        jsonResponse($posts);
    }
}

// ===== POST (create) =====
if ($method === 'POST') {
    requireAuth();
    $image = '';
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $filename = 'blog_' . time() . rand(100,999) . '.' . $ext;
        move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $filename);
        $image = '/uploads/' . $filename;
    }
    $published = isset($_POST['published']) && ($_POST['published'] === 'true' || $_POST['published'] === '1' || $_POST['published'] === true);
    $post = [
        'id'        => (string)time() . rand(100,999),
        'title'     => trim($_POST['title'] ?? 'Untitled'),
        'excerpt'   => trim($_POST['excerpt'] ?? ''),
        'content'   => trim($_POST['content'] ?? ''),
        'author'    => trim($_POST['author'] ?? 'Admin'),
        'date'      => trim($_POST['date'] ?? date('Y-m-d')),
        'image'     => $image,
        'published' => $published
    ];
    $content['blog'][] = $post;
    writeContent($content);
    jsonResponse(['success' => true, 'post' => $post]);
}

// ===== PUT (update) =====
if ($method === 'PUT') {
    requireAuth();
    if (!$id) jsonResponse(['error' => 'ID required'], 400);

    $idx = -1;
    foreach ($content['blog'] as $i => $p) {
        if ($p['id'] === $id) { $idx = $i; break; }
    }
    if ($idx === -1) jsonResponse(['error' => 'Not found'], 404);

    $p = &$content['blog'][$idx];
    if (isset($_POST['title']))   $p['title']   = trim($_POST['title']);
    if (isset($_POST['excerpt'])) $p['excerpt'] = trim($_POST['excerpt']);
    if (isset($_POST['content'])) $p['content'] = trim($_POST['content']);
    if (isset($_POST['author']))  $p['author']  = trim($_POST['author']);
    if (isset($_POST['date']))    $p['date']    = trim($_POST['date']);
    if (isset($_POST['published'])) {
        $p['published'] = ($_POST['published'] === 'true' || $_POST['published'] === '1');
    }
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $filename = 'blog_' . time() . rand(100,999) . '.' . $ext;
        move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $filename);
        $p['image'] = '/uploads/' . $filename;
    }
    writeContent($content);
    jsonResponse(['success' => true, 'post' => $p]);
}

// ===== DELETE =====
if ($method === 'DELETE') {
    requireAuth();
    if (!$id) jsonResponse(['error' => 'ID required'], 400);
    $content['blog'] = array_values(array_filter($content['blog'], fn($p) => $p['id'] !== $id));
    writeContent($content);
    jsonResponse(['success' => true]);
}
