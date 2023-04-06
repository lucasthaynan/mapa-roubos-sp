mapboxgl.accessToken =
  "pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ";
const map = new mapboxgl.Map({
  container: "map", // Specify the container ID
  style: "mapbox://styles/mapbox/light-v11", // Specify which map style to use
  center: [-46.65601, -23.56158], // Specify the starting position [lng, lat]
  zoom: 15, // Specify the starting zoom
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/driving",
  alternatives: true,
  geometries: "geojson",
  controls: { instructions: false },
  flyTo: false,
  language: "pt-BR",
  geocoder: {
    language: "pt-BR",
  },
  steps: true,
});

map.addControl(directions, "top-right");
map.scrollZoom.enable();

let obstacle;

fetch("./clearance_map.json")
  .then((response) => response.json())
  .then((data) => {
    clearances = data;
    obstacle = turf.buffer(clearances, 0.01, { units: "kilometers" });
    console.log("🚀 ~ file: main.js:35 ~ .then ~ obstacle:", obstacle);
    // faça algo com a variável obstacle
  })
  .catch((error) => console.error(error));

// const clearances = {
//   type: 'FeatureCollection',
//   features: [
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [-46.65882, -23.55925]
//       },
//       properties: {
//         clearance: 1
//       }
//     },
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [-46.63867,-23.562684]
//       },
//       properties: {
//         clearance: 20
//       }
//     },
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [-46.638,-23.562]
//       },
//       properties: {
//         clearance: 20
//       }
//     },
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [-46.6581, -23.5593]
//       },
//       properties: {
//         clearance: 20
//       }
//     },
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [-46.65937,-23.55896]
//       },
//       properties: {
//         clearance: 1
//       }
//     },
//     {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [-46.65517,-23.56245]
//       },
//       properties: {
//         clearance: 1
//       }
//     }
//   ]
// };

// const obstacle = turf.buffer(clearances, 0.01, { units: 'kilometers' });
let bbox = [0, 0, 0, 0];
let polygon = turf.bboxPolygon(bbox);

map.on("load", () => {
  map.addLayer({
    id: "clearances",
    type: "fill",
    source: {
      type: "geojson",
      data: obstacle,
    },
    layout: {},
    paint: {
      "fill-color": "#f03b20",
      "fill-opacity": 0.5,
      "fill-outline-color": "#f03b20",
    },
  });

  map.addSource("theRoute", {
    type: "geojson",
    data: {
      type: "Feature",
    },
  });

  map.addLayer({
    id: "theRoute",
    type: "line",
    source: "theRoute",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#cccccc",
      "line-opacity": 0.5,
      "line-width": 13,
      "line-blur": 0.5,
    },
  });

  // Source and layer for the bounding box
  map.addSource("theBox", {
    type: "geojson",
    data: {
      type: "Feature",
    },
  });
  map.addLayer({
    id: "theBox",
    type: "fill",
    source: "theBox",
    layout: {},
    paint: {
      "fill-color": "#FFC300",
      "fill-opacity": 0.5,
      "fill-outline-color": "#FFC300",
    },
  });
});

let counter = 0;
const maxAttempts = 5;
let emoji = "";
let collision = "";
let detail = "";
const reports = document.getElementById("reports");

// FUNÇAO PARA ADICIONAR CARD COM INFOS DAS ROTAS NA TELA
function addCard(id, element, clear, detail) {
  const card = document.createElement("div");
  card.className = "card";
  // Add the response to the individual report created above
  const heading = document.createElement("div");
  // Set the class type based on clear value
  heading.className =
    clear === true ? "card-header route-found" : "card-header obstacle-found";
  heading.innerHTML =
    id === 0
      ? `${emoji} Esta rota ${collision}`
      : `${emoji} Rota ${id} ${collision}`;

  const details = document.createElement("div");
  details.className = "card-details";
  details.innerHTML = `This ${detail} obstacles.`;

  card.appendChild(heading);
  card.appendChild(details);
  element.insertBefore(card, element.firstChild);
}

// FUNÇAO QUE EXIBE QUANDO UMA ROTA SEM OBSTACULOS NAO É ENCONTRADA
function noRoutes(element) {
  const card = document.createElement("div");
  card.className = "card";
  // Add the response to the individual report created above
  const heading = document.createElement("div");
  heading.className = "card-header no-route";
  emoji = "🛑";
  heading.innerHTML = `${emoji} Fim da busca.`;

  // Add details to the individual report
  const details = document.createElement("div");
  details.className = "card-details";
  details.innerHTML = `No clear route found in ${counter} tries.`;

  card.appendChild(heading);
  card.appendChild(details);
  element.insertBefore(card, element.firstChild);
}

directions.on("clear", () => {
  map.setLayoutProperty("theRoute", "visibility", "none");
  map.setLayoutProperty("theBox", "visibility", "none");

  counter = 0;
  reports.innerHTML = "";
});



