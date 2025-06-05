
const map = L.map('map').setView([44.63123767665573, -89.64431989719363], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// STYLING FUNCTIONS FOR RAW GEOJSON DATA //
function censusTractStyle(feature) {
  return {
    fillColor: getTractColor(feature.properties.canrate),
    weight: 0.5,             
    color: '#666666',        
    opacity: 1,              
    fillOpacity: 1      
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
    radius: 6,
    fillColor: getWellColor(feature.properties.nitr_ran),
    color: '#333',          // Circle border
    weight: 0.5,
    opacity: 1,
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


// LOADING IN RAW GEOJSON DATA //

// Load census tract cancer geojson layer
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
    }).addTo(map);
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
    }).addTo(map);
  });







// fetch('/run-analysis')
//   .then(res => res.json())
//   .then(data => {
//     L.geoJSON(data).addTo(map);
//   });