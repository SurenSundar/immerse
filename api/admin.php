<?php
// Private Library editor API (used by /admin). One owner account.
//
//   GET  ?action=status            → is an account set up, am I signed in
//   POST ?action=setup             → first run only: {setupCode, username, password}
//   POST ?action=login             → {username, password}
//   POST ?action=logout
//   GET  ?action=books             → the live list (null if never saved)
//   POST ?action=save              → {books, baseUpdatedAt}
//   POST ?action=password          → {current, next}
//   POST ?action=cover             → {coverId}: save an Open Library cover on our server
//   GET  ?action=backups           → saved versions of the list
//   GET  ?action=backup&name=…     → one saved version (to review and re-save)
//
// Writes need the session cookie AND the X-CSRF-Token header from `status`.
define('MM_API', true);
require __DIR__ . '/_lib.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

const MM_MIN_PASSWORD = 10;
const MM_IDLE_SECONDS = 4 * 3600;       // signed out after 4h of inactivity
const MM_MAX_SESSION_SECONDS = 24 * 3600;
const MM_MAX_FAILS = 5;                 // per IP, then locked for MM_LOCK_SECONDS
const MM_MAX_GLOBAL_FAILS = 25;         // across all IPs, same window
const MM_LOCK_SECONDS = 15 * 60;
const MM_BACKUPS_KEPT = 30;

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ── Session ────────────────────────────────────────────────────────────────
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
  || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name($https ? '__Host-mm_admin' : 'mm_admin');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => $https,
  'httponly' => true,
  'samesite' => 'Strict',
]);
session_start();

function mm_signed_in(): bool {
  if (empty($_SESSION['user'])) return false;
  $now = time();
  if ($now - ($_SESSION['last'] ?? 0) > MM_IDLE_SECONDS || $now - ($_SESSION['since'] ?? 0) > MM_MAX_SESSION_SECONDS) {
    $_SESSION = [];
    session_regenerate_id(true);
    return false;
  }
  $_SESSION['last'] = $now;
  return true;
}

function mm_csrf(): string {
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
  return $_SESSION['csrf'];
}

function mm_body(): array {
  $type = $_SERVER['CONTENT_TYPE'] ?? '';
  if (stripos($type, 'application/json') !== 0) mm_fail(415, 'Expected JSON.');
  $raw = file_get_contents('php://input', false, null, 0, 4 * 1024 * 1024);
  $data = json_decode($raw ?: '', true);
  if (!is_array($data)) mm_fail(400, 'Invalid request.');
  return $data;
}

// ── Cross-site protection for every POST ───────────────────────────────────
if ($method === 'POST') {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
  if ($origin !== '' && strtolower(parse_url($origin, PHP_URL_HOST) ?? '') !== $host) mm_fail(403, 'Request blocked.');
} elseif ($method !== 'GET') {
  mm_fail(405, 'Method not allowed.');
}

function mm_require_signed_in_write(): void {
  if (!mm_signed_in()) mm_fail(401, 'Please sign in again.');
  $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (!hash_equals(mm_csrf(), $token)) mm_fail(403, 'Your session expired. Reload the page and try again.');
}

// ── Brute-force protection ─────────────────────────────────────────────────
function mm_with_attempts(callable $fn) {
  $lock = fopen(mm_path('attempts.lock'), 'c');
  flock($lock, LOCK_EX);
  $data = mm_read_json('attempts.json') ?: [];
  $now = time();
  foreach ($data as $k => $v) if ($now - ($v['first'] ?? 0) > MM_LOCK_SECONDS) unset($data[$k]);
  $result = $fn($data, $now);
  mm_write_json('attempts.json', $data);
  flock($lock, LOCK_UN);
  fclose($lock);
  return $result;
}

function mm_ip_key(): string {
  return 'ip:' . substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|mm'), 0, 16);
}

function mm_check_not_locked(): void {
  $wait = mm_with_attempts(function (&$d, $now) {
    foreach ([mm_ip_key() => MM_MAX_FAILS, 'global' => MM_MAX_GLOBAL_FAILS] as $k => $max) {
      if (($d[$k]['count'] ?? 0) >= $max) return MM_LOCK_SECONDS - ($now - $d[$k]['first']);
    }
    return 0;
  });
  if ($wait > 0) mm_fail(429, 'Too many attempts. Try again in ' . max(1, (int) ceil($wait / 60)) . ' min.');
}

function mm_record_fail(): void {
  mm_with_attempts(function (&$d, $now) {
    foreach ([mm_ip_key(), 'global'] as $k) {
      if (!isset($d[$k])) $d[$k] = ['count' => 0, 'first' => $now];
      $d[$k]['count']++;
    }
  });
}

