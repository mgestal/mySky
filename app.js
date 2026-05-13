function openCalendar(){
  const input=document.getElementById('date');
  if(input&&typeof input.showPicker==='function')input.showPicker();
  else if(input){input.focus();input.click();}
}

const slider=document.getElementById('hourSlider'),
selectedTime=document.getElementById('selectedTime'),
thumbLabel=document.getElementById('thumbLabel'),
nowLine=document.getElementById('nowLine'),
nowAltitude=document.getElementById('nowAltitude'),
gcMarker=document.getElementById('gcMarker'),
mwMarker=document.getElementById('mwMarker'),
mwPlanePath=document.getElementById('mwPlanePath'),
mwPlane360Path=document.getElementById('mwPlane360Path'),
sunPath=document.getElementById('sunPath'),
sunPath360=document.getElementById('sunPath360'),
sunPositionMarker=document.getElementById('sunPositionMarker'),
sunPosition360=document.getElementById('sunPosition360'),
sunriseMarker360=document.getElementById('sunriseMarker360'),
sunsetMarker360=document.getElementById('sunsetMarker360'),
moonriseMarker360=document.getElementById('moonriseMarker360'),
moonsetMarker360=document.getElementById('moonsetMarker360'),
vlRiseMarker360=document.getElementById('vlRiseMarker360'),
vlRiseTailMarker360=document.getElementById('vlRiseTailMarker360'),
vlSetMarker360=document.getElementById('vlSetMarker360'),
vlSetFrontMarker360=document.getElementById('vlSetFrontMarker360'),
gcRiseMarker360=document.getElementById('gcRiseMarker360'),
gcSetMarker360=document.getElementById('gcSetMarker360'),
moonDot=document.getElementById('moonDot'),
gcAlt=document.getElementById('gcAlt'),
gcAz=document.getElementById('gcAz'),
mwMaxAlt=document.getElementById('mwMaxAlt'),
mwInclination=document.getElementById('mwInclination'),
autoPlay=document.getElementById('autoPlay'),
speedButtons=document.querySelectorAll('[data-speed]'),
btn360=document.getElementById('btn360'),
btnPanorama=document.getElementById('btnPanorama'),
btnInclination=document.getElementById('btnInclination'),
view360=document.getElementById('view360'),
viewPanorama=document.getElementById('viewPanorama'),
viewInclination=document.getElementById('viewInclination'),
nowMarker360=document.getElementById('nowMarker360'),
skyPanel=document.getElementById('skyPanel'),
skyPhoto=document.getElementById('skyPhoto'),
panoramaHeading=document.getElementById('panoramaHeading'),
panLeftLabel=document.getElementById('panLeftLabel'),
panCenterLabel=document.getElementById('panCenterLabel'),
panRightLabel=document.getElementById('panRightLabel'),
sunriseMarker=document.getElementById('sunriseMarker'),
sunsetMarker=document.getElementById('sunsetMarker'),
moonriseMarker=document.getElementById('moonriseMarker'),
moonsetMarker=document.getElementById('moonsetMarker'),
objectLayer360=document.getElementById('objectLayer360'),
objectLayerPanorama=document.getElementById('objectLayerPanorama'),
objectSearch=document.getElementById('objectSearch'),
objectResults=document.getElementById('objectResults'),
objectDetail=document.getElementById('objectDetail'),
horizonProfile360=document.getElementById('horizonProfile360'),
horizonFill360=document.getElementById('horizonFill360'),
horizonProfilePanorama=document.getElementById('horizonProfilePanorama'),
horizonFillPanorama=document.getElementById('horizonFillPanorama'),
daySlider=document.getElementById('daySlider'),
dayThumbLabel=document.getElementById('dayThumbLabel'),
dayCurrentLabel=document.getElementById('dayCurrentLabel'),
skySvg360=document.getElementById('skySvg360'),
sky360Rotate=document.getElementById('sky360Rotate'),
heading360=document.getElementById('heading360'),
satelliteControlsRow=document.getElementById('satelliteControlsRow'),
satelliteLayerToggle=document.getElementById('satelliteLayerToggle'),
satZoomIn=document.getElementById('satZoomIn'),
satZoomOut=document.getElementById('satZoomOut'),
satellite360El=document.getElementById('satellite360'),
inclinationSvg=document.getElementById('inclinationSvg'),
inclMwPath=document.getElementById('inclMwPath'),
inclGcMarker=document.getElementById('inclGcMarker'),
inclHorizon=document.getElementById('inclHorizon'),
inclHorizonGlow=document.getElementById('inclHorizonGlow'),
inclGround=document.getElementById('inclGround'),
inclTiltLabel=document.getElementById('inclTiltLabel'),
inclAimLabel=document.getElementById('inclAimLabel'),
inclHorizonLabel=document.getElementById('inclHorizonLabel'),
openConfigModalBtn=document.getElementById('openConfigModal'),
configModal=document.getElementById('configModal'),
closeConfigModalBtn=document.getElementById('closeConfigModal'),
configMapEl=document.getElementById('configMap'),
configFavoritesSelect=document.getElementById('configFavoritesSelect'),
configLocationNameInput=document.getElementById('configLocationName'),
configLatInput=document.getElementById('configLat'),
configLonInput=document.getElementById('configLon'),
configSvgFileInput=document.getElementById('configSvgFile'),
configAddressSearchInput=document.getElementById('configAddressSearch'),
configAddressSearchBtn=document.getElementById('configAddressSearchBtn'),
configStatus=document.getElementById('configStatus'),
saveFavoriteBtn=document.getElementById('saveFavoriteBtn'),
saveConfigBtn=document.getElementById('saveConfigBtn');

const timelineEventLabels=document.querySelectorAll('.timeline-labels [data-time]');

let speed=1,timer=null;
let panCenterAz=180;
let skyCenterAz=0;
let satelliteEnabled=false;
let LAT=Number(window.ASTRO_DATA?.lat ?? 43.37);
let LON=Number(window.ASTRO_DATA?.lon ?? -8.41);
let LOCATION_NAME=String(window.ASTRO_DATA?.locationName || 'A Coruña');
let FAVORITE_LOCATIONS=Array.isArray(window.ASTRO_DATA?.favoriteLocations) ? [...window.ASTRO_DATA.favoriteLocations] : [];
const PAN_FOV=180;
let PEAKFINDER_FILE=String(window.ASTRO_DATA?.horizonSvg || 'PeakFinder_n43.25450_w8.39506_s_32_3_e_M_m_d.svg');
const PEAKFINDER_X_START=240;
const PEAKFINDER_X_SPAN=32760;
const PEAKFINDER_Y_HORIZON=1816;
const PEAKFINDER_PX_PER_DEG=56.8;
const HORIZON_SAMPLES=720;
const layerState={planets:false,constellations:false,deepSky:false};
let selectedObjectId=null;
let horizonAltitudes=null;
let satelliteMap=null;

// Visibility settings for chart markers
const visState={
  gcMarkers: true,
  sunMarkers: true,
  sunPath: true,
  moonMarkers: true,
  vlMarkers: true,
};

const gcAltValues=document.querySelectorAll('[data-stat="gcAlt"]');
const gcAzValues=document.querySelectorAll('[data-stat="gcAz"]');
const mwMaxAltValues=document.querySelectorAll('[data-stat="mwMaxAlt"]');
const mwInclinationValues=document.querySelectorAll('[data-stat="mwInclination"]');

const objectCatalog=[
  {id:'jupiter', label:'Júpiter', category:'planets', kind:'point', ra:73.2, dec:22.1, magnitude:'-2.0'},
  {id:'venus', label:'Venus', category:'planets', kind:'point', ra:50.8, dec:18.0, magnitude:'-4.1'},
  {id:'mars', label:'Marte', category:'planets', kind:'point', ra:121.3, dec:24.8, magnitude:'1.1'},
  {id:'orion', label:'Orión', category:'constellations', kind:'constellation', stars:[
    {ra:88.79, dec:7.41},
    {ra:81.28, dec:6.35},
    {ra:85.19, dec:-1.94},
    {ra:84.05, dec:-1.20},
    {ra:83.00, dec:-0.30}
  ], magnitude:'-'},
  {id:'cygnus', label:'Cisne', category:'constellations', kind:'constellation', stars:[
    {ra:310.36, dec:45.28},
    {ra:305.56, dec:40.26},
    {ra:292.68, dec:27.96}
  ], magnitude:'-'},
  {id:'m31', label:'M31 Andrómeda', category:'deepSky', kind:'point', ra:10.6847, dec:41.2692, magnitude:'3.4'},
  {id:'m42', label:'M42 Orión', category:'deepSky', kind:'point', ra:83.8221, dec:-5.3911, magnitude:'4.0'},
  {id:'m13', label:'M13 Hércules', category:'deepSky', kind:'point', ra:250.423, dec:36.461, magnitude:'5.8'},
  {id:'m8', label:'M8 Laguna', category:'deepSky', kind:'point', ra:270.925, dec:-24.385, magnitude:'6.0'},
  {id:'cassiopeia', label:'Casiopea', category:'constellations', kind:'constellation', stars:[
    {ra:10.67, dec:56.54},
    {ra:2.44, dec:59.15},
    {ra:3.21, dec:60.74},
    {ra:21.29, dec:60.24},
    {ra:28.60, dec:63.67}
  ], magnitude:'-'},
  {id:'ursamajor', label:'Osa Mayor', category:'constellations', kind:'constellation', stars:[
    {ra:165.93, dec:61.76},
    {ra:165.93, dec:56.38},
    {ra:206.89, dec:49.31},
    {ra:200.98, dec:54.93},
    {ra:193.51, dec:55.96},
    {ra:178.46, dec:47.78}
  ], magnitude:'-'},
  {id:'lyra', label:'Lira', category:'constellations', kind:'constellation', stars:[
    {ra:279.23, dec:38.78},
    {ra:284.73, dec:33.36},
    {ra:284.72, dec:32.69},
    {ra:286.76, dec:39.67}
  ], magnitude:'-'},
  {id:'scorpius', label:'Escorpio', category:'constellations', kind:'constellation', stars:[
    {ra:244.43, dec:-26.43},
    {ra:263.90, dec:-37.10},
    {ra:264.30, dec:-42.82},
    {ra:261.33, dec:-38.97},
    {ra:248.97, dec:-28.23}
  ], magnitude:'-'}
];

function deg2rad(d){return d*Math.PI/180;}
function rad2deg(r){return r*180/Math.PI;}
function norm360(d){d%=360; return d<0?d+360:d;}
function signedAzDiff(az,center){return ((az-center+540)%360)-180;}

