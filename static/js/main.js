const map = L.map('map').setView([45.0, -93.0], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

fetch('/run-analysis')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data).addTo(map);
  });