let idRota = 1;
let routesInfo = {};
let totalObstaculoRotas = [];

directions.on("route", (event) => {
  map.setLayoutProperty("theRoute", "visibility", "none");
  map.setLayoutProperty("theBox", "visibility", "none");

  if (counter >= maxAttempts) {
    noRoutes(reports);
  } else {
    for (const route of event.route) {
      map.setLayoutProperty("theRoute", "visibility", "visible");
      map.setLayoutProperty("theBox", "visibility", "visible");

      const routeLine = polyline.toGeoJSON(route.geometry);

      bbox = turf.bbox(routeLine);
      polygon = turf.bboxPolygon(bbox);

      map.getSource("theRoute").setData(routeLine);
      map.getSource("theBox").setData(polygon);
      const clear = turf.booleanDisjoint(obstacle, routeLine);
      totalObstaculoRota = turf.lineIntersect(obstacle, routeLine).features.length / 2;

      routesInfo[idRota] = {
        routeLine: routeLine,
        bbox: bbox,
        polygon: polygon,
        clear: clear,
        obstacles: totalObstaculoRota,
      };

      totalObstaculoRotas.push(totalObstaculoRota);

      idRota += 1;
    }

    const minObstacles = Math.min(...totalObstaculoRotas);
    const bestRoute = Object.values(routesInfo).find((route) => route.obstacles === minObstacles);

    map.getSource("theRoute").setData(bestRoute.routeLine);
    map.getSource("theBox").setData(bestRoute.polygon);
    const clear = bestRoute.clear;

    if (clear === true) {
      map.setPaintProperty("theRoute", "line-color", "#74c476");
      map.setLayoutProperty("theBox", "visibility", "none");
      counter = 0;
    } else {
      counter = counter + 1;

      polygon = turf.transformScale(bestRoute.polygon, counter * 0.01);
      bbox = turf.bbox(polygon);
      collision = "is bad.";
      detail = `takes ${(bestRoute.duration / 60).toFixed(0)} minutes and hits ${bestRoute.obstacles} obstacles`;

      map.setPaintProperty("theRoute", "line-color", "#de2d26");

      // const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
      // directions.setWaypoint(
      //   0,
      //   randomWaypoint["features"][0].geometry.coordinates
      // );
    }

    addCard(counter, reports, clear, detail);
  }
});

let minObstacles = Infinity;
let bestRoute;

function melhorRota(routesInfo) {
    // Percorre o objeto routesInfo
  
    for (const [id, routeInfo] of Object.entries(routesInfo)) {
      const { obstacles, routeLine } = routeInfo;
  
      // Verifica se a rota atual tem menos obstáculos do que a rota com menos obstáculos encontrada até o momento
      if (obstacles < minObstacles) {
        minObstacles = obstacles;
        bestRoute = routeLine;
      }
  }
  directions.on("route", (event) => {
    map.setLayoutProperty("theRoute", "visibility", "none");
    map.setLayoutProperty("theBox", "visibility", "none");
  // Exibe a rota com menos obstáculos
    map.getSource("theRoute").setData(bestRoute);
  })
}



function traduzirInput() {
  let input = document.querySelectorAll(
    '.mapboxgl-ctrl-geocoder > input[type="text"]'
  );
  input.forEach((input) => {
    if (input.placeholder == "Choose a starting place") {
      input.placeholder = "Endereço de partida";
    } else {
      input.placeholder = "Endereço de destino";
    }
  });

  document.querySelector(
    'label[for="mapbox-directions-profile-driving-traffic"]'
  ).innerText = "Trânsito";
  document.querySelector(
    'label[for="mapbox-directions-profile-driving"]'
  ).innerText = "Dirigindo";
  document.querySelector(
    'label[for="mapbox-directions-profile-walking"]'
  ).innerText = "Andando";
  document.querySelector(
    'label[for="mapbox-directions-profile-cycling"]'
  ).innerText = "Pedalando";
}

// Adiciona um listener para o evento DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  // Chama a função traduzirInput()
  traduzirInput();
});

//   CÓDIGO 2 - CRIA APENAS POUCAS ROTAS

// mapboxgl.accessToken = 'pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ';
// const map = new mapboxgl.Map({
//   container: 'map', // container id
//   style: 'mapbox://styles/mapbox/light-v11',
//   center: [-46.65882, -23.55925], // starting position
//   zoom: 16, // starting zoom
//   language: "pt-BR",
//   geocoder: {language: 'pt-BR'},
//   steps: true
// });

// const directions = new MapboxDirections({
//   accessToken: mapboxgl.accessToken,
//   unit: 'metric',
//   profile: 'mapbox/driving',
//   alternatives: 3,
//   geometries: 'geojson'
// });

