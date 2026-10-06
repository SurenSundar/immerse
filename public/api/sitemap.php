<?php
// Public: sitemap of the live Library's book pages (books added or edited in /admin).
// The build also writes /sitemap.xml with the main pages and the built-in books.
define('MM_API', true);
require __DIR__ . '/_lib.php';

$data = mm_read_json('books.json');
$books = is_array($data['books'] ?? null) ? $data['books'] : [];
$lastmod = substr((string) ($data['updatedAt'] ?? gmdate('c')), 0, 10);

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($books as $b) {
  $id = (string) ($b['id'] ?? '');
  if (!preg_match('/^[a-z0-9][a-z0-9-]*$/', $id)) continue;
  echo '  <url><loc>' . MM_SITE . '/books/' . $id . "</loc><lastmod>$lastmod</lastmod></url>\n";
}
echo "</urlset>\n";
