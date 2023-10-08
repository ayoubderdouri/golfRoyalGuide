mapboxgl.accessToken = 'pk.eyJ1IjoibWlrZW9tZWFyYTEiLCJhIjoiY2ppZjUybTl0MGtpbTNybnhmaW5lODF0YSJ9.Z3yxLGnip7kSCxPTxZ1oKA';
mapboxgl.setRTLTextPlugin(
	'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
	null,
	true // Lazy load the plugin
	);

let Dataset = null;
let map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v12',
	center: [-6.8313, 33.9177],
	zoom: 13,
});

map.on('load', async function() {
	const response = await fetch('./dataset/geojson.json');
  	Dataset = await response.json();

	  filtreMarker(Dataset);

});
/**
 * Filters a dataset of features based on a query and modifies the properties of matching features.
 * @param {string} query - The search query to match against the feature properties.
 * @returns {Array} - A list of features that match the query, with modified properties.
 */
function forwardGeocoder(query) {
  // Filter the features based on the query
  const filteredFeatures = Dataset.features.filter(feature => {
    const title = feature.properties.title;
    return title && title.toLowerCase().includes(query.toLowerCase());
  });

  // Create a new list of matching features with modified properties
  const matchingFeatures = filteredFeatures.map(feature => {
    const modifiedFeature = {
      ...feature,
      place_name: feature.properties.title,
      center: feature.geometry.coordinates
    };
    return modifiedFeature;
  });

  return matchingFeatures;
}


map.addControl(
	new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		localGeocoder: forwardGeocoder,
		localGeocoderOnly: true,
		mapboxgl: mapboxgl
	})
);


const myPosition = new mapboxgl.Marker(createCustomIcon('positions.svg')).setLngLat([-6.832486702272945, 33.91805261622227]).addTo(map);
myPosition.setPopup(new mapboxgl.Popup().setHTML(createPopupContent('you are here')));




map.setMaxBounds(map.getBounds());

map.addControl(new mapboxgl.NavigationControl());



// Function to set map style and re-add Mapbox Directions control
function setMapStyle(style) {


	map.remove();

	// Create a new map instance with the specified style
	map = new mapboxgl.Map({
		container: 'map',
		style: style,
		center: [-6.8313, 33.9177],
		zoom: 13
	});
	if (document.getElementById('MapboxDirections').classList.contains('show')) {
		document.getElementById('MapboxDirections').classList.remove('show');
	}
	map.setMaxBounds(map.getBounds());
	map.addControl(new mapboxgl.NavigationControl());
}

document.querySelectorAll('.style-control').forEach(function(radio) {
	radio.addEventListener('change', function() {
		const menu = document.getElementById('menu');
		if (this.value === 'streets-v12') {
			menu.classList.remove('satellite-streets-v12');
			menu.classList.add('streets-v12');
			setMapStyle('mapbox://styles/mapbox/streets-v12');
		} else {
			menu.classList.remove('streets-v12');
			menu.classList.add('satellite-streets-v12');
			setMapStyle('mapbox://styles/mapbox/satellite-streets-v12');
		}
	});
});

let directions = null;

// Function to create or get the singleton instance of Mapbox Directions control
function getDirectionsControl() {
	if (!directions) {
		directions = new MapboxDirections({
			accessToken: mapboxgl.accessToken,
			unit: 'metric',
			language: 'fr'

		});
	}
	return directions;
}

document.getElementById('MapboxDirections').addEventListener('click', function() {
	if (this.classList.contains('show')) {
		this.classList.remove('show');
		map.removeControl(directions);
		directions = null; // Reset the control instance
	} else {
		this.classList.add('show');
		const directionsControl = getDirectionsControl();
		map.addControl(directionsControl, 'top-left');
	}
});





// Create a marker based on type and properties
function createMarker(type, coordinates, properties) {
	let customIcon;
	let popupContent;

	switch (type) {
		case "Parking":
			customIcon = createCustomIcon('marker-parking.svg');
			popupContent = createPopupContent(properties.name, `Parking Number: ${properties.numero}`);
			break;
		case "Parcour":
			customIcon = createCustomIcon(`marker-golf-${properties.color}.svg`);
			popupContent = createPopupContent(`Parcour ${properties.color}`, `Trou numero: ${properties.parcour}`);
			break;
		case "WC":
			customIcon = createCustomIcon('marker-wc.svg');
			popupContent = createPopupContent('WC', properties.description);
			break;
		default:
			customIcon = createCustomIcon('mapbox-marker-icon-purple.svg');
			popupContent = createPopupContent(properties.name);
			break;
	}

	const marker = new mapboxgl.Marker(customIcon).setLngLat(coordinates);
	marker.setPopup(new mapboxgl.Popup().setHTML(popupContent));
	return marker;
}

// Utility functions to create custom icon and popup content
function createCustomIcon(iconSrc) {
	const customIcon = document.createElement('div');
	customIcon.className = 'custom-marker';
	customIcon.innerHTML = `<img src="./images/${iconSrc}" alt="Custom Icon">`;
	return customIcon;
}

function createPopupContent(title='', content = '') {
	return `<div><h3>${title}</h3><p>${content}</p></div>`;
}

// Initialize marker arrays
let parkingMarkers = [];
let wcMarkers = [];
let parcourRedMarkers = [];
let parcourGreenMarkers = [];
let parcourBlueMarkers = [];

