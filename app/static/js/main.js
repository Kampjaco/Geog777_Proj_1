
// SETTING UP THE MAP //

//Basemaps
var grey = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri'
});

var stadia = L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.{ext}', {
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

const map = L.map('map', {
  center: [44.63123767665573, -89.64431989719363],
  zoom: 7,
  layers: [grey]
});

//Ensures well layer is in front of census tract layer
map.createPane('wellPane');
map.getPane('wellPane').style.zIndex = 650;

//////////////////////////////////////////////////////////////////////////////////
// STYLING FUNCTIONS FOR RAW GEOJSON DATA //

function censusTractStyle(feature) {
  return {
    fillColor: getTractColor(feature.properties.canrate),
    weight: 0.5,             
    color: '#666666',        
    opacity: .65,              
    fillOpacity: .65      
  }
}
 
function getTractColor(rate) {
  return  rate > 0.61 ? `#08519c` :
          rate > 0.39 ? `#3182bd` :
          rate > 0.22 ? `#6baed6` :
          rate > 0.08 ? `#bdd7e7` :
                        `#eff3ff`;
}

function wellStyle(feature) {
  return {
    pane: 'wellPane',
    radius: 4,
    fillColor: getWellColor(feature.properties.nitr_ran),
    color: '#333',          
    weight: 0.5,
    opacity: .85,
    fillOpacity: 0.85
  }
}

function getWellColor(ppm) {
  return  ppm > 11.05 ? `#a63603` :
          ppm > 6.32  ? `#e6550d` :
          ppm > 3.40  ? `#fd8d3c` :
          ppm > 1.16  ? `#fdbe85` :
                        `#feedde` ;

}

let idwBreaks = [];
function getIDWColor(val) {

  if (val <= idwBreaks[1]) return '#8c510a';
  else if (val <= idwBreaks[2]) return '#bf812d';
  else if (val <= idwBreaks[3]) return '#dfc27d';
  else if (val <= idwBreaks[4]) return '#f6e8c3';
  else if (val <= idwBreaks[5]) return '#c7eae5';
  else if (val <= idwBreaks[6]) return '#80cdc1';
  else return '#35978f';

}

function glrStyle(feature) {

  return {
    fillColor: getGLRColor(feature.properties.STDRESID),
    weight: 1,             
    color: '#B2B2B2',        
    opacity: 1,              
    fillOpacity: 1      
  }
}

function getGLRColor(val) {

  return  val <= -2.5 ? '#2D004B' :
          val <= -1.5 ? '#715AA0' :
          val <= -0.5 ? '#BFBBDA' :
          val <= 0.5  ? '#F7F7F7' :
          val <= 1.5  ? '#C7EAE5' :
          val <= 2.5  ? '#5AB4AC' :
                        '#01665E' ;
}

function onEachGLR(feature, layer) {

  layer.bindPopup( `
    <b>Nitrate Concentration:</b> ${Number(feature.properties.idw_mean)?.toFixed(2)} ppm  <br>
    <b>Observed Cancer Rate:</b> ${Number(feature.properties.canrate)?.toFixed(2)} <br>
    <b>Predicted Cancer Rate:</b> ${Number(feature.properties.PREDICTED)?.toFixed(2)} 
  `)
}

//////////////////////////////////////////////////////////////////////////////////
// LAYER CONTROL //

const cancerTractsLayer = L.layerGroup();
const wellsLayer = L.layerGroup();
const idwLayer = L.layerGroup();
const glrLayer = L.layerGroup();

//////////////////////////////////////////////////////////////////////////////////
// LOADING IN RAW GEOJSON DATA //

// Load census tract cancer rate geojson layer
fetch('/static/raw_files/cancer_tracts.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: censusTractStyle,
      onEachFeature: function(feature, layer) {
        const rawRate = feature.properties.canrate;
        const truncatedRate = Math.floor(rawRate * 100) / 100;
        layer.bindPopup(`Cancer rate: ${truncatedRate}%`);
      }
    }).addTo(cancerTractsLayer);
  });

// Load wells geojson layer
fetch('/static/raw_files/well_nitrate.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, wellStyle(feature))
      },
      onEachFeature: function(feature, layer) {
        layer.bringToFront();
        const rawRate = feature.properties.nitr_ran;
        const truncatedRate = Math.floor(rawRate * 100) / 100;
        layer.bindPopup(`Nitrate level: ${truncatedRate} ppm`);
      }
    }).addTo(wellsLayer);
  });

