<?php
/**
 * TV Pulsar - High-Performance Streaming & Download Proxy
 * Hosted natively on cPanel (Apache / PHP)
 * Solves 429 Too Many Requests by providing verified MovieBox Referer headers
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

$targetUrl = isset($_GET['url']) ? trim($_GET['url']) : '';
if (empty($targetUrl) || !filter_var($targetUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo "Missing or invalid target url parameter.";
    exit();
}

$rawName = isset($_GET['filename']) ? trim($_GET['filename']) : 'video.mp4';
$cleanName = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $rawName);
if (!str_ends_with(strtolower($cleanName), '.mp4')) {
    $cleanName .= '.mp4';
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 3600);
curl_setopt($ch, CURLOPT_BUFFERSIZE, 128 * 1024);

$reqHeaders = [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer: https://movieboxapp.in/',
    'Accept: */*'
];

if (isset($_SERVER['HTTP_RANGE'])) {
    $reqHeaders[] = 'Range: ' . $_SERVER['HTTP_RANGE'];
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

// Forward relevant headers from upstream
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $headerLine) {
    $len = strlen($headerLine);
    $parts = explode(':', $headerLine, 2);
    if (count($parts) === 2) {
        $headerName = strtolower(trim($parts[0]));
        $headerVal = trim($parts[1]);
        if (in_array($headerName, ['content-type', 'content-length', 'content-range', 'accept-ranges'])) {
            header("$headerName: $headerVal");
        }
    }
    return $len;
});

// Force direct attachment download with clean filename
header("Content-Disposition: attachment; filename=\"$cleanName\"; filename*=UTF-8''" . rawurlencode($cleanName));

$success = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if ($httpCode >= 200 && $httpCode < 300) {
    http_response_code($httpCode);
}
curl_close($ch);