function minutesToLabel(v){
  v=Number(v);
  const mins=v%1440,h=Math.floor(mins/60),m=mins%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function setView(mode){
  const is360=mode==='360';
  const isPanorama=mode==='panorama';
  const isInclination=mode==='inclination';
  view360.classList.toggle('active',is360);
  viewPanorama.classList.toggle('active',isPanorama);
  if(viewInclination) viewInclination.classList.toggle('active',isInclination);
  btn360.classList.toggle('active',is360);
  btnPanorama.classList.toggle('active',isPanorama);
  if(btnInclination) btnInclination.classList.toggle('active',isInclination);
  if(satelliteControlsRow) satelliteControlsRow.style.display=is360?'flex':'none';
  if(is360 && satelliteEnabled && satelliteMap){
    setTimeout(()=>{ if(satelliteMap) satelliteMap.invalidateSize(); },80);
  }
  localStorage.setItem('selectedView',mode);
}

btn360.addEventListener('click',()=>setView('360'));
btnPanorama.addEventListener('click',()=>setView('panorama'));
if(btnInclination) btnInclination.addEventListener('click',()=>setView('inclination'));

function julianDate(dateObj){ return dateObj.getTime()/86400000 + 2440587.5; }

function gmstDeg(jd){
  const T=(jd-2451545.0)/36525.0;
  return norm360(280.46061837 + 360.98564736629*(jd-2451545.0) + 0.000387933*T*T - T*T*T/38710000.0);
}

function lstDeg(dateObj){ return norm360(gmstDeg(julianDate(dateObj)) + LON); }

// Galactic -> equatorial J2000 using the standard rotation matrix.
// l,b in degrees. Returns RA/Dec in degrees.
function galToEq(lDeg,bDeg){
  const l=deg2rad(lDeg), b=deg2rad(bDeg);
  const xg=Math.cos(b)*Math.cos(l);
  const yg=Math.cos(b)*Math.sin(l);
  const zg=Math.sin(b);

  const xeq = -0.0548755604*xg + 0.4941094279*yg - 0.8676661490*zg;
  const yeq = -0.8734370902*xg - 0.4448296300*yg - 0.1980763734*zg;
  const zeq = -0.4838350155*xg + 0.7469822445*yg + 0.4559837762*zg;

  return {ra:norm360(rad2deg(Math.atan2(yeq,xeq))), dec:rad2deg(Math.asin(zeq))};
}

function eqToAltAz(raDeg,decDeg,dateObj){
  const H=deg2rad(norm360(lstDeg(dateObj)-raDeg));
  const lat=deg2rad(LAT), dec=deg2rad(decDeg);
  const alt=Math.asin(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(H));
  const az=Math.atan2(-Math.sin(H), Math.tan(dec)*Math.cos(lat)-Math.sin(lat)*Math.cos(H));
  return {alt:rad2deg(alt), az:norm360(rad2deg(az))};
}

function directionName(az){
  az=norm360(az);
  if(az>=337.5 || az<22.5) return 'N';
  if(az>=22.5 && az<67.5) return 'NE';
  if(az>=67.5 && az<112.5) return 'E';
  if(az>=112.5 && az<157.5) return 'SE';
  if(az>=157.5 && az<202.5) return 'S';
  if(az>=202.5 && az<247.5) return 'SO';
  if(az>=247.5 && az<292.5) return 'O';
  return 'NO';
}

function setStatValues(nodes,text){
  nodes.forEach(node=>{node.textContent=text;});
}

function dateForSliderMinutes(sliderMinutes){
  const baseDate=(window.ASTRO_DATA&&window.ASTRO_DATA.date)?window.ASTRO_DATA.date:new Date().toISOString().slice(0,10);
  const [y,m,d]=baseDate.split('-').map(Number);
  let minutes=Number(sliderMinutes);
  const dayOffset=minutes>=1440?1:0;
  minutes%=1440;
  return new Date(y,m-1,d+dayOffset,Math.floor(minutes/60),minutes%60,0);
}

function projectPanorama(az,alt){
  const d=signedAzDiff(az,panCenterAz);
  const visible=alt>0 && Math.abs(d)<=PAN_FOV/2;
  const x=500+(d/(PAN_FOV/2))*500;
  const y=430-(Math.max(0,Math.min(75,alt))/75)*350;
  return {x,y,visible};
}

function project360(az,alt){
  if(alt<=0) return {x:0,y:0,visible:false};
  const cx=320, cy=320, r=238*(1-Math.min(90,alt)/90);
  const a=deg2rad(az-90);
  return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a), visible:true};
}

function project360WithHorizon(az,alt){
  const cx=320, cy=320, r=238*(1-Math.min(90,Math.max(0,alt))/90);
  const a=deg2rad(az-90);
  return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)};
}

function project360Outer(az){
  const cx=320, cy=320, r=286;
  const a=deg2rad(az-90);
  return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)};
}

function parsePathPoints(pathD){
  const points=[];
  const re=/[ML]\s*([\d.]+),([\d.]+)/g;
  let match;
  while((match=re.exec(pathD))!==null){
    points.push({x:Number(match[1]), y:Number(match[2])});
  }
  return points;
}

function peakfinderXToAz(x){
  return norm360(((x-PEAKFINDER_X_START)/PEAKFINDER_X_SPAN)*360);
}

function peakfinderYToAlt(y){
  return (PEAKFINDER_Y_HORIZON-y)/PEAKFINDER_PX_PER_DEG;
}

function parsePeakfinderHorizon(svgText){
  const parser=new DOMParser();
  const doc=parser.parseFromString(svgText,'image/svg+xml');
  const paths=[...doc.querySelectorAll('g#lines path[d]')];
  if(!paths.length) return null;

  const minYBySample=new Array(HORIZON_SAMPLES).fill(Infinity);

  const registerPoint=(x,y)=>{
    if(!Number.isFinite(x) || !Number.isFinite(y)) return;
    if(x<PEAKFINDER_X_START || x>PEAKFINDER_X_START+PEAKFINDER_X_SPAN) return;
    const az=peakfinderXToAz(x);
    const idx=Math.max(0,Math.min(HORIZON_SAMPLES-1,Math.round((az/360)*(HORIZON_SAMPLES-1))));
    if(y<minYBySample[idx]) minYBySample[idx]=y;
  };

  paths.forEach(path=>{
    const points=parsePathPoints(path.getAttribute('d')||'');
    if(points.length<2) return;
    for(let i=1;i<points.length;i++){
      const p0=points[i-1], p1=points[i];
      const steps=Math.max(1,Math.ceil(Math.abs(p1.x-p0.x)/8));
      for(let step=0;step<=steps;step++){
        const t=step/steps;
        registerPoint(p0.x+(p1.x-p0.x)*t, p0.y+(p1.y-p0.y)*t);
      }
    }
  });

  let lastValid=null;
  for(let i=0;i<HORIZON_SAMPLES;i++){
    if(minYBySample[i]!==Infinity){
      lastValid=minYBySample[i];
    }else if(lastValid!==null){
      minYBySample[i]=lastValid;
    }
  }
  lastValid=null;
  for(let i=HORIZON_SAMPLES-1;i>=0;i--){
    if(minYBySample[i]!==Infinity){
      lastValid=minYBySample[i];
    }else if(lastValid!==null){
      minYBySample[i]=lastValid;
    }
  }

  return minYBySample.map(y=>{
    if(y===Infinity) return null;
    return Math.max(0,Math.min(25,peakfinderYToAlt(y)));
  });
}

function renderHorizonProfile360(){
  if(!horizonProfile360 || !horizonFill360 || !horizonAltitudes) return;
  let profilePath='';
  const terrain=[];
  const outer=[];
  for(let i=0;i<horizonAltitudes.length;i++){
    const alt=horizonAltitudes[i];
    if(alt===null) continue;
    const az=(i/(horizonAltitudes.length-1))*360;
    const pTerrain=project360WithHorizon(az,alt);
    const pOuter=project360Outer(az);
    terrain.push(pTerrain);
    outer.push(pOuter);
    profilePath += profilePath ? `L ${pTerrain.x.toFixed(1)} ${pTerrain.y.toFixed(1)} ` : `M ${pTerrain.x.toFixed(1)} ${pTerrain.y.toFixed(1)} `;
  }
  if(!terrain.length){
    horizonProfile360.setAttribute('d','');
    horizonFill360.setAttribute('d','');
    return;
  }
  let fillPath=`M ${terrain[0].x.toFixed(1)} ${terrain[0].y.toFixed(1)} `;
  for(let i=1;i<terrain.length;i++) fillPath += `L ${terrain[i].x.toFixed(1)} ${terrain[i].y.toFixed(1)} `;
  for(let i=outer.length-1;i>=0;i--) fillPath += `L ${outer[i].x.toFixed(1)} ${outer[i].y.toFixed(1)} `;
  fillPath += 'Z';
  horizonProfile360.setAttribute('d',profilePath.trim());
  horizonFill360.setAttribute('d',fillPath.trim());
}

function renderHorizonProfilePanorama(){
  if(!horizonProfilePanorama || !horizonFillPanorama || !horizonAltitudes) return;
  const getHorizonAlt=(az)=>{
    const n=horizonAltitudes.length;
    if(n<2) return null;
    const pos=(norm360(az)/360)*(n-1);
    const i0=Math.floor(pos);
    const i1=(i0+1)%(n-1);
    const t=pos-i0;
    const a0=horizonAltitudes[i0];
    const a1=horizonAltitudes[i1];
    if(a0===null && a1===null) return null;
    if(a0===null) return a1;
    if(a1===null) return a0;
    return a0 + (a1-a0)*t;
  };

  const points=[];
  for(let x=0;x<=1000;x+=2){
    const d=((x-500)/500)*(PAN_FOV/2);
    const az=norm360(panCenterAz+d);
    const alt=getHorizonAlt(az);
    if(alt===null) continue;
    const y=430-(Math.max(0,Math.min(75,alt))/75)*350;
    points.push({x,y});
  }

  if(points.length<2){
    horizonProfilePanorama.setAttribute('d','');
    horizonFillPanorama.setAttribute('d','');
    return;
  }
  let profilePath=`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} `;
  for(let i=1;i<points.length;i++) profilePath += `L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)} `;
  let fillPath=profilePath + `L ${points[points.length-1].x.toFixed(1)} 560 L ${points[0].x.toFixed(1)} 560 Z`;
  horizonProfilePanorama.setAttribute('d',profilePath.trim());
  horizonFillPanorama.setAttribute('d',fillPath.trim());
}

