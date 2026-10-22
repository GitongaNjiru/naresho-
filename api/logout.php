<?php
require_once __DIR__ . '/bootstrap.php';
$_SESSION['is_admin'] = false;
session_destroy();
jsonResponse(['success' => true]);
