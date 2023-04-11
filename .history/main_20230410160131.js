mapboxgl.accessToken =
  "pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ";
const map = new mapboxgl.Map({
  container: "map", // Specify the container ID
  style: "mapbox://styles/mapbox/dark-v11", // Specify which map style to use
  center: [-46.63330,-23.55077], // Specify the starting position [lng, lat]
  zoom: 12, // Specify the starting zoom

});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/driving",
  alternatives: false,
  geometries: "geojson",
  controls: { instructions: true },
  flyTo: false,
  language: "pt-BR",
  geocoder: {
    language: "pt-BR",
  },
  steps: true,
});

map.scrollZoom.enable();
map.addControl(directions, "top-right");


let obstacle;

fetch("./seu_arquivo_modificado.json")
  .then((response) => response.json())
  .then((data) => {
    clearances = data;
    obstacle = turf.buffer(clearances, 0.035, { units: "kilometers" });
  })
  .catch((error) => console.error(error));

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
      "fill-opacity": 0.2,
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
      "fill-opacity": 0.3,
      "fill-outline-color": "#FFC300",
    },
  });
});

let counter = 0;
const maxAttempts = 10;
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
      : `${emoji} Testanto rota ${id} ${collision}`;

  const details = document.createElement("div");
  details.className = "card-details";
  details.innerHTML = `Esta ${detail}.`;

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
  emoji = "✅";
  heading.innerHTML = `${emoji} Fim da busca.`;

  // Add details to the individual report
  const details = document.createElement("div");
  details.className = "card-details";
  details.innerHTML = `Nenhuma rota sem assaltos foi encontrada no trajeto, em ${counter} tentativas. 
    <br><br> A melhor rota foi a que teve ${minimoAssaltosRota} registros, ela registrou ⬇ ${percentualMinObstacles.toFixed(
    2
  )}% assaltos a menos em relação à média das rotas verificadas.`;

  card.appendChild(heading);
  card.appendChild(details);
  element.insertBefore(card, element.firstChild);
}

directions.on("clear", () => {
  console.log("Limpando rotas...")
  // console.log(document.getElementById('textbox_id').value)
  map.setLayoutProperty("theRoute", "visibility", "none");
  map.setLayoutProperty("theBox", "visibility", "none");

  counter = 0;
  reports.innerHTML = "";
  
});


let listaRotasSelecionada = []

function teste(listaRotasSelecionada){
  document.querySelectorAll('.mapboxgl-ctrl-geocoder > input[type="text"]')
  .forEach((input) => {
    console.log(input.value)
    listaRotasSelecionada.push(input.value)
    })
  return listaRotasSelecionada
}


let percentualMinObstacles;
let minimoAssaltosRota;
let idRota = 1;
let routesInfo = {};
let totalObstaculoRotas = [];

let routeLayerId = null;

directions.on("route", (event) => {
  if (counter >= maxAttempts) {
    noRoutes(reports);
  } else {
    for (const route of event.route) {

      // const routeId = JSON.stringify(route.geometry.coordinates);
      // if (testedRoutes.has(routeId)) {
      //   console.log(`Route ${routeId} has already been tested`);
      //   continue;
      // }

      // testedRoutes.add(routeId);

      const routeLine = polyline.toGeoJSON(route.geometry);

      bbox = turf.bbox(routeLine);
      polygon = turf.bboxPolygon(bbox);
      map.getSource("theBox").setData(polygon);
      const clear = turf.booleanDisjoint(obstacle, routeLine);

      totalObstaculoRota =
        turf.lineIntersect(obstacle, routeLine).features.length / 2;


        const routeInstructions = []; // new variable to store street-by-street instructions

        for (const leg of route.legs) {
          for (const step of leg.steps) {
            routeInstructions.push(step.maneuver.instruction);
          }
        }

      routesInfo[idRota] = {
        routeLine: routeLine,
        bbox: bbox,
        polygon: polygon,
        clear: clear,
        obstacles: totalObstaculoRota,
        instructions: routeInstructions
      };

      idRota += 1;
      if (clear === true) {
        counter = 0;
      } else {
        counter = counter + 1;

        polygon = turf.transformScale(polygon, counter * 0.01);
        bbox = turf.bbox(polygon);
        collision = "<--";
        detail = `rota leva ${(route.duration / 60).toFixed(
          0
        )} minutos e teve ${
          turf.lineIntersect(obstacle, routeLine).features.length / 2
        } registros de assalto`;

        const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
        directions.setWaypoint(
          0,
          randomWaypoint["features"][0].geometry.coordinates
        );
      }

      addCard(counter, reports, clear, detail);
    }

    if (counter >= maxAttempts) {
      let totalObstacles = 0;
      let numRoutes = 0;

      let minObstacles = Infinity;
      let bestRoute = null;

      let maxObstacles = -Infinity;
      let worstRoute = null;

      for (const id in routesInfo) {
        const { obstacles, routeLine } = routesInfo[id];

        totalObstacles += obstacles;
        numRoutes++;

        if (obstacles < minObstacles) {
          minObstacles = obstacles;
          minimoAssaltosRota = minObstacles;
          bestRoute = routeLine;
        }
        if (obstacles > maxObstacles) {
          maxObstacles = obstacles;
          worstRoute = routeLine;
        }
      }
      const averageObstacles = totalObstacles / numRoutes;

      percentualMinObstacles =
        ((averageObstacles - minObstacles) / averageObstacles) * 100;
      console.log(
        `A rota com menos obstáculos tem ${percentualMinObstacles.toFixed(
          2
        )}% a menos de obstáculos em relação à média.`
      );

      if (minObstacles === maxObstacles) {
        // Rotas com o mesmo número de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#9370db");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);
        routeLayerId = "theRoute"; // assign ID to the route layer
      } else {
        // Rotas com diferentes números de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#74c476");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);

        removeSelectedRoute(directions)
      
        map.addLayer({
          id: "worstRoute",
          type: "line",
          source: {
            type: "geojson",
            data: worstRoute,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#de2d26",
            "line-width": 4,
          },
        });
        routeLayerId = "worstRoute"; // assign ID to the route layer
      }
      
    }
  }
  

});