async function loadHorizonProfile(){
  if(!horizonProfile360) return;
  try{
    const response=await fetch(PEAKFINDER_FILE,{cache:'no-store'});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const text=await response.text();
    horizonAltitudes=parsePeakfinderHorizon(text);
    renderHorizonProfile360();
    renderHorizonProfilePanorama();
  }catch(error){
    horizonAltitudes=null;
    horizonProfile360.setAttribute('d','');
    if(horizonFill360) horizonFill360.setAttribute('d','');
    if(horizonProfilePanorama) horizonProfilePanorama.setAttribute('d','');
    if(horizonFillPanorama) horizonFillPanorama.setAttribute('d','');
    console.warn('No se pudo cargar el perfil de horizonte PeakFinder.',error);
  }
}

function ensureValidCoordinates(){
  if(!Number.isFinite(LAT) || LAT<-90 || LAT>90) LAT=43.37;
  if(!Number.isFinite(LON) || LON<-180 || LON>180) LON=-8.41;
}

function updateSatellite360Rotation(){
  if(!satellite360El) return;
  satellite360El.style.transform=`rotate(${-skyCenterAz}deg)`;
}

function initSatellite360Map(){
  if(typeof L==='undefined' || !satellite360El || satelliteMap) return;
  satelliteMap=L.map(satellite360El,{
    zoomControl:false,
    attributionControl:true,
    dragging:false,
    scrollWheelZoom:false,
    doubleClickZoom:false,
    boxZoom:false,
    keyboard:false,
    touchZoom:false
  }).setView([LAT,LON],15);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
    attribution:'Tiles &copy; Esri'
  }).addTo(satelliteMap);

  updateSatellite360Rotation();
}

function setSatelliteLayerEnabled(enabled){
  satelliteEnabled=!!enabled;
  if(satelliteLayerToggle) satelliteLayerToggle.checked=satelliteEnabled;
  if(satZoomIn) satZoomIn.disabled=!satelliteEnabled;
  if(satZoomOut) satZoomOut.disabled=!satelliteEnabled;

  if(satelliteEnabled){
    initSatellite360Map();
    if(satellite360El) satellite360El.classList.add('active');
    const skyBg360=document.getElementById('skyBg360');
    if(skyBg360) skyBg360.classList.add('hidden');
    if(horizonProfile360) horizonProfile360.style.display='none';
    if(horizonFill360) horizonFill360.style.display='none';
    if(satelliteMap){
      satelliteMap.setView([LAT,LON],satelliteMap.getZoom()||15);
      setTimeout(()=>{ if(satelliteMap) satelliteMap.invalidateSize(); },80);
    }
  }else{
    if(satellite360El) satellite360El.classList.remove('active');
    const skyBg360=document.getElementById('skyBg360');
    if(skyBg360) skyBg360.classList.remove('hidden');
    if(horizonProfile360) horizonProfile360.style.display='';
    if(horizonFill360) horizonFill360.style.display='';
  }

  localStorage.setItem('satelliteLayer360',satelliteEnabled?'1':'0');
}

let configMap=null;
let configMarker=null;

function syncFavoriteLocations(favorites){
  FAVORITE_LOCATIONS=Array.isArray(favorites) ? favorites.filter(favorite => favorite && Number.isFinite(Number(favorite.lat)) && Number.isFinite(Number(favorite.lon)) && String(favorite.locationName || '').trim()) : [];
  if(window.ASTRO_DATA) window.ASTRO_DATA.favoriteLocations=FAVORITE_LOCATIONS;
  if(!configFavoritesSelect) return;

  const currentValue=configFavoritesSelect.value;
  configFavoritesSelect.innerHTML='<option value="">Selecciona una favorita...</option>';
  FAVORITE_LOCATIONS.forEach(favorite => {
    const option=document.createElement('option');
    option.value=JSON.stringify(favorite);
    const horizonSvg=String(favorite.horizonSvg || '').trim();
    const horizonLabel=horizonSvg && horizonSvg!=='default.svg' ? ' · Horizonte guardado' : ' · Horizonte por defecto';
    option.textContent=`${favorite.locationName} · ${Number(favorite.lat).toFixed(6)}, ${Number(favorite.lon).toFixed(6)}${horizonLabel}`;
    configFavoritesSelect.appendChild(option);
  });
  if([...configFavoritesSelect.options].some(option => option.value===currentValue)){
    configFavoritesSelect.value=currentValue;
  }
}

