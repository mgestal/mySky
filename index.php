<?php
declare(strict_types=1);
date_default_timezone_set('Europe/Madrid');

$configPath = __DIR__ . '/config.json';
$defaultConfig = [
  'locationName' => 'A Coruña',
  'lat' => 43.37,
  'lon' => -8.41,
  'horizonSvg' => 'default.svg',
  'horizonOffset' => 18,
  'focalPreset' => 'na',
  'favorites' => [],
];
$loadedConfig = $defaultConfig;
if (is_file($configPath)) {
  $rawConfig = json_decode((string)file_get_contents($configPath), true);
  if (is_array($rawConfig)) {
    $loadedConfig = array_merge($loadedConfig, $rawConfig);
  }
}

$lat = isset($loadedConfig['lat']) ? (float)$loadedConfig['lat'] : 43.37;
$lon = isset($loadedConfig['lon']) ? (float)$loadedConfig['lon'] : -8.41;
if ($lat < -90 || $lat > 90) $lat = 43.37;
if ($lon < -180 || $lon > 180) $lon = -8.41;
$locationName = isset($loadedConfig['locationName']) ? trim((string)$loadedConfig['locationName']) : 'A Coruña';
if ($locationName === '') $locationName = 'A Coruña';
$horizonSvg = is_string($loadedConfig['horizonSvg'] ?? null) ? $loadedConfig['horizonSvg'] : $defaultConfig['horizonSvg'];
if ($horizonSvg === '') {
  $horizonSvg = $defaultConfig['horizonSvg'];
}
$horizonOffset = isset($loadedConfig['horizonOffset']) ? (float)$loadedConfig['horizonOffset'] : (float)$defaultConfig['horizonOffset'];
if (!is_finite($horizonOffset)) {
  $horizonOffset = (float)$defaultConfig['horizonOffset'];
}
$horizonOffset = max(-40.0, min(40.0, $horizonOffset));
$focalPreset = is_string($loadedConfig['focalPreset'] ?? null) ? $loadedConfig['focalPreset'] : $defaultConfig['focalPreset'];
if (!in_array($focalPreset, ['na', '16mm', '35mm', '50mm'], true)) {
  $focalPreset = $defaultConfig['focalPreset'];
}
$favorites = [];
if (isset($loadedConfig['favorites']) && is_array($loadedConfig['favorites'])) {
  foreach ($loadedConfig['favorites'] as $favorite) {
    if (!is_array($favorite)) continue;
    $favoriteName = trim((string)($favorite['locationName'] ?? ''));
    $favoriteLat = isset($favorite['lat']) ? (float)$favorite['lat'] : null;
    $favoriteLon = isset($favorite['lon']) ? (float)$favorite['lon'] : null;
    if ($favoriteName === '' || !is_float($favoriteLat) || !is_float($favoriteLon)) continue;
    if ($favoriteLat < -90 || $favoriteLat > 90 || $favoriteLon < -180 || $favoriteLon > 180) continue;
    $favoriteHorizonSvg = trim((string)($favorite['horizonSvg'] ?? ''));
    if ($favoriteHorizonSvg === '') {
      $favoriteHorizonSvg = 'default.svg';
    }
    $favoriteHorizonOffset = isset($favorite['horizonOffset']) ? (float)$favorite['horizonOffset'] : (float)$horizonOffset;
    if (!is_finite($favoriteHorizonOffset)) {
      $favoriteHorizonOffset = (float)$horizonOffset;
    }
    $favoriteHorizonOffset = max(-40.0, min(40.0, $favoriteHorizonOffset));
    $favorites[] = [
      'locationName' => $favoriteName,
      'lat' => round($favoriteLat, 6),
      'lon' => round($favoriteLon, 6),
      'horizonSvg' => $favoriteHorizonSvg,
      'horizonOffset' => round($favoriteHorizonOffset, 2),
    ];
  }
}

$tz = new DateTimeZone('Europe/Madrid');

$date = $_GET['date'] ?? date('Y-m-d');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    $date = date('Y-m-d');
}

$timeParam = (int)($_GET['t'] ?? 0);
$timeParam = max(0, min(600, $timeParam));
$sliderValue = 1440 + $timeParam;

$current = new DateTimeImmutable($date . ' 12:00:00', $tz);
$prevDate = $current->modify('-1 day')->format('Y-m-d');
$nextDate = $current->modify('+1 day')->format('Y-m-d');
$displayDate = $current->format('d/m/Y');
$sunInfo = date_sun_info($current->getTimestamp(), $lat, $lon);

// Day slider: today to +2 months
$todayDateObj = new DateTimeImmutable('today', $tz);
$maxDateObj = $todayDateObj->modify('+2 months');
$dayRangeMax = (int)$maxDateObj->diff($todayDateObj)->format('%a');
$dayOffsetSigned = (int)$todayDateObj->diff($current)->format('%r%a');
$dayOffset = max(0, min($dayRangeMax, $dayOffsetSigned));
$dayThumbDate = $current->format('d/m');

function hm($timestamp): string {
    if ($timestamp === false || $timestamp === true || $timestamp === null) return '—';
    return (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone('Europe/Madrid'))->format('H:i');
}
function hmWithOffset($timestamp, string $date): array {
    if ($timestamp === false || $timestamp === true || $timestamp === null) return ['time' => '—', 'nextDay' => false];
    $dtUtc = new DateTimeImmutable('@' . $timestamp);
    $dtLocal = $dtUtc->setTimezone(new DateTimeZone('Europe/Madrid'));
    $dateObj = new DateTimeImmutable($date . ' 00:00:00', new DateTimeZone('Europe/Madrid'));
    $isNextDay = $dtLocal->format('Y-m-d') !== $dateObj->format('Y-m-d');
    return ['time' => $dtLocal->format('H:i'), 'nextDay' => $isNextDay];
}
function hhmmToMinutes(string $hhmm): int {
    if (!preg_match('/^(\d{2}):(\d{2})$/', $hhmm, $m)) return 0;
    return ((int)$m[1]) * 60 + (int)$m[2];
}
function minutesToHhmm(int $minutes): string {
    $minutes %= 1440;
    if ($minutes < 0) $minutes += 1440;
    return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
}
function addMinutes(string $hhmm, int $delta): string {
    if ($hhmm === '—') return '—';
    return minutesToHhmm(hhmmToMinutes($hhmm) + $delta);
}

function sliderValueForTime(string $hhmm, ?bool $forceNextDay = null): ?int {
  if (!preg_match('/^(\d{2}):(\d{2})$/', $hhmm, $m)) return null;
  $mins = ((int)$m[1]) * 60 + (int)$m[2];
  $isNextDay = $forceNextDay ?? ($mins < 12 * 60);
  $value = $isNextDay ? 1440 + $mins : $mins;
  if ($value < 1200 || $value > 2040) return null;
  return $value;
}

function renderSliderTimeLink(string $hhmm, ?bool $forceNextDay = null): string {
  if ($hhmm === '—') return '—';
  $sliderValue = sliderValueForTime($hhmm, $forceNextDay);
  if ($sliderValue === null) return htmlspecialchars($hhmm, ENT_QUOTES, 'UTF-8');
  return '<a href="#" class="time-jump-link" data-slider-target="' . $sliderValue . '">' . htmlspecialchars($hhmm, ENT_QUOTES, 'UTF-8') . '</a>';
}

function isTimeNextDayInNightFrame(string $hhmm, ?bool $forceNextDay = null): bool {
  $sliderValue = sliderValueForTime($hhmm, $forceNextDay);
  return $sliderValue !== null && $sliderValue >= 1440;
}

function renderNextDayBadge(string $hhmm, ?bool $forceNextDay = null): string {
  if (!isTimeNextDayInNightFrame($hhmm, $forceNextDay)) return '';
  return ' <span class="time-next-day">(+1)</span>';
}

function moonPhaseIllumination(string $date): int {
    $knownNewMoon = strtotime('2000-01-06 18:14:00 UTC');
    $t = strtotime($date . ' 12:00:00 UTC');
    $synodic = 29.53058867;
    $days = ($t - $knownNewMoon) / 86400.0;
    $phase = fmod($days, $synodic);
    if ($phase < 0) $phase += $synodic;
    return (int)round(((1 - cos(2 * M_PI * $phase / $synodic)) / 2) * 100);
}
// --- Astronomical calculations ---