// map.addControl(directions, 'top-right');
// map.scrollZoom.enable();

// let obstacle

// fetch('./clearance_map.json')
//   .then(response => response.json())
//   .then(data => {
//     clearances = data;
//      obstacle = turf.buffer(clearances, 0.01, { units: 'kilometers' });
//     // faça algo com a variável obstacle
//   })
//   .catch(error => console.error(error));

// map.on('load', () => {
//   map.addLayer({
//     id: 'clearances',
//     type: 'fill',
//     source: {
//       type: 'geojson',
//       data: obstacle
//     },
//     layout: {},
//     paint: {
//       'fill-color': '#f03b20',
//       'fill-opacity': 0.5,
//       'fill-outline-color': '#f03b20'
//     }
//   });

//   // Create sources and layers for the returned routes.
//   // There will be a maximum of 3 results from the Directions API.
//   // We use a loop to create the sources and layers.
//   for (let i = 0; i < 3; i++) {
//     map.addSource(`route${i}`, {
//       type: 'geojson',
//       data: {
//         type: 'Feature'
//       }
//     });

//     map.addLayer({
//       id: `route${i}`,
//       type: 'line',
//       source: `route${i}`,
//       layout: {
//         'line-join': 'round',
//         'line-cap': 'round'
//       },
//       paint: {
//         'line-color': '#cccccc',
//         'line-opacity': 0.5,
//         'line-width': 13,
//         'line-blur': 0.5
//       }
//     });
//   }
// });

// directions.on('route', (event) => {
//   const reports = document.getElementById('reports');
//   reports.innerHTML = '';
//   const report = reports.appendChild(document.createElement('div'));
//   // Add IDs to the routes
//   const routes = event.route.map((route, index) => ({
//     ...route,
//     id: index
//   }));

//   // Hide all routes by setting the opacity to zero.
//   for (let i = 0; i < 20; i++) {
//       map.setLayoutProperty(`route${i}`, 'visibility', 'none');
//     }

//     for (const route of routes) {
//   let obstacleCount = 0; // Initialize counter variable for this route
//   let obstaclePoints = []; // Initialize array to store all obstacle points for this route

//   map.setLayoutProperty(`route${route.id}`, 'visibility', 'visible');

//   const routeLine = polyline.toGeoJSON(route.geometry);

//   map.getSource(`route${route.id}`).setData(routeLine);

//   const intersection = turf.lineIntersect(routeLine, obstacle);

//   if (intersection.features.length > 0) { // If there's at least one obstacle, add to counter and array
//     obstacleCount += intersection.features.length;
//     intersection.features.forEach((feature) => {
//       obstaclePoints.push(feature.geometry.coordinates);
//     });
//   }

//   const collision = obstacleCount === 0 ? 'is good!' : 'is bad.';
//   const emoji = obstacleCount === 0 ? '✔️' : '⚠️';
//   const detail = obstacleCount === 0 ? 'does not go' : 'goes';
//   report.className = obstacleCount === 0 ? 'item' : 'item warning';

//   if (obstacleCount === 0) {
//     map.setPaintProperty(`route${route.id}`, 'line-color', '#74c476');
//   } else {
//     map.setPaintProperty(`route${route.id}`, 'line-color', '#de2d26');
//   }

//   report.id = `report-${route.id}`;

//   const heading = report.appendChild(document.createElement('h3'));

//   heading.className = obstacleCount === 0 ? 'title' : 'warning';
//   heading.innerHTML = `${emoji} Route ${route.id + 1} ${collision} <span class="obstacle-count"></span>`;

//   const obstacleCountElement = heading.querySelector('.obstacle-count');
//   obstacleCountElement.innerText = obstacleCount;

//   if (obstacleCount > 0) { // If there are obstacles, add a button to show them on the map
//     const showObstaclesButton = document.createElement('button');
//     showObstaclesButton.innerText = `Show ${obstacleCount} obstacle(s) on map`;
//     showObstaclesButton.addEventListener('click', () => {
//       const obstacleFeatureCollection = turf.featureCollection(obstaclePoints.map((coords) => turf.point(coords)));
//       map.addLayer({
//         id: `obstacles-route${route.id}`,
//         type: 'circle',
//         source: {
//           type: 'geojson',
//           data: obstacleFeatureCollection
//         },
//         paint: {
//           'circle-color': '#f03b20',
//           'circle-radius': 6,
//           'circle-opacity': 0.5,
//           'circle-stroke-color': '#f03b20',
//           'circle-stroke-width': 2
//         }
//       });
//     });
//     report.appendChild(showObstaclesButton);
//   }

//   const details = report.appendChild(document.createElement('div'));
//   details.innerHTML = `This route ${detail} through an avoidance area.`;
//   report.appendChild(document.createElement('hr'));
// }

// });

