<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
// Support _method override for PUT/DELETE from multipart forms
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
$uri = $_SERVER['REQUEST_URI'];
preg_match('/\/api\/blog\/?([^?]*)/', $uri, $matches);
$id = trim($matches[1] ?? '', '/');

$content = readContent();
if (!isset($content['blog'])) $content['blog'] = [];

// GET — public, list published posts (or single post by id)
if ($method === 'GET') {
    if ($id) {
        $post = null;
        foreach ($content['blog'] as $p) {
            if ($p['id'] === $id) { $post = $p; break; }
        }
        if (!$post) jsonResponse(['error' => 'Not found'], 404);
        jsonResponse($post);
    } else {
        // Sort by date newest first
        $posts = $content['blog'];
        usort($posts, fn($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));
        jsonResponse($posts);
    }
}

// POST — admin, create post
if ($method === 'POST') {
    requireAuth();
    $image = '';
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $filename = 'blog_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $filename);
        $image = '/uploads/' . $filename;
    }

    $post = [
        'id'        => (string)time(),
        'title'     => trim($_POST['title'] ?? 'Untitled'),
        'excerpt'   => trim($_POST['excerpt'] ?? ''),
        'content'   => trim($_POST['content'] ?? ''),
        'author'    => trim($_POST['author'] ?? 'Admin'),
        'date'      => trim($_POST['date'] ?? date('Y-m-d')),
        'image'     => $image,
        'published' => ($_POST['published'] ?? 'false') === 'true'
    ];

    $content['blog'][] = $post;
    writeContent($content);
    jsonResponse(['success' => true, 'post' => $post]);
}

// PUT — admin, update post
if ($method === 'PUT' && $id) {
    requireAuth();
    $idx = -1;
    foreach ($content['blog'] as $i => $p) {
        if ($p['id'] === $id) { $idx = $i; break; }
    }
    if ($idx === -1) jsonResponse(['error' => 'Not found'], 404);

    $p = &$content['blog'][$idx];
    $p['title']     = trim($_POST['title']   ?? $p['title']);
    $p['excerpt']   = trim($_POST['excerpt'] ?? $p['excerpt']);
    $p['content']   = trim($_POST['content'] ?? $p['content']);
    $p['author']    = trim($_POST['author']  ?? $p['author']);
    $p['date']      = trim($_POST['date']    ?? $p['date']);
    $p['published'] = ($_POST['published'] ?? ($p['published'] ? 'true' : 'false')) === 'true';

    if (!empty($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
        $filename = 'blog_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['image']['tmp_name'], UPLOAD_DIR . '/' . $filename);
        $p['image'] = '/uploads/' . $filename;
    }

    writeContent($content);
    jsonResponse(['success' => true, 'post' => $p]);
}

// DELETE — admin
if ($method === 'DELETE' && $id) {
    requireAuth();
    $content['blog'] = array_values(array_filter($content['blog'], fn($p) => $p['id'] !== $id));
    writeContent($content);
    jsonResponse(['success' => true]);
}