// Fetch GeoJSON data and filter markers


// Function to filter markers based on GeoJSON data
 function filtreMarker(data) {
	try {
		
		const GolfPolygon = data.features.find(geo => geo.properties.leisure === "golf_course");
		map.addSource('golf-course', {
			type: 'geojson',
			data: GolfPolygon
		});

		map.addLayer({
			id: 'golf-course-outline',
			type: 'line',
			source: 'golf-course',
			paint: {
				'line-color': '#000', // Line color
				'line-width': 4, // Line width
				'line-opacity': 0.7, // Line opacity
				'line-dasharray': [10, 5] // Dash pattern: 10 units on, 5 units off
			},
			layout: {
				visibility: 'visible' // You can toggle visibility as needed
			}
		});

		data.features.forEach(element => {
			const properties = element.properties;

			if (properties.amenity === "Parking") {
				parkingMarkers.push(createMarker("Parking", [element.geometry.coordinates[0], element.geometry.coordinates[1]], properties));
			} else if (properties.parcour) {
				const marker = createMarker("Parcour", [element.geometry.coordinates[element.geometry.coordinates.length - 1][0], element.geometry.coordinates[element.geometry.coordinates.length - 1][1]], properties);
				marker.parcourColor = properties.color;

				if (properties.color === 'red') {
					parcourRedMarkers.push(marker);
				} else if (properties.color === 'blue') {
					parcourBlueMarkers.push(marker);
				} else {
					parcourGreenMarkers.push(marker);
				}
			} else if (properties.WC) {
				wcMarkers.push(createMarker("WC", [element.geometry.coordinates[0], element.geometry.coordinates[1]], properties));
			}
		});
	} catch (error) {
		console.error('Error fetching and adding markers:', error);
	}
}

// Function to add a list of markers to the map
function addMarkersToMap(markers) {
	markers.forEach(marker => marker.addTo(map));
}

// Event listeners for checkboxes to add markers to the map
const checkboxIds = ['parkingCheckbox', 'wcCheckbox', 'redCourseCheckbox', 'blueCourseCheckbox', 'greenCourseCheckbox'];

checkboxIds.forEach(checkboxId => {
	const checkbox = document.getElementById(checkboxId);
	checkbox.addEventListener('change', function() {
		switch (checkboxId) {
			case 'parkingCheckbox':
				addOrRemoveMarkers(this.checked, parkingMarkers);
				break;
			case 'wcCheckbox':
				addOrRemoveMarkers(this.checked, wcMarkers);
				break;
			case 'redCourseCheckbox':
				addOrRemoveMarkers(this.checked, parcourRedMarkers);
				break;
			case 'blueCourseCheckbox':
				addOrRemoveMarkers(this.checked, parcourBlueMarkers);
				break;
			case 'greenCourseCheckbox':
				addOrRemoveMarkers(this.checked, parcourGreenMarkers);
				break;
		}
	});
});

// Function to add or remove markers from the map based on checkbox state
function addOrRemoveMarkers(checked, markers) {
	if (checked) {
		addMarkersToMap(markers);
	} else {
		markers.forEach(marker => marker.remove());
	}
}

// Event listener for the menu toggle button
document.getElementById('menu').addEventListener('click', function() {
	const layerCtl = document.getElementById('layer-control');
	if (layerCtl.classList.contains('d-none')) {
		layerCtl.classList.remove('d-none');
		layerCtl.classList.add('d-block');
	} else if (layerCtl.classList.contains('d-block')) {
		layerCtl.classList.remove('d-block');
		layerCtl.classList.add('d-none');
	}
});

// Sélectionnez l'élément avec l'ID 'mapbox-3d'
document.getElementById('mapbox-3d').addEventListener('click', function() {
	// Vérifiez si l'élément a la classe 'show'
	if (this.classList.contains('show')) {
		this.classList.remove('show');
		// Supprimez la couche 3D de la carte (si nécessaire)
		if (map.getLayer('add-3d-buildings')) {
			map.removeLayer('add-3d-buildings');
            map.setPitch(null); 
            map.setBearing(null); 
		}
	} else {
        this.classList.add('show');
        map.setPitch(45); 
        map.setBearing(-17.6); 
		const layers = map.getStyle().layers;
		const labelLayerId = layers.find(
			(layer) => layer.type === 'symbol' && layer.layout['text-field']
		).id;
		map.addLayer({
				'id': 'add-3d-buildings',
				'source': 'composite',
				'source-layer': 'building',
				'filter': ['==', 'extrude', 'true'],
				'type': 'fill-extrusion',
				'minzoom': 15,
				'paint': {
					'fill-extrusion-color': '#aaa',

					'fill-extrusion-height': [
						'interpolate',
						['linear'],
						['zoom'],
						15,
						0,
						15.05,
						['get', 'height']
					],
					'fill-extrusion-base': [
						'interpolate',
						['linear'],
						['zoom'],
						15,
						0,
						15.05,
						['get', 'min_height']
					],
					'fill-extrusion-opacity': 0.6
				}
			},
			labelLayerId
		);
		
	}
});

document.getElementById('layer-control').addEventListener('mouseleave',function(){
	if(this.classList.contains('d-block')){
		this.classList.remove('d-block');
		this.classList.add('d-none');
	}
});