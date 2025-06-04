
const map = L.map('map').setView([45.0, -93.0], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Load wells geojson layer
fetch('/static/raw_geojson/well_nitrate.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: 'red',
        weight: 2
      }
    }).addTo(map);
  });

  // Load census tract cancer geojson layer
fetch('/static/raw_geojson/cancer_tracts.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: 'blue',
        weight: 2
      }
    }).addTo(map);
  });



// fetch('/run-analysis')
//   .then(res => res.json())
//   .then(data => {
//     L.geoJSON(data).addTo(map);
//   });