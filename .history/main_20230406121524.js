
//       mapboxgl.accessToken = 'pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ';
//       const map = new mapboxgl.Map({
//         container: 'map', // Specify the container ID
//         style: 'mapbox://styles/mapbox/light-v11', // Specify which map style to use
//         center: [-46.65601, -23.56158], // Specify the starting position [lng, lat]
//         zoom: 15 // Specify the starting zoom
//       });


//       const directions = new MapboxDirections({
//         accessToken: mapboxgl.accessToken,
//         unit: 'metric',
//         profile: 'mapbox/driving',
//         alternatives: true,
//         geometries: 'geojson',
//         controls: { instructions: false },
//         flyTo: false,
//         language: "pt-BR",
//         geocoder: {
//             language: 'pt-BR'
//         },
//         steps: true
//       });

      

//       map.addControl(directions, 'top-right');
//       map.scrollZoom.enable();

//       const clearances = {
//         type: 'FeatureCollection',
//         features: [
//           {
//             type: 'Feature',
//             geometry: {
//               type: 'Point',
//               coordinates: [-46.65882, -23.55925]
//             },
//             properties: {
//               clearance: 1
//             }
//           },
//           {
//             type: 'Feature',
//             geometry: {
//               type: 'Point',
//               coordinates: [-46.63867,-23.562684]
//             },
//             properties: {
//               clearance: 20
//             }
//           },
//           {
//             type: 'Feature',
//             geometry: {
//               type: 'Point',
//               coordinates: [-46.638,-23.562]
//             },
//             properties: {
//               clearance: 20
//             }
//           },
//           {
//             type: 'Feature',
//             geometry: {
//               type: 'Point',
//               coordinates: [-46.6581, -23.5593]
//             },
//             properties: {
//               clearance: 20
//             }
//           },
//           {
//             type: 'Feature',
//             geometry: {
//               type: 'Point',
//               coordinates: [-46.65937,-23.55896]
//             },
//             properties: {
//               clearance: 1
//             }
//           },
//           {
//             type: 'Feature',
//             geometry: {
//               type: 'Point',
//               coordinates: [-46.65517,-23.56245]
//             },
//             properties: {
//               clearance: 1
//             }
//           }
//         ]
//       };

//       const obstacle = turf.buffer(clearances, 0.01, { units: 'kilometers' });
//       let bbox = [0, 0, 0, 0];
//       let polygon = turf.bboxPolygon(bbox);

//       map.on('load', () => {
//         map.addLayer({
//           id: 'clearances',
//           type: 'fill',
//           source: {
//             type: 'geojson',
//             data: obstacle
//           },
//           layout: {},
//           paint: {
//             'fill-color': '#f03b20',
//             'fill-opacity': 0.5,
//             'fill-outline-color': '#f03b20'
//           }
//         });

//         map.addSource('theRoute', {
//           type: 'geojson',
//           data: {
//             type: 'Feature'
//           }
//         });

//         map.addLayer({
//           id: 'theRoute',
//           type: 'line',
//           source: 'theRoute',
//           layout: {
//             'line-join': 'round',
//             'line-cap': 'round'
//           },
//           paint: {
//             'line-color': '#cccccc',
//             'line-opacity': 0.5,
//             'line-width': 13,
//             'line-blur': 0.5
//           }
//         });

//         // Source and layer for the bounding box
//         map.addSource('theBox', {
//           type: 'geojson',
//           data: {
//             type: 'Feature'
//           }
//         });
//         map.addLayer({
//           id: 'theBox',
//           type: 'fill',
//           source: 'theBox',
//           layout: {},
//           paint: {
//             'fill-color': '#FFC300',
//             'fill-opacity': 0.5,
//             'fill-outline-color': '#FFC300'
//           }
//         });
//       });

//       let counter = 0;
//       const maxAttempts = 100;
//       let emoji = '';
//       let collision = '';
//       let detail = '';
//       const reports = document.getElementById('reports');

//       function addCard(id, element, clear, detail) {
//         const card = document.createElement('div');
//         card.className = 'card';
//         // Add the response to the individual report created above
//         const heading = document.createElement('div');
//         // Set the class type based on clear value
//         heading.className =
//           clear === true
//             ? 'card-header route-found'
//             : 'card-header obstacle-found';
//         heading.innerHTML =
//           id === 0
//             ? `${emoji} Esta rota ${collision}`
//             : `${emoji} Rota ${id} ${collision}`;

//         const details = document.createElement('div');
//         details.className = 'card-details';
//         details.innerHTML = `This ${detail} obstacles.`;

//         card.appendChild(heading);
//         card.appendChild(details);
//         element.insertBefore(card, element.firstChild);
//       }

