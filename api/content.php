<?php
require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/content — public, returns all content
if ($method === 'GET') {
    jsonResponse(readContent());
}

// PUT /api/content/:section — admin only
if ($method === 'PUT') {
    requireAuth();
    $uri = $_SERVER['REQUEST_URI'];

    // Parse section from URL: /api/content/hero, /api/content/about etc
    preg_match('/\/api\/content\/?([^?]*)/', $uri, $matches);
    $section = trim($matches[1] ?? '', '/');

    $body = json_decode(file_get_contents('php://input'), true);
    $content = readContent();

    if ($section === '' || $section === 'all') {
        // Full content update
        writeContent($body);
        jsonResponse(['success' => true]);
    } elseif (isset($content[$section])) {
        $content[$section] = $body;
        writeContent($content);
        jsonResponse(['success' => true, 'content' => $content[$section]]);
    } else {
        jsonResponse(['error' => 'Section not found'], 404);
    }
}
