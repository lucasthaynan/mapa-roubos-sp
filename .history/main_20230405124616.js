mapboxgl.accessToken = 'sk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3QxbWNxMGl2MDNrcnZ5a2t3cnp0cyJ9.NXBrY-ta1wdadzaiYuM8JA';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-122.662323, 45.523751], // starting position
  zoom: 12
});
// set the bounds of the map
const bounds = [
  [-123.069003, 45.395273],
  [-122.303707, 45.612333]
];
map.setMaxBounds(bounds);

// an arbitrary start will always be the same
// only the end or destination will change
const start = [-122.662323, 45.523751];

// this is where the code for the next step will go