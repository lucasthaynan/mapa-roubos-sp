
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
  placeholderOrigin: "Origem",
  placeholderDestination: "Destino",
  languagePlaceholderOrigin: "Origem",
  languagePlaceholderDestination: "Destino",
  geocoder: {
    language: "pt-BR",
  },
  steps: true,
});

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

directions.on("clear", () => {
  console.log("Limpando rotas...");
  map.setLayoutProperty("theRoute", "visibility", "none");
  // resetMap()
  // map.setLayoutProperty("theBox", "visibility", "none");

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

let percentualMinObstacles;
let minimoAssaltosRota;
let percentualMaxObstacles;
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
  if (counter >= maxAttempts) {

    // chama a função que mostra os dados sobre as rotas geradas
    gerarResultado(reports, rotasIguais); // rotasIguais é true ou false

    // champ a função que bloqueia as entradas de origem e destino
    bloquearEntradaOrigemDestino(map);

    // inserindo instrucoes
    inserindoInstrucoesRotas(routesInfo)

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
              bottom: 300,
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
              top: 170,
              right: 170,
              bottom: 170,
              left: 380,
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
            "line-color": "#9370db",
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
            "line-color": "#9370db",
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
        const bestRoute = routesInfo[bestRouteId].routeLine;
        const startCoord = bestRoute.coordinates[0];
        const endCoord =
          bestRoute.coordinates[bestRoute.coordinates.length - 1];
        const waypoints = [startCoord, endCoord];

        addWaypointsToMap(waypoints);
        // Rotas com diferentes números de obstáculos
        map.setPaintProperty("theRoute", "line-color", "#74c476");
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
            "line-color": "#74c476",
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
            "line-color": "#74c476",
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
      "icon-allow-overlap": true,
      "icon-size": 1,
    },
  });
}

//  funcao que permite ver os ids das layers do tipo line
function verLayer() {
  map
    .queryRenderedFeatures()
    .filter((d) => d.layer.type == "line") // filtra layers do tipo line
    .map((d) => d.layer.id) // pega os ids delas
    .filter((d, i, a) => a.indexOf(d) == i) // filtra os valores únicos de ids
    .forEach((id) => console.log(id)); // imprime os ids únicos no console
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

}

// CONTAINER COM OS DADOS

function containerLoadingOn() {
  document.querySelector("section.container.loading").style.display = "flex";
}

function containerLoadingOff(rotasIguais) {

  document.querySelector("section.container.loading").style.display = "none";
  document.querySelector("section.container.loading").style.opacity = "0";

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
    console.log(input.value);

    if (input.placeholder == "Origem") {
      origemInserida = input.value;
    } else {
      destinoInserido = input.value;
    }
  });

  // insere novamente as informacoes de origem e destino

  input.forEach((input) => {
    console.log(input.value);

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
    ).innerHTML = `A melhor rota registrou <strong>${percentualMinObstacles.toFixed(1)}% assaltos a menos</strong> em relação à média das ${maxAttempts} rotas verificadas`;
  
    document.querySelector(
      "section.container.pior-rota > p.text"
    ).innerHTML = `A pior rota teve <strong>${percentualMaxObstacles.toFixed(1)}% mais assaltos </strong> do que o melhor trajeto`;
    
    document.querySelector(
      "section.container.pior-rota > p.infos-rota"
    ).innerHTML = `${tempoPiorRota} min • ${distanciaPiorRota.toFixed(1)} km`;
  

  } else {

    document.querySelector(
      "section.container.rotas-iguais > p.text"
    ).innerHTML = `As ${maxAttempts} rotas verificadas tiveram o mesmo número de assaltos.`;
  
  }


  
  // Altera a propriedade interactive para true

  // bloquearEntradaDeDados(directions)

}



// Adicione um event listener para o botão que reinicia a entrada dos pontos A e B
function reiniciarDirecoes() {
  // Remove o controle existente do mapa
  map.removeControl(directions);

  ocultarRotasVerdeVermelha()
  // Cria uma nova instância do MapboxDirections
  directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: "metric",
    profile: "mapbox/driving",
    alternatives: false,
    geometries: "geojson",
    controls: { instructions: false },
    flyTo: true,
    interactive: false,
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

  // Adiciona a nova instância do MapboxDirections ao mapa
  map.addControl(directions, "top-left");


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

let instrucoesPiorRota = [];
let tempoPiorRota = 0;
let distanciaPiorRota = 0;

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

    } 
    if (name.endsWith("worstRoute")) {
      console.log(name)
      instrucoesPiorRota = instructions;
      tempoPiorRota = item.durationMin;
      distanciaPiorRota = item.distanceKm;

    } 
  }

}


function inserindoInstrucoesRotas(routesInfo) {

  // Obtém o elemento <ul> em que as instruções serão exibidas
  var routeInstructionsElement = document.getElementById("routeInstructions");
		
  // Itera sobre as instruções e cria um elemento <div> para cada uma
  for (var i = 0; i < instrucoesMelhorRota.length; i++) {
    var instructionNumber = i + 1;
    var instructionText = instrucoesMelhorRota[i];
    
    var instructionElement = document.createElement("div");
    instructionElement.classList.add("routeInstruction");
    
    // var instructionNumberElement = document.createElement("span");
    // instructionNumberElement.classList.add("routeInstructionNumber");
    // instructionNumberElement.innerHTML = instructionNumber + ".";
    
    var instructionTextElement = document.createElement("p");
    instructionTextElement.classList.add("routeInstructionText");
    instructionTextElement.innerHTML = `<strong>${instructionNumber}</strong>. ${instructionText}`
    
    // instructionElement.appendChild(instructionNumberElement);
    instructionElement.appendChild(instructionTextElement);
    
    routeInstructionsElement.appendChild(instructionElement);
  }
}

mostrarInstrucoesAtivo = false

function mostrarInstrucoes(){
  if (mostrarInstrucoesAtivo == false){
    document.querySelector(".melhor-rota > div.instrutions").style.display = "flex";
    document.querySelector(".container.pior-rota").style.display = "none";
    mostrarInstrucoesAtivo = true
    document.querySelector(".melhor-rota > p.btn-instrucoes").innerText = "▴ Ocultar instruções";
  } else {
    document.querySelector(".melhor-rota > div.instrutions").style.display = "none";
    document.querySelector(".container.pior-rota").style.display = "flex";
    mostrarInstrucoesAtivo = false
    document.querySelector(".melhor-rota > p.btn-instrucoes").innerText = "▸ Detalhes da rota";
  }
}