function removeSelectedRoute(directions) {
  directions.on('routeSelected', function(event) {
    var selectedRouteIndex = event.routeIndex;
    directions.removeRoutes(selectedRouteIndex);
  });
}



function removeRoutes(map) {

  if (map.getSource("theRoute")) {
    map.removeLayer("theRoute");
    map.removeSource("theRoute");
  }
  if (map.getSource("theBox")) {
    map.removeLayer("theBox");
    map.removeSource("theBox");
  }
  if (map.getSource("clearances")) {
    map.removeLayer("clearances");
    map.removeSource("clearances");
  }
  if (map.getSource("route")) {
    map.removeLayer("route");
    map.removeSource("route");
  }
  if (map.getSource("load")) {
    map.removeLayer("load");
    map.removeSource("load");
  }

  if (map.getSource("worstRoute")) {
    map.removeLayer("worstRoute");
    map.removeSource("worstRoute");
  }
  
  if (map.getSource("routeLine")) {
    map.removeLayer("routeLine");
    map.removeSource("routeLine");
  }
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

// for (const route of event.route) {

//   map.setLayoutProperty("theRoute", "visibility", "visible");
//   map.setPaintProperty("theRoute", "line-color", "#a037bf");
//   map.setLayoutProperty("theBox", "visibility", "visible");

//   const routeLine = polyline.toGeoJSON(route.geometry);

//   bbox = turf.bbox(routeLine);
//   polygon = turf.bboxPolygon(bbox);

//   map.getSource("theBox").setData(polygon);
//   const clear = turf.booleanDisjoint(obstacle, routeLine);

//   totalObstaculoRota = turf.lineIntersect(obstacle, routeLine).features.length / 2;

//   routesInfo[idRota] = {
//     routeLine: routeLine,
//     bbox: bbox,
//     polygon: polygon,
//     clear: clear,
//     obstacles: totalObstaculoRota,
//   };

//   idRota += 1;

//   if (clear === true) {

//     map.setPaintProperty("theRoute", "line-color", "#74c476");
//     map.setLayoutProperty("theBox", "visibility", "none");
//     counter = 0;

//   } else {
//     counter = counter + 1;
//     polygon = turf.transformScale(polygon, counter * 0.01);
//     bbox = turf.bbox(polygon);
//     detail = `takes ${(route.duration / 60).toFixed(0)} minutes and hits ${
//       turf.lineIntersect(obstacle, routeLine).features.length / 2
//     } obstacles`;

//     map.setPaintProperty("theRoute", "line-color", "#de2d26");

//     const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
//     directions.setWaypoint(
//       0,
//       randomWaypoint["features"][0].geometry.coordinates
//     );

//     if (counter >= maxAttempts) {

//       let minObstacles = Infinity;
//       let bestRoute = null;

//       for (const id in routesInfo) {
//         const { obstacles, routeLine } = routesInfo[id];
//         if (obstacles < minObstacles) {
//           minObstacles = obstacles;
//           bestRoute = routeLine;
//         }
//       }
//       if (bestRoute !== null) {
//         map.setPaintProperty("theRoute", "line-color", "#d1a51f");
//         map.setLayoutProperty("theBox", "visibility", "none");
//         map.getSource("theRoute").setData(bestRoute);

//       }

//   }
//   }
//   addCard(counter, reports, clear, detail);

// }

// directions.on("route", (event) => {

//   if (counter >= maxAttempts) {
//     noRoutes(reports);
//   } else {
//     // let minObstacles = Infinity;
//     let bestRoute;

//     for (const route of event.route) {
//       console.log(`teste id rota: ${idRota}`);

//       const routeLine = polyline.toGeoJSON(route.geometry);

//       bbox = turf.bbox(routeLine);
//       polygon = turf.bboxPolygon(bbox);

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

//       idRota += 1;

//       if (clear === true) {
//         map.setPaintProperty("theRoute", "line-color", "#74c476");
//         map.setLayoutProperty("theBox", "visibility", "none");
//         counter = 0;

//         if (counter >= maxAttempts) {
//           // exibe a rota com menos obstáculos
//           map.getSource("theRoute").setData(bestRoute);

//         }
//       } else {
//         counter = counter + 1;

//         polygon = turf.transformScale(polygon, counter * 0.01);
//         bbox = turf.bbox(polygon);

//         map.setPaintProperty("theRoute", "line-color", "#de2d26");

//         const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
//         directions.setWaypoint(
//           0,
//           randomWaypoint["features"][0].geometry.coordinates
//         );

//         if (counter >= maxAttempts) {

//           for (const id in routesInfo) {
//             const { obstacles, routeLine } = routesInfo[id];

//             totalObstacles += obstacles;
//             numRoutes++;

//             if (obstacles < minObstacles) {
//               minObstacles = obstacles;
//               minimoAssaltosRota = minObstacles;
//               bestRoute = routeLine;
//             }

//             if (obstacles > maxObstacles) {
//               maxObstacles = obstacles;
//             }
//           }

//           if (bestRoute !== null) {
//             map.setPaintProperty("theRoute", "line-color", "#d1a51f");
//             map.setLayoutProperty("theBox", "visibility", "none");
//             map.getSource("theRoute").setData(bestRoute);
//                       }
//         }
//       }

//       addCard(counter, reports, clear, detail);

//     }
//   }
// });





directions.on("route", (event) => {
  if (counter >= maxAttempts) {
    noRoutes(reports);
  } else {
    for (const route of event.route) {

      const routeLine = polyline.toGeoJSON(route.geometry);

      bbox = turf.bbox(routeLine);
      polygon = turf.bboxPolygon(bbox);
      map.getSource("theBox").setData(polygon);
      const clear = turf.booleanDisjoint(obstacle, routeLine);

      totalObstaculoRota =
        turf.lineIntersect(obstacle, routeLine).features.length / 2;
      routesInfo[idRota] = {
        routeLine: routeLine,
        bbox: bbox,
        polygon: polygon,
        clear: clear,
        obstacles: totalObstaculoRota,
      };

      idRota += 1;
      if (clear === true) {
        counter = 0;
      } else {
        counter = counter + 1;

        polygon = turf.transformScale(polygon, counter * 0.01);
        bbox = turf.bbox(polygon);
        collision = "<--";

        const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
        directions.setWaypoint(
          0,
          randomWaypoint["features"][0].geometry.coordinates
        );
      }

      addCard(counter, reports, clear, detail);
    }

    if (counter >= maxAttempts) {
      let totalObstacles = 0;
      let numRoutes = 0;

      let minObstacles = Infinity;
      let bestRoute = null;

      let maxObstacles = -Infinity;
      let worstRoute = null;

      for (const id in routesInfo) {
        const { obstacles, routeLine } = routesInfo[id];

        totalObstacles += obstacles;
        numRoutes++;

        if (obstacles < minObstacles) {
          minObstacles = obstacles;
          minimoAssaltosRota = minObstacles;
          bestRoute = routeLine;
        }
        if (obstacles > maxObstacles) {
          maxObstacles = obstacles;
          worstRoute = routeLine;
        }
      }
      const averageObstacles = totalObstacles / numRoutes;

      percentualMinObstacles =
        ((averageObstacles - minObstacles) / averageObstacles) * 100;
   
    

      if (minObstacles === maxObstacles) {
        // Rotas com o mesmo número de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#9370db");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);
        routeLayerId = "theRoute"; // assign ID to the route layer
      } else {
        // Rotas com diferentes números de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#74c476");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);


      }
      
    }
  }
  

});