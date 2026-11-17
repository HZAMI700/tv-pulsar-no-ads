<?php
/**
 * TV Pulsar - High-Performance Streaming & Direct Download Proxy
 * Hosted natively on cPanel (Apache / PHP)
 * Solves 429 Too Many Requests by providing verified MovieBox Referer headers
 * Prevents 1KB corrupt file downloads by validating upstream HTTP status before emitting Content-Disposition
 */

set_time_limit(0);
ini_set('memory_limit', '512M');
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', 'Off');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Range, Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Reassemble target URL if query parameters were split by PHP GET parsing
$targetUrl = isset($_GET['url']) ? trim($_GET['url']) : '';
if (empty($targetUrl) || !filter_var($targetUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing or invalid target url parameter.']);
    exit();
}

$extraParams = [];
foreach ($_GET as $k => $v) {
    if (!in_array($k, ['url', 'filename', 'download', 'name'])) {
        if (strpos($targetUrl, $k . '=') === false) {
            $extraParams[] = urlencode($k) . '=' . urlencode($v);
        }
    }
}
if (!empty($extraParams)) {
    $targetUrl .= (strpos($targetUrl, '?') === false ? '?' : '&') . implode('&', $extraParams);
}

$rawName = isset($_GET['filename']) ? trim($_GET['filename']) : (isset($_GET['name']) ? trim($_GET['name']) : 'video.mp4');
$cleanName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $rawName);
if (!preg_match('/\.mp4$/i', $cleanName)) {
    $cleanName .= '.mp4';
}

// 2. Prepare cURL request with required anti-hotlink bypass headers
$reqHeaders = [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer: https://movieboxapp.in/',
    'Origin: https://movieboxapp.in',
    'Accept: */*'
];

if (isset($_SERVER['HTTP_RANGE'])) {
    $reqHeaders[] = 'Range: ' . $_SERVER['HTTP_RANGE'];
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 3600);
curl_setopt($ch, CURLOPT_BUFFERSIZE, 128 * 1024);
curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
    curl_setopt($ch, CURLOPT_NOBODY, true);
}

// Track whether attachment headers have been safely sent
$headersSent = false;
$upstreamStatus = 0;

curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $headerLine) use (&$headersSent, &$upstreamStatus, $cleanName) {
    $len = strlen($headerLine);
    $trimmed = trim($headerLine);

    if (empty($trimmed)) {
        return $len;
    }

    if (preg_match('#^HTTP/[\d\.]+\s+(\d+)#i', $trimmed, $m)) {
        $upstreamStatus = (int)$m[1];
        if ($upstreamStatus >= 200 && $upstreamStatus < 300) {
            http_response_code($upstreamStatus);
            if (!$headersSent) {
                header("Content-Disposition: attachment; filename=\"$cleanName\"; filename*=UTF-8''" . rawurlencode($cleanName));
                $headersSent = true;
            }
        }
        return $len;
    }

    $parts = explode(':', $headerLine, 2);
    if (count($parts) === 2 && $upstreamStatus >= 200 && $upstreamStatus < 300) {
        $headerName = strtolower(trim($parts[0]));
        $headerVal = trim($parts[1]);
        if (in_array($headerName, ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag'])) {
            header("$headerName: $headerVal");
        }
    }
    return $len;
});

// Stream body chunks directly to client ONLY if upstream status is valid (200 or 206)
// This guarantees that any 429, 403, 404, or 500 error pages from CDN are NEVER saved as 1KB MP4 files!
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $chunk) use (&$headersSent, &$upstreamStatus) {
    $len = strlen($chunk);
    if ($upstreamStatus >= 200 && $upstreamStatus < 300) {
        echo $chunk;
        if (ob_get_level() > 0) {
            @ob_flush();
        }
        @flush();
        return $len;
    }
    // If upstream failed, discard error body from file output
    return $len;
});

$success = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// If upstream failed or returned an error status, output clean JSON error instead of corrupt MP4
if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code($httpCode >= 400 && $httpCode < 600 ? $httpCode : 502);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => "Video stream temporarily unavailable from upstream server (HTTP $httpCode).",
        'code' => $httpCode
    ]);
    exit();
}
