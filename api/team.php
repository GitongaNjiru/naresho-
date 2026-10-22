<?php
require_once __DIR__ . '/bootstrap.php';
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
// Support _method override for PUT from multipart forms
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}
$uri = $_SERVER['REQUEST_URI'];
preg_match('/\/api\/(?:admin\/)?team\/?([^?\/]*)/', $uri, $matches);
$id = trim($matches[1] ?? '', '/');

$content = readContent();
if (!isset($content['team'])) $content['team'] = [];

// GET — list team
if ($method === 'GET') {
    jsonResponse($content['team']);
}

// POST — add member
if ($method === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $role = trim($_POST['role'] ?? '');
    $bio  = trim($_POST['bio'] ?? '');
    $photo = '';

    if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
        $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
        $filename = 'team_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['photo']['tmp_name'], UPLOAD_DIR . '/' . $filename);
        $photo = '/uploads/' . $filename;
    }

    $member = ['id' => (string)time(), 'name' => $name, 'role' => $role, 'bio' => $bio, 'photo' => $photo];
    $content['team'][] = $member;
    writeContent($content);
    jsonResponse(['success' => true, 'member' => $member]);
}

// PUT — update member
if ($method === 'PUT' && $id) {
    $team = &$content['team'];
    $idx = -1;
    foreach ($team as $i => $m) {
        if ($m['id'] === $id) { $idx = $i; break; }
    }
    if ($idx === -1) jsonResponse(['error' => 'Not found'], 404);

    // PHP doesn't parse multipart PUT, parse raw body or use POST override
    // Use $_POST if sent as POST with _method=PUT, otherwise parse
    $name = trim($_POST['name'] ?? $team[$idx]['name']);
    $role = trim($_POST['role'] ?? $team[$idx]['role']);
    $bio  = trim($_POST['bio']  ?? $team[$idx]['bio']);

    $team[$idx]['name'] = $name;
    $team[$idx]['role'] = $role;
    $team[$idx]['bio']  = $bio;

    if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
        $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
        $filename = 'team_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['photo']['tmp_name'], UPLOAD_DIR . '/' . $filename);
        $team[$idx]['photo'] = '/uploads/' . $filename;
    }

    writeContent($content);
    jsonResponse(['success' => true, 'member' => $team[$idx]]);
}

// DELETE — remove member
if ($method === 'DELETE' && $id) {
    $content['team'] = array_values(array_filter($content['team'], fn($m) => $m['id'] !== $id));
    writeContent($content);
    jsonResponse(['success' => true]);
}
