
// Função para desabilitar a entrada de texto no Geocoder

function bloquearEntradaOrigemDestino(map) {
  var inputs = document.querySelectorAll(".mapboxgl-ctrl-geocoder input");
  inputs.forEach(function (input) {
    input.disabled = true;
  });
}

mapboxgl.accessToken =
  "pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ";

// criando mapa com mapbox
const map = new mapboxgl.Map({
  container: "map", // Specify the container ID
  style: "mapbox://styles/mapbox/dark-v11", // Specify which map style to use
  center: [-46.62889, -23.55594], // Specify the starting position [lng, lat]
  zoom: 10.8, // Specify the starting zoom
  
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// chamando metodo para criar as direcoes no mapa com mapbox gl
let directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: "metric",
  profile: "mapbox/driving",
  alternatives: false,
  geometries: "geojson",
  controls: { instructions: false },
  flyTo: true,
  interactive: true,
  language: "pt-BR",
  placeholderOrigin: "ORIGEM",
  placeholderDestination: "DESTINO",
  languagePlaceholderOrigin: "ORIGEM",
  languagePlaceholderDestination: "DESTINO",
  geocoder: {
    language: "pt-BR",
  },
  steps: true,
  
});


  

// function desativarInterativideMapa() {
//   let canvasContainer = document.querySelector('.mapboxgl-canvas-container');
//   canvasContainer.style.pointerEvents = 'none';
//   canvasContainer.style.cursor = 'default';
// }

// Adiciona um listener para o evento `result` do MapboxDirections

map.scrollZoom.enable();
map.addControl(directions, "top-left");

let obstacle;

// carregando os dados de assaltos (obstáculos)
fetch("./seu_arquivo_modificado.json")
  .then((response) => response.json())
  .then((data) => {
    clearances = data;
    obstacle = turf.buffer(clearances, 0.035, { units: "kilometers" });
  })
  .catch((error) => console.error(error));

// carregando os dados de assaltos (obstáculos)
let limitesSaoPaulo 
fetch("./malha_sao_paulo_3550308.geojson")
  .then((response) => response.json())
  .then((data) => {
    limitesSaoPaulo = data;
  })
  .catch((error) => console.error(error));


let bbox = [0, 0, 0, 0];
let polygon = turf.bboxPolygon(bbox);

let origem = null;
let destino = null;

function coordenadasIguais(coord1, coord2) {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

directions.on("origin", (origin) => {
  const novaOrigem = origin.feature.geometry.coordinates;
  if (origem === null || !coordenadasIguais(novaOrigem, origem)) {
    origem = novaOrigem;
    console.log("Origem atualizada:", origem);
  }
});

directions.on("destination", (destination) => {
  const novoDestino = destination.feature.geometry.coordinates;
  if (destino === null || !coordenadasIguais(novoDestino, destino)) {
    destino = novoDestino;
    console.log("Destino atualizado:", destino);
  }
});

directions.on("loading", () => {
  console.log("Rota alterada --> loading");
});

directions.on("profile", () => {
  console.log("Rota alterada --> profile");
});

// Adicione um event listener para quando as direções forem carregadas

map.on("load", () => {


  // desabilitando o scroll zoom do mapa
  // map.scrollZoom.disable();

  map.addLayer({
    'id': 'sp-boundary',
    'type': 'line',
    'source': {
      'type': 'geojson',
      'data': limitesSaoPaulo,
    },
    'paint': {
      'line-color': '#000000',
      'line-width': 2.5,
      "line-opacity": 0.6,

    }
  });



  console.log("Obstaculos carregados!");
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

  // if (mapaReiniciado == false) {
  //   addAreasMaiorVolume()
  // }

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
      "line-opacity": 0,
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

//  ADICIONANDO CIRCULOS
 
function addAreasMaiorVolume() {
  map.addSource("earthquakes", {
    type: "geojson",
    data: clearances,
    cluster: true,
    clusterMaxZoom: 20,
    clusterRadius: 200,
  });
  
  

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "earthquakes",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#f03b20",
        10,
        "#f03b20",
        750,
        "#f03b20",
      ],
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["sqrt", ["get", "point_count"]],
        0,
        10,
        1000,
        30,
      ],
  
      "circle-opacity": 0.2,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#f03b20",
      "circle-stroke-opacity": 1,
      "circle-pitch-scale": "map",
    },
  });
  
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "earthquakes",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });

  // Modificar tamanho do círculo para criar efeito de pulsação
