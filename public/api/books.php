<?php
// Public, read-only: the live Library list saved from /admin.
// Responds 204 when nothing has been saved yet, so the site keeps its built-in list.
define('MM_API', true);
require __DIR__ . '/_lib.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { header('Access-Control-Allow-Origin: *'); http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') mm_fail(405, 'Method not allowed.');

// The list is public anyway; allow the mobile app (capacitor://) to read it too
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=60');

$data = mm_read_json('books.json');
if (!is_array($data) || !isset($data['books'])) { http_response_code(204); exit; }

mm_json(200, ['ok' => true, 'updatedAt' => $data['updatedAt'] ?? null, 'books' => $data['books']]);
