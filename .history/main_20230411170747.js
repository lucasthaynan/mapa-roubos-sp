mapboxgl.accessToken =
  "pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ";
const map = new mapboxgl.Map({
  container: "map", // Specify the container ID
  style: "mapbox://styles/mapbox/dark-v11", // Specify which map style to use
  center: [-46.6333, -23.55077], // Specify the starting position [lng, lat]
  zoom: 12, // Specify the starting zoom
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/driving",
  alternatives: false,
  geometries: "geojson",
  controls: { instructions: false },
  flyTo: false,
  language: "pt-BR",
  placeholderOrigin: "Origem",
  placeholderDestination: "Destino",
  languagePlaceholderOrigin: "Origem",
  languagePlaceholderDestination: "Destino",
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
  console.log("Obstaculos carregados!")
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
const maxAttempts = 5;


directions.on("clear", () => {
  console.log("Limpando rotas...");
  map.setLayoutProperty("theRoute", "visibility", "none");
  map.setLayoutProperty("theBox", "visibility", "none");

  // counter = 0;
  // reports.innerHTML = "";
});



// function clearRoute() {
//   map.setLayoutProperty("theRoute", "visibility", "invisible");
//   map.setLayoutProperty("theBox", "visibility", "none");

//   counter = 0;
//   reports.innerHTML = "";
// }

function mudarCor(map){
  map.setPaintProperty("theRoute", "line-color", "rgba(255, 255, 0, 0.5)");

}



function btnLimparRotaAzul() {

  // remove a última rota (em azul) testada no mapa
  const buttons = document.querySelectorAll('button.geocoder-icon.geocoder-icon-close.active');
  buttons.forEach(button => {
    button.click();
  });

  let rotasTracadas = Object.values(routesInfo)
  console.log(rotasTracadas)

  // let bboxCoords, bboxSouthWest, bboxNorthEast;

//   const routes = routesInfo;

//   for (let i = 0; i < routes.length; i++) {
//     const route = routes[i];
//     const { name, bbox } = route;

//     if (name.endsWith("bestRoute")) {
//       bboxCoords = bbox;
//       bboxSouthWest = { lng: bbox[0], lat: bbox[1] };
//       bboxNorthEast = { lng: bbox[2], lat: bbox[3] };
//       break;
//     }
//   }

// console.log("bboxCoords:", bboxCoords);
// console.log("bboxSouthWest:", bboxSouthWest);
// console.log("bboxNorthEast:", bboxNorthEast);

  // adiciona os novos pins
  // var customIcon = document.createElement('div');
  // customIcon.className = 'custom-marker';
  // customIcon.innerHTML = '<span>A</span>';

  // var marker = new mapboxgl.Marker(customIcon)
  //     .setLngLat([-46.6333, -23.55077])
  //     .addTo(map);


}

// Chamando a função clickAllButtons em um evento de clique de um botão
document.getElementById("click-all-buttons").addEventListener("click", btnLimparRotaAzul);


// let listaRotasSelecionada = [];

// function teste(listaRotasSelecionada) {
//   document
//     .querySelectorAll('.mapboxgl-ctrl-geocoder > input[type="text"]')
//     .forEach((input) => {
//       console.log(input.value);
//       listaRotasSelecionada.push(input.value);
//     });
//   return listaRotasSelecionada;
// }

let percentualMinObstacles;
let minimoAssaltosRota;
let idRota = 1;
let routesInfo = {};
let totalObstaculoRotas = [];

let routeLayerId = null;

let bestRouteId = null;
let worstRouteId = null;
let minObstacles = Infinity;
let maxObstacles = -Infinity;

directions.on("route", (event) => {

  console.log("Rota")
  btnLimparRotaAzul()
  
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
        name: `total_${totalObstaculoRota}`,
        routeLine: routeLine,
        bbox: bbox,
        polygon: polygon,
        clear: clear,
        obstacles: totalObstaculoRota,
        instructions: routeInstructions,
        durationSec: route.duration, // add duration to routesInfo
        durationMin: Math.ceil(route.duration / 60) // convert duration to minutes


        // name: route.summary // add the name of the route
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
        directions.setWaypoint(0, randomWaypoint["features"][0].geometry.coordinates
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

          bestRouteId = Object.keys(routesInfo).reduce((a, b) => routesInfo[a].obstacles < routesInfo[b].obstacles ? a : b);
        routesInfo[bestRouteId].name = `total_${minObstacles}_bestRoute`;

        map.getSource("theRoute").setData(routesInfo[bestRouteId].routeLine);
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
        // routesInfo[idRota-1].name = `total_${minObstacles}_bestRoute`;
        routeLayerId = "theRoute"; // assign ID to the route layer


        bestRouteId = Object.keys(routesInfo).reduce((a, b) => routesInfo[a].obstacles < routesInfo[b].obstacles ? a : b);
        routesInfo[bestRouteId].name = `total_${minObstacles}_bestRoute`;

        map.getSource("theRoute").setData(routesInfo[bestRouteId].routeLine);
        routeLayerId = "theRoute";

      } else {

        const bestRoute = routesInfo[bestRouteId].routeLine;
        const startCoord = bestRoute.coordinates[0];
        const endCoord = bestRoute.coordinates[bestRoute.coordinates.length - 1];
        const waypoints = [startCoord, endCoord];

        addWaypointsToMap(waypoints);
        // Rotas com diferentes números de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#74c476");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);
        // routesInfo[idRota-1].name = `total_${maxObstacles}_worstRoute`;
        // routesInfo[idRota].name = "theBestRoute"

        map.addLayer({
          id: "bestRoute",
          type: "line",
          source: {
            type: "geojson",
            data: bestRoute,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#74c476",
            "line-width": 4,
          },
        });

        

        for (const id in routesInfo) {
          const { obstacles } = routesInfo[id];
      
          if (obstacles < minObstacles) {
            minObstacles = obstacles;
            bestRouteId = id;
          }
      
          if (obstacles > maxObstacles) {
            maxObstacles = obstacles;
            worstRouteId = id;
          }
        }
      
        for (const id in routesInfo) {
          if (id === bestRouteId) {
            routesInfo[id].name = `total_${routesInfo[id].obstacles}_bestRoute`;
          } else {
            routesInfo[id].name = `total_${routesInfo[id].obstacles}`;
          }
        }

        worstRouteId = Object.keys(routesInfo).reduce((a, b) => routesInfo[a].obstacles > routesInfo[b].obstacles ? a : b);
        routesInfo[worstRouteId].name = `total_${maxObstacles}_worstRoute`;

        // map.getSource("theRoute").setData(routesInfo[worstRouteId].routeLine);


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
        map.addLayer({
          id: "worstRoute2",
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
            "line-opacity": 0.3,
            "line-width": 13,
          },
        });

        routeLayerId = "worstRoute"; // assign ID to the route layer
      }

      console.log(routesInfo)
      
    }
  }

});