let t = 0;
setInterval(() => {
  t++;
  const scale = 1 + Math.abs(Math.sin(t / 10)) * 0.3; // calcula o tamanho do círculo
  map.setPaintProperty("clusters", "circle-radius", [
    "step",
    ["get", "point_count"],
    50 * scale,
    299,
    60 * scale,
    300,
    100 * scale,
  ]);
}, 50);
}




let counter = 0;
const maxAttempts = 3;

directions.on("clear", () => {
  console.log("Limpando rotas...");
  map.setLayoutProperty("theRoute", "visibility", "none");
  
  // resetMap()
  map.setLayoutProperty("theBox", "visibility", "none");

  // removeRoutes(map);
  counter = 0;
  // reports.innerHTML = "";
});



// function btnLimparRotaAzul() {
//   // remove a última rota (em azul) testada no mapa
//   const buttons = document.querySelectorAll(
//     "button.geocoder-icon.geocoder-icon-close.active"
//   );
//   buttons.forEach((button) => {
//     button.click();
//   });

//   // adiciona os novos pins
//   var customIconA = document.createElement("div");
//   customIconA.className = "custom-marker-a";
//   customIconA.innerHTML = "<span>A</span>";

//   var marker = new mapboxgl.Marker(customIconA)
//     .setLngLat([origem[1][0], origem[1][1]])
//     .addTo(map);

//   var customIconB = document.createElement("div");
//   customIconB.className = "custom-marker-b";
//   customIconB.innerHTML = "<span>B</span>";

//   var marker = new mapboxgl.Marker(customIconB)
//     .setLngLat([destino[1][0], destino[1][1]])
//     .addTo(map);
// }

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let percentualMinObstacles = 0
let minimoAssaltosRota = 0
let percentualMaxObstacles = 0
let idRota = 1;
let routesInfo = {};
let totalObstaculoRotas = [];

let routeLayerId = null;

let bestRouteId = null;
let worstRouteId = null;
let minObstacles = Infinity;
let maxObstacles = -Infinity;
let rotasIguais = false