function applyFavoriteSelection(rawValue){
  if(!rawValue) return;
  try{
    const favorite=JSON.parse(rawValue);
    const lat=Number(favorite.lat);
    const lon=Number(favorite.lon);
    const locationName=String(favorite.locationName || '').trim();
    const favoriteHorizonSvg=String(favorite.horizonSvg || '').trim();
    const horizonSvgToLoad=favoriteHorizonSvg || 'default.svg';
    if(!locationName || !Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Favorita inválida');
    if(configLocationNameInput) configLocationNameInput.value=locationName;
    if(configLatInput) configLatInput.value=lat.toFixed(6);
    if(configLonInput) configLonInput.value=lon.toFixed(6);
    if(configMarker) configMarker.setLatLng([lat,lon]);
    if(configMap) configMap.setView([lat,lon],13);
    PEAKFINDER_FILE=horizonSvgToLoad;
    if(window.ASTRO_DATA) window.ASTRO_DATA.horizonSvg=horizonSvgToLoad;
    loadHorizonProfile();
    queueSkyUpdate();
    if(configStatus) configStatus.textContent=`Favorita cargada: ${locationName}`;
  }catch(error){
    if(configStatus) configStatus.textContent='No se pudo cargar la favorita seleccionada.';
  }
}

function openConfigModal(){
  if(!configModal) return;
  configModal.classList.add('open');
  configModal.setAttribute('aria-hidden','false');

  if(configLatInput) configLatInput.value=String(LAT.toFixed(6));
  if(configLonInput) configLonInput.value=String(LON.toFixed(6));
  if(configLocationNameInput) configLocationNameInput.value=LOCATION_NAME;
  syncFavoriteLocations(FAVORITE_LOCATIONS);

  if(typeof L === 'undefined' || !configMapEl) return;
  if(!configMap){
    configMap=L.map(configMapEl).setView([LAT,LON],9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,
      attribution:'&copy; OpenStreetMap'
    }).addTo(configMap);
    configMarker=L.marker([LAT,LON]).addTo(configMap);
    configMap.on('click',e=>{
      const {lat,lng}=e.latlng;
      if(configLatInput) configLatInput.value=lat.toFixed(6);
      if(configLonInput) configLonInput.value=lng.toFixed(6);
      if(configMarker) configMarker.setLatLng([lat,lng]);
      if(configStatus) configStatus.textContent=`Coordenadas seleccionadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    });
  }else{
    configMap.setView([LAT,LON],9);
    if(configMarker) configMarker.setLatLng([LAT,LON]);
  }
  setTimeout(()=>{ if(configMap) configMap.invalidateSize(); },120);
}

async function saveFavoriteLocation(){
  if(!configLatInput || !configLonInput || !saveFavoriteBtn) return;
  const lat=Number(configLatInput.value);
  const lon=Number(configLonInput.value);
  const locationName=configLocationNameInput ? configLocationNameInput.value.trim() : '';

  if(!locationName){
    if(configStatus) configStatus.textContent='Indica un nombre para guardar la favorita.';
    return;
  }
  if(!Number.isFinite(lat) || lat<-90 || lat>90 || !Number.isFinite(lon) || lon<-180 || lon>180){
    if(configStatus) configStatus.textContent='Coordenadas inválidas. Revisa los rangos.';
    return;
  }

  const formData=new FormData();
  formData.append('action','save_favorite');
  formData.append('locationName',locationName);
  formData.append('lat',String(lat));
  formData.append('lon',String(lon));
  formData.append('currentHorizonSvg',PEAKFINDER_FILE);
  if(configSvgFileInput && configSvgFileInput.files && configSvgFileInput.files[0]){
    formData.append('horizonSvg',configSvgFileInput.files[0]);
  }

  saveFavoriteBtn.disabled=true;
  if(configStatus) configStatus.textContent='Guardando favorita...';
  try{
    const response=await fetch('save_config.php',{method:'POST',body:formData});
    const data=await response.json();
    if(!response.ok || !data.ok) throw new Error(data && data.error ? data.error : 'No se pudo guardar la favorita');
    syncFavoriteLocations(data.config.favorites || FAVORITE_LOCATIONS);
    if(configStatus) configStatus.textContent=`Favorita guardada: ${locationName}`;
  }catch(error){
    if(configStatus) configStatus.textContent=`Error al guardar favorita: ${error.message}`;
  }finally{
    saveFavoriteBtn.disabled=false;
  }
}

function closeConfigModal(){
  if(!configModal) return;
  configModal.classList.remove('open');
  configModal.setAttribute('aria-hidden','true');
}

async function searchAddressAndMoveMap(){
  if(!configAddressSearchInput) return;
  const q=configAddressSearchInput.value.trim();
  if(!q){
    if(configStatus) configStatus.textContent='Escribe una dirección para buscar.';
    return;
  }

  if(configStatus) configStatus.textContent='Buscando dirección...';
  try{
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const response=await fetch(url,{headers:{'Accept':'application/json'}});
    const data=await response.json();
    if(!Array.isArray(data) || !data.length) throw new Error('No se encontraron resultados');

    const hit=data[0];
    const lat=Number(hit.lat);
    const lon=Number(hit.lon);
    if(!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Resultado inválido');

    if(configLatInput) configLatInput.value=lat.toFixed(6);
    if(configLonInput) configLonInput.value=lon.toFixed(6);
    if(configLocationNameInput && !configLocationNameInput.value.trim()){
      configLocationNameInput.value=String(hit.display_name || q).slice(0,80);
    }

    if(configMap){
      configMap.setView([lat,lon],13);
      if(configMarker) configMarker.setLatLng([lat,lon]);
    }
    if(configStatus) configStatus.textContent=`Dirección encontrada: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }catch(error){
    if(configStatus) configStatus.textContent=`No se pudo geolocalizar la dirección: ${error.message}`;
  }
}

async function saveConfiguration(){
  if(!configLatInput || !configLonInput || !saveConfigBtn) return;
  const lat=Number(configLatInput.value);
  const lon=Number(configLonInput.value);
  const locationName=configLocationNameInput ? configLocationNameInput.value.trim() : LOCATION_NAME;

  if(!Number.isFinite(lat) || lat<-90 || lat>90 || !Number.isFinite(lon) || lon<-180 || lon>180){
    if(configStatus) configStatus.textContent='Coordenadas inválidas. Revisa los rangos.';
    return;
  }

  const formData=new FormData();
  formData.append('locationName',locationName || 'A Coruña');
  formData.append('lat',String(lat));
  formData.append('lon',String(lon));
  formData.append('currentHorizonSvg',PEAKFINDER_FILE);
  if(configSvgFileInput && configSvgFileInput.files && configSvgFileInput.files[0]){
    formData.append('horizonSvg',configSvgFileInput.files[0]);
  }

  saveConfigBtn.disabled=true;
  if(configStatus) configStatus.textContent='Guardando configuración...';
  try{
    const response=await fetch('save_config.php',{method:'POST',body:formData});
    const data=await response.json();
    if(!response.ok || !data.ok){
      throw new Error(data && data.error ? data.error : 'No se pudo guardar');
    }

    LAT=Number(data.config.lat);
    LON=Number(data.config.lon);
    LOCATION_NAME=String(data.config.locationName || LOCATION_NAME);
    PEAKFINDER_FILE=String(data.config.horizonSvg || PEAKFINDER_FILE);
    ensureValidCoordinates();
    if(window.ASTRO_DATA){
      window.ASTRO_DATA.locationName=LOCATION_NAME;
      window.ASTRO_DATA.lat=LAT;
      window.ASTRO_DATA.lon=LON;
      window.ASTRO_DATA.horizonSvg=PEAKFINDER_FILE;
    }

    if(configStatus) configStatus.textContent='Configuración guardada. Recargando cálculos...';
    window.location.reload();
  }catch(error){
    if(configStatus) configStatus.textContent=`Error al guardar: ${error.message}`;
  }finally{
    saveConfigBtn.disabled=false;
  }
}

function eqToObjectPosition(ra,dec,dateObj){
  const aa=eqToAltAz(ra,dec,dateObj);
  return {aa, panorama:projectPanorama(aa.az,aa.alt), sky:project360(aa.az,aa.alt)};
}

function isLayerEnabled(category){
  return layerState[category] !== false;
}

function categoryLabel(category){
  if(category==='planets') return 'Planeta';
  if(category==='constellations') return 'Constelación';
  return 'Deep-sky';
}

function objectMatchesQuery(object, query){
  if(!query) return true;
  const value=query.toLowerCase();
  return [object.id, object.label, object.category].some(part => String(part).toLowerCase().includes(value));
}

function renderObjectResults(objects, dateObj){
  if(!objectResults) return;
  objectResults.innerHTML = objects.map(object => {
    const pos = object.kind === 'point' ? eqToObjectPosition(object.ra, object.dec, dateObj) : null;
    const meta = object.kind === 'point'
      ? `${Math.max(0, pos.aa.alt).toFixed(0)}° alt · ${Math.round(pos.aa.az)}° az`
      : `${object.stars.length} estrellas`;
    const active = object.id === selectedObjectId ? ' active' : '';
    return `<button type="button" class="object-card${active}" data-object="${object.id}"><span><strong>${object.label}</strong><span>${categoryLabel(object.category)}</span></span><span class="meta">${meta}</span></button>`;
  }).join('') || '<div class="object-detail">No hay coincidencias.</div>';
}

function renderObjectDetail(object, dateObj){
  if(!objectDetail) return;
  if(!object){
    objectDetail.textContent='Selecciona un objeto para centrarlo y ver sus datos.';
    return;
  }
  if(object.kind === 'point'){
    const pos=eqToObjectPosition(object.ra, object.dec, dateObj);
    objectDetail.innerHTML = `<strong>${object.label}</strong><br>${categoryLabel(object.category)}<br>Alt ${Math.max(0, pos.aa.alt).toFixed(1)}° · Az ${Math.round(pos.aa.az)}° · Mag ${object.magnitude}`;
    return;
  }
  objectDetail.innerHTML = `<strong>${object.label}</strong><br>${categoryLabel(object.category)}<br>${object.stars.length} estrellas de referencia`;
}

function renderObjectLayers(dateObj){
  if(!objectLayer360 || !objectLayerPanorama) return;

  const query = objectSearch ? objectSearch.value.trim() : '';
  const visibleObjects = objectCatalog.filter(object => isLayerEnabled(object.category) && objectMatchesQuery(object, query));
  const selectedObject = objectCatalog.find(object => object.id === selectedObjectId) || null;
  const selectedObjectVisible = selectedObject && isLayerEnabled(selectedObject.category) ? selectedObject : null;

  if(objectResults) renderObjectResults(visibleObjects, dateObj);
  renderObjectDetail(selectedObjectVisible, dateObj);

  const selectedState = new Map();
  const addPoint = (object, pos, kindClass) => {
    if(!pos.visible) return '';
    const selected = object.id === selectedObjectId ? ' selected' : '';
    const labelX = kindClass === 'point' ? pos.x + 12 : pos.x + 10;
    const labelY = kindClass === 'point' ? pos.y - 8 : pos.y - 10;
    const radius = object.id === selectedObjectId ? 8 : 5;
    const labelClass = object.id === selectedObjectId ? 'object-label selected' : 'object-label';
    return `<g class="object-${kindClass} ${kindClass === 'point' ? 'planet-m' : 'constellation-m'}${selected}" data-object="${object.id}" style="color:currentColor"><circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${radius}" fill="currentColor"/><text class="${labelClass}" x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}">${object.label}</text></g>`;
  };

  const buildVisibleSegments = (positions, maxGap) => {
    const segments=[];
    let current=[];
    positions.forEach(pos => {
      if(!pos.visible){
        if(current.length > 1) segments.push(current);
        current=[];
        return;
      }
      if(current.length){
        const prev=current[current.length-1];
        if(Math.hypot(pos.x-prev.x, pos.y-prev.y) > maxGap){
          if(current.length > 1) segments.push(current);
          current=[];
        }
      }
      current.push(pos);
    });
    if(current.length > 1) segments.push(current);
    return segments;
  };

  const addConstellation = (object, points) => {
    const panSegments = buildVisibleSegments(points.map(point => point.pan), 140);
    const skySegments = buildVisibleSegments(points.map(point => point.sky), 120);
    if(!panSegments.length && !skySegments.length) return {pan:'', sky:''};
    const selected = object.id === selectedObjectId ? ' selected' : '';
    const panPolylines = panSegments.map(segment => `<polyline points="${segment.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')}" stroke="currentColor"/>`).join('');
    const skyPolylines = skySegments.map(segment => `<polyline points="${segment.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')}" stroke="currentColor"/>`).join('');
    const panLabelPoint = panSegments[0] ? panSegments[0][0] : null;
    const skyLabelPoint = skySegments[0] ? skySegments[0][0] : null;
    return {
      pan: panPolylines ? `<g class="object-constellation constellation-m${selected}" data-object="${object.id}" style="color:currentColor">${panPolylines}${panLabelPoint ? `<text class="object-label${selected ? ' selected' : ''}" x="${panLabelPoint.x.toFixed(1)}" y="${(panLabelPoint.y - 12).toFixed(1)}">${object.label}</text>` : ''}</g>` : '',
      sky: skyPolylines ? `<g class="object-constellation constellation-m${selected}" data-object="${object.id}" style="color:currentColor">${skyPolylines}${skyLabelPoint ? `<text class="object-label${selected ? ' selected' : ''}" x="${skyLabelPoint.x.toFixed(1)}" y="${(skyLabelPoint.y - 12).toFixed(1)}">${object.label}</text>` : ''}</g>` : ''
    };
  };

  const panoramaParts=[];
  const skyParts=[];

  objectCatalog.forEach(object => {
    if(!isLayerEnabled(object.category)) return;
    if(object.kind === 'point'){
      const pos = eqToObjectPosition(object.ra, object.dec, dateObj);
      panoramaParts.push(addPoint(object, pos.panorama, 'point'));
      skyParts.push(addPoint(object, pos.sky, 'point'));
      if(object.id === selectedObjectId) selectedState.set(object.id, pos);
      return;
    }

    const points = object.stars.map(star => {
      const aa = eqToAltAz(star.ra, star.dec, dateObj);
      return {pan: projectPanorama(aa.az, aa.alt), sky: project360(aa.az, aa.alt)};
    });
    const constellation = addConstellation(object, points);
    if(constellation.pan) panoramaParts.push(constellation.pan);
    if(constellation.sky) skyParts.push(constellation.sky);
  });

  objectLayerPanorama.innerHTML = panoramaParts.join('');
  objectLayer360.innerHTML = skyParts.join('');

  if(objectResults){
    objectResults.querySelectorAll('[data-object]').forEach(button => {
      button.classList.toggle('active', button.dataset.object === selectedObjectId);
      button.addEventListener('click', () => selectObject(button.dataset.object, true));
    });
  }
}

function selectObject(objectId, focusPanorama=false){
  selectedObjectId = objectId;
  const object = objectCatalog.find(item => item.id === objectId);
  const dateObj = dateForSliderMinutes(Number(slider.value));
  if(object && focusPanorama && object.kind === 'point'){
    const pos = eqToObjectPosition(object.ra, object.dec, dateObj);
    if(pos.panorama.visible){
      panCenterAz = norm360(pos.panorama.az);
    }
  }
  updateSky();
}


function dateForTimeLabel(hhmm, preferNextDay=false){
  if(!hhmm || hhmm==='—') return null;
  const m=String(hhmm).match(/(\d{2}):(\d{2})/);
  if(!m) return null;
  const baseDate=(window.ASTRO_DATA&&window.ASTRO_DATA.date)?window.ASTRO_DATA.date:new Date().toISOString().slice(0,10);
  const [y,mo,d]=baseDate.split('-').map(Number);
  const h=Number(m[1]), mi=Number(m[2]);
  const dayOffset=preferNextDay || h<12 ? 1 : 0;
  return new Date(y,mo-1,d+dayOffset,h,mi,0);
}

function timeLabelToSliderValue(hhmm){
  if(!hhmm || hhmm==='—') return null;
  const m=String(hhmm).match(/(\d{2}):(\d{2})/);
  if(!m) return null;
  const h=Number(m[1]), mi=Number(m[2]);
  const mins=h*60+mi;
  return h<12 ? 1440+mins : mins;
}

function updateTimelineLabelPositions(){
  if(!timelineEventLabels || !timelineEventLabels.length || !slider) return;
  const min=Number(slider.min);
  const max=Number(slider.max);
  if(!Number.isFinite(min) || !Number.isFinite(max) || max<=min) return;

  timelineEventLabels.forEach(label=>{
    const timeLabel=String(label.dataset.time || '').trim();
    const sliderValue=timeLabelToSliderValue(timeLabel);
    if(sliderValue===null) return;
    const t=(sliderValue-min)/(max-min);
    const clamped=Math.max(0,Math.min(1,t));
    label.style.left=`${(clamped*100).toFixed(2)}%`;
  });
}

function sunEq(dateObj){
  const jd=julianDate(dateObj);
  const n=jd-2451545.0;
  const L=norm360(280.460+0.9856474*n);
  const g=deg2rad(norm360(357.528+0.9856003*n));
  const lambda=deg2rad(norm360(L+1.915*Math.sin(g)+0.020*Math.sin(2*g)));
  const eps=deg2rad(23.439-0.0000004*n);
  const ra=norm360(rad2deg(Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda))));
  const dec=rad2deg(Math.asin(Math.sin(eps)*Math.sin(lambda)));
  return {ra,dec};
}