function addWaypointsToMap(coords) {
  map.addLayer({
    id: "start-point",
    type: "symbol",
    source: {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords[0],
        },
      },
    },
    layout: {
      "icon-image": "marker-15",
      "icon-allow-overlap": true,
      "icon-size": 1,
    },
  });
  
  map.addLayer({
    id: "end-point",
    type: "symbol",
    source: {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords[1],
        },
      },
    },
    layout: {
      "icon-image": "marker-15",
      "icon-allow-overlap": true,
      "icon-size": 1,
    },
  });
}

// function removeSelectedRoute(directions) {
//   directions.on("routeSelected", function (event) {
//     var selectedRouteIndex = event.routeIndex;
//     directions.removeRoutes(selectedRouteIndex);
//   });
// }

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
  // let input = document.querySelectorAll(
  //   '.mapboxgl-ctrl-geocoder > input[type="text"]'
  // );
  // input.forEach((input) => {
  //   if (input.placeholder == "Choose a starting place") {
  //     input.placeholder = "Endereço de partida";
  //   } else {
  //     input.placeholder = "Endereço de destino";
  //   }
  // });

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
 
// updateSidebar(routesInfo[1], map)


function updateSidebar(routeInfo) {
  const sidebar = document.getElementById("sidebar2");
  sidebar.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `Rota ${routeInfo.name}`;
  sidebar.appendChild(title);

  const subtitle = document.createElement("h3");
  subtitle.textContent = `Assaltos: ${routeInfo.obstacles}`;
  sidebar.appendChild(subtitle);

  const instructionsTitle = document.createElement("h4");
  instructionsTitle.textContent = "Instruções:";
  sidebar.appendChild(instructionsTitle);

  const instructionsList = document.createElement("ul");
  for (const instruction of routeInfo.instructions) {
    const item = document.createElement("li");
    item.textContent = instruction;
    instructionsList.appendChild(item);
  }
  sidebar.appendChild(instructionsList);
}


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




// directions.on("route", (event) => {

//   console.log("Rota")
//   if (counter >= maxAttempts) {
//     noRoutes(reports);
//   } else {
//     for (const route of event.route) {


//       const routeLine = polyline.toGeoJSON(route.geometry);

//       bbox = turf.bbox(routeLine);
//       polygon = turf.bboxPolygon(bbox);
//       map.getSource("theBox").setData(polygon);
//       const clear = turf.booleanDisjoint(obstacle, routeLine);