directions.on("route", async (event) => {

  desabilitaBtnDirecoes()
  // map.setLayoutProperty("directions-route-line-casing", "visibility", "visible");
  // map.setLayoutProperty("directions-route-line", "visibility", "visible");

  map.setLayoutProperty('theRoute', 'visibility', 'visible');
  map.setLayoutProperty('theBox', 'visibility', 'visible');


  if (counter >= maxAttempts) {
    map.setLayoutProperty("theBox", "visibility", "none");

    // chama a função que mostra os dados sobre as rotas geradas
    gerarResultado(reports, rotasIguais); // rotasIguais é true ou false

    // chama a função que bloqueia as entradas de origem e destino
    bloquearEntradaOrigemDestino(map);

    // ocultando a barra superior de direcoes do mapbox
    ocultarBarraDirecoes()

    // inserindo instrucoes
    // inserindoInstrucoesRotas(routesInfo)

    

    // addAreasMaiorVolume()

  } else {
    for (const route of event.route) {
      const routeLine = polyline.toGeoJSON(route.geometry);

      bbox = turf.bbox(routeLine);
      console.log(counter);


      polygon = turf.bboxPolygon(bbox);
      map.getSource("theBox").setData(polygon);
      const clear = turf.booleanDisjoint(obstacle, routeLine);


      if (counter == 0) {
        // Cria um objeto de bounds do Mapbox GL a partir da bounding box
        const bounds = new mapboxgl.LngLatBounds(
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]]
        );

        // Aproxima o zoom do mapa para mostrar todo o polygon e centraliza na tela
        if (window.innerWidth < 500) {
          map.fitBounds(bounds, {
            padding: {
              top: 170,
              right: 50,
              bottom: 260,
              left: 50,
            },
            maxZoom: map.getMaxZoom(),
            duration: 1500,
          });
          // delay para esperar dar o zoom que aproxima do trajeto
          await delay(1500);
        } else {
          map.fitBounds(bounds, {
            padding: {
              top: 160,
              right: 240,
              bottom: 220,
              left: 240,
            },
            maxZoom: map.getMaxZoom(),
            duration: 1500,
          });
          // delay para esperar dar o zoom que aproxima do trajeto
          await delay(1500);
        }
      }

      totalObstaculoRota =
        turf.lineIntersect(obstacle, routeLine).features.length / 2;

      const routeInstructions = []; // new variable to store street-by-street instructions

      for (const leg of route.legs) {
        for (const step of leg.steps) {

          // salvando dados de ruas/intrucoes das rotas
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
        durationMin: Math.ceil(route.duration / 60), // convert duration to minutes
        distanceKm: turf.length(routeLine, { units: "kilometers" }), // add distance in kilometers to routesInfo
      };

      idRota += 1;
      
        counter = counter + 1;

        polygon = turf.transformScale(polygon, counter * 0.01);
        bbox = turf.bbox(polygon);
        collision = "<--";
        detail = `rota leva ${(route.duration / 60).toFixed(
          0
        )} minutos e teve ${
          turf.lineIntersect(obstacle, routeLine).features.length / 2
        } registros de assalto`;

        

        let randomWaypoint = turf.randomPoint(1, { bbox: bbox });
        directions.setWaypoint(
          0,
          randomWaypoint["features"][0].geometry.coordinates
        );
      

      addCard(counter, reports, clear, detail);

      containerLoadingOn();
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

          bestRouteId = Object.keys(routesInfo).reduce((a, b) =>
            routesInfo[a].obstacles < routesInfo[b].obstacles ? a : b
          );
          routesInfo[bestRouteId].name = `total_${minObstacles}_bestRoute`;

          map.getSource("theRoute").setData(routesInfo[bestRouteId].routeLine);
        }
        if (obstacles > maxObstacles) {
          maxObstacles = obstacles;

          worstRoute = routeLine;
        }
      }
      const averageObstacles = totalObstacles / numRoutes;

      percentualMaxObstacles =
        ((maxObstacles - minObstacles) / averageObstacles) * 100;
      percentualMinObstacles =
        ((averageObstacles - minObstacles) / averageObstacles) * 100;

      console.log(
        `A rota com menos obstáculos tem ${percentualMinObstacles.toFixed(
          2
        )}% a menos de obstáculos em relação à média.`
      );

      // caso as rotas tenham o mesmo número de assaltos(obstaculos)
      if (minObstacles === maxObstacles) {
        rotasIguais = true
        console.log("Rotas com o mesmo numero de assaltos")
        // Rotas com o mesmo número de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#9370db");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);
        // routesInfo[idRota-1].name = `total_${minObstacles}_bestRoute`;
        routeLayerId = "theRoute"; // assign ID to the route layer

        map.addLayer({
          id: "bestRouteIgual",
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
            "line-color": "#FFFFFF",
            "line-width": 4,
          },
        });

        map.addLayer({
          id: "bestRouteIgual2",
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
            "line-color": "#FFFFFF",
            "line-opacity": 0.3,
            "line-width": 13,
          },
        });

        bestRouteId = Object.keys(routesInfo).reduce((a, b) =>
          routesInfo[a].obstacles < routesInfo[b].obstacles ? a : b
        );
        routesInfo[bestRouteId].name = `total_${minObstacles}_bestRoute`;

        map.getSource("theRoute").setData(routesInfo[bestRouteId].routeLine);
        routeLayerId = "theRoute";
      } else {
        let bestRoute = routesInfo[bestRouteId].routeLine;
        const startCoord = bestRoute.coordinates[0];
        const endCoord =
          bestRoute.coordinates[bestRoute.coordinates.length - 1];
        const waypoints = [startCoord, endCoord];

        // addWaypointsToMap(waypoints);
        // Rotas com diferentes números de obstáculos
        // map.setPaintProperty("theRoute", "line-color", "#74c476");
        map.setLayoutProperty("theBox", "visibility", "none");
        map.getSource("theRoute").setData(bestRoute);

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

        worstRouteId = Object.keys(routesInfo).reduce((a, b) =>
          routesInfo[a].obstacles > routesInfo[b].obstacles ? a : b
        );
        routesInfo[worstRouteId].name = `total_${maxObstacles}_worstRoute`;

        map.getSource("theRoute").setData(routesInfo[worstRouteId].routeLine);

        // adicionando rota com mais assaltos (vermelha)

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
            "line-color": "#FF8D9E",
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
            "line-color": "#FF8D9E",
            "line-opacity": 0.3,
            "line-width": 13,
          },
        });

        // adicionando rota mais segura (verde)

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
            "line-color": "#5FC2CB",
            "line-width": 4,
          },
        });

        map.addLayer({
          id: "bestRoute2",
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
            "line-color": "#5FC2CB",
            "line-opacity": 0.3,
            "line-width": 13,
          },
        });

        routeLayerId = "worstRoute"; // assign ID to the route layer
      }
      console.log(routesInfo);
    }
  }
});

