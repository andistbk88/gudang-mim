<?php
/**
 * Google Apps Script Proxy for PHP Shared Hosting
 * PT. Mahameru Insan Mandiri - Inventory & Stock Movement System
 */
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$scriptUrl = '';
$action = 'ping';
$payload = null;

if ($method === 'GET') {
    $scriptUrl = isset($_GET['scriptUrl']) ? $_GET['scriptUrl'] : '';
    $action = isset($_GET['action']) ? $_GET['action'] : 'ping';
} else {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if ($data) {
        $scriptUrl = isset($data['scriptUrl']) ? $data['scriptUrl'] : '';
        $action = isset($data['action']) ? $data['action'] : '';
        $payload = $rawInput;
    }
}

if (empty($scriptUrl) || strpos($scriptUrl, 'https://script.google.com/') !== 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'URL Google Apps Script tidak valid.']);
    exit;
}

$ch = curl_init();

if ($method === 'GET') {
    $separator = (strpos($scriptUrl, '?') !== false) ? '&' : '?';
    $targetUrl = $scriptUrl . $separator . 'action=' . urlencode($action);
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_HTTPGET, true);
} else {
    curl_setopt($ch, CURLOPT_URL, $scriptUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: text/plain']);
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'CURL Error: ' . $curlError]);
    exit;
}

$decoded = json_decode($response, true);
if ($decoded !== null) {
    echo json_encode(array_merge(['success' => true], $decoded));
} else {
    echo json_encode(['success' => true, 'raw' => $response]);
}