//////////////////////////////////////////////////////////////////////////////////
// CREATING LEGENDS //

const tractLegend = L.control({ position: 'bottomright' });

tractLegend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [0,0.08, 0.22, 0.39, 0.61];
  const labels = [];

  div.innerHTML = '<strong>Cancer Rate</strong><br>';

  for (let i = 0; i < grades.length; i++) {
    const from = grades[i];
    const to = grades[i + 1];

    div.innerHTML +=
      `<i style="background:${getTractColor(from + 0.001)}"></i> ` +
      `${from}${to ? `–${to}` : '+'}<br>`;
  }

  return div;
};
tractLegend.addTo(map);


const wellLegend = L.control({ position: 'bottomright' });

wellLegend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  const ppm = [-1.89, 1.16, 3.40, 6.32, 11.05];

  div.innerHTML = '<strong>Nitrate Levels (ppm)</strong><br>';

  for (let i = 0; i < ppm.length; i++) {
    const from = ppm[i];
    const to = ppm[i + 1];

    div.innerHTML +=
      `<i style="background:${getWellColor(from + 0.001)}"></i> ` +
      `${from}${to ? `–${to}` : '+'}<br>`;
  }

  return div;
};
wellLegend.addTo(map);

let idwLegend;
function createIDWLegend(breaks) {
  if (idwLegend) {
    map.removeControl(idwLegend);
  }

  idwLegend = L.control({ position: 'bottomright' });

  idwLegend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<strong>Interpolated Nitrate Levels (ppm)</strong><br>';

    for (let i = 0; i < breaks.length - 1; i++) {
      const from = breaks[i].toFixed(2);
      const to = breaks[i + 1].toFixed(2);
      const mid = (breaks[i] + breaks[i + 1]) / 2;

      div.innerHTML +=
        `<i style="background:${getIDWColor(mid)}"></i> ${from}–${to}<br>`;
    }

    return div;
  }
}

const glrLegend = L.control({ position: 'bottomright' });

glrLegend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [
    { min: -2.51, label: '< -2.5 Std. Dev. (overprediction)' },
    { min: -2.5,  label: '-2.5 Std. Dev. - -1.5 Std. Dev.' },
    { min: -1.5,  label: '-1.5 Std. Dev - -0.5 Std. Dev.' },
    { min: -0.5,  label: '-0.5 Std. Dev. - 0.5 Std. Dev.' },
    { min: 0.5,  label: '0.5 Std. Dev. - 1.5 Std. Dev.' },
    { min: 1.5,  label: '1.5 Std. Dev. - 2.5 Std. Dev.' },
    { min: 2.5,  label: '> 2.5 Std. Dev. (underprediction)' }
  ];
  
  div.innerHTML = '<strong>Standardized Residuals</strong><br>';

  grades.forEach(entry => {
    const color = getGLRColor(entry.min + 0.001);
    div.innerHTML +=
      `<i style="background:${color}; width: 18px; height: 18px; display: inline-block; margin-right: 6px;"></i> ${entry.label}<br>`;
  });

  return div;
};


//Adds and removes legends when layers are added/removed
map.on('overlayadd', function(e) {
  if (e.name === 'Cancer Tracts') {
    tractLegend.addTo(map);
  }
});

map.on('overlayremove', function(e) {
  if (e.name === 'Cancer Tracts') {
    map.removeControl(tractLegend);
  }
});

map.on('overlayadd', function(e) {
  if (e.name === 'Nitrate Wells') {
    wellLegend.addTo(map);
  }
});

map.on('overlayremove', function(e) {
  if (e.name === 'Nitrate Wells') {
    map.removeControl(wellLegend);
  }
});

//Adds legend if IDW layer is triggered
map.on('overlayadd', function (e) {
  if (e.name === 'IDW') idwLegend.addTo(map);
});

map.on('overlayremove', function (e) {
  if (e.name === 'IDW') map.removeControl(idwLegend);
});

map.on('overlayadd', function (e) {
  if (e.name === 'GLR') glrLegend.addTo(map);
});

map.on('overlayremove', function (e) {
  if (e.name === 'GLR') map.removeControl(glrLegend);
});


//////////////////////////////////////////////////////////////////////////////////
// MORE LAYER CONTROL //

//Raw GEOJSON files added to map by default
cancerTractsLayer.addTo(map);
wellsLayer.addTo(map);

