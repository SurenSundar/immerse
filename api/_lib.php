<?php
// Shared helpers for the Library API. Not an endpoint: only included by books.php / admin.php.
if (!defined('MM_API')) { http_response_code(404); exit; }

// PHP notices must never leak into JSON responses (they still go to the error log)
ini_set('display_errors', '0');

// ── Storage ────────────────────────────────────────────────────────────────
// Everything private (login, live book list, backups, rate-limit counters) lives
// OUTSIDE the web root, so it can't be downloaded and deploys never overwrite it.
// On Hostinger: /home/<user>/domains/<domain>/monkeymind-data (next to public_html).
// If that level is locked, falls back to the hosting account's home folder.
function mm_data_dir(): string {
  static $resolved = null;
  if ($resolved) return $resolved;

  $env = getenv('MM_DATA_DIR');
  $home = getenv('HOME') ?: (function_exists('posix_getpwuid') ? (posix_getpwuid(posix_geteuid())['dir'] ?? '') : '');
  $candidates = $env ? [$env] : array_filter([
    dirname(rtrim($_SERVER['DOCUMENT_ROOT'] ?? __DIR__ . '/..', '/')) . '/monkeymind-data',
    $home ? $home . '/monkeymind-data' : null,
  ]);

  foreach ($candidates as $dir) {
    if (!is_dir($dir) && @mkdir($dir, 0700, true)) {
      // Belt and braces in case the folder is ever moved inside the web root
      @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
    }
    if (is_dir($dir) && is_writable($dir)) return $resolved = $dir;
  }
  mm_fail(500, 'Storage folder could not be created. Create a folder named monkeymind-data next to public_html in File Manager, then reload.');
}

function mm_path(string $name): string { return mm_data_dir() . '/' . $name; }

function mm_read_json(string $name) {
  $file = mm_path($name);
  if (!is_file($file)) return null;
  $raw = file_get_contents($file);
  return $raw === false ? null : json_decode($raw, true);
}

// Atomic write: a half-written file can never replace the good one
function mm_write_json(string $name, $data): void {
  $file = mm_path($name);
  $tmp = $file . '.' . bin2hex(random_bytes(6)) . '.tmp';
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  if ($json === false || file_put_contents($tmp, $json, LOCK_EX) === false || !rename($tmp, $file)) {
    @unlink($tmp);
    mm_fail(500, 'Could not save. Please try again.');
  }
  @chmod($file, 0600);
}

// ── Responses ──────────────────────────────────────────────────────────────
function mm_json(int $status, array $body): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('X-Content-Type-Options: nosniff');
  echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

function mm_fail(int $status, string $message, array $extra = []): void {
  mm_json($status, ['ok' => false, 'error' => $message] + $extra);
}

// ── Live list ──────────────────────────────────────────────────────────────
// When the built-in list (src/data/library.json) is replaced, set this to that time:
// a list saved from /admin before then is ignored, so the new built-in list shows.
// The old file stays and becomes a backup on the next save.
const MM_BUILT_IN_SINCE = '2026-10-08T17:25:00+00:00';

/** The list saved from /admin, or null when there is none or the built-in list is newer. */
function mm_live_books(): ?array {
  $data = mm_read_json('books.json');
  if (!is_array($data) || !is_array($data['books'] ?? null)) return null;
  if ((strtotime((string) ($data['updatedAt'] ?? '')) ?: 0) < strtotime(MM_BUILT_IN_SINCE)) return null;
  return $data;
}

// ── Book validation ────────────────────────────────────────────────────────
const MM_MAX_BOOKS = 2000;
const MM_DEFAULT_COVER = 'linear-gradient(160deg, #3b4a7a, #1d2647)';
const MM_COVER_PATH = '#^(/covers/[a-z0-9-]+\.(webp|jpg)|/api/cover\.php\?f=ol-\d{1,12}\.jpg)$#';
const MM_SITE = 'https://monkeymind.online';