function mm_clear_fails(): void {
  mm_with_attempts(function (&$d) { unset($d[mm_ip_key()]); });
}

// ── First-run setup code ───────────────────────────────────────────────────
// Shown only in a file on the server, so only the site owner can create the account.
function mm_setup_code(): string {
  $file = mm_path('SETUP-CODE.txt');
  if (is_file($file) && preg_match('/CODE:\s*([A-Z0-9-]+)/', file_get_contents($file), $m)) return $m[1];
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $code = '';
  for ($i = 0; $i < 12; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)] . ($i % 4 === 3 && $i < 11 ? '-' : '');
  file_put_contents($file, "MonkeyMind admin setup\n\nEnter this code on the /admin page to create your account.\nIt stops working (and this file is deleted) once the account exists.\n\nCODE: $code\n");
  @chmod($file, 0600);
  return $code;
}

function mm_valid_username(string $u): bool { return (bool) preg_match('/^[A-Za-z0-9._-]{3,40}$/', $u); }

function mm_start_session(string $user): void {
  session_regenerate_id(true);
  $_SESSION = ['user' => $user, 'since' => time(), 'last' => time()];
  mm_csrf();
}

$account = mm_read_json('account.json');
$configured = is_array($account) && !empty($account['hash']);

switch ($action) {
  case 'status':
    if (!$configured) mm_setup_code();
    $in = $configured && mm_signed_in();
    mm_json(200, [
      'ok' => true,
      'configured' => $configured,
      'signedIn' => $in,
      'username' => $in ? $_SESSION['user'] : null,
      'csrf' => $in ? mm_csrf() : null,
    ]);

  case 'setup':
    if ($method !== 'POST') mm_fail(405, 'Method not allowed.');
    if ($configured) mm_fail(409, 'An account already exists. Please sign in.');
    mm_check_not_locked();
    $b = mm_body();
    $code = strtoupper(trim((string) ($b['setupCode'] ?? '')));
    if (!hash_equals(mm_setup_code(), $code)) { mm_record_fail(); mm_fail(403, 'That setup code is not right.'); }
    $user = trim((string) ($b['username'] ?? ''));
    $pass = (string) ($b['password'] ?? '');
    if (!mm_valid_username($user)) mm_fail(400, 'Username: 3–40 letters, numbers, dots, dashes or underscores.');
    if (mb_strlen($pass) < MM_MIN_PASSWORD) mm_fail(400, 'Password must be at least ' . MM_MIN_PASSWORD . ' characters.');
    mm_write_json('account.json', ['username' => $user, 'hash' => password_hash($pass, PASSWORD_DEFAULT), 'createdAt' => gmdate('c')]);
    @unlink(mm_path('SETUP-CODE.txt'));
    mm_clear_fails();
    mm_start_session($user);
    mm_json(200, ['ok' => true, 'username' => $user, 'csrf' => mm_csrf()]);

  case 'login':
    if ($method !== 'POST') mm_fail(405, 'Method not allowed.');
    if (!$configured) mm_fail(409, 'No account yet. Use the setup code first.');
    mm_check_not_locked();
    $b = mm_body();
    $user = (string) ($b['username'] ?? '');
    $pass = (string) ($b['password'] ?? '');
    // Always run password_verify so a wrong username takes as long as a wrong password
    $okPass = password_verify($pass, $account['hash']);
    if (!hash_equals($account['username'], $user) || !$okPass) {
      mm_record_fail();
      usleep(random_int(200000, 500000));
      mm_fail(401, 'Wrong username or password.');
    }
    if (password_needs_rehash($account['hash'], PASSWORD_DEFAULT)) {
      $account['hash'] = password_hash($pass, PASSWORD_DEFAULT);
      mm_write_json('account.json', $account);
    }
    mm_clear_fails();
    mm_start_session($user);
    mm_json(200, ['ok' => true, 'username' => $user, 'csrf' => mm_csrf()]);

  case 'logout':
    if ($method !== 'POST') mm_fail(405, 'Method not allowed.');
    $_SESSION = [];
    session_regenerate_id(true);
    session_destroy();
    mm_json(200, ['ok' => true]);

  case 'books':
    if (!mm_signed_in()) mm_fail(401, 'Please sign in.');
    $data = mm_live_books();
    mm_json(200, ['ok' => true, 'books' => $data['books'] ?? null, 'updatedAt' => $data['updatedAt'] ?? null]);

  case 'save':
    if ($method !== 'POST') mm_fail(405, 'Method not allowed.');
    mm_require_signed_in_write();
    $b = mm_body();
    $current = mm_live_books();
    $currentAt = $current['updatedAt'] ?? null;
    if (($b['baseUpdatedAt'] ?? null) !== $currentAt) {
      mm_fail(409, 'The list was changed somewhere else (another tab or device). Reload to get the latest, then redo your edits.', ['updatedAt' => $currentAt]);
    }
    [$books, $errors] = mm_clean_books($b['books'] ?? null);
    if ($errors) mm_fail(422, 'Some books need fixing before saving.', ['errors' => array_slice($errors, 0, 20)]);

    // Keep the previous version as a dated backup (also one the built-in list replaced)
    if (is_file(mm_path('books.json'))) {
      $dir = mm_data_dir() . '/backups';
      if (!is_dir($dir)) @mkdir($dir, 0700);
      @copy(mm_path('books.json'), $dir . '/books-' . gmdate('Ymd-His') . '.json');
      $old = glob($dir . '/books-*.json') ?: [];
      sort($old);
      foreach (array_slice($old, 0, max(0, count($old) - MM_BACKUPS_KEPT)) as $f) @unlink($f);
    }
    $now = gmdate('c');
    mm_write_json('books.json', ['updatedAt' => $now, 'updatedBy' => $_SESSION['user'], 'books' => $books]);
    mm_json(200, ['ok' => true, 'updatedAt' => $now, 'count' => count($books)]);

  case 'password':
    if ($method !== 'POST') mm_fail(405, 'Method not allowed.');
    mm_require_signed_in_write();
    mm_check_not_locked();
    $b = mm_body();
    if (!password_verify((string) ($b['current'] ?? ''), $account['hash'])) { mm_record_fail(); mm_fail(403, 'Current password is not right.'); }
    $next = (string) ($b['next'] ?? '');
    if (mb_strlen($next) < MM_MIN_PASSWORD) mm_fail(400, 'New password must be at least ' . MM_MIN_PASSWORD . ' characters.');
    $account['hash'] = password_hash($next, PASSWORD_DEFAULT);
    mm_write_json('account.json', $account);
    mm_start_session($account['username']);
    mm_json(200, ['ok' => true, 'csrf' => mm_csrf()]);

  case 'cover':
    if ($method !== 'POST') mm_fail(405, 'Method not allowed.');
    mm_require_signed_in_write();
    $b = mm_body();
    $coverId = (string) ($b['coverId'] ?? '');
    if (!preg_match('/^\d{1,12}$/', $coverId)) mm_fail(400, 'Invalid cover.');
    $dir = mm_data_dir() . '/covers';
    if (!is_dir($dir)) @mkdir($dir, 0700);
    $file = "$dir/ol-$coverId.jpg";
    if (!is_file($file)) {
      $img = mm_download("https://covers.openlibrary.org/b/id/$coverId-L.jpg");
      $info = $img ? @getimagesizefromstring($img) : false;
      if (!$info || $info[2] !== IMAGETYPE_JPEG || $info[0] < 60) mm_fail(502, 'Could not download that cover. Try another one.');
      if (file_put_contents($file, mm_shrink_jpeg($img, 360)) === false) mm_fail(500, 'Could not save the cover.');
    }
    mm_json(200, ['ok' => true, 'cover' => "/api/cover.php?f=ol-$coverId.jpg"]);

  case 'backups':
    if (!mm_signed_in()) mm_fail(401, 'Please sign in.');
    $files = glob(mm_data_dir() . '/backups/books-*.json') ?: [];
    rsort($files);
    $list = [];
    foreach ($files as $f) {
      $d = json_decode((string) file_get_contents($f), true);
      $list[] = ['name' => basename($f), 'savedAt' => $d['updatedAt'] ?? null, 'count' => count($d['books'] ?? [])];
    }
    mm_json(200, ['ok' => true, 'backups' => $list]);

  case 'backup':
    if (!mm_signed_in()) mm_fail(401, 'Please sign in.');
    $name = (string) ($_GET['name'] ?? '');
    if (!preg_match('/^books-\d{8}-\d{6}\.json$/', $name)) mm_fail(400, 'Invalid backup.');
    $d = json_decode((string) @file_get_contents(mm_data_dir() . "/backups/$name"), true);
    if (!is_array($d) || !isset($d['books'])) mm_fail(404, 'That backup no longer exists.');
    mm_json(200, ['ok' => true, 'books' => $d['books'], 'savedAt' => $d['updatedAt'] ?? null]);

  default:
    mm_fail(404, 'Unknown action.');
}