// function addWaypointsToMap(coords) {
//   map.addLayer({
//     id: "start-point",
//     type: "symbol",
//     source: {
//       type: "geojson",
//       data: {
//         type: "Feature",
//         geometry: {
//           type: "Point",
//           coordinates: coords[0],
//         },
//       },
//     },
//     layout: {
//       "icon-allow-overlap": true,
//       "icon-size": 1,
//     },
//   });

//   map.addLayer({
//     id: "end-point",
//     type: "symbol",
//     source: {
//       type: "geojson",
//       data: {
//         type: "Feature",
//         geometry: {
//           type: "Point",
//           coordinates: coords[1],
//         },
//       },
//     },
//     layout: {
//       "icon-allow-overlap": true,
//       "icon-size": 1,
//     },
//   });
// }

//  funcao que permite ver os ids das layers do tipo line
function verLayer() {
  map
    .queryRenderedFeatures()
    .filter((d) => d.layer.type == "line") // filtra layers do tipo line
    .map((d) => d.layer.id) // pega os ids delas
    .filter((d, i, a) => a.indexOf(d) == i) // filtra os valores únicos de ids
    .forEach((id) => console.log(id)); // imprime os ids únicos no console
}

function verLayerIndex() {
  map
    .getStyle()
    .layers // obtém todas as camadas do estilo
    .forEach((layer) => console.log(layer.id, layer['z-index'])); // imprime o id e z-index de cada camada
}


// funcao que oculta as rotas indesejadas do mapa
function ocultarRotas() {
  map.setLayoutProperty("directions-route-line-casing", "visibility", "none");
  map.setLayoutProperty("directions-route-line", "visibility", "none");
  map.setLayoutProperty("theRoute", "visibility", "none");
}

// funcao que oculta as rotas finais geradas (melhor e pior rota)
function ocultarRotasVerdeVermelha() {
  map.setLayoutProperty("bestRoute", "visibility", "none");
  map.setLayoutProperty("bestRoute2", "visibility", "none");
  map.setLayoutProperty("worstRoute", "visibility", "none");
  map.setLayoutProperty("worstRoute2", "visibility", "none");

  // map.removeLayer("bestRoute");
  // map.removeLayer("bestRoute2");
  // setTimeout(() => {
  //   map.removeSource("bestRoute");
  //   map.removeSource("bestRoute2");
  // }, 1000);

  map.removeLayer("worstRoute");
  map.removeLayer("worstRoute2");
  setTimeout(() => {
    map.removeSource("worstRoute");
    map.removeSource("worstRoute2");
  }, 1000);

  // deixar objeto vazio
  routesInfo = {};
  

}

// CONTAINER COM OS DADOS

function containerLoadingOn() {
  document.querySelector("section.container.loading").style.display = "flex";
}

function containerLoadingOff(rotasIguais) {

  document.querySelector("section.container.loading").style.display = "none";
  // document.querySelector("section.container.loading").style.opacity = "0";

  if (rotasIguais == false) {
    document.querySelector("section.container.melhor-rota").style.display = "flex";
    document.querySelector("section.container.pior-rota").style.display = "flex";
  } else {
    document.querySelector("section.container.rotas-iguais").style.display = "flex";
  }

  document.querySelector("section.container.nova-busca").style.display = "flex";

}