//       totalObstaculoRota =
//         turf.lineIntersect(obstacle, routeLine).features.length / 2;

//       const routeInstructions = []; // new variable to store street-by-street instructions

//       for (const leg of route.legs) {
//         for (const step of leg.steps) {
//           routeInstructions.push(step.maneuver.instruction);
//         }
//       }

//       routesInfo[idRota] = {
//         name: `total_${totalObstaculoRota}`,
//         routeLine: routeLine,
//         bbox: bbox,
//         polygon: polygon,
//         clear: clear,
//         obstacles: totalObstaculoRota,
//         instructions: routeInstructions,
//         durationSec: route.duration, // add duration to routesInfo
//         durationMin: Math.ceil(route.duration / 60) // convert duration to minutes

//       };

//       idRota += 1;
//       if (clear === true) {
//         counter = 0;
//       } else {
//         counter = counter + 1;

//         polygon = turf.transformScale(polygon, counter * 0.01);
//         bbox = turf.bbox(polygon);

//         const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
//         directions.setWaypoint(0, randomWaypoint["features"][0].geometry.coordinates
//         );
//       }

//       addCard(counter, reports, clear, detail);
//     }

//     if (counter >= maxAttempts) {
//       let totalObstacles = 0;
//       let numRoutes = 0;

//       let minObstacles = Infinity;
//       let bestRoute = null;

//       let maxObstacles = -Infinity;
//       let worstRoute = null;

//       for (const id in routesInfo) {
//         const { obstacles, routeLine } = routesInfo[id];

//         totalObstacles += obstacles;
//         numRoutes++;

//         if (obstacles < minObstacles) {
//           minObstacles = obstacles;
//           minimoAssaltosRota = minObstacles;
//           bestRoute = routeLine;

//           bestRouteId = Object.keys(routesInfo).reduce((a, b) => routesInfo[a].obstacles < routesInfo[b].obstacles ? a : b);
//         routesInfo[bestRouteId].name = `total_${minObstacles}_bestRoute`;

//         map.getSource("theRoute").setData(routesInfo[bestRouteId].routeLine);
//         }
//         if (obstacles > maxObstacles) {
//           maxObstacles = obstacles;
//           worstRoute = routeLine;
//         }
//       }
//       const averageObstacles = totalObstacles / numRoutes;

//       percentualMinObstacles =
//         ((averageObstacles - minObstacles) / averageObstacles) * 100;


//       if (minObstacles === maxObstacles) {
//         map.setPaintProperty("theRoute", "line-color", "#9370db");
//         map.setLayoutProperty("theBox", "visibility", "none");
//         map.getSource("theRoute").setData(bestRoute);
//         routeLayerId = "theRoute"; // assign ID to the route layer

//         bestRouteId = Object.keys(routesInfo).reduce((a, b) => routesInfo[a].obstacles < routesInfo[b].obstacles ? a : b);
//         routesInfo[bestRouteId].name = `total_${minObstacles}_bestRoute`;

//         map.getSource("theRoute").setData(routesInfo[bestRouteId].routeLine);
//         routeLayerId = "theRoute";

//       } else {
//         map.setPaintProperty("theRoute", "line-color", "#74c476");
//         map.setLayoutProperty("theBox", "visibility", "none");
//         map.getSource("theRoute").setData(bestRoute);


//         map.addLayer({
//           id: "bestRoute",
//           type: "line",
//           source: {
//             type: "geojson",
//             data: bestRoute,
//           },
//           layout: {
//             "line-join": "round",
//             "line-cap": "round",
//           },
//           paint: {
//             "line-color": "#74c476",
//             "line-width": 4,
//           },
//         });

        

//         for (const id in routesInfo) {
//           const { obstacles } = routesInfo[id];
      
//           if (obstacles < minObstacles) {
//             minObstacles = obstacles;
//             bestRouteId = id;
//           }
      
//           if (obstacles > maxObstacles) {
//             maxObstacles = obstacles;
//             worstRouteId = id;
//           }
//         }
      
//         for (const id in routesInfo) {
//           if (id === bestRouteId) {
//             routesInfo[id].name = `total_${routesInfo[id].obstacles}_bestRoute`;
//           } else {
//             routesInfo[id].name = `total_${routesInfo[id].obstacles}`;
//           }
//         }

//         worstRouteId = Object.keys(routesInfo).reduce((a, b) => routesInfo[a].obstacles > routesInfo[b].obstacles ? a : b);
//         routesInfo[worstRouteId].name = `total_${maxObstacles}_worstRoute`;

      
//     }
//   }

// });