mapboxgl.accessToken = 'pk.eyJ1IjoibHVjYXN0aGF5bmFuLWVzdGFkYW8iLCJhIjoiY2xnM3N1amQzMGlqeDNrbWdla3doY2o2dCJ9.OXh3OY3_HFqAiF-zzZ6SDQ';

        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-23.561973, -46.65563],
            zoom: 12
        });

        var geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        });

        document.getElementById('origin').appendChild(geocoder.onAdd(map));
        document.getElementById('destination').appendChild(geocoder.onAdd(map));

        var directions = new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit: 'metric',
            profile: 'mapbox/driving',
            controls: {
                inputs: false,
                instructions: true,
                profileSwitcher: true
            },
            language: 'pt-BR'
        });

        map.addControl(directions, 'top-left');

        directions.on('route', function (event) {
            map.getSource('route').setData(event.route.geometry);
        });

        map.on('load', function () {
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            });

            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#0080ff',
                    'line-width': 8,
                    'line-opacity': 0.8
                }
            });
        });