function julianDay(string $date): float {
    [$y, $m, $d] = array_map('intval', explode('-', $date));
    if ($m <= 2) { $y--; $m += 12; }
    $A = intdiv($y, 100);
    $B = 2 - $A + intdiv($A, 4);
    return (float)((int)(365.25 * ($y + 4716)) + (int)(30.6001 * ($m + 1)) + $d + $B) - 1524.5;
}
function gmst0h(float $jd): float {
    $T = ($jd - 2451545.0) / 36525.0;
    $g = 6.697374558 + 2400.0513369 * $T + 0.0000258622 * $T * $T;
    $g = fmod($g, 24.0);
    return $g < 0.0 ? $g + 24.0 : $g;
}
function riseSetUT(float $ra_deg, float $dec_deg, float $lat_deg, float $lon_deg, string $date): array {
    $jd    = julianDay($date);
    $lmst0 = fmod(gmst0h($jd) + $lon_deg / 15.0, 24.0);
    if ($lmst0 < 0.0) $lmst0 += 24.0;
    $ra_h  = $ra_deg / 15.0;
    $cosH0 = -tan(deg2rad($lat_deg)) * tan(deg2rad($dec_deg));
    $n24   = static function (float $h): float {
        $h = fmod($h, 24.0);
        return $h < 0.0 ? $h + 24.0 : $h;
    };
    $transit = $n24(($ra_h - $lmst0) / 1.00273791);
    if (abs($cosH0) > 1.0) return ['rise' => null, 'transit' => $transit, 'set' => null];
    $H0_h = rad2deg(acos($cosH0)) / 15.0;
    return [
        'rise'    => $n24(($ra_h - $H0_h - $lmst0) / 1.00273791),
        'transit' => $transit,
        'set'     => $n24(($ra_h + $H0_h - $lmst0) / 1.00273791),
    ];
}
function utToLocal(float $ut_h, string $date): string {
    $ts = strtotime($date . ' 00:00:00 UTC') + (int)round($ut_h * 3600.0);
    return (new DateTimeImmutable('@' . $ts))->setTimezone(new DateTimeZone('Europe/Madrid'))->format('H:i');
}
function localToUT(string $hhmm, string $date): ?float {
    if ($hhmm === '—') return null;
    $dt = DateTimeImmutable::createFromFormat('Y-m-d H:i', $date . ' ' . $hhmm, new DateTimeZone('Europe/Madrid'));
    if ($dt === false) return null;
    return ($dt->getTimestamp() - strtotime($date . ' 00:00:00 UTC')) / 3600.0;
}
function moonPosition(string $date): array {
    $jd = julianDay($date);
    $T  = ($jd - 2451545.0) / 36525.0;
    $L0 = fmod(218.316 + 481267.881 * $T, 360.0);
    $M  = fmod(134.963 + 477198.867 * $T, 360.0);
    $F  = fmod(93.272  + 483202.017 * $T, 360.0);
    $D  = fmod(297.850 + 445267.111 * $T, 360.0);
    $Mr = deg2rad($M); $Fr = deg2rad($F); $Dr = deg2rad($D);
    $dL = (6893.0*sin($Mr) + 72.0*sin(2.0*$Mr) + 2784.0*sin(2.0*$Dr - $Mr)
           + 2752.0*sin(2.0*$Dr) - 976.0*sin(2.0*$Dr - 2.0*$Mr)) / 3600.0;
    $dB = (5128.0*sin($Fr) + 280.0*sin($Mr + $Fr) + 277.0*sin($Mr - $Fr)) / 3600.0;
    $lambda = fmod($L0 + $dL + 360.0, 360.0);
    $eps    = 23.4393 - 0.0130042 * $T;
    $lr = deg2rad($lambda); $br = deg2rad($dB); $er = deg2rad($eps);
    $ra  = fmod(rad2deg(atan2(cos($er)*sin($lr) - tan($br)*sin($er), cos($lr))) + 360.0, 360.0);
    $dec = rad2deg(asin(sin($br)*cos($er) + cos($br)*sin($er)*sin($lr)));
    return ['ra' => $ra, 'dec' => $dec];
}
function sunDeclination(string $date): float {
    $jd  = julianDay($date);
    $n   = $jd - 2451545.0;
    $L   = fmod(280.460 + 0.9856474 * $n, 360.0);
    $g   = deg2rad(fmod(357.528 + 0.9856003 * $n, 360.0));
    $lam = deg2rad($L + 1.915 * sin($g) + 0.020 * sin(2.0 * $g));
    $eps = deg2rad(23.439 - 0.0000004 * $n);
    return rad2deg(asin(sin($eps) * sin($lam)));
}
function riseAzimuth(float $dec_deg, float $lat_deg): float {
    $c = sin(deg2rad($dec_deg)) / cos(deg2rad($lat_deg));
    $c = max(-1.0, min(1.0, $c));
    return round(rad2deg(acos($c)));
}
function marker360(float $az, string $label, string $time, string $color, int $r=238, string $id=''): string {
    $cx = 320; $cy = 320;
    $a = deg2rad($az - 90.0);
    $x = $cx + $r * cos($a); $y = $cy + $r * sin($a);
    $tx = $cx + ($r + 42) * cos($a); $ty = $cy + ($r + 42) * sin($a);
    $anchor = $x > $cx ? 'start' : 'end';
    if (abs($x - $cx) < 30) $anchor = 'middle';
  $idAttr = $id !== '' ? ' id="' . htmlspecialchars($id, ENT_QUOTES, 'UTF-8') . '"' : '';
  return '<g' . $idAttr . ' class="mark" style="--c:' . $color . '">' .
        '<line x1="' . round($x,1) . '" y1="' . round($y,1) . '" x2="' . round($cx + ($r - 34) * cos($a),1) . '" y2="' . round($cy + ($r - 34) * sin($a),1) . '" />' .
        '<circle cx="' . round($x,1) . '" cy="' . round($y,1) . '" r="8" />' .
        '<text x="' . round($tx,1) . '" y="' . round($ty,1) . '" text-anchor="' . $anchor . '">' . htmlspecialchars($label) . '</text>' .
        '<text x="' . round($tx,1) . '" y="' . (round($ty,1)+16) . '" text-anchor="' . $anchor . '">' . htmlspecialchars($time . ' · Az ' . round($az) . '°') . '</text>' .
        '</g>';
}
function js($value): string {
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function coordLabel(float $value, string $positive, string $negative): string {
  $abs = abs($value);
  return number_format($abs, 5, '.', '') . '° ' . ($value >= 0 ? $positive : $negative);
}

function weatherCodeLabel(?int $code): string {
  $map = [
    0 => 'Despejado',
    1 => 'Mayormente despejado',
    2 => 'Parcialmente nuboso',
    3 => 'Cubierto',
    45 => 'Niebla',
    48 => 'Niebla con escarcha',
    51 => 'Llovizna ligera',
    53 => 'Llovizna',
    55 => 'Llovizna intensa',
    56 => 'Llovizna helada ligera',
    57 => 'Llovizna helada intensa',
    61 => 'Lluvia ligera',
    63 => 'Lluvia',
    65 => 'Lluvia intensa',
    66 => 'Lluvia helada ligera',
    67 => 'Lluvia helada intensa',
    71 => 'Nieve ligera',
    73 => 'Nieve',
    75 => 'Nieve intensa',
    77 => 'Granizo',
    80 => 'Chubascos ligeros',
    81 => 'Chubascos',
    82 => 'Chubascos intensos',
    85 => 'Chubascos de nieve ligeros',
    86 => 'Chubascos de nieve intensos',
    95 => 'Tormenta',
    96 => 'Tormenta con granizo ligero',
    99 => 'Tormenta con granizo',
  ];

  if ($code === null) {
    return 'Sin datos';
  }

  return $map[$code] ?? 'Sin datos';
}

function fetchWeatherData(float $lat, float $lon): array {
  $query = http_build_query([
    'latitude' => $lat,
    'longitude' => $lon,
    'timezone' => 'Europe/Madrid',
    'current' => 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,weather_code',
    'hourly' => 'temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,weather_code',
    'forecast_hours' => 80,
  ]);
  $url = 'https://api.open-meteo.com/v1/forecast?' . $query;

  $opts = [
    'http' => [
      'method' => 'GET',
      'timeout' => 3,
      'ignore_errors' => true,
      'header' => "User-Agent: astro-coruna/1.0\r\n",
    ],
  ];
  $ctx = stream_context_create($opts);
  $raw = @file_get_contents($url, false, $ctx);
  if ($raw === false) {
    return [];
  }

  $json = json_decode($raw, true);
  if (!is_array($json)) {
    return [];
  }

  return [
    'current' => (isset($json['current']) && is_array($json['current'])) ? $json['current'] : [],
    'hourly' => (isset($json['hourly']) && is_array($json['hourly'])) ? $json['hourly'] : [],
  ];
}

function buildWeatherForecastByOffset(array $hourly, array $offsetHours): array {
  $times = $hourly['time'] ?? null;
  if (!is_array($times) || $times === []) {
    return [];
  }

  $tz = new DateTimeZone('Europe/Madrid');
  $timeEntries = [];
  foreach ($times as $i => $timeRaw) {
    if (!is_string($timeRaw)) {
      continue;
    }
    $dt = DateTimeImmutable::createFromFormat('Y-m-d\\TH:i', $timeRaw, $tz);
    if ($dt === false) {
      continue;
    }
    $timeEntries[] = ['index' => $i, 'dt' => $dt];
  }

  if ($timeEntries === []) {
    return [];
  }

  $now = new DateTimeImmutable('now', $tz);
  $result = [];
  foreach ($offsetHours as $offset) {
    $target = $now->modify('+' . (int)$offset . ' hours');
    $chosen = null;
    foreach ($timeEntries as $entry) {
      if ($entry['dt'] >= $target) {
        $chosen = $entry;
        break;
      }
    }
    if ($chosen === null) {
      continue;
    }

    $idx = $chosen['index'];
    $tempVal = isset($hourly['temperature_2m'][$idx]) ? (int)round((float)$hourly['temperature_2m'][$idx]) . '°C' : '—';
    $humVal = isset($hourly['relative_humidity_2m'][$idx]) ? (int)round((float)$hourly['relative_humidity_2m'][$idx]) . '%' : '—';
    $windVal = isset($hourly['wind_speed_10m'][$idx]) ? (int)round((float)$hourly['wind_speed_10m'][$idx]) . ' km/h' : '—';
    $cloudVal = isset($hourly['cloud_cover'][$idx]) ? (int)round((float)$hourly['cloud_cover'][$idx]) . '%' : '—';
    $codeVal = isset($hourly['weather_code'][$idx]) ? (int)$hourly['weather_code'][$idx] : null;

    $result[] = [
      'offsetLabel' => '+' . (int)$offset . 'h',
      'timeLabel' => $chosen['dt']->format('d/m H:i'),
      'temperature' => $tempVal,
      'humidity' => $humVal,
      'windSpeed' => $windVal,
      'cloudCover' => $cloudVal,
      'weatherLabel' => weatherCodeLabel($codeVal),
    ];
  }

  return $result;
}

$sunrise = hm($sunInfo['sunrise'] ?? null);
$sunset = hm($sunInfo['sunset'] ?? null);
$astroEnd = hm($sunInfo['astronomical_twilight_end'] ?? null);
$astroBegin = hm($sunInfo['astronomical_twilight_begin'] ?? null);
// Moon
$moonPos   = moonPosition($date);
$moonTimes = riseSetUT($moonPos['ra'], $moonPos['dec'], $lat, $lon, $date);
$moonRise  = ($moonTimes['rise'] !== null) ? utToLocal($moonTimes['rise'], $date) : '—';
$moonSet   = ($moonTimes['set']  !== null) ? utToLocal($moonTimes['set'],  $date) : '—';
// Determine if Moon set is on next day (if set time < rise time, it must be next day)
$moonSetNextDay = false;
if ($moonSet !== '—' && $moonRise !== '—') {
    $setMin = hhmmToMinutes($moonSet);
    $riseMin = hhmmToMinutes($moonRise);
    $moonSetNextDay = $setMin < $riseMin;
}
$moonIllumination = moonPhaseIllumination($date);

// Dark window boundaries in UT hours
$astroEnd_ut   = localToUT($astroEnd,   $date);
$astroBegin_ut = localToUT($astroBegin, $date);

// Galactic Center: RA 17h45m40s = 266.405°, Dec -29°00' = -29.007°
$gcTimes    = riseSetUT(266.405, -29.007, $lat, $lon, $date);
$gcRise_ut  = $gcTimes['rise'];
$gcTrans_ut = $gcTimes['transit'];
$gcSet_ut   = $gcTimes['set'];
$gcRise = ($gcRise_ut !== null) ? utToLocal($gcRise_ut, $date) : '—';

// GC set is capped to astronomical twilight begin (sky brightens before geometric set)
if ($gcSet_ut !== null && $astroBegin_ut !== null) {
    $gcSet = utToLocal(min($gcSet_ut, $astroBegin_ut), $date);
} else {
    $gcSet = ($gcSet_ut !== null) ? utToLocal($gcSet_ut, $date) : ($astroBegin ?? '—');
}

// Best window: transit ± 1h, capped to dark window
// Use "night frame" (morning hours < 12 are shifted +24 for correct comparison)
$nf = static function (float $h): float { return $h < 12.0 ? $h + 24.0 : $h; };
if ($gcTrans_ut !== null) {
    $tn = $nf($gcTrans_ut);
    $bs = $tn - 1.0;
    $be = $tn + 1.0;
    if ($gcRise_ut    !== null) $bs = max($bs, $nf($gcRise_ut));
    if ($astroEnd_ut  !== null) $bs = max($bs, $nf($astroEnd_ut));
    if ($astroBegin_ut !== null) $be = min($be, $nf($astroBegin_ut));
    $gcBest = utToLocal($bs > 24.0 ? $bs - 24.0 : $bs, $date)
            . ' – '
            . utToLocal($be > 24.0 ? $be - 24.0 : $be, $date);
} else {
    $gcBest = '—';
}

// Milky Way: representative point at Sgr/Sco boundary (rises ~20 min before GC)
$vlTimes   = riseSetUT(260.0, -29.0, $lat, $lon, $date);
$vlRise_ut = $vlTimes['rise'];
// VL rise = max(geometric rise, end of astronomical twilight)
if ($vlRise_ut !== null && $astroEnd_ut !== null) {
    $vr_nf  = max($nf($vlRise_ut), $nf($astroEnd_ut));
    $vlRise = utToLocal($vr_nf > 24.0 ? $vr_nf - 24.0 : $vr_nf, $date);
} else {
    $vlRise = ($vlRise_ut !== null) ? utToLocal($vlRise_ut, $date) : '—';
}
$vlSet = $astroBegin;

$weatherData = fetchWeatherData($lat, $lon);
$weatherCurrent = (isset($weatherData['current']) && is_array($weatherData['current'])) ? $weatherData['current'] : [];
$temperature = isset($weatherCurrent['temperature_2m']) ? (int)round((float)$weatherCurrent['temperature_2m']) . '°C' : '—';
$humidity = isset($weatherCurrent['relative_humidity_2m']) ? (int)round((float)$weatherCurrent['relative_humidity_2m']) . '%' : '—';
$windSpeed = isset($weatherCurrent['wind_speed_10m']) ? (int)round((float)$weatherCurrent['wind_speed_10m']) . ' km/h' : '—';
$cloudCover = isset($weatherCurrent['cloud_cover']) ? (int)round((float)$weatherCurrent['cloud_cover']) . '%' : '—';
$weatherLabel = weatherCodeLabel(isset($weatherCurrent['weather_code']) ? (int)$weatherCurrent['weather_code'] : null);
$weatherForecast = buildWeatherForecastByOffset(
  (isset($weatherData['hourly']) && is_array($weatherData['hourly'])) ? $weatherData['hourly'] : [],
  [6, 12, 24, 72]
);

$sunDecl   = sunDeclination($date);
$sunsetAz  = 360 - (int)riseAzimuth($sunDecl, $lat);
$gcRiseAz  = (int)riseAzimuth(-29.007, $lat);
$gcSetAz   = 360 - $gcRiseAz;
$vlRiseAz  = (int)riseAzimuth(-29.0, $lat);
$vlSetAz   = 360 - $vlRiseAz;
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MySky @ <?= htmlspecialchars($locationName) ?></title>
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>
.layout{grid-template-columns:360px minmax(0,1fr) 360px!important;align-items:start}
.main{min-width:0}
.right-column{display:flex;flex-direction:column;gap:12px}
.right-column .layers-card{position:static}
.layers-card{display:flex;flex-direction:column;gap:12px;padding:14px 16px}
.layers-card p{margin:0;color:#cedaeb;line-height:1.45}
.layers-legend{display:flex;gap:8px;flex-wrap:wrap}
.layer-pill{background:#18283d;border:1px solid #2b4260;color:#dce7f5;padding:9px 12px;border-radius:999px;font-weight:900;cursor:pointer;font-size:12px;line-height:1}
.layer-pill.active{background:#226fe2;border-color:#4d93ff;box-shadow:0 0 0 1px rgba(77,147,255,.18) inset}
.object-search{display:grid;gap:7px}
.object-search span{font-size:12px;color:#9eb1cc;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.object-search input{appearance:none;-webkit-appearance:none;background:#081220;color:#eef7ff;border:1px solid #52657e;border-radius:8px;padding:11px 12px;font-weight:700;min-width:0}
.object-results{display:grid;gap:8px;max-height:240px;overflow-y:auto;padding-right:2px}
.object-card{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.03);color:#dce7f5;font-size:13px;cursor:pointer}
.object-card.active{border-color:#49ee61;background:rgba(73,238,97,.11)}
.object-card strong{display:block;font-size:14px;color:#f1f7ff}
.object-card .meta{color:#aab7ca;font-size:12px;white-space:nowrap}
.object-detail{padding:12px 12px 13px;border:1px solid var(--line);border-radius:10px;background:rgba(8,17,30,.72);color:#dce7f5;line-height:1.45;font-size:13px}
.object-detail strong{color:#f1f7ff}
.object-label{fill:#f1f7ff;font-weight:900;font-size:13px;paint-order:stroke;stroke:#06101d;stroke-width:4px;stroke-linejoin:round}
.object-label.selected{fill:#49ee61;stroke:#07130c}
.object-point circle,.object-point path,.object-constellation polyline{filter:drop-shadow(0 0 6px currentColor)}
.object-point.selected circle,.object-constellation.selected polyline{stroke-width:4}
.object-constellation line{stroke-linecap:round}
.object-constellation path,.object-constellation polyline{fill:none;stroke-width:2.4;stroke-linejoin:round}
.planet-m{color:var(--orange)}
.constellation-m{color:var(--cyan)}
.deepsky-m{color:#ff9cc8}
.horizon-fill{fill:#000;opacity:1}
.horizon-profile-360{fill:none;stroke:#040404;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;opacity:.995;filter:none}
.horizon-profile-panorama{fill:none;stroke:rgba(170,208,238,.62);stroke-width:2.15;stroke-linecap:round;stroke-linejoin:round;opacity:.98;filter:drop-shadow(0 0 4px rgba(120,184,238,.45))}
.panorama-ground-mask{display:none}
.panorama-ground-cover{position:absolute;left:0;right:0;bottom:0;height:0;background:transparent}
.inclination-frame{aspect-ratio:2/3;  width: 55%; margin: 0 auto;background:radial-gradient(circle at 50% 0%,rgba(45,98,166,.28),rgba(4,12,24,.9) 58%,rgba(2,7,15,.98) 100%),radial-gradient(circle at 12% 18%,rgba(255,255,255,.55) 0 1.1px,transparent 1.7px),radial-gradient(circle at 78% 11%,rgba(255,255,255,.5) 0 1px,transparent 1.6px),radial-gradient(circle at 64% 52%,rgba(255,255,255,.42) 0 1px,transparent 1.6px),radial-gradient(circle at 35% 71%,rgba(255,255,255,.45) 0 1px,transparent 1.6px),radial-gradient(circle at 48% 37%,rgba(255,255,255,.38) 0 .9px,transparent 1.5px),#040b16;border:1px solid #294769;border-radius:10px;overflow:hidden;position:relative;background-size:cover,72px 72px,86px 86px,98px 98px,112px 112px,130px 130px,auto}
#inclinationSvg{width:100%;height:100%;display:block}
.incl-grid{stroke:rgba(220,235,255,.16);stroke-width:1}
.incl-horizon{stroke:#8fbbe7;stroke-width:2.6;filter:drop-shadow(0 0 6px rgba(135,196,255,.7))}
.incl-horizon-glow{fill:rgba(96,156,220,.2)}
.incl-ground{fill:#000;opacity:.97}
.incl-mw{fill:none;stroke:var(--green);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px var(--green))}
.incl-gc{stroke:var(--violet);stroke-width:2.4;fill:none;filter:drop-shadow(0 0 6px var(--violet))}
.incl-axis{stroke:rgba(190,215,245,.75);stroke-width:1.1}
.incl-text{fill:#dbe9fd;font-size:12px;font-weight:800}
.incl-text-strong{fill:var(--cyan);font-size:12px;font-weight:900}
.inclination-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:8px;padding:0 4px;color:#cfe0f6;font-size:12px;font-weight:700}
.controls{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.controls-row{display:flex;align-items:center;justify-content:flex-end;gap:16px;flex-wrap:wrap;width:100%}
.controls-row.compact-right{justify-content:flex-end}
.auto-speed-row{display:flex;align-items:center;justify-content:flex-end;gap:16px;flex-wrap:nowrap;white-space:nowrap;max-width:100%}
.sat-block{display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-width:100%}
.sat-layer-controls{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:nowrap;white-space:nowrap;max-width:100%}
.sat-drag-hint{color:#9ec5f4;font-size:12px;font-weight:700;white-space:nowrap}
.sat-zoom-controls{display:flex;gap:6px}
.sat-zoom-btn{background:#18283d;border:1px solid #2b4260;color:#dce7f5;border-radius:8px;padding:8px 11px;font-weight:900;cursor:pointer;line-height:1}
.sat-zoom-btn:disabled{opacity:.45;cursor:not-allowed}
#satellite360{position:absolute;inset:4.8%;border-radius:50%;overflow:hidden;display:none;z-index:0;transform-origin:center center;will-change:transform}
#satellite360.active{display:block}
#satellite360 .leaflet-control-attribution{display:none}
.sky-bg-360.hidden{display:none}
.timeline-labels span.timeline-pin-right{transform:translateX(-100%);text-align:right}
.config-card{padding:14px 16px}
.config-card p{margin:0;color:#cedaeb;line-height:1.45}
.config-open-btn{width:100%;display:block;text-align:center;text-decoration:none;background:#18324f;border:1px solid #2f5c8c;color:#dce7f5;border-radius:10px;padding:12px;font-weight:900;cursor:pointer}
.modal-backdrop{position:fixed;inset:0;background:rgba(1,7,14,.74);display:none;align-items:center;justify-content:center;padding:20px;z-index:9999}
.modal-backdrop.open{display:flex}
.modal-card{width:min(880px,100%);max-height:90vh;overflow:auto;background:linear-gradient(160deg,rgba(17,31,49,.98),rgba(8,17,30,.98));border:1px solid var(--line);border-radius:12px;padding:16px}
.modal-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
.modal-head h3{margin:0;color:var(--blue);font-size:18px}
.modal-head-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px}
.modal-head-btn{min-width:108px;height:40px;display:inline-flex;align-items:center;justify-content:center}
.modal-close{background:#18283d;border:1px solid #2b4260;color:#dce7f5;border-radius:8px;cursor:pointer;font-weight:900}
.config-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}
.config-map-block{display:grid;gap:10px}
.config-map{height:360px;border:1px solid #2b4260;border-radius:10px;overflow:hidden}
.config-search-row{display:flex;gap:8px}
.config-search-row input{flex:1;appearance:none;-webkit-appearance:none;background:#081220;color:#eef7ff;border:1px solid #52657e;border-radius:8px;padding:10px 11px;font-weight:700;min-width:0}
.config-search-row button{background:#18324f;border:1px solid #2f5c8c;color:#dce7f5;border-radius:8px;padding:10px 12px;font-weight:900;cursor:pointer}
.config-fields{display:grid;gap:10px}
.config-fields label{display:grid;gap:6px;font-size:13px;color:#cddbed;font-weight:700}
.config-fields input,.config-fields select{appearance:none;-webkit-appearance:none;background:#081220;color:#eef7ff;border:1px solid #52657e;border-radius:8px;padding:10px 11px;font-weight:700;min-width:0}
.config-hint{font-size:12px;color:#9eb1cc;line-height:1.35}
.config-fields-actions{display:flex;gap:10px;flex-wrap:wrap}
.config-secondary-btn{background:#18324f;border:1px solid #2f5c8c;color:#dce7f5;border-radius:8px;padding:10px 12px;font-weight:900;cursor:pointer}
.config-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px;flex-wrap:wrap}
.config-status{min-height:20px;font-size:12px;color:#9eb1cc}
.config-vis-section{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}
.config-vis-section h4{margin:0 0 10px;font-size:13px;color:#9eb1cc;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.config-vis-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 16px}
.config-vis-label{display:flex;align-items:center;gap:8px;font-size:13px;color:#cddbed;font-weight:600;cursor:pointer;user-select:none}
.config-vis-label input[type=checkbox]{width:15px;height:15px;accent-color:#5ba3f5;cursor:pointer;flex-shrink:0}
.weather-forecast{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.weather-forecast h3{margin:0 0 10px;color:#9eb1cc;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.forecast-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.forecast-item{border:1px solid var(--line);border-radius:10px;padding:10px;background:rgba(255,255,255,.03)}
.forecast-item strong{display:block;margin-bottom:8px;color:#f1f7ff;font-size:13px;font-weight:900;line-height:1.25}
.forecast-row{margin:0;color:#d9e8f8;font-size:12px;line-height:1.35}
.forecast-row + .forecast-row{margin-top:4px}
@media(max-width:900px){.config-grid{grid-template-columns:1fr}.config-map{height:300px}}
@media(max-width:1400px){.layout{grid-template-columns:360px minmax(0,1fr)!important}.right-column{grid-column:1/-1}.right-column .layers-card{position:static}}
@media(max-width:1200px){.selected-panel dl{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:1050px){.layout{grid-template-columns:1fr!important}.bottom-grid{grid-template-columns:1fr}}
@media(max-width:900px){.forecast-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.selected-panel dl{grid-template-columns:1fr}.forecast-grid{grid-template-columns:1fr}}
.header-icons{display:flex;gap:8px;align-items:center;margin-left:12px}
.header-icon-btn{background:transparent;border:none;font-size:20px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.15s ease}
.header-icon-btn:hover{background:rgba(255,255,255,.1)}
.view-toggle{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:min(560px,100%)}
.view-toggle button{padding:8px 8px;font-size:9px;line-height:1.1;white-space:nowrap;min-width:0}
.terrain-stage{margin-top:16px;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#071120}
.terrain-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);background:rgba(8,17,30,.82);color:#dce9fb;font-size:13px;font-weight:700}
.terrain-link{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#18324f;border:1px solid #2f5c8c;color:#dce7f5;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:900;white-space:nowrap}
.terrain-frame{display:block;width:100%;height:560px;border:0;background:#040b16}
.time-jump-link{color:#8fc8ff;text-decoration:none;border-bottom:1px dashed rgba(143,200,255,.55);padding-bottom:1px;font-weight:900}
.time-jump-link:hover,.time-jump-link:focus-visible{color:#c8e7ff;border-bottom-color:#c8e7ff;outline:none}
.time-next-day{color:#32d4ff;font-weight:bold}
@media(max-width:900px){.terrain-frame{height:460px}}
@media(max-width:640px){.view-toggle button{padding:7px 5px;font-size:10px}}
</style>
</head>
<body>
<div class="page">
  <header class="top">
    <div><h1 id="locationTitle"><?= htmlspecialchars($locationName) ?></h1><div id="locationSubtitle" class="subtitle"><?= htmlspecialchars(coordLabel($lat, 'N', 'S')) ?>, <?= htmlspecialchars(coordLabel($lon, 'E', 'O')) ?></div></div>
    <form method="get" class="date-form">
      <label for="date">Fecha:</label>
      <input id="date" class="date-input" type="date" name="date" value="<?= htmlspecialchars($date) ?>" required>
      <button type="button" class="calendar-btn" onclick="openCalendar()" title="Abrir calendario">📅</button>
      <a class="daybtn" href="?date=<?= htmlspecialchars($prevDate) ?>" title="Día anterior">←</a>
      <a class="daybtn" href="?date=<?= htmlspecialchars($nextDate) ?>" title="Día siguiente">→</a>
      <noscript><button type="submit">Actualizar</button></noscript>
      <div class="header-icons">
        <button type="button" id="headerManualBtn" class="header-icon-btn" title="Manual de usuario">📖</button>
        <button type="button" id="headerConfigBtn" class="header-icon-btn" title="Configuración">⚙️</button>
      </div>
    </form>
  </header>

  <div class="layout">
    <aside>
      <section class="card">
        <h2>Resumen de tiempos</h2>
        <table class="times">
          <tr class="orange"><td>🌅 Puesta del Sol</td><td><?= renderSliderTimeLink($sunset) ?><?= renderNextDayBadge($sunset) ?></td></tr>
          <tr><td>☀️ Salida del Sol</td><td><?= renderSliderTimeLink($sunrise) ?><?= renderNextDayBadge($sunrise) ?></td></tr>
          <tr><td>☾ Salida de la Luna</td><td><?= renderSliderTimeLink($moonRise, $moonRiseNextDay) ?><?= renderNextDayBadge($moonRise, $moonRiseNextDay) ?></td></tr>
          <tr><td>☽ Puesta de la Luna</td><td><?= renderSliderTimeLink($moonSet, $moonSetNextDay) ?><?= renderNextDayBadge($moonSet, $moonSetNextDay) ?></td></tr>
          <tr><td>◐ Iluminación lunar</td><td><?= $moonIllumination ?>%</td></tr>
          <tr><td>◐ Fin crepúsculo astronómico</td><td><?= renderSliderTimeLink($astroEnd) ?><?= renderNextDayBadge($astroEnd) ?></td></tr>
          <tr><td>◑ Inicio crepúsculo astronómico</td><td><?= renderSliderTimeLink($astroBegin) ?><?= renderNextDayBadge($astroBegin) ?></td></tr>
          <tr class="green"><td>☼ Salida visible de la Vía Láctea</td><td><?= renderSliderTimeLink($vlRise) ?><?= renderNextDayBadge($vlRise) ?></td></tr>
          <tr class="red"><td>☼ Ocultación de la Vía Láctea</td><td><?= renderSliderTimeLink($vlSet) ?><?= renderNextDayBadge($vlSet) ?></td></tr>
          <tr class="violet"><td>✣ Salida del Centro Galáctico</td><td><?= renderSliderTimeLink($gcRise) ?><?= renderNextDayBadge($gcRise) ?></td></tr>
          <tr class="violet"><td>★ Mejor momento Centro Galáctico</td><td><?= $gcBest ?></td></tr>
          <tr class="violet"><td>○ Puesta del Centro Galáctico</td><td><?= renderSliderTimeLink($gcSet) ?><?= renderNextDayBadge($gcSet) ?></td></tr>
        </table>
      </section>
      <section class="card info-card">
        <h2>Información</h2>
        <p>Horarios calculados/aproximados para <?= htmlspecialchars($locationName) ?> el <?= htmlspecialchars($displayDate) ?>.</p>
        <p>En la tabla, <span class="time-next-day">(+1)</span> indica que la hora corresponde al día siguiente dentro de la sesión nocturna.</p>
        <p>La vista panorámica está orientada mirando hacia el Sur: izquierda = E/SE, centro = S, derecha = SO/O.</p>
        <p>La altura máxima de la Vía Láctea se calcula muestreando el plano galáctico visible; la inclinación es la pendiente aparente del arco en la panorámica Sur.</p>
      </section>
      <!-- <section class="card legend-card">
        <h2>Leyenda</h2>
        <span class="green"><i></i>Salida de la Vía Láctea</span>
        <span class="red"><i></i>Ocultación de la Vía Láctea</span>
        <span class="violet"><i></i>Centro Galáctico</span>
        <span class="orange"><i></i>Sol: salida, puesta y trayectoria</span>
        <span class="cyan"><i></i>Luna: salida y puesta</span>
      </section> -->
    </aside>

    <main class="main">
      <section class="card hero">
        <div class="hero-head">
          <div>
            <h1>MySky App</h1>
            <p>Planificación fotográfica</p>
          </div>
          <div class="controls">
            <div class="controls-row">
              <div class="view-toggle">
                <button type="button" id="btn360" class="active">Vista 360°</button>
                <button type="button" id="btnPanorama">Panorámica</button>
                <button type="button" id="btnInclination">Inclinación</button>
                <button type="button" id="btnTerrain">Perfil &nbsp; </button>
              </div>
            </div>
            <div class="controls-row compact-right">
              <div class="auto-speed-row" id="autoSpeedRow">
                <label class="switch-label">Auto: <input id="autoPlay" type="checkbox"><span class="switch"></span></label>
                <div class="speed">
                  <span>Velocidad:</span>
                  <button type="button" data-speed="0.5">0.5x</button>
                  <button type="button" class="active" data-speed="1">1x</button>
                  <button type="button" data-speed="2">2x</button>
                </div>
              </div>
            </div>
            <div id="satelliteControlsRow" class="controls-row compact-right">
              <div class="sat-block">
                <div class="sat-layer-controls">
                  <label class="switch-label">Horizonte <input id="horizonLayerToggle" type="checkbox" checked><span class="switch"></span></label>
                  <label class="switch-label">Capa satélite <input id="satelliteLayerToggle" type="checkbox"><span class="switch"></span></label>
                  <div class="sat-zoom-controls">
                    <button type="button" id="satZoomOut" class="sat-zoom-btn" aria-label="Alejar mapa satélite">-</button>
                    <button type="button" id="satZoomIn" class="sat-zoom-btn" aria-label="Acercar mapa satélite">+</button>
                  </div>
                </div>
                <span class="sat-drag-hint">Ctrl + arrastrar: mover mapa</span>
              </div>
            </div>
          </div>
        </div>

        <div id="view360" class="view-pane active">
          <div class="sky-stage" id="sky360Stage">
            <div class="panorama-help">Arrastra para rotar · <strong id="heading360">N · 0°</strong></div>
            <div class="sky-bg-360" id="skyBg360"></div>
            <div id="satellite360" aria-label="Capa satélite para orientación sobre terreno"></div>
            <svg id="skySvg360" viewBox="0 0 640 640" role="img" aria-label="Vista circular 360 grados del cielo" style="cursor:grab">
              <circle class="horizon" cx="320" cy="320" r="238"/>
              <circle class="gridline" cx="320" cy="320" r="158"/>
              <circle class="gridline" cx="320" cy="320" r="78"/>
              <g id="sky360Rotate">
                <line class="axis" x1="320" y1="82" x2="320" y2="558"/>
                <line class="axis" x1="82" y1="320" x2="558" y2="320"/>
                <path id="horizonFill360" class="horizon-fill" d=""/>
                <path id="horizonProfile360" class="horizon-profile-360" d=""/>
                <path id="sunPath360" class="sun-path-360" d=""/>
                <path id="mwPlane360Path" class="mw-plane-360" d=""/>
                <g id="objectLayer360"></g>
                <g id="sunPosition360" class="mark sun-current" style="--c:#ffb02e"><circle cx="320" cy="320" r="7"/><text x="332" y="316">Sol</text></g>
                <g id="sunriseMarker360" class="mark" style="--c:#ffb02e"><circle cx="320" cy="320" r="7"/><text x="332" y="316">Salida Sol</text></g>
                <g id="sunsetMarker360" class="mark" style="--c:#ffb02e"><circle cx="320" cy="320" r="7"/><text x="332" y="316">Puesta Sol</text></g>
                <g id="moonriseMarker360" class="mark" style="--c:#32d4ff"><circle cx="320" cy="320" r="7"/><text x="332" y="316">Salida Luna</text></g>
                <g id="moonsetMarker360" class="mark" style="--c:#32d4ff"><circle cx="320" cy="320" r="7"/><text x="332" y="316">Puesta Luna</text></g>
                <g id="moonPosition360" class="moon-current" style="--c:#d9d9d9"><circle cx="320" cy="320" r="7"/><text x="332" y="316">Luna</text></g>
                <?= marker360($vlRiseAz, 'Salida VL', $vlRise, '#56f06a', 238, 'vlRiseMarker360') ?>
                <?= marker360($vlRiseAz, 'Salida cola VL', $vlRise, '#56f06a', 238, 'vlRiseTailMarker360') ?>
                <?= marker360($vlSetAz, 'Ocultación cola VL', $vlSet, '#ff4f45', 238, 'vlSetMarker360') ?>
                <?= marker360($vlSetAz, 'Ocultación VL', $vlSet, '#ff4f45', 238, 'vlSetFrontMarker360') ?>
                <?= marker360($gcRiseAz, 'Salida CG', $gcRise, '#b678ff', 238, 'gcRiseMarker360') ?>
                <?= marker360($gcSetAz, 'Puesta CG', $gcSet, '#4bd7ff', 238, 'gcSetMarker360') ?>
              </g>
              <g id="dynamicDirections360"></g>
            </svg>
          </div>
        </div>

        <div id="viewPanorama" class="view-pane">
          <div class="sky-panel" id="skyPanel">
            <div class="panorama-toolbar">
              <div class="panorama-help">Arrastrar cambia orientación · <strong id="panoramaHeading">180° (S)</strong></div>
            </div>
            <div class="sky-photo" id="skyPhoto"></div>
            <div class="sky-stars" id="skyStars" aria-hidden="true"></div>
            <div class="panorama-ground-cover" aria-hidden="true"></div>
            <svg viewBox="0 0 1000 520" preserveAspectRatio="xMidYMin slice" class="sky-overlay" aria-label="Panorámica orientable 360 grados">
              <path class="dome" d="M40,430 C150,60 850,60 960,430" />
              <line class="axis" x1="500" y1="80" x2="500" y2="470" />
              <line class="axis" x1="40" y1="430" x2="960" y2="430" />
              <path class="alt" d="M180,430 C250,210 750,210 820,430" />
              <path class="alt" d="M280,430 C330,300 670,300 720,430" />
              <path class="alt" d="M380,430 C410,370 590,370 620,430" />
              <path class="panorama-ground-mask" d="M0 380 L1000 380 L1000 520 L0 520 Z"/>
              <path id="horizonFillPanorama" class="horizon-fill" d=""/>
              <path id="horizonProfilePanorama" class="horizon-profile-panorama" d=""/>
              <g id="dynamicDirections"></g>
              <path id="sunPath" class="sun-path" d=""/>
              <path id="mwPlanePath" class="mw-plane" d=""/>
              <g id="objectLayerPanorama"></g>
              <circle id="moonDot" class="moon-dot" cx="820" cy="375" r="12"/>
              <g id="sunPositionMarker" class="svg-marker orange-m sun-current"><circle cx="710" cy="430" r="10"/><text x="690" y="398">Sol</text></g>
              <g id="sunriseMarker" class="svg-marker orange-m"><line x1="710" y1="430" x2="710" y2="402"/><circle cx="710" cy="430" r="8"/><text x="675" y="398">Salida del Sol</text></g>
              <g id="sunsetMarker" class="svg-marker orange-m"><line x1="710" y1="430" x2="710" y2="402"/><circle cx="710" cy="430" r="8"/><text x="675" y="398">Puesta del Sol</text></g>
              <g id="moonriseMarker" class="svg-marker cyan-m"><line x1="710" y1="430" x2="710" y2="402"/><circle cx="710" cy="430" r="8"/><text x="675" y="398">Salida Luna</text></g>
              <g id="moonsetMarker" class="svg-marker cyan-m"><line x1="710" y1="430" x2="710" y2="402"/><circle cx="710" cy="430" r="8"/><text x="675" y="398">Puesta Luna</text></g>              <g id="moonPositionMarker" class="svg-marker moon-current"><circle cx="710" cy="430" r="10"/><text x="675" y="398">Luna</text></g>              <g id="mwMarker" class="svg-marker green-m"><line x1="250" y1="430" x2="250" y2="400"/><circle cx="250" cy="430" r="8"/><text x="215" y="390">Vía Láctea<tspan x="215" dy="18">visible</tspan></text></g>
              <g id="gcMarker" class="svg-marker violet-m"><path d="M515 305 l0 28 M501 319 l28 0"/><circle cx="515" cy="319" r="11"/><text x="470" y="285">Centro Galáctico</text></g>
            </svg>
          </div>
          <label class="focal-control focal-control-panorama">
            Focal simulada
            <select class="focal-preset-select" data-focal-select>
              <option value="na"<?= $focalPreset === 'na' ? ' selected' : '' ?>>n/a</option>
              <option value="16mm"<?= $focalPreset === '16mm' ? ' selected' : '' ?>>16mm</option>
              <option value="35mm"<?= $focalPreset === '35mm' ? ' selected' : '' ?>>35mm</option>
              <option value="50mm"<?= $focalPreset === '50mm' ? ' selected' : '' ?>>50mm</option>
            </select>
          </label>
          <aside class="selected-panel">
        </div>

        <div id="viewInclination" class="view-pane">
          <div class="inclination-stage">
            <div class="inclination-frame">
              <svg id="inclinationSvg" viewBox="0 0 320 480" role="img" aria-label="Previsualización vertical de la inclinación de la Vía Láctea con cámara apuntando al centro galáctico">
                <line class="incl-grid" x1="160" y1="24" x2="160" y2="456"/>
                <line class="incl-grid" x1="16" y1="240" x2="304" y2="240"/>
                <path id="inclGround" class="incl-ground" d="M0 420 L320 420 L320 480 L0 480 Z"/>
                <path id="inclHorizonGlow" class="incl-horizon-glow" d=""/>
                <path id="inclHorizon" class="incl-horizon" d="M0 420 L320 420"/>
                <path id="inclMwPath" class="incl-mw" d=""/>
                <g id="inclGcMarker" class="incl-gc">
                  <line x1="160" y1="224" x2="160" y2="256"/>
                  <line x1="144" y1="240" x2="176" y2="240"/>
                  <circle cx="160" cy="240" r="10"/>
                  <text x="176" y="244" text-anchor="start" dominant-baseline="middle" style="fill:var(--violet);font-size:12px;font-weight:900;stroke:#06101d;stroke-width:3px;paint-order:stroke;stroke-linejoin:round">CG</text>
                </g>
                <line class="incl-axis" x1="16" y1="462" x2="304" y2="462"/>
                <line class="incl-axis" x1="160" y1="456" x2="160" y2="468"/>
                <text id="inclTiltLabel" class="incl-text-strong" x="16" y="24">Inclinación: 0°</text>
              </svg>
            </div>
            <label class="focal-control focal-control-inclination">
              Focal simulada
              <select class="focal-preset-select" data-focal-select>
                <option value="na"<?= $focalPreset === 'na' ? ' selected' : '' ?>>n/a </option>
                <option value="16mm"<?= $focalPreset === '16mm' ? ' selected' : '' ?>>16mm</option>
                <option value="35mm"<?= $focalPreset === '35mm' ? ' selected' : '' ?>>35mm</option>
                <option value="50mm"<?= $focalPreset === '50mm' ? ' selected' : '' ?>>50mm</option>
              </select>
            </label>
            <div class="inclination-meta">
              <span id="inclAimLabel">Apuntar cámara: Az 180°</span>
              <span id="inclHorizonLabel">Horizonte en Y=420</span>
            </div>
          </div>
        </div>

        <div id="viewTerrain" class="view-pane">
          <div class="terrain-stage">
            <div class="terrain-toolbar">
              <span>Perfil del terreno (Peakfinder)</span>
              <a id="terrainOpenExternal" class="terrain-link" href="https://www.peakfinder.com/es/" target="_blank" rel="noopener noreferrer">Abrir en Peakfinder</a>
            </div>
            <iframe id="terrainIframe" class="terrain-frame" title="Perfil del terreno en Peakfinder" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="about:blank"></iframe>
          </div>
        </div>

        <aside class="selected-panel">
          <dl>
            <dt>Altura Centro Galáctico</dt>
            <dt>Azimut Centro Galáctico</dt>
            <dt>Altura máxima Vía Láctea</dt>
            <dt>Inclinación Vía Láctea</dt>
            <dd data-stat="gcAlt">42.7°</dd>
            <dd data-stat="gcAz">187° (S)</dd>
            <dd data-stat="mwMaxAlt">—</dd>
            <dd data-stat="mwInclination">—</dd>
          </dl>
        </aside>

        <div class="timeline">
          
          <div class="timeline-labels">
            <span class="orange" style="left:3%" data-time="<?= htmlspecialchars($sunset, ENT_QUOTES, 'UTF-8') ?>">Ocaso<br><?= $sunset ?></span>
            <span style="left:15%" data-time="<?= htmlspecialchars($astroEnd, ENT_QUOTES, 'UTF-8') ?>">Noche<br><?= $astroEnd ?></span>
            <span class="green" style="left:28%" data-time="<?= htmlspecialchars($vlRise, ENT_QUOTES, 'UTF-8') ?>">Salida VL<br><?= $vlRise ?></span>
            <span class="violet" style="left:40%" data-time="<?= htmlspecialchars($gcRise, ENT_QUOTES, 'UTF-8') ?>">CG<br><?= $gcRise ?></span>
            <span class="violet" style="left:54%" data-time="<?= htmlspecialchars($gcBest, ENT_QUOTES, 'UTF-8') ?>">Best<br><?= $gcBest ?></span>
            <span class="red" style="left:70%" data-time="<?= htmlspecialchars($vlSet, ENT_QUOTES, 'UTF-8') ?>">Ocultación VL<br><?= $vlSet ?></span>
            <span class="violet" style="left:84%" data-time="<?= htmlspecialchars($gcSet, ENT_QUOTES, 'UTF-8') ?>">Puesta CG<br><?= $gcSet ?></span>
            <span class="orange" style="left:96%;transform:translateX(-100%);text-align:right" data-time="<?= htmlspecialchars($sunrise, ENT_QUOTES, 'UTF-8') ?>" data-shift="-4">Amanecer<br><?= $sunrise ?></span>
          </div>
          <div class="bar">
            <div class="seg sunset"></div><div class="seg night"></div><div class="seg mw"></div><div class="seg gc"></div><div class="seg best"></div><div class="seg redseg"></div><div id="dawnSeg" class="seg dawn"></div>
            <input id="hourSlider" type="range" min="1200" max="2040" value="<?= $sliderValue ?>" step="5">
            <div id="thumbLabel">03:30</div>
          </div>
          <div class="hours"><span>20:00</span><span>22:00</span><span>00:00</span><span>02:00</span><span>04:00</span><span>06:00</span><span>08:00</span><span>10:00</span></div>
        </div>
      </section>

      <section class="card day-slider-section">
        <div class="day-slider-label-left">Hoy: <strong><?= $dayThumbDate ?></strong></div>
        <div class="day-slider-wrap">
          <div class="day-slider-container">
            <input id="daySlider" type="range" min="0" max="<?= $dayRangeMax ?>" value="<?= $dayOffset ?>" step="1" class="day-slider">
            <div id="dayThumbLabel" class="day-thumb-label"></div>
          </div>
          <div class="day-label-right">+2 meses</div>
        </div>
      </section>

    </main>
    <aside class="right-column">
      <section class="card note conditions-card">
        <h2>Condiciones actuales (<?= htmlspecialchars($locationName) ?>)</h2>
        <div class="weather weather-current">
          <span>🌡️ <?= htmlspecialchars($temperature) ?></span>
          <span>💧 <?= htmlspecialchars($humidity) ?></span>
          <span>💨 <?= htmlspecialchars($windSpeed) ?></span>
          <span>🌤️ <?= htmlspecialchars($weatherLabel) ?></span>
          <span>☁️ <?= htmlspecialchars($cloudCover) ?></span>
        </div>
        <?php if ($weatherForecast !== []): ?>
          <div class="weather-forecast">
            <h3>Previsión próximas horas</h3>
            <div class="forecast-grid">
              <?php foreach ($weatherForecast as $forecast): ?>
                <article class="forecast-item">
                  <strong><?= htmlspecialchars($forecast['offsetLabel']) ?> <?= htmlspecialchars($forecast['timeLabel']) ?></strong>
                  <p class="forecast-row">🌡️ <?= htmlspecialchars($forecast['temperature']) ?>, 💧 <?= htmlspecialchars($forecast['humidity']) ?>, 💨 <?= htmlspecialchars($forecast['windSpeed']) ?></p>
                  <p class="forecast-row">🌤️ <?= htmlspecialchars($forecast['weatherLabel']) ?>, ☁️ <?= htmlspecialchars($forecast['cloudCover']) ?></p>
                </article>
              <?php endforeach; ?>
            </div>
          </div>
        <?php endif; ?>
      </section>
      <section class="card note layers-card">
        <h2>Capas de objetos celestes</h2>
        <p>Activa planetas, constelaciones y deep-sky, y busca objetos concretos para resaltarlos en el mapa.</p>
        <div class="layers-legend">
          <button type="button" class="layer-pill" data-layer="planets">Planetas</button>
          <button type="button" class="layer-pill" data-layer="constellations">Constelaciones</button>
          <button type="button" class="layer-pill" data-layer="deepSky">Deep-sky</button>
        </div>
        <label class="object-search">
          <span>Buscar objeto</span>
          <input id="objectSearch" type="search" placeholder="M31, Venus, Orión..." autocomplete="off">
        </label>
        <div id="objectResults" class="object-results"></div>
        <div id="objectDetail" class="object-detail">Selecciona un objeto para centrarlo y ver sus datos.</div>
      </section>
    </aside>
  </div>
</div>

<div id="configModal" class="modal-backdrop" aria-hidden="true">
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="configModalTitle">
    <div class="modal-head">
      <h3 id="configModalTitle">Configuración de ubicación y horizonte</h3>
      <div class="modal-head-actions">
        <button type="button" id="saveConfigBtn" class="modal-head-btn">Aceptar</button>
        <button type="button" id="closeConfigModal" class="modal-close modal-head-btn">Cerrar</button>
      </div>
    </div>
    <div class="config-grid">
      <div class="config-map-block">
        <div id="configMap" class="config-map" aria-label="Mapa para seleccionar coordenadas"></div>
        <div class="config-search-row">
          <input id="configAddressSearch" type="text" placeholder="Buscar dirección (ej. Torre de Hércules, A Coruña)">
          <button type="button" id="configAddressSearchBtn">Buscar</button>
        </div>
      </div>
      <div class="config-fields">
        <label>
          Localizaciones favoritas
          <select id="configFavoritesSelect">
            <option value="">Selecciona una favorita...</option>
            <?php foreach ($favorites as $favorite): ?>
                      <option value='<?= htmlspecialchars(json_encode($favorite, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), ENT_QUOTES, 'UTF-8') ?>'><?= htmlspecialchars($favorite['locationName']) ?> · <?= htmlspecialchars((string)$favorite['lat']) ?> </option>
            <?php endforeach; ?>
          </select>
          <div class="config-hint">Las favoritas pueden guardar también su perfil de horizonte.</div>
        </label>
        <label>
          Nombre de la ubicación
          <input id="configLocationName" type="text" maxlength="80" value="<?= htmlspecialchars($locationName) ?>">
        </label>
        <label>
          Latitud
          <input id="configLat" type="number" min="-90" max="90" step="0.000001" value="<?= htmlspecialchars((string)$lat) ?>">
        </label>
        <label>
          Longitud
          <input id="configLon" type="number" min="-180" max="180" step="0.000001" value="<?= htmlspecialchars((string)$lon) ?>">
        </label>
        <label>
          Horizonte (SILUETA.svg http://peakfinder.com)
          <input id="configSvgFile" type="file" accept=".svg,image/svg+xml">
          <div id="configCurrentHorizonHint" class="config-hint">Horizonte actual: <?= htmlspecialchars((string)$horizonSvg) ?></div>
        </label>
        <label>
          Offset
          <input id="configHorizonOffset" type="number" min="-40" max="40" step="0.1" value="<?= htmlspecialchars((string)round($horizonOffset, 2)) ?>">
          <div class="config-hint">Desplazamiento radial del perfil 360 para alinear terreno y horizonte.</div>
        </label>
        <div class="config-status" id="configStatus">Haz clic en el mapa para elegir coordenadas.</div>
        <div class="config-fields-actions">
          <button type="button" id="saveFavoriteBtn" class="config-secondary-btn">Guardar favorito</button>
          <button type="button" id="deleteFavoriteBtn" class="config-secondary-btn">Eliminar favorito</button>
        </div>
      </div>
    </div>
    <div class="config-vis-section">
      <h4>Visibilidad en gráficas</h4>
      <div class="config-vis-grid">
        <label class="config-vis-label"><input type="checkbox" id="visGcMarkers" checked> Marcadores CG (salida/ocultación)</label>
        <label class="config-vis-label"><input type="checkbox" id="visSunMarkers" checked> Marcadores Sol (salida/puesta)</label>
        <label class="config-vis-label"><input type="checkbox" id="visSunPath" checked> Arco recorrido Sol</label>
        <label class="config-vis-label"><input type="checkbox" id="visMoonMarkers" checked> Marcadores Luna (salida/puesta)</label>
        <label class="config-vis-label"><input type="checkbox" id="visVlMarkers" checked> Marcadores VL (salida/ocultación)</label>
        <label class="config-vis-label"><input type="checkbox" id="visAutoSpeed" checked> Controles de animación (Auto / Velocidad)</label>
      </div>
    </div>
  </div>
</div>

<script>
window.ASTRO_DATA = {
  date: <?= js($date) ?>,
  locationName: <?= js($locationName) ?>,
  lat: <?= js($lat) ?>,
  lon: <?= js($lon) ?>,
  horizonSvg: <?= js($horizonSvg) ?>,
  horizonOffset: <?= js(round($horizonOffset, 2)) ?>,
  focalPreset: <?= js($focalPreset) ?>,
  favoriteLocations: <?= js($favorites) ?>,
  dayBaseDate: <?= js($todayDateObj->format('Y-m-d')) ?>,
  moonIllumination: <?= js($moonIllumination) ?>,
  sunrise: <?= js($sunrise) ?>,
  sunset: <?= js($sunset) ?>,
  vlRise: <?= js($vlRise) ?>,
  vlSet: <?= js($vlSet) ?>,
  gcRise: <?= js($gcRise) ?>,
  gcSet: <?= js($gcSet) ?>,
  moonRise: <?= js($moonRise) ?>,
  moonSet: <?= js($moonSet) ?>,
  sunsetAz: <?= js($sunsetAz) ?>,
  vlRiseAz: <?= js($vlRiseAz) ?>,
  vlSetAz: <?= js($vlSetAz) ?>,
  gcRiseAz: <?= js($gcRiseAz) ?>,
  gcSetAz: <?= js($gcSetAz) ?>
};
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script src="app.js"></script>
<footer style="text-align:center;padding:20px;color:#999;font-size:14px;border-top:1px solid #333;margin-top:40px;">
  © 2026 Marcos Gestal. Todos los derechos reservados.
</footer>
</body>
</html>
