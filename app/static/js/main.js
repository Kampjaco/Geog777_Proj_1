
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

function getIDWColor(val) {

  return  val > 10.985 ? '#01665e'  :
          val > 7.391 ? '#35978f'   :
          val > 5.199 ? '#80cdc1'   :
          val > 3.862 ? '#c7eae5'   :
          val > 3.047 ? '#f5f5f5'   :
          val > 2.550 ? '#f6e8c3'   :
          val > 1.735 ? '#dfc27d'   :
          val > 0.399 ? '#bf812d'   :
                        '#8c510a'   ;
          
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

  div.innerHTML = '<strong>Cancer Rate %</strong><br>';

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

  div.innerHTML = '<strong>Nitrate (ppm)</strong><br>';

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

//Creates IDW legend
const idwLegend = L.control({ position: 'bottomright' });

idwLegend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  div.innerHTML += '<strong>Nitrate (ppm)</strong><br>';

  const grades = [
    { min: 10.985, label: '> 10.985' },
    { min: 7.391,  label: '7.391 - 10.985' },
    { min: 5.199,  label: '5.199 - 7.391' },
    { min: 3.862,  label: '3.862 - 5.199' },
    { min: 3.047,  label: '3.047 - 3.862' },
    { min: 2.550,  label: '2.550 - 3.047' },
    { min: 1.735,  label: '1.735 - 2.550' },
    { min: 0.399,  label: '0.399 - 1.735' },
    { min: -Infinity, label: '≤ 0.399' }
  ];

  grades.forEach(entry => {
    const color = getIDWColor(entry.min + 0.001);
    div.innerHTML +=
      `<i style="background:${color}; width: 20px; height: 12px; display: inline-block; margin-right: 6px;"></i> ${entry.label}<br>`;
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

const layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

//////////////////////////////////////////////////////////////////////////////////
// PERFORMING ANALYSIS //

function submitCoeff() {

  decay_coefficient = document.getElementById("coeff").value;

  //IDW
  fetch('/call_idw', {
    method: 'POST',
    headers: { 
      'Content-Type' : 'application/json' 
    },
    body: JSON.stringify({ decay: decay_coefficient })
  })
  .then(response => response.json())
  .then(data => {
    addGeoTIFFToMap(data.raster_url);
  });

  //Zonal stats
  fetch('/call_zonal_regression', {
    method: 'POST'
  })
    .then(res => res.json())
    .then(data => {
      addGLRToMap(data.geojson_url)
    })

  updateLayerGroups();
}

//Adds IDW layer to map
function addGeoTIFFToMap(tiffUrl) {
  fetch(tiffUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => parseGeoraster(arrayBuffer))
    .then(georaster => {
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
    });
}

function addGLRToMap(glrUrl) {
  fetch(glrUrl)
        .then(res => res.json())
        .then(geojson => {
          const glr_json = new L.geoJSON(geojson, {
             style: feature => ({
              color: "#3182bd",
              weight: 1,
              fillOpacity: 0.5
            }),
            onEachFeature: (feature, layer) => {
              const p = feature.properties;
              layer.bindPopup(`
                <strong>Tract:</strong> ${p.GEOID10}<br>
                <strong>Observed:</strong> ${p.canrate}<br>
                <strong>Predicted:</strong> ${p.PREDICTED?.toFixed(2)}<br>
                <strong>Residual:</strong> ${p.RESIDUAL?.toFixed(2)}
              `)
            }

          
          })
          console.log(geojson)
          // //Clear old GLR, add new one
          glrLayer.clearLayers();
          glrLayer.addLayer(glr_json);
        })
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
  L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
}