function mm_str($v, int $max): string {
  $s = trim(is_string($v) ? $v : '');
  $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
  return mb_substr($s, 0, $max);
}

// Returns [cleanBooks, errors]
function mm_clean_books($input): array {
  if (!is_array($input)) return [[], ['The book list is missing.']];
  if (count($input) > MM_MAX_BOOKS) return [[], ['Too many books (max ' . MM_MAX_BOOKS . ').']];

  $out = []; $errors = []; $seen = [];
  foreach (array_values($input) as $i => $b) {
    $row = $i + 1;
    if (!is_array($b)) { $errors[] = "Row $row is not a book."; continue; }

    $title = mm_str($b['title'] ?? '', 200);
    $label = $title !== '' ? "“{$title}”" : "Row $row";
    $id = strtolower(mm_str($b['id'] ?? '', 80));
    if (!preg_match('/^[a-z0-9][a-z0-9-]*$/', $id)) { $errors[] = "$label: id must use only a-z, 0-9 and dashes."; continue; }
    if (isset($seen[$id])) { $errors[] = "$label: id “{$id}” is used twice."; continue; }
    $seen[$id] = true;

    $type = ($b['type'] ?? '') === 'audio' ? 'audio' : 'text';
    $author = mm_str($b['author'] ?? '', 200);
    if ($title === '' || $author === '') { $errors[] = "$label: title and author are required."; continue; }

    $link = mm_str($b['buyLink'] ?? '', 2000);
    if ($link !== '' && (!filter_var($link, FILTER_VALIDATE_URL) || !preg_match('#^https://#i', $link))) {
      $errors[] = "$label: the link must be a full https:// address."; continue;
    }

    $cover = mm_str($b['coverColor'] ?? '', 120);
    if (!preg_match('/^linear-gradient\(\d{1,3}deg,\s*#[0-9a-fA-F]{3,8},\s*#[0-9a-fA-F]{3,8}\)$/', $cover)) $cover = MM_DEFAULT_COVER;

    // Cover images are always our own files: built-in (/covers/…) or saved from the admin
    $image = mm_str($b['cover'] ?? '', 120);
    if ($image !== '' && !preg_match(MM_COVER_PATH, $image)) $image = '';

    $out[] = [
      'id' => $id,
      'type' => $type,
      'title' => $title,
      'author' => $author,
      'emoji' => mm_str($b['emoji'] ?? '', 16) ?: '📖',
      'coverColor' => $cover,
      'cover' => $image,
      'review' => mm_str($b['review'] ?? '', 1200),
      'buyLink' => $link,
      'shopName' => mm_str($b['shopName'] ?? '', 40) ?: 'Amazon',
    ];
  }
  return [$out, $errors];
}

// ── Covers ─────────────────────────────────────────────────────────────────
function mm_download(string $url): ?string {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 4,
      CURLOPT_TIMEOUT => 20, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
      CURLOPT_USERAGENT => 'MonkeyMind cover fetch (monkeymind.online)',
    ]);
    $body = curl_exec($ch);
    $ok = curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
    if (PHP_VERSION_ID < 80000) curl_close($ch); // no-op (and deprecated) since PHP 8
    return ($ok && is_string($body) && strlen($body) < 5 * 1024 * 1024) ? $body : null;
  }
  $ctx = stream_context_create(['http' => ['timeout' => 20, 'user_agent' => 'MonkeyMind cover fetch (monkeymind.online)']]);
  $body = @file_get_contents($url, false, $ctx, 0, 5 * 1024 * 1024);
  return $body === false ? null : $body;
}

// Resize to a sensible width when the GD extension is available; otherwise keep the original
function mm_shrink_jpeg(string $jpeg, int $width): string {
  if (!function_exists('imagecreatefromstring')) return $jpeg;
  $src = @imagecreatefromstring($jpeg);
  if (!$src || imagesx($src) <= $width) return $jpeg;
  $dst = imagescale($src, $width);
  ob_start();
  imagejpeg($dst, null, 80);
  return (string) ob_get_clean() ?: $jpeg;
}