function moonEqApprox(dateObj){
  const jd=julianDate(dateObj);
  const d=jd-2451543.5;
  const N=deg2rad(norm360(125.1228-0.0529538083*d));
  const i=deg2rad(5.1454);
  const w=deg2rad(norm360(318.0634+0.1643573223*d));
  const a=60.2666;
  const e=0.054900;
  const M=deg2rad(norm360(115.3654+13.0649929509*d));
  const E=M+e*Math.sin(M)*(1+e*Math.cos(M));
  const xv=a*(Math.cos(E)-e);
  const yv=a*Math.sqrt(1-e*e)*Math.sin(E);
  const v=Math.atan2(yv,xv);
  const r=Math.sqrt(xv*xv+yv*yv);
  const xh=r*(Math.cos(N)*Math.cos(v+w)-Math.sin(N)*Math.sin(v+w)*Math.cos(i));
  const yh=r*(Math.sin(N)*Math.cos(v+w)+Math.cos(N)*Math.sin(v+w)*Math.cos(i));
  const zh=r*(Math.sin(v+w)*Math.sin(i));
  const ecl=deg2rad(23.4393-3.563e-7*d);
  const xe=xh;
  const ye=yh*Math.cos(ecl)-zh*Math.sin(ecl);
  const ze=yh*Math.sin(ecl)+zh*Math.cos(ecl);
  return {ra:norm360(rad2deg(Math.atan2(ye,xe))), dec:rad2deg(Math.atan2(ze,Math.sqrt(xe*xe+ye*ye)))};
}

function bodyAltAz(body,dateObj){
  const eq=body==='sun'?sunEq(dateObj):moonEqApprox(dateObj);
  return eqToAltAz(eq.ra,eq.dec,dateObj);
}

function buildBodyPath(body,dateObj){
  const baseDate=(window.ASTRO_DATA&&window.ASTRO_DATA.date)?window.ASTRO_DATA.date:new Date().toISOString().slice(0,10);
  const [y,m,d]=baseDate.split('-').map(Number);
  let panD='', skyD='', panOpen=false, skyOpen=false, prevPan=null, prevSky=null;
  for(let mins=0; mins<=1440; mins+=10){
    const dt=new Date(y,m-1,d,0,mins,0);
    const aa=bodyAltAz(body,dt);
    const pan=projectPanorama(aa.az,aa.alt);
    if(pan.visible){
      const jump=prevPan && Math.hypot(pan.x-prevPan.x,pan.y-prevPan.y)>90;
      if(!panOpen || jump){panD+=`M ${pan.x.toFixed(1)} ${pan.y.toFixed(1)} `; panOpen=true;}
      else panD+=`L ${pan.x.toFixed(1)} ${pan.y.toFixed(1)} `;
      prevPan=pan;
    }else{panOpen=false; prevPan=null;}
    const sky=project360(aa.az,aa.alt);
    if(sky.visible){
      const jump=prevSky && Math.hypot(sky.x-prevSky.x,sky.y-prevSky.y)>75;
      if(!skyOpen || jump){skyD+=`M ${sky.x.toFixed(1)} ${sky.y.toFixed(1)} `; skyOpen=true;}
      else skyD+=`L ${sky.x.toFixed(1)} ${sky.y.toFixed(1)} `;
      prevSky=sky;
    }else{skyOpen=false; prevSky=null;}
  }
  return {panD,skyD};
}

function move360Marker(el,p){
  if(!el) return;
  setMarkerVisibility(el,p.visible);
  if(!p.visible) return;
  const circle=el.querySelector('circle');
  const text=el.querySelector('text');
  if(circle){circle.setAttribute('cx',p.x); circle.setAttribute('cy',p.y);}
  if(text){text.setAttribute('x',p.x+12); text.setAttribute('y',p.y-10);}
}

function placeEventMarker360(marker, az, timeLabel){
  if(!marker || !Number.isFinite(az)) return;
  const cx=320, cy=320, r=238;
  const a=deg2rad(az-90);
  const x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
  const x2=cx+(r-34)*Math.cos(a), y2=cy+(r-34)*Math.sin(a);
  const tx=cx+(r+42)*Math.cos(a), ty=cy+(r+42)*Math.sin(a);
  let anchor='end';
  if(x>cx) anchor='start';
  if(Math.abs(x-cx)<30) anchor='middle';

  const line=marker.querySelector('line');
  const circle=marker.querySelector('circle');
  const texts=marker.querySelectorAll('text');
  if(line){
    line.setAttribute('x1',x.toFixed(1));
    line.setAttribute('y1',y.toFixed(1));
    line.setAttribute('x2',x2.toFixed(1));
    line.setAttribute('y2',y2.toFixed(1));
  }
  if(circle){
    circle.setAttribute('cx',x.toFixed(1));
    circle.setAttribute('cy',y.toFixed(1));
  }
  if(texts[0]){
    texts[0].setAttribute('x',tx.toFixed(1));
    texts[0].setAttribute('y',ty.toFixed(1));
    texts[0].setAttribute('text-anchor',anchor);
  }
  if(texts[1]){
    texts[1].setAttribute('x',tx.toFixed(1));
    texts[1].setAttribute('y',(ty+16).toFixed(1));
    texts[1].setAttribute('text-anchor',anchor);
    texts[1].textContent=`${timeLabel} · Az ${Math.round(norm360(az))}°`;
  }
}

function estimateMilkyWayRiseAz(riseDate, fallbackAz){
  let best=null;
  let bestEast=null;
  for(let l=0;l<=360;l+=1){
    const eq=galToEq(l%360,0);
    const aa=eqToAltAz(eq.ra,eq.dec,riseDate);
    const candidate={az:aa.az, score:Math.abs(aa.alt), tie:Math.abs(signedAzDiff(aa.az,fallbackAz))};
    if(!best || candidate.score<best.score || (candidate.score===best.score && candidate.tie<best.tie)) best=candidate;
    if(aa.az>=60 && aa.az<=200){
      if(!bestEast || candidate.score<bestEast.score || (candidate.score===bestEast.score && candidate.tie<bestEast.tie)) bestEast=candidate;
    }
  }
  return bestEast ? bestEast.az : (best ? best.az : fallbackAz);
}

function estimateMilkyWayCrossAz(eventDate, fallbackAz){
  let best=null;
  for(let l=0;l<=360;l+=1){
    const eq=galToEq(l%360,0);
    const aa=eqToAltAz(eq.ra,eq.dec,eventDate);
    const candidate={az:aa.az, score:Math.abs(aa.alt), tie:Math.abs(signedAzDiff(aa.az,fallbackAz))};
    if(!best || candidate.score<best.score || (candidate.score===best.score && candidate.tie<best.tie)) best=candidate;
  }
  return best ? best.az : fallbackAz;
}

// Returns the OTHER galactic-plane horizon crossing (the "front" end, opposite to the known setAz)
function estimateMilkyWayFrontCrossAz(eventDate, knownAz){
  // Exclude candidates within 60° of the known crossing to find the opposite intersection
  let best=null;
  for(let l=0;l<=360;l+=1){
    const eq=galToEq(l%360,0);
    const aa=eqToAltAz(eq.ra,eq.dec,eventDate);
    if(Math.abs(signedAzDiff(aa.az,knownAz))<60) continue; // skip same crossing region
    const candidate={az:aa.az, score:Math.abs(aa.alt)};
    if(!best || candidate.score<best.score) best=candidate;
  }
  return best ? best.az : norm360(knownAz+180);
}

