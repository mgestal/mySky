<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Metodo no permitido']);
    exit;
}

$action = (string)($_POST['action'] ?? 'save_config');

$latRaw = $_POST['lat'] ?? null;
$lonRaw = $_POST['lon'] ?? null;
$locationNameRaw = $_POST['locationName'] ?? null;
$postedHorizonSvg = trim((string)($_POST['currentHorizonSvg'] ?? ''));

$normalizeHorizonSvg = static function (string $value): string {
    $value = trim($value);
    return $value === '' ? 'default.svg' : $value;
};

if (!is_numeric($latRaw) || !is_numeric($lonRaw)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Lat/Lon invalidas']);
    exit;
}

$lat = (float)$latRaw;
$lon = (float)$lonRaw;
$locationName = trim((string)$locationNameRaw);
if ($locationName === '') {
    $locationName = 'A Coruña';
}
if (function_exists('mb_strlen') && function_exists('mb_substr')) {
    if (mb_strlen($locationName) > 80) {
        $locationName = mb_substr($locationName, 0, 80);
    }
} elseif (strlen($locationName) > 80) {
    $locationName = substr($locationName, 0, 80);
}

if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Rangos de coordenadas invalidos']);
    exit;
}

$configPath = __DIR__ . '/config.json';
$current = [
    'locationName' => 'A Coruña',
    'lat' => 43.37,
    'lon' => -8.41,
    'horizonSvg' => 'default.svg',
    'favorites' => [],
];

if (is_file($configPath)) {
    $json = json_decode((string)file_get_contents($configPath), true);
    if (is_array($json)) {
        $current = array_merge($current, $json);
    }
}

$favorites = [];
if (isset($current['favorites']) && is_array($current['favorites'])) {
    foreach ($current['favorites'] as $favorite) {
        if (!is_array($favorite)) continue;
        $favoriteName = trim((string)($favorite['locationName'] ?? ''));
        $favoriteLat = isset($favorite['lat']) ? (float)$favorite['lat'] : null;
        $favoriteLon = isset($favorite['lon']) ? (float)$favorite['lon'] : null;
        $favoriteHorizonSvg = $normalizeHorizonSvg((string)($favorite['horizonSvg'] ?? ''));
        if ($favoriteName === '' || !is_float($favoriteLat) || !is_float($favoriteLon)) continue;
        if ($favoriteLat < -90 || $favoriteLat > 90 || $favoriteLon < -180 || $favoriteLon > 180) continue;
        $favorites[] = [
            'locationName' => $favoriteName,
            'lat' => round($favoriteLat, 6),
            'lon' => round($favoriteLon, 6),
            'horizonSvg' => $favoriteHorizonSvg !== '' ? $favoriteHorizonSvg : 'default.svg',
        ];
    }
}

if ($action === 'save_favorite') {
    $favoriteHorizonSvg = $normalizeHorizonSvg((string)$current['horizonSvg']);
    if (isset($_FILES['horizonSvg']) && is_array($_FILES['horizonSvg']) && ($_FILES['horizonSvg']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $upload = $_FILES['horizonSvg'];
        if (($upload['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Error al subir el SVG']);
            exit;
        }

        $tmpPath = (string)($upload['tmp_name'] ?? '');
        $original = (string)($upload['name'] ?? 'horizon.svg');
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        if ($ext !== 'svg') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'El fichero debe ser SVG']);
            exit;
        }

        $raw = (string)file_get_contents($tmpPath);
        if (stripos($raw, '<svg') === false) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Contenido SVG invalido']);
            exit;
        }

        $safeBase = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($original));
        if (!is_string($safeBase) || $safeBase === '') {
            $safeBase = 'horizon.svg';
        }

        $uploadDir = __DIR__ . '/uploads';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'No se pudo crear el directorio de subida']);
            exit;
        }

        $targetName = 'horizon_' . date('Ymd_His') . '_' . $safeBase;
        $targetPath = $uploadDir . '/' . $targetName;

        if (!move_uploaded_file($tmpPath, $targetPath)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'No se pudo guardar el SVG']);
            exit;
        }

        $favoriteHorizonSvg = 'uploads/' . $targetName;
    } elseif ($postedHorizonSvg !== '') {
        $favoriteHorizonSvg = $normalizeHorizonSvg($postedHorizonSvg);
    }

    $updated = false;
    foreach ($favorites as &$favorite) {
        if (strcasecmp($favorite['locationName'], $locationName) === 0) {
            $favorite['lat'] = round($lat, 6);
            $favorite['lon'] = round($lon, 6);
            $favorite['horizonSvg'] = $favoriteHorizonSvg;
            $updated = true;
            break;
        }
    }
    unset($favorite);
    if (!$updated) {
        $favorites[] = [
            'locationName' => $locationName,
            'lat' => round($lat, 6),
            'lon' => round($lon, 6),
            'horizonSvg' => $favoriteHorizonSvg,
        ];
    }

    $current['favorites'] = $favorites;
    $encodedFavorites = json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($encodedFavorites === false || file_put_contents($configPath, $encodedFavorites . "\n") === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'No se pudo guardar la favorita']);
        exit;
    }

    echo json_encode(['ok' => true, 'config' => $current], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$horizonSvg = is_string($current['horizonSvg'] ?? null) ? $current['horizonSvg'] : 'default.svg';
if ($horizonSvg === '') {
    $horizonSvg = 'default.svg';
}

if (isset($_FILES['horizonSvg']) && is_array($_FILES['horizonSvg']) && ($_FILES['horizonSvg']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $upload = $_FILES['horizonSvg'];
    if (($upload['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Error al subir el SVG']);
        exit;
    }

    $tmpPath = (string)($upload['tmp_name'] ?? '');
    $original = (string)($upload['name'] ?? 'horizon.svg');
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if ($ext !== 'svg') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'El fichero debe ser SVG']);
        exit;
    }

    $raw = (string)file_get_contents($tmpPath);
    if (stripos($raw, '<svg') === false) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Contenido SVG invalido']);
        exit;
    }

    $safeBase = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($original));
    if (!is_string($safeBase) || $safeBase === '') {
        $safeBase = 'horizon.svg';
    }

    $uploadDir = __DIR__ . '/uploads';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'No se pudo crear el directorio de subida']);
        exit;
    }

    $targetName = 'horizon_' . date('Ymd_His') . '_' . $safeBase;
    $targetPath = $uploadDir . '/' . $targetName;

    if (!move_uploaded_file($tmpPath, $targetPath)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'No se pudo guardar el SVG']);
        exit;
    }

    $horizonSvg = 'uploads/' . $targetName;
}

$newConfig = [
    'locationName' => $locationName,
    'lat' => round($lat, 6),
    'lon' => round($lon, 6),
    'horizonSvg' => $horizonSvg,
    'favorites' => $favorites,
];

$encoded = json_encode($newConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($encoded === false || file_put_contents($configPath, $encoded . "\n") === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo guardar config.json']);
    exit;
}

echo json_encode(['ok' => true, 'config' => $newConfig], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