// function traduzirInput(){
// let input = document.querySelectorAll('.mapboxgl-ctrl-geocoder > input[type="text"]')
// input.forEach(input => {

//   if(input.placeholder == "Choose a starting place") {

//       input.placeholder = "Endereço de partida"

//   } else {
//       input.placeholder = "Endereço de destino"
//   }
// })

// document.querySelector('label[for="mapbox-directions-profile-driving-traffic"]').innerText = "Trânsito"
// document.querySelector('label[for="mapbox-directions-profile-driving"]').innerText = "Dirigindo"
// document.querySelector('label[for="mapbox-directions-profile-walking"]').innerText = "Andando"
// document.querySelector('label[for="mapbox-directions-profile-cycling"]').innerText = "Pedalando"

// }

// // Adiciona um listener para o evento DOMContentLoaded
// document.addEventListener('DOMContentLoaded', function() {
// // Chama a função traduzirInput()
// traduzirInput();
// });

// TESTE OUTRO

// for (const route of event.route) {

//   map.setLayoutProperty('theRoute', 'visibility', 'visible');
//   map.setLayoutProperty('theBox', 'visibility', 'visible');

//   const routeLine = polyline.toGeoJSON(route.geometry);

//   bbox = turf.bbox(routeLine);
//   polygon = turf.bboxPolygon(bbox);

//   map.getSource('theRoute').setData(routeLine);
//   console.log(verificacao)

//   map.getSource('theBox').setData(polygon);
//   const clear = turf.booleanDisjoint(obstacle, routeLine);

//   if (clear === true) {

//     map.setPaintProperty('theRoute', 'line-color', '#74c476');

//     map.setLayoutProperty('theBox', 'visibility', 'none');
//     counter = 0;
//   } else {

//     counter = counter + 1;
//     polygon = turf.transformScale(polygon, counter * 0.01);
//     bbox = turf.bbox(polygon);

//     totalObstaculoRota = (turf.lineIntersect(obstacle, routeLine).features.length)/2
//     collision = 'is bad.';
//     detail = `takes ${(route.duration / 60).toFixed(
//       0
//     )} minutes and hits ${totalObstaculoRota} obstacles`;

//     emoji = '⚠️';
//     map.setPaintProperty('theRoute', 'line-color', '#de2d26');

//     const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
//     directions.setWaypoint(
//       0,
//       randomWaypoint['features'][0].geometry.coordinates
//     );
//   }

//   routesInfo[route.routeIndex] = {
//     "routeLine": routeLine,
//     "bbox": bbox,
//     "polygon": polygon,
//     "clear": clear
//   };
//   addCard(counter, reports, clear, detail);

// }

// let idRota = 1
// let routesInfo = {};
// let totalObstaculoRotas = [];

// directions.on("route", (event) => {
//   map.setLayoutProperty("theRoute", "visibility", "none");
//   map.setLayoutProperty("theBox", "visibility", "none");

//   if (counter >= maxAttempts) {
//     noRoutes(reports);
//   } else {

//     let minObstacles = Infinity;
//     let bestRoute;

//     for (const route of event.route) {

//       console.log(`teste id rota: ${idRota}`);

//       map.setLayoutProperty("theRoute", "visibility", "visible");
//       map.setLayoutProperty("theBox", "visibility", "visible");

//       const routeLine = polyline.toGeoJSON(route.geometry);

//       bbox = turf.bbox(routeLine);
//       polygon = turf.bboxPolygon(bbox);

//       map.getSource("theRoute").setData(routeLine);
//       map.getSource("theBox").setData(polygon);
//       const clear = turf.booleanDisjoint(obstacle, routeLine);
//       totalObstaculoRota = turf.lineIntersect(obstacle, routeLine).features.length / 2;

//       routesInfo[idRota] = {
//         routeLine: routeLine,
//         bbox: bbox,
//         polygon: polygon,
//         clear: clear,
//         obstacles: totalObstaculoRota,
//       };

//       idRota += 1

//       if (clear === true) {

//         map.setPaintProperty("theRoute", "line-color", "#74c476");
//         map.setLayoutProperty("theBox", "visibility", "none");
//         counter = 0;
//       } else {
//         counter = counter + 1;

//         polygon = turf.transformScale(polygon, counter * 0.01);
//         bbox = turf.bbox(polygon);
//         collision = "is bad.";
//         detail = `takes ${(route.duration / 60).toFixed(0)} minutes and hits ${
//           turf.lineIntersect(obstacle, routeLine).features.length / 2
//         } obstacles`;

//         map.setPaintProperty("theRoute", "line-color", "#de2d26");

//         const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
//         directions.setWaypoint(
//           0,
//           randomWaypoint["features"][0].geometry.coordinates
//         );

//       }

//       addCard(counter, reports, clear, detail);
//     }
//   }
// });