const baseMaps = {
  "Grey": grey,
  "Satellite": satellite,
  "Stamen": stadia
};

const overlayMaps = {
  "Cancer Tracts": cancerTractsLayer,
  "Nitrate Wells": wellsLayer
};


//Add sidebar
var sidebar = L.control.sidebar({
    autopan: false,       // whether to maintain the centered map point when opening the sidebar
    closeButton: true,    // whether t add a close button to the panes
    container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
    position: 'left',     // left or right
}).addTo(map);

setTimeout(function() {
  sidebar.open('home');
}, 500);

let layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

//////////////////////////////////////////////////////////////////////////////////
// PERFORMING ANALYSIS //

function submitCoeff() {

  const decay_coefficient = document.getElementById("coeff").value;

  if(decay_coefficient <= 1) {
    alert("Distance Decay Coefficient must be greater than 1");
    return
  }

  // Start both requests in parallel
  const idwPromise = fetch('/call_idw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decay: decay_coefficient })
  }).then(response => response.json())
    .then(data => {
      addGeoTIFFToMap(data.raster_url);
    });

  const glrPromise = fetch('/call_zonal_regression', {
    method: 'POST'
  }).then(res => res.json())
    .then(data => {
      // Return a promise from addGLRToMap
      displayGLRStats(data.glr_stats)

      //Creates button to download GLR shapefile
      const downloadBtn = document.getElementById("download-glr");
      downloadBtn.href = data.download_url;
      downloadBtn.style.display = "inline-block";

      return addGLRToMap(data.geojson_url); 
    });

  // Wait until both are complete before updating the layers
  Promise.all([idwPromise, glrPromise]).then(() => {
    alert("Analysis successful!  Toggle additional layers on top right portion of screen.")
    updateLayerGroups();
  });
}

//Displays GLR stats
function displayGLRStats(stats) {
  
  const r2 = extractR2(stats)

  const container = document.getElementById("equation");

  container.innerHTML = `
    <strong>R Squared Value</strong><br>
    ${r2}<br>
    <span style="font-size: 14px;">R Squared values closer to 1 indicate a stronger relationship between nitrate levels and and cancer rate.</span>
  `
}

function extractR2(text) {

  let r2Line = text
    .split('\n')
    .find(line => line.includes("Multiple R-Squared"));

  console.log(r2Line)

  r2Line = r2Line.replaceAll(' ', '')
  r2Line = r2Line.substring(20,28)
  return r2Line

  
}

//Adds IDW layer to map
function addGeoTIFFToMap(tiffUrl) {
  fetch(tiffUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => parseGeoraster(arrayBuffer))
    .then(georaster => {
      //For dynamically creating IDW legend
      const min = georaster.mins[0];
      const max = georaster.maxs[0];

      idwBreaks = [];
      const steps = 7;
      for (let i = 0; i <= steps; i++) {
        idwBreaks.push(min + i * (max - min) / steps);
      }

      const idw_raster = new GeoRasterLayer({
        georaster: georaster,
        resolution: 128,
        pixelValuesToColorFn: values => {
          const val = values[0]; 
          return getIDWColor(val);
        }
      });

      // Clear old raster, add new one
      idwLayer.clearLayers();
      idwLayer.addLayer(idw_raster);

      // Add dynamic legend
      createIDWLegend(idwBreaks);
    });
}

function addGLRToMap(glrUrl) {
  return fetch(glrUrl)
    .then(res => res.json())
    .then(geojson => {
      const glr_json = new L.geoJSON(geojson, {
        style: glrStyle,
        onEachFeature: onEachGLR
      });

      glrLayer.clearLayers();
      glrLayer.addLayer(glr_json);

      return glr_json;
    });
}

//Updates layer groups to include IDW and regression layers
function updateLayerGroups() {

  const baseMaps = {
    "Grey": grey,
    "Satellite": satellite,
    "Stamen": stadia
  };

  const overlayMaps = {
    "Cancer Tracts": cancerTractsLayer,
    "Nitrate Wells": wellsLayer,
    "IDW": idwLayer,
    "GLR": glrLayer
  };


  //Removes old layer control and adds new one with IDW and regression layers
  map.removeControl(layerControl);
  layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
  cancerTractsLayer.remove();
  wellsLayer.remove();
  idwLayer.remove();
  map.addLayer(glrLayer);

}