function buildGalacticPlane(dateObj){
  const panoramaVisible=[];
  const allVisible=[];
  let panD='', skyD='';
  let panOpen=false, skyOpen=false, prevPan=null, prevSky=null;

  for(let l=0;l<=360;l+=2){
    const eq=galToEq(l%360,0);
    const aa=eqToAltAz(eq.ra,eq.dec,dateObj);

    const s={l:l%360,alt:aa.alt,az:aa.az,...project360(aa.az,aa.alt)};
    if(s.visible){
      allVisible.push(s);
      const jump=prevSky && Math.hypot(s.x-prevSky.x,s.y-prevSky.y)>75;
      if(!skyOpen || jump){skyD+=`M ${s.x.toFixed(1)} ${s.y.toFixed(1)} `; skyOpen=true;}
      else skyD+=`L ${s.x.toFixed(1)} ${s.y.toFixed(1)} `;
      prevSky=s;
    }else{skyOpen=false; prevSky=null;}

    const p={l:l%360,alt:aa.alt,az:aa.az,...projectPanorama(aa.az,aa.alt)};
    if(p.visible){
      panoramaVisible.push(p);
      const jump=prevPan && Math.hypot(p.x-prevPan.x,p.y-prevPan.y)>90;
      if(!panOpen || jump){panD+=`M ${p.x.toFixed(1)} ${p.y.toFixed(1)} `; panOpen=true;}
      else panD+=`L ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
      prevPan=p;
    }else{panOpen=false; prevPan=null;}
  }

  const visibleForStats=allVisible;
  if(visibleForStats.length<3){
    return {maxAlt:0,maxAz:180,inclination:0,markerX:500,markerY:430,markerVisible:false,panD:'',skyD:''};
  }

  const highest=visibleForStats.reduce((a,b)=>b.alt>a.alt?b:a,visibleForStats[0]);
  const markerSource=panoramaVisible.length>=3 ? panoramaVisible : [];

  let markerX=500, markerY=430, markerVisible=false, inclination=0;
  if(markerSource.length>=3){
    markerVisible=true;
    markerX=markerSource.reduce((s,p)=>s+p.x,0)/markerSource.length;
    markerY=markerSource.reduce((s,p)=>s+p.y,0)/markerSource.length;
    const centerIdx=markerSource.reduce((best,p,i)=>Math.abs(p.x-markerX)<Math.abs(markerSource[best].x-markerX)?i:best,0);
    const p1=markerSource[Math.max(0,centerIdx-3)];
    const p2=markerSource[Math.min(markerSource.length-1,centerIdx+3)];
    const dx=p2.x-p1.x, dy=p2.y-p1.y;
    inclination=Math.abs(rad2deg(Math.atan2(-dy,dx)));
    if(inclination>90) inclination=180-inclination;
  }

  return {maxAlt:highest.alt,maxAz:highest.az,inclination,markerX,markerY,markerVisible,panD,skyD};
}

function renderInclinationView(dateObj,gcAA){
  if(!inclinationSvg || !inclMwPath || !inclGcMarker) return;

  const astro=window.ASTRO_DATA||{};
  const gcRiseSliderValue=timeLabelToSliderValue(astro.gcRise);
  const gcSetSliderValue=timeLabelToSliderValue(astro.gcSet);
  const val=Number(slider.value);
  const beforeRise=gcRiseSliderValue!==null && val<gcRiseSliderValue;
  const afterSet=gcSetSliderValue!==null && val>=gcSetSliderValue;
  const gcVisibleNow=!(beforeRise || afterSet);
  
  // Buscar o crear el overlay de "No visible"
  let noVisibleOverlay=document.getElementById('inclNoVisibleOverlay');
  
  if(!gcVisibleNow){
    if(!noVisibleOverlay){
      noVisibleOverlay=document.createElementNS('http://www.w3.org/2000/svg','text');
      noVisibleOverlay.id='inclNoVisibleOverlay';
      noVisibleOverlay.setAttribute('x','160');
      noVisibleOverlay.setAttribute('y','240');
      noVisibleOverlay.setAttribute('text-anchor','middle');
      noVisibleOverlay.setAttribute('dominant-baseline','middle');
      noVisibleOverlay.setAttribute('style','font-size:24px;font-weight:900;fill:#888;paint-order:stroke;stroke:#06101d;stroke-width:3px');
      inclinationSvg.appendChild(noVisibleOverlay);
    }
    noVisibleOverlay.textContent=beforeRise?'No visible (antes)':'No visible (después)';
    noVisibleOverlay.style.display='block';
    inclMwPath.style.display='none';
    inclGcMarker.style.display='none';
    if(inclHorizon) inclHorizon.style.display='none';
    if(inclHorizonGlow) inclHorizonGlow.style.display='none';
    if(inclGround) inclGround.style.display='none';
    if(inclTiltLabel) inclTiltLabel.textContent='Inclinación: —';
    if(inclAimLabel) inclAimLabel.textContent='Apuntar cámara: — · Alt —°';
    if(inclHorizonLabel) inclHorizonLabel.textContent='Fuera de horario de visibilidad';
    return;
  }
  
  // Mostrar elementos cuando es visible
  if(noVisibleOverlay) noVisibleOverlay.style.display='none';
  inclMwPath.style.display='block';
  inclGcMarker.style.display='block';
  if(inclHorizon) inclHorizon.style.display='block';
  if(inclHorizonGlow) inclHorizonGlow.style.display='block';
  if(inclGround) inclGround.style.display='block';

  const width=320, height=480;
  const cx=160;
  const cameraAz=gcAA.az;
  const cameraAlt=gcAA.alt;
  const hFov=62;
  const vFov=93;

  const project=(az,alt)=>{
    const dx=signedAzDiff(az,cameraAz)/(hFov/2);
    const dy=(alt-cameraAlt)/(vFov/2);
    return {x:cx + dx*(width/2), y:(height/2) - dy*(height/2)};
  };

  const getHorizonAltAtAz=(az)=>{
    if(!horizonAltitudes || horizonAltitudes.length<2) return 0;
    const n=horizonAltitudes.length;
    const pos=(norm360(az)/360)*(n-1);
    const i0=Math.floor(pos);
    const i1=(i0+1)%(n-1);
    const t=pos-i0;
    const a0=horizonAltitudes[i0];
    const a1=horizonAltitudes[i1];
    if(a0===null && a1===null) return 0;
    if(a0===null) return a1;
    if(a1===null) return a0;
    return a0 + (a1-a0)*t;
  };

  const baseHorizonY=height*0.85;
  const horizonRelief=height*0.13;
  const horizonPoints=[];
  for(let x=0;x<=width;x+=4){
    const az=norm360(cameraAz + ((x-cx)/(width/2))*(hFov/2));
    const hAlt=Math.max(0,Math.min(25,getHorizonAltAtAz(az)));
    const y=baseHorizonY - (hAlt/25)*horizonRelief;
    horizonPoints.push({x,y});
  }
  if(horizonPoints[horizonPoints.length-1].x!==width){
    const az=norm360(cameraAz + ((width-cx)/(width/2))*(hFov/2));
    const hAlt=Math.max(0,Math.min(25,getHorizonAltAtAz(az)));
    const y=baseHorizonY - (hAlt/25)*horizonRelief;
    horizonPoints.push({x:width,y});
  }

  const horizonD=horizonPoints.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  if(inclHorizon) inclHorizon.setAttribute('d',horizonD);
  if(inclHorizonGlow){
    const glowTop=horizonPoints.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${(p.y-10).toFixed(1)}`).join(' ');
    const glowBottom=[...horizonPoints].reverse().map(p=>`L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    inclHorizonGlow.setAttribute('d',`${glowTop} ${glowBottom} Z`);
  }
  if(inclGround){
    const groundD=`${horizonD} L ${width} ${height} L 0 ${height} Z`;
    inclGround.setAttribute('d',groundD);
  }

  let path='';
  let open=false;
  let prev=null;
  const nearCenter=[];
  for(let l=0;l<=360;l+=2){
    const eq=galToEq(l%360,0);
    const aa=eqToAltAz(eq.ra,eq.dec,dateObj);
    const p=project(aa.az,aa.alt);
    const visible=p.x>=-30 && p.x<=350 && p.y>=-30 && p.y<=510;
    if(visible){
      const jump=prev && Math.hypot(p.x-prev.x,p.y-prev.y)>90;
      if(!open || jump){path += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} `; open=true;}
      else path += `L ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
      prev=p;
    }else{open=false; prev=null;}
    if(Math.abs(signedAzDiff(aa.az,cameraAz))<=10){
      nearCenter.push({x:p.x,y:p.y,az:aa.az,alt:aa.alt});
    }
  }
  inclMwPath.setAttribute('d',path);

  const gcPoint=project(gcAA.az,gcAA.alt);
  inclGcMarker.setAttribute('transform',`translate(${(gcPoint.x-cx).toFixed(1)}, ${(gcPoint.y-240).toFixed(1)})`);

  let tiltDeg=0;
  if(nearCenter.length>=2){
    nearCenter.sort((a,b)=>a.x-b.x);
    const p1=nearCenter[0];
    const p2=nearCenter[nearCenter.length-1];
    const dx=p2.x-p1.x;
    const dy=p2.y-p1.y;
    tiltDeg=rad2deg(Math.atan2(-dy,dx));
    if(tiltDeg>90) tiltDeg-=180;
    if(tiltDeg<-90) tiltDeg+=180;
  }

  const cameraAzNorm=norm360(cameraAz);
  const cameraDir=directionName(cameraAzNorm);
  if(inclTiltLabel) inclTiltLabel.textContent=`Inclinación: ${Math.abs(tiltDeg).toFixed(1)}°`;
  
  // Mostrar direcciones cardinales posicionadas según su azimut real
  const cardinals=[{az:0,dir:'N'},{az:45,dir:'NE'},{az:90,dir:'E'},{az:135,dir:'SE'},{az:180,dir:'S'},{az:225,dir:'SO'},{az:270,dir:'O'},{az:315,dir:'NO'}];
  cardinals.forEach((c,i)=>{
    let label=document.getElementById('inclCardinal'+i);
    if(!label){
      label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.id='inclCardinal'+i;
      label.setAttribute('class','incl-text');
      label.setAttribute('text-anchor','middle');
      label.setAttribute('y','476');
      inclinationSvg.appendChild(label);
    }
    const p=project(c.az,0);
    const inView=p.x>=-20 && p.x<=340;
    label.style.display=inView?'block':'none';
    if(inView){
      label.textContent=c.dir;
      label.setAttribute('x',Math.max(16,Math.min(304,p.x)).toFixed(1));
    }
  });
  
  if(inclAimLabel) inclAimLabel.textContent=`Apuntar cámara: Az ${Math.round(cameraAzNorm)}° (${cameraDir}) · Alt ${Math.max(0,cameraAlt).toFixed(1)}°`;
  if(inclHorizonLabel) inclHorizonLabel.textContent='Horizonte (perfil SVG) · suelo = 15% inferior';
}

function setMarkerVisibility(el,visible){
  if(!el) return;
  el.style.display=visible?'':'none';
}

function movePanMarker(el,p,offsetX,offsetY){
  if(!el) return;
  setMarkerVisibility(el,p.visible);
  if(p.visible) el.setAttribute('transform',`translate(${p.x-offsetX}, ${p.y-offsetY})`);
}

function updateDirections360(){
  if(sky360Rotate) sky360Rotate.setAttribute('transform',`rotate(${-skyCenterAz},320,320)`);
  updateSatellite360Rotation();
  const dyn=document.getElementById('dynamicDirections360');
  if(dyn){
    const dirs=[
      {az:0,label:'N'},{az:45,label:'NE'},{az:90,label:'E'},{az:135,label:'SE'},
      {az:180,label:'S'},{az:225,label:'SO'},{az:270,label:'O'},{az:315,label:'NO'}
    ];
    const cx=320,cy=320,rL=258,rD=275;
    dyn.innerHTML=dirs.map(d=>{
      const a=deg2rad(d.az-skyCenterAz-90);
      const x=(cx+rL*Math.cos(a)).toFixed(1);
      const y=(cy+rL*Math.sin(a)).toFixed(1);
      const xd=(cx+rD*Math.cos(a)).toFixed(1);
      const yd=(cy+rD*Math.sin(a)).toFixed(1);
      return `<text class="dir" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${d.label}</text>`
            +`<text class="deg" x="${xd}" y="${yd}" text-anchor="middle" dominant-baseline="middle">${d.az}°</text>`;
    }).join('');
  }
  if(heading360){
    const topAz=norm360(skyCenterAz);
    heading360.textContent=`${directionName(topAz)} · ${Math.round(topAz)}°`;
  }
}

function updatePanoramaLabels(){
  const left=norm360(panCenterAz-PAN_FOV/2), center=norm360(panCenterAz), right=norm360(panCenterAz+PAN_FOV/2);
  const fmt=az=>`${directionName(az)} ${Math.round(az)}°`;
  if(panLeftLabel) panLeftLabel.textContent=fmt(left);
  if(panCenterLabel) panCenterLabel.textContent=fmt(center);
  if(panRightLabel) panRightLabel.textContent=fmt(right);
  const dyn=document.getElementById('dynamicDirections');
  if(dyn){
    const dirs=[
      {az:0,label:'N'},{az:45,label:'NE'},{az:90,label:'E'},{az:135,label:'SE'},
      {az:180,label:'S'},{az:225,label:'SO'},{az:270,label:'O'},{az:315,label:'NO'},{az:360,label:'N'}
    ];
    dyn.innerHTML=dirs.map(d=>{
      const diff=signedAzDiff(d.az,center);
      if(Math.abs(diff)>PAN_FOV/2) return '';
      const x=500+(diff/(PAN_FOV/2))*500;
      return `<text class="dir" x="${x.toFixed(1)}" y="490">${d.label}</text><text class="deg" x="${x.toFixed(1)}" y="508">${Math.round(norm360(d.az))}°</text>`;
    }).join('');
  }
  if(panoramaHeading) panoramaHeading.textContent=`${Math.round(center)}° (${directionName(center)})`;
  if(skyPhoto) skyPhoto.style.backgroundPosition=`${(center/360)*100}% center`;
}

function updateSky(){
  const min=Number(slider.min),max=Number(slider.max),val=Number(slider.value),t=(val-min)/(max-min),label=minutesToLabel(val);
  if(selectedTime) selectedTime.textContent=label;
  if(thumbLabel){
    thumbLabel.textContent=label;
    thumbLabel.style.left=`${t*100}%`;
  }

  const dateObj=dateForSliderMinutes(val);
  const gcEq=galToEq(0,0);
  const gcAA=eqToAltAz(gcEq.ra,gcEq.dec,dateObj);
  const mw=buildGalacticPlane(dateObj);
  renderInclinationView(dateObj,gcAA);

  const gcAltText=`${Math.max(0,gcAA.alt).toFixed(1)}°`;
  const gcAzText=`${Math.round(gcAA.az)}° (${directionName(gcAA.az)})`;
  const mwMaxAltText=`${mw.maxAlt.toFixed(1)}°`;
  const mwInclinationText=`${mw.inclination.toFixed(0)}°`;
  if(gcAlt) gcAlt.textContent=gcAltText;
  if(gcAz) gcAz.textContent=gcAzText;
  if(mwMaxAlt) mwMaxAlt.textContent=mwMaxAltText;
  if(mwInclination) mwInclination.textContent=mwInclinationText;
  setStatValues(gcAltValues,gcAltText);
  setStatValues(gcAzValues,gcAzText);
  setStatValues(mwMaxAltValues,mwMaxAltText);
  setStatValues(mwInclinationValues,mwInclinationText);

  const x=80+t*840;
  if(nowLine){nowLine.setAttribute('x1',x); nowLine.setAttribute('x2',x);}
  if(nowAltitude){nowAltitude.textContent=`${Math.round(Math.max(0,gcAA.alt))}°`; nowAltitude.setAttribute('x',x+12);}

  const gcP=projectPanorama(gcAA.az,gcAA.alt);
  movePanMarker(gcMarker,gcP,515,319);

  const astro=window.ASTRO_DATA||{};
  const vlRiseDate=dateForTimeLabel(astro.vlRise,false);
  if(visState.vlMarkers){
    if(vlRiseMarker360 && vlRiseDate){
      const fallbackRiseAz=Number.isFinite(Number(astro.vlRiseAz)) ? Number(astro.vlRiseAz) : 124;
      const vlRiseAz=estimateMilkyWayRiseAz(vlRiseDate,fallbackRiseAz);
      placeEventMarker360(vlRiseMarker360,vlRiseAz,astro.vlRise);
      if(vlRiseTailMarker360){
        const tailRiseAz=estimateMilkyWayFrontCrossAz(vlRiseDate,vlRiseAz);
        placeEventMarker360(vlRiseTailMarker360,tailRiseAz,astro.vlRise);
      }
    }
  }else{
    setMarkerVisibility(vlRiseMarker360,false);
    setMarkerVisibility(vlRiseTailMarker360,false);
  }
  const vlSetDate=dateForTimeLabel(astro.vlSet,false);
  if(visState.vlMarkers){
    if(vlSetMarker360 && vlSetDate){
      const fallbackSetAz=Number.isFinite(Number(astro.vlSetAz)) ? Number(astro.vlSetAz) : 185;
      const vlSetAz=estimateMilkyWayCrossAz(vlSetDate,fallbackSetAz);
      placeEventMarker360(vlSetMarker360,vlSetAz,astro.vlSet);
      // Front (leading) edge of VL at set time
      if(vlSetFrontMarker360){
        const frontAz=estimateMilkyWayFrontCrossAz(vlSetDate,vlSetAz);
        placeEventMarker360(vlSetFrontMarker360,frontAz,astro.vlSet);
      }
    }
  }else{
    setMarkerVisibility(vlSetMarker360,false);
    setMarkerVisibility(vlSetFrontMarker360,false);
  }
  const gcRiseDate=dateForTimeLabel(astro.gcRise,false);
  if(visState.gcMarkers){
    if(gcRiseMarker360 && gcRiseDate){
      const gcEq=galToEq(0,0);
      const gcRiseAA=eqToAltAz(gcEq.ra,gcEq.dec,gcRiseDate);
      placeEventMarker360(gcRiseMarker360,gcRiseAA.az,astro.gcRise);
    }
  }else{
    setMarkerVisibility(gcRiseMarker360,false);
  }
  const gcSetDate=dateForTimeLabel(astro.gcSet,false);
  if(visState.gcMarkers){
    if(gcSetMarker360 && gcSetDate){
      const gcEq=galToEq(0,0);
      const gcSetAA=eqToAltAz(gcEq.ra,gcEq.dec,gcSetDate);
      placeEventMarker360(gcSetMarker360,gcSetAA.az,astro.gcSet);
    }
  }else{
    setMarkerVisibility(gcSetMarker360,false);
  }
  const mwRiseSliderValue=timeLabelToSliderValue(astro.vlRise);
  const mwSetSliderValue=timeLabelToSliderValue(astro.vlSet);
  const beforeRise=mwRiseSliderValue!==null && val<mwRiseSliderValue;
  const afterSet=mwSetSliderValue!==null && val>=mwSetSliderValue;
  const mwVisibleNow=!(beforeRise || afterSet);
  const mwOpacity=mwVisibleNow ? 0.78 : 0.3;

  if(mwPlanePath) mwPlanePath.setAttribute('d',mw.panD);
  if(mwPlane360Path) mwPlane360Path.setAttribute('d',mw.skyD);
  if(mwPlanePath) mwPlanePath.style.opacity=String(mwOpacity);
  if(mwPlane360Path) mwPlane360Path.style.opacity=String(mwOpacity);
  setMarkerVisibility(mwMarker,mw.markerVisible);
  if(mwMarker) mwMarker.style.opacity=String(mwOpacity);
  if(mw.markerVisible) mwMarker.setAttribute('transform',`translate(${mw.markerX-250}, ${mw.markerY-430})`);

  const solarPath=buildBodyPath('sun',dateObj);
  if(visState.sunPath){
    if(sunPath){sunPath.setAttribute('d',solarPath.panD); sunPath.style.display='';}
    if(sunPath360){sunPath360.setAttribute('d',solarPath.skyD); sunPath360.style.display='';}
  }else{
    if(sunPath) sunPath.style.display='none';
    if(sunPath360) sunPath360.style.display='none';
  }

  const sunAA=bodyAltAz('sun',dateObj);
  const sunP=projectPanorama(sunAA.az,sunAA.alt);
  movePanMarker(sunPositionMarker,sunP,710,430);
  move360Marker(sunPosition360,project360(sunAA.az,sunAA.alt));

  const sunriseDate=dateForTimeLabel(astro.sunrise,false);
  const sunsetDate=dateForTimeLabel(astro.sunset,false);
  const moonriseDate=dateForTimeLabel(astro.moonRise,false);
  const moonsetDate=dateForTimeLabel(astro.moonSet,false);

  if(visState.sunMarkers){
    if(sunriseDate){
      const aa=bodyAltAz('sun',sunriseDate);
      movePanMarker(sunriseMarker,projectPanorama(aa.az,0.1),710,430);
      move360Marker(sunriseMarker360,project360(aa.az,0.1));
    }else{setMarkerVisibility(sunriseMarker,false); setMarkerVisibility(sunriseMarker360,false);}
    if(sunsetDate){
      const aa=bodyAltAz('sun',sunsetDate);
      movePanMarker(sunsetMarker,projectPanorama(aa.az,0.1),710,430);
      move360Marker(sunsetMarker360,project360(aa.az,0.1));
    }else{setMarkerVisibility(sunsetMarker,false); setMarkerVisibility(sunsetMarker360,false);}
  }else{
    setMarkerVisibility(sunriseMarker,false); setMarkerVisibility(sunriseMarker360,false);
    setMarkerVisibility(sunsetMarker,false); setMarkerVisibility(sunsetMarker360,false);
  }

  if(visState.moonMarkers){
    if(moonriseDate){
      const aa=bodyAltAz('moon',moonriseDate);
      movePanMarker(moonriseMarker,projectPanorama(aa.az,0.1),710,430);
      move360Marker(moonriseMarker360,project360(aa.az,0.1));
    }else{setMarkerVisibility(moonriseMarker,false); setMarkerVisibility(moonriseMarker360,false);}
    if(moonsetDate){
      const aa=bodyAltAz('moon',moonsetDate);
      movePanMarker(moonsetMarker,projectPanorama(aa.az,0.1),710,430);
      move360Marker(moonsetMarker360,project360(aa.az,0.1));
    }else{setMarkerVisibility(moonsetMarker,false); setMarkerVisibility(moonsetMarker360,false);}
  }else{
    setMarkerVisibility(moonriseMarker,false); setMarkerVisibility(moonriseMarker360,false);
    setMarkerVisibility(moonsetMarker,false); setMarkerVisibility(moonsetMarker360,false);
  }

  if(moonDot){
    const moonAA=bodyAltAz('moon',dateObj);
    const moonP=projectPanorama(moonAA.az,moonAA.alt);
    if(moonP.visible){
      moonDot.setAttribute('cx',moonP.x);
      moonDot.setAttribute('cy',moonP.y);
      moonDot.style.display='';
    }else{
      moonDot.style.display='none';
    }
  }

  if(nowMarker360){
    const az=gcAA.az,rad=deg2rad(az-90),cx=320,cy=320,r=238,x2=cx+r*Math.cos(rad),y2=cy+r*Math.sin(rad);
    nowMarker360.querySelector('line').setAttribute('x2',x2);
    nowMarker360.querySelector('line').setAttribute('y2',y2);
    nowMarker360.querySelector('circle').setAttribute('cx',x2);
    nowMarker360.querySelector('circle').setAttribute('cy',y2);
  }

  renderObjectLayers(dateObj);
  renderHorizonProfilePanorama();
  updatePanoramaLabels();
  updateDirections360();
}

let skyUpdateQueued=false;
function queueSkyUpdate(){
  if(skyUpdateQueued) return;
  skyUpdateQueued=true;
  requestAnimationFrame(()=>{
    skyUpdateQueued=false;
    updateSky();
  });
}

function stopAutoPlay(){
  if(!autoPlay || !timer) return;
  autoPlay.checked=false;
  clearInterval(timer);
  timer=null;
}

if(slider){
  slider.addEventListener('input',queueSkyUpdate);
  slider.addEventListener('pointerdown',()=>stopAutoPlay());
}

function getDaySliderBaseDate(){
  const base=(window.ASTRO_DATA&&window.ASTRO_DATA.dayBaseDate)
    ? window.ASTRO_DATA.dayBaseDate
    : new Date().toISOString().slice(0,10);
  const [y,m,d]=base.split('-').map(Number);
  return new Date(y,m-1,d);
}

// Day slider event listeners
if(daySlider){
  daySlider.addEventListener('input',()=>{
    const todayObj=getDaySliderBaseDate();
    const offset=Number(daySlider.value);
    const selectedDate=new Date(todayObj);
    selectedDate.setDate(selectedDate.getDate()+offset);
    const dateStr=selectedDate.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'});
    if(dayCurrentLabel) dayCurrentLabel.textContent=dateStr;
    if(dayThumbLabel) dayThumbLabel.textContent=dateStr;
  });
  daySlider.addEventListener('change',()=>{
    const todayObj=getDaySliderBaseDate();
    const offset=Number(daySlider.value);
    const selectedDate=new Date(todayObj);
    selectedDate.setDate(selectedDate.getDate()+offset);
    const newDateStr=selectedDate.toISOString().slice(0,10);
    const currentTime=slider?Number(slider.value):1650;
    const minutes=currentTime-1440;
    window.location.href=`?date=${newDateStr}&t=${minutes}`;
  });
}

if(objectSearch){
  objectSearch.addEventListener('input',()=>queueSkyUpdate());
}

document.querySelectorAll('[data-layer]').forEach(btn=>btn.addEventListener('click',()=>{
  const layer=btn.dataset.layer;
  layerState[layer]=!layerState[layer];
  btn.classList.toggle('active',layerState[layer]);
  queueSkyUpdate();
}));

speedButtons.forEach(btn=>btn.addEventListener('click',()=>{
  speedButtons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  speed=Number(btn.dataset.speed);
}));

if(autoPlay && slider){
  autoPlay.addEventListener('change',()=>{
    if(autoPlay.checked){
      clearInterval(timer);
      timer=setInterval(()=>{
        let v=Number(slider.value)+5*speed;
        if(v>Number(slider.max))v=Number(slider.min);
        slider.value=v;
        queueSkyUpdate();
      },180);
    }else{
      clearInterval(timer);
      timer=null;
    }
  });
}

if(skyPanel){
  let dragging=false,lastX=0,activePointerId=null;
  skyPanel.addEventListener('pointerdown',e=>{
    if(e.button!==0) return;
    if(e.target.closest('.selected-panel')) return;
    dragging=true;
    activePointerId=e.pointerId;
    lastX=e.clientX;
    skyPanel.classList.add('dragging');
    skyPanel.setPointerCapture(e.pointerId);
  });
  skyPanel.addEventListener('pointermove',e=>{
    if(!dragging) return;
    const dx=e.clientX-lastX;
    lastX=e.clientX;
    panCenterAz=norm360(panCenterAz-dx*0.25);
    queueSkyUpdate();
  });
  function endDrag(){
    dragging=false;
    skyPanel.classList.remove('dragging');
    if(activePointerId!==null && skyPanel.hasPointerCapture(activePointerId)) skyPanel.releasePointerCapture(activePointerId);
    activePointerId=null;
  }
  skyPanel.addEventListener('pointerup',endDrag);
  skyPanel.addEventListener('pointercancel',endDrag);
  skyPanel.addEventListener('lostpointercapture',endDrag);
  window.addEventListener('pointerup',endDrag);
  window.addEventListener('blur',endDrag);
}

if(skySvg360){
  const updateSky360Cursor=(ctrlPressed=false)=>{
    if(!skySvg360) return;
    if(dragging360){
      skySvg360.style.cursor=(ctrlPressed && satelliteEnabled) ? 'move' : 'grabbing';
      return;
    }
    skySvg360.style.cursor=(ctrlPressed && satelliteEnabled) ? 'move' : 'grab';
  };
  let dragging360=false,lastX360=0,activePointerId360=null;
  skySvg360.addEventListener('pointerdown',e=>{
    if(e.button!==0) return;
    dragging360=true;
    activePointerId360=e.pointerId;
    lastX360=e.clientX;
    skySvg360._lastY360=e.clientY;
    updateSky360Cursor(e.ctrlKey);
    skySvg360.setPointerCapture(e.pointerId);
  });
  skySvg360.addEventListener('pointermove',e=>{
    if(!dragging360) return;
    const dx=e.clientX-lastX360;
    const dy=e.clientY-(skySvg360._lastY360 ?? e.clientY);
    lastX360=e.clientX;
    skySvg360._lastY360=e.clientY;
    updateSky360Cursor(e.ctrlKey);
    if(e.ctrlKey && satelliteEnabled && satelliteMap){
      satelliteMap.panBy([-dx,-dy],{animate:false});
      return;
    }
    skyCenterAz=norm360(skyCenterAz+dx*0.35);
    queueSkyUpdate();
  });
  function endDrag360(){
    dragging360=false;
    skySvg360._lastY360=null;
    updateSky360Cursor(false);
    if(activePointerId360!==null && skySvg360.hasPointerCapture(activePointerId360)) skySvg360.releasePointerCapture(activePointerId360);
    activePointerId360=null;
  }
  skySvg360.addEventListener('pointerup',endDrag360);
  skySvg360.addEventListener('pointercancel',endDrag360);
  skySvg360.addEventListener('lostpointercapture',endDrag360);
  window.addEventListener('pointerup',endDrag360);
  window.addEventListener('blur',endDrag360);
  window.addEventListener('keydown',e=>{ if(e.key==='Control') updateSky360Cursor(true); });
  window.addEventListener('keyup',e=>{ if(e.key==='Control') updateSky360Cursor(false); });
}

if(openConfigModalBtn){
  openConfigModalBtn.addEventListener('click',openConfigModal);
}
if(closeConfigModalBtn){
  closeConfigModalBtn.addEventListener('click',closeConfigModal);
}
if(configModal){
  configModal.addEventListener('click',e=>{
    if(e.target===configModal) closeConfigModal();
  });
}
if(saveConfigBtn){
  saveConfigBtn.addEventListener('click',saveConfiguration);
}
if(saveFavoriteBtn){
  saveFavoriteBtn.addEventListener('click',saveFavoriteLocation);
}
if(configFavoritesSelect){
  configFavoritesSelect.addEventListener('change',()=>applyFavoriteSelection(configFavoritesSelect.value));
}
if(satelliteLayerToggle){
  satelliteLayerToggle.addEventListener('change',()=>setSatelliteLayerEnabled(satelliteLayerToggle.checked));
}
if(satZoomIn){
  satZoomIn.addEventListener('click',()=>{
    if(satelliteEnabled && satelliteMap) satelliteMap.setZoom(Math.min(19,satelliteMap.getZoom()+1));
  });
}
if(satZoomOut){
  satZoomOut.addEventListener('click',()=>{
    if(satelliteEnabled && satelliteMap) satelliteMap.setZoom(Math.max(2,satelliteMap.getZoom()-1));
  });
}
if(configAddressSearchBtn){
  configAddressSearchBtn.addEventListener('click',searchAddressAndMoveMap);
}
if(configAddressSearchInput){
  configAddressSearchInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      searchAddressAndMoveMap();
    }
  });
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && configModal && configModal.classList.contains('open')) closeConfigModal();
});

ensureValidCoordinates();
setSatelliteLayerEnabled(localStorage.getItem('satelliteLayer360')==='1');

// Load and wire up visibility settings
(function initVisibilitySettings(){
  const keys=['gcMarkers','sunMarkers','sunPath','moonMarkers','vlMarkers','autoSpeed'];
  const raw=localStorage.getItem('chartVisibility');
  if(raw){
    try{
      const saved=JSON.parse(raw);
      keys.forEach(k=>{ if(k in saved) visState[k]=!!saved[k]; });
    }catch(e){}
  }
  const checkboxMap={
    gcMarkers: document.getElementById('visGcMarkers'),
    sunMarkers: document.getElementById('visSunMarkers'),
    sunPath:    document.getElementById('visSunPath'),
    moonMarkers:document.getElementById('visMoonMarkers'),
    vlMarkers:  document.getElementById('visVlMarkers'),
    autoSpeed:  document.getElementById('visAutoSpeed'),
  };
  const autoSpeedRow=document.getElementById('autoSpeedRow');
  const applyAutoSpeedVisibility=()=>{
    if(autoSpeedRow) autoSpeedRow.style.display=visState.autoSpeed?'':'none';
  };
  // Sync checkbox states from loaded values
  keys.forEach(k=>{ if(checkboxMap[k]) checkboxMap[k].checked=visState[k]; });
  // Listen for changes
  keys.forEach(k=>{
    const cb=checkboxMap[k];
    if(!cb) return;
    cb.addEventListener('change',()=>{
      visState[k]=cb.checked;
      localStorage.setItem('chartVisibility',JSON.stringify(visState));
      if(k==='autoSpeed') applyAutoSpeedVisibility();
      queueSkyUpdate();
    });
  });
  applyAutoSpeedVisibility();
})();

setView(localStorage.getItem('selectedView')||'360');
updateTimelineLabelPositions();
updateSky();
loadHorizonProfile();
