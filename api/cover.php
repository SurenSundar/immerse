<?php
// Public: serves covers saved from the admin (stored outside the web root).
define('MM_API', true);
require __DIR__ . '/_lib.php';

$f = (string) ($_GET['f'] ?? '');
if (!preg_match('/^ol-\d{1,12}\.jpg$/', $f)) { http_response_code(404); exit; }
$file = mm_data_dir() . '/covers/' . $f;
if (!is_file($file)) { http_response_code(404); exit; }

header('Content-Type: image/jpeg');
header('Content-Length: ' . filesize($file));
header('Cache-Control: public, max-age=31536000, immutable');
header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');
readfile($file);
