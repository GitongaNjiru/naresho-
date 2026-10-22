<?php
require_once __DIR__ . '/bootstrap.php';
jsonResponse(['authenticated' => !empty($_SESSION['is_admin'])]);
