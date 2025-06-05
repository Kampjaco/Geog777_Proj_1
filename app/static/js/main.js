
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
    color: '#333',          // Circle border
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

// LAYER CONTROL //

//LayerGroups to store raw GEOJSON
const cancerTractsLayer = L.layerGroup();
const wellsLayer = L.layerGroup();

// LOADING IN RAW GEOJSON DATA //

// Load census tract cancer rate geojson layer
fetch('/static/raw_geojson/cancer_tracts.geojson')
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
fetch('/static/raw_geojson/well_nitrate.geojson')
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

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);











// fetch('/run-analysis')
//   .then(res => res.json())
//   .then(data => {
//     L.geoJSON(data).addTo(map);
//   });