function pegarOrigemDestino() {
  let origemInserida;
  let destinoInserido;

  // pega as informacoes de origem e destino
  let input = document.querySelectorAll(
    '.mapboxgl-ctrl-geocoder > input[type="text"]'
  );
  input.forEach((input) => {
    // console.log(input.value);

    if (input.placeholder == "Origem") {
      origemInserida = input.value;
    } else {
      destinoInserido = input.value;
    }
  });

  // insere novamente as informacoes de origem e destino

  input.forEach((input) => {
    // console.log(input.value);

    if (input.placeholder == "Origem") {
      input.value = origemInserida;
    } else {
      input.value = destinoInserido;
    }
  });
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

// function updateSidebar(routeInfo) {
//   const sidebar = document.getElementById("sidebar2");
//   sidebar.innerHTML = "";

//   const title = document.createElement("h2");
//   title.textContent = `Rota ${routeInfo.name}`;
//   sidebar.appendChild(title);

//   const subtitle = document.createElement("h3");
//   subtitle.textContent = `Assaltos: ${routeInfo.obstacles}`;
//   sidebar.appendChild(subtitle);

//   const instructionsTitle = document.createElement("h4");
//   instructionsTitle.textContent = "Instruções:";
//   sidebar.appendChild(instructionsTitle);

//   const instructionsList = document.createElement("ul");
//   for (const instruction of routeInfo.instructions) {
//     const item = document.createElement("li");
//     item.textContent = instruction;
//     instructionsList.appendChild(item);
//   }
//   sidebar.appendChild(instructionsList);
// }

// let emoji = "";
// let collision = "";

let detail = "";

const reports = document.getElementById("reports");

// FUNÇAO PARA ADICIONAR CARD COM INFOS DAS ROTAS NA TELA
function addCard(id, element, clear, detail) {

  pegarOrigemDestino()

  // desativarInterativideMapa()

  document.querySelector(
    "section.container.loading > p"
  ).innerHTML = `Buscando a melhor rota... <strong>${id}</strong> de ${maxAttempts}`;


}

// FUNÇAO QUE EXIBE QUANDO UMA ROTA SEM OBSTACULOS NAO É ENCONTRADA
function gerarResultado(element, rotasIguais) {
  // chamando função para ocultar rotas indesejadas
  obtendoInfosRotas(routesInfo)
  ocultarRotas();
  containerLoadingOff(rotasIguais);
  

  if (rotasIguais == false) {
    document.querySelector(
      "section.container.melhor-rota > p.infos-rota"
    ).innerHTML = `${tempoMelhorRota} min • ${distanciaMelhorRota.toFixed(1)} km`;
  
    document.querySelector(
      "section.container.melhor-rota > p.text"
    ).innerHTML = `Rota com<strong> -roubos</strong><br>teve <strong>${assaltosMelhorRota.toFixed(1)} casos</strong>`;
  
    document.querySelector(
      "section.container.pior-rota > p.text"
    ).innerHTML = `Rota com<strong> +roubos</strong><br>teve <strong>${assaltosPiorRota.toFixed(1)} casos</strong>`;
    
    document.querySelector(
      "section.container.pior-rota > p.infos-rota"
    ).innerHTML = `${tempoPiorRota} min • ${distanciaPiorRota.toFixed(1)} km`;

    // document.querySelector(
    //   "section.container.melhor-rota > p.text"
    // ).innerHTML = `A melhor rota registrou <strong>${percentualMinObstacles.toFixed(1)}% assaltos a menos</strong> em relação à média das ${maxAttempts} verificadas`;
  
    // document.querySelector(
    //   "section.container.pior-rota > p.text"
    // ).innerHTML = `A pior rota teve <strong>${percentualMaxObstacles.toFixed(1)}% mais assaltos </strong> do que o melhor trajeto`;
    
  

  } else {

    document.querySelector(
      "section.container.rotas-iguais > p.text"
    ).innerHTML = `As ${maxAttempts} rotas verificadas tiveram o mesmo número de assaltos.`;
    document.querySelector(
      "section.container.rotas-iguais > p.infos-rota"
    ).innerHTML = `${tempoMelhorRota} min • ${distanciaMelhorRota.toFixed(1)} km`;
  
  }


}


let mapaReiniciado = false

// Adicione um event listener para o botão que reinicia a entrada dos pontos A e B
function reiniciarDirecoes() {

  // exibindo novamente a barra de direcoes do mapbox
  document.querySelector("#map > div.mapboxgl-control-container > div.mapboxgl-ctrl-top-left").style.display = "block"

  mapaReiniciado = true

  map.removeControl(directions);

  setTimeout(() => {
    map.addControl(directions, "top-left");
  }, 500);

  if (map.getLayer("start-point")) {
    map.removeLayer("start-point");
  }

  if (map.getLayer('end-point')) {
    map.removeLayer('end-point');
  }

  // if (map.getLayer('clusters')) {
  //   map.removeLayer('clusters');
  //   map.removeSource("clusters");
  // }

  // if (map.getLayer('cluster-count')) {
  //   map.removeLayer('cluster-count');
  //   map.removeSource("cluster-count");
  // }

  


  if (rotasIguais == true) {

    map.setLayoutProperty("bestRouteIgual", "visibility", "none");
    map.setLayoutProperty("bestRouteIgual2", "visibility", "none");

    map.removeLayer("bestRouteIgual");
    map.removeSource("bestRouteIgual");

    map.removeLayer("bestRouteIgual2");
    map.removeSource("bestRouteIgual2");

    // resetando variável
    rotasIguais = false

  } else {

    map.setLayoutProperty("bestRoute", "visibility", "none");
    map.setLayoutProperty("bestRoute2", "visibility", "none");
    map.setLayoutProperty("worstRoute", "visibility", "none");
    map.setLayoutProperty("worstRoute2", "visibility", "none");
  
    map.removeLayer("bestRoute");
    map.removeLayer("bestRoute2");
    map.removeSource("bestRoute");
    map.removeSource("bestRoute2");
  
    map.removeLayer("worstRoute");
    map.removeLayer("worstRoute2");
    map.removeSource("worstRoute");
    map.removeSource("worstRoute2");

  }
  
  // deixar objeto vazio
  routesInfo = {};

  // ocultando container de informacoes das rotas
  document.querySelector("section.container.melhor-rota").style.display = "none";
  document.querySelector("section.container.pior-rota").style.display = "none";
  document.querySelector("section.container.rotas-iguais").style.display = "none";
  document.querySelector("section.container.nova-busca").style.display = "none";  

};




// function hasBestRoute(array) {
//   for (var i = 0; i < array.length; i++) {
//     var item = array[i];
//     var name = item.name;
    
//     if (name.endsWith("bestRoute")) {
//       console.log(name)
//       return true;
      
//     }
//   }
  
//   return false;
// }

//  salvador instrucoes da melhor e pior rota
let instrucoesMelhorRota = [];
let tempoMelhorRota = 0;
let distanciaMelhorRota = 0;
let assaltosMelhorRota = 0;

let instrucoesPiorRota = [];
let tempoPiorRota = 0;
let distanciaPiorRota = 0;
let assaltosPiorRota = 0;

function obtendoInfosRotas(routesInfo) {

  for (var key in routesInfo) {
    var item = routesInfo[key];
    var name = item.name;
    var instructions = item.instructions
    
    if (name.endsWith("bestRoute")) {
      console.log(name)
      instrucoesMelhorRota = instructions;
      tempoMelhorRota = item.durationMin;
      distanciaMelhorRota = item.distanceKm;
      assaltosMelhorRota = item.obstacles;

    } 
    if (name.endsWith("worstRoute")) {
      console.log(name)
      instrucoesPiorRota = instructions;
      tempoPiorRota = item.durationMin;
      distanciaPiorRota = item.distanceKm;
      assaltosPiorRota = item.obstacles;

    } 
  }

}


function tempoInfosRotas(routesInfo) {

  for (var key in routesInfo) {
    var item = routesInfo[key];
    console.log(item.name + ": " + item.durationMin)

}
}

function trajetoRotas(routesInfo) {

  for (var key in routesInfo) {
    var item = routesInfo[key];
    var name = item.name;
    var instructions = item.instructions
    
    if (name.endsWith("bestRoute")) {
      console.log(item.routeLine.coordinates)

      const routeLine = {
        coordinates: [],
      };
      
      for (let i = 0; i < item.routeLine.coordinates.length; i += 100) {
        routeLine.item.routeLine.coordinates.push(item.routeLine.coordinates.slice(i, i + 100));
      }
      
      console.log(routeLine);

    } 
    if (name.endsWith("worstRoute")) {
      console.log(name)
      instrucoesPiorRota = instructions;
      tempoPiorRota = item.durationMin;
      distanciaPiorRota = item.distanceKm;

    } 
  }

}


function inserindoInstrucoesRotas(intrucoesRota) {

  console.log("inserindo instrucoes da rota")
  // Obtém o elemento <ul> em que as instruções serão exibidas
  var routeInstructionsElement = document.getElementById("routeInstructions");

  // excluindo dados caso exista
  routeInstructionsElement.innerHTML = ""
		
  // Itera sobre as instruções e cria um elemento <div> para cada uma
  for (var i = 0; i < intrucoesRota.length; i++) {
    var instructionNumber = i + 1;
    var instructionText = intrucoesRota[i];
    
    var instructionElement = document.createElement("div");
    instructionElement.classList.add("routeInstruction");
    
    var instructionTextElement = document.createElement("p");
    instructionTextElement.classList.add("routeInstructionText");
    instructionTextElement.innerHTML = `<strong>${instructionNumber}</strong>. ${instructionText}`
    

    instructionElement.appendChild(instructionTextElement);
    
    routeInstructionsElement.appendChild(instructionElement);
  }
}




// function mostrarInstrucoes(){
//   if (mostrarInstrucoesAtivo == false){
//     document.querySelector("div.container-instrutions").style.display = "flex";
//     document.querySelector("div.instrutions").style.display = "flex";
//     document.querySelector(".container.pior-rota").style.display = "none";
//     document.querySelector(".container.melhor-rota").style.display = "none";
//     mostrarInstrucoesAtivo = true
//     // document.querySelector(".melhor-rota > p.btn-instrucoes").innerText = "▴ Ocultar instruções";
//   } else {
//     document.querySelector("div.container-instrutions").style.display = "flex";
//     document.querySelector("div.instrutions").style.display = "flex";
//     document.querySelector(".container.pior-rota").style.display = "flex";
//     mostrarInstrucoesAtivo = false
//     document.querySelector(".melhor-rota > p.btn-instrucoes").innerText = "▸ Detalhes da rota";
//   }
// }


function removeLayersAndSources() {
  if (map.getLayer("clusters")) {
    map.removeLayer("clusters");
  }
  if (map.getLayer("cluster-count")) {
    map.removeLayer("cluster-count");
  }
  if (map.getSource("earthquakes")) {
    map.removeSource("earthquakes");
  }
}

function desabilitaBtnDirecoes() {
  document.querySelector("#mapbox-directions-origin-input > div > div > button").style.display = "none"
  document.querySelector("#mapbox-directions-destination-input > div > div > button").style.display = "none"
}


mostrarInstrucoesAtivo = false

function mostrarInstrucoes(tipoRota){

  document.querySelector("div.container-instrutions").style.display = "flex";
  document.querySelector("div.instrutions").style.display = "flex";
  document.querySelector(".container.pior-rota").style.display = "none";
  document.querySelector(".container.melhor-rota").style.display = "none";

  if (tipoRota == "melhor-rota"){

    document.querySelector("div.infos-rota-selecao").style.background = "#5FC2CB";
    inserindoInstrucoesRotas(instrucoesMelhorRota)

    map.setPaintProperty("bestRoute", "line-color", "rgba(95, 194, 203, 1)");
    map.setPaintProperty("bestRoute2", "line-color", "rgba(95, 194, 203, 1)");

    map.setPaintProperty("worstRoute", "line-color", "rgba(255, 141, 158, 0.3)");
    map.setPaintProperty("worstRoute2", "line-color", "rgba(255, 141, 158, 0.3)");

    console.log("melhor-rota")

  } if (tipoRota == "pior-rota") {

    document.querySelector("div.infos-rota-selecao").style.background = "#FF8D9E";
    inserindoInstrucoesRotas(instrucoesPiorRota)

    map.setPaintProperty("worstRoute", "line-color", "rgba(255, 141, 158, 1)");
    map.setPaintProperty("worstRoute2", "line-color", "rgba(255, 141, 158, 1)");

    map.setPaintProperty("bestRoute", "line-color", "rgba(95, 194, 203, 0.3)");
    map.setPaintProperty("bestRoute2", "line-color", "rgba(95, 194, 203, 0.3)");


    console.log("pior-rota")
 

  }
}

function ocultarContainerRotas() {

  document.querySelector("div.container-instrutions").style.display = "none";
  document.querySelector("div.instrutions").style.display = "none";
  document.querySelector(".container.pior-rota").style.display = "flex";
  document.querySelector(".container.melhor-rota").style.display = "flex";

  map.setPaintProperty("worstRoute", "line-color", "rgba(255, 141, 158, 1)");
  map.setPaintProperty("worstRoute2", "line-color", "rgba(255, 141, 158, 1)");

  map.setPaintProperty("bestRoute", "line-color", "rgba(95, 194, 203, 1)");
  map.setPaintProperty("bestRoute2", "line-color", "rgba(95, 194, 203, 1)");


}

function ocultarBarraDirecoes() {
  document.querySelector("#map > div.mapboxgl-control-container > div.mapboxgl-ctrl-top-left").style.display = "none"
}