//       function noRoutes(element) {
//         const card = document.createElement('div');
//         card.className = 'card';
//         // Add the response to the individual report created above
//         const heading = document.createElement('div');
//         heading.className = 'card-header no-route';
//         emoji = '🛑';
//         heading.innerHTML = `${emoji} Fim da busca.`;

//         // Add details to the individual report
//         const details = document.createElement('div');
//         details.className = 'card-details';
//         details.innerHTML = `No clear route found in ${counter} tries.`;

//         card.appendChild(heading);
//         card.appendChild(details);
//         element.insertBefore(card, element.firstChild);
//       }

//       directions.on('clear', () => {
//         map.setLayoutProperty('theRoute', 'visibility', 'none');
//         map.setLayoutProperty('theBox', 'visibility', 'none');

//         counter = 0;
//         reports.innerHTML = '';
//       });

//       directions.on('route', (event) => {
//         // Hide the route and box by setting the opacity to zero
//         map.setLayoutProperty('theRoute', 'visibility', 'none');
//         map.setLayoutProperty('theBox', 'visibility', 'none');

//         if (counter >= maxAttempts) {
//           noRoutes(reports);
//         } else {
//           // Make each route visible
//           for (const route of event.route) {
//             // Make each route visible
//             map.setLayoutProperty('theRoute', 'visibility', 'visible');
//             map.setLayoutProperty('theBox', 'visibility', 'visible');

//             // Get GeoJSON LineString feature of route
//             const routeLine = polyline.toGeoJSON(route.geometry);

//             // Create a bounding box around this route
//             // The app will find a random point in the new bbox
//             bbox = turf.bbox(routeLine);
//             polygon = turf.bboxPolygon(bbox);

//             // Update the data for the route
//             // This will update the route line on the map
//             map.getSource('theRoute').setData(routeLine);

//             // Update the box
//             map.getSource('theBox').setData(polygon);

//             const clear = turf.booleanDisjoint(obstacle, routeLine);

//             if (clear === true) {
//               collision = 'não cruza nenhum obstáculo!';
//               detail = `${counter}Obstacuslos - leva  ${(route.duration / 60).toFixed(
//                 0
//               )} minutes and avoids`;
//               emoji = '✔️';
//               map.setPaintProperty('theRoute', 'line-color', '#74c476');
//               // Hide the box
//               map.setLayoutProperty('theBox', 'visibility', 'none');
//               // Reset the counter
//               counter = 0;
//             } else {
//               // Collision occurred, so increment the counter
//               counter = counter + 1;
//               // As the attempts increase, expand the search area
//               // by a factor of the attempt count
//               polygon = turf.transformScale(polygon, counter * 0.01);
//               bbox = turf.bbox(polygon);
//               collision = 'is bad.';
//               detail = `takes ${(route.duration / 60).toFixed(
//                 0
//               )} minutes and hits`;
//               emoji = '⚠️';
//               map.setPaintProperty('theRoute', 'line-color', '#de2d26');

//               // Add a randomly selected waypoint to get a new route from the Directions API
//               const randomWaypoint = turf.randomPoint(1, { bbox: bbox });
//               directions.setWaypoint(
//                 0,
//                 randomWaypoint['features'][0].geometry.coordinates
//               );
//             }
//             // Add a new report section to the sidebar
//             addCard(counter, reports, clear, detail);
//           }
//         }
//       });
    

// function traduzirInput(){
//     let input = document.querySelectorAll('.mapboxgl-ctrl-geocoder > input[type="text"]')
//     input.forEach(input => {
        
//         if(input.placeholder == "Choose a starting place") {
            
//             input.placeholder = "Endereço de partida"

//         } else {
//             input.placeholder = "Endereço de destino"
//         }
//     })

//     document.querySelector('label[for="mapbox-directions-profile-driving-traffic"]').innerText = "Trânsito"
//     document.querySelector('label[for="mapbox-directions-profile-driving"]').innerText = "Dirigindo"
//     document.querySelector('label[for="mapbox-directions-profile-walking"]').innerText = "Andando"
//     document.querySelector('label[for="mapbox-directions-profile-cycling"]').innerText = "Pedalando"
    


// }

// // Adiciona um listener para o evento DOMContentLoaded
// document.addEventListener('DOMContentLoaded', function() {
//     // Chama a função traduzirInput()
//     traduzirInput();
//   });
  


//   CÓDIGO 2 - CRIA APENAS POUCAS ROTAS 


mapboxgl.accessToken = 'pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ';
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-46.65882, -23.55925], // starting position
  zoom: 11, // starting zoom
  language: "pt-BR",
  geocoder: {language: 'pt-BR'}
});

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: 'metric',
  profile: 'mapbox/driving',
  alternatives: 'true',
  geometries: 'geojson'
});



map.addControl(directions, 'top-right');
map.scrollZoom.enable();

const clearances = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.65882, -23.55925]
      },
      properties: {
        clearance: 1
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.63867,-23.562684]
      },
      properties: {
        clearance: 20
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.638,-23.562]
      },
      properties: {
        clearance: 20
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.6581, -23.5593]
      },
      properties: {
        clearance: 20
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.65937,-23.55896]
      },
      properties: {
        clearance: 1
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.65517,-23.56245]
      },
      properties: {
        clearance: 1
      }
    }
  ]
};

const obstacle = turf.buffer(clearances, 0.1, { units: 'kilometers' });

map.on('load', () => {
  map.addLayer({
    id: 'clearances',
    type: 'fill',
    source: {
      type: 'geojson',
      data: obstacle
    },
    layout: {},
    paint: {
      'fill-color': '#f03b20',
      'fill-opacity': 0.5,
      'fill-outline-color': '#f03b20'
    }
  });

  // Create sources and layers for the returned routes.
  // There will be a maximum of 3 results from the Directions API.
  // We use a loop to create the sources and layers.
  for (let i = 0; i < 5; i++) {
    map.addSource(`route${i}`, {
      type: 'geojson',
      data: {
        type: 'Feature'
      }
    });

    map.addLayer({
      id: `route${i}`,
      type: 'line',
      source: `route${i}`,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#cccccc',
        'line-opacity': 0.5,
        'line-width': 13,
        'line-blur': 0.5
      }
    });
  }
});


directions.on('route', (event) => {
  const reports = document.getElementById('reports');
  reports.innerHTML = '';
  const report = reports.appendChild(document.createElement('div'));
  // Add IDs to the routes
  const routes = event.route.map((route, index) => ({
    ...route,
    id: index
  }));

  // Hide all routes by setting the opacity to zero.
  for (let i = 0; i < 20; i++) {
      map.setLayoutProperty(`route${i}`, 'visibility', 'none');
  }

  let obstacleCount = 0; // Initialize counter variable outside the loop

  for (const route of routes) {
    // Make each route visible, by setting the opacity to 50%.
    map.setLayoutProperty(`route${route.id}`, 'visibility', 'visible');

    // Get GeoJSON LineString feature of route
    const routeLine = polyline.toGeoJSON(route.geometry);

    // Update the data for the route, updating the visual.
    map.getSource(`route${route.id}`).setData(routeLine);

    const isClear = turf.booleanDisjoint(obstacle, routeLine) === true;

    if (!isClear) { // If there's an obstacle, increment counter
      obstacleCount++;
    }

    const collision = isClear ? 'is good!' : 'is bad.';
    const emoji = isClear ? '✔️' : '⚠️';
    const detail = isClear ? 'does not go' : 'goes';
    report.className = isClear ? 'item' : 'item warning';

    if (isClear) {
      map.setPaintProperty(`route${route.id}`, 'line-color', '#74c476');
    } else {
      map.setPaintProperty(`route${route.id}`, 'line-color', '#de2d26');
    }

    // Add a new report section to the sidebar.
    // Assign a unique `id` to the report.
    report.id = `report-${route.id}`;

    // Add the response to the individual report created above.
    const heading = report.appendChild(document.createElement('h3'));

    // Set the class type based on clear value.
    heading.className = isClear ? 'title' : 'warning';
    heading.innerHTML = `${emoji} Route ${route.id + 1} ${collision}`;

    // Add details to the individual report.
    const details = report.appendChild(document.createElement('div'));
    details.innerHTML = `This route ${detail} through an avoidance area.`;
    report.appendChild(document.createElement('hr'));
  }

  // Add a final report with the obstacle count
  const obstacleReport = reports.appendChild(document.createElement('div'));
  obstacleReport.className = 'item';
  obstacleReport.innerHTML = `There are ${obstacleCount} obstacle(s) in the path.`;
});




function traduzirInput(){
let input = document.querySelectorAll('.mapboxgl-ctrl-geocoder > input[type="text"]')
input.forEach(input => {
  
  if(input.placeholder == "Choose a starting place") {
      
      input.placeholder = "Endereço de partida"

  } else {
      input.placeholder = "Endereço de destino"
  }
})

document.querySelector('label[for="mapbox-directions-profile-driving-traffic"]').innerText = "Trânsito"
document.querySelector('label[for="mapbox-directions-profile-driving"]').innerText = "Dirigindo"
document.querySelector('label[for="mapbox-directions-profile-walking"]').innerText = "Andando"
document.querySelector('label[for="mapbox-directions-profile-cycling"]').innerText = "Pedalando"



}

// Adiciona um listener para o evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
// Chama a função traduzirInput()
traduzirInput();
});
