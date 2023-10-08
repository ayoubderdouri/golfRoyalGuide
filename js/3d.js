mapboxgl.accessToken = 'pk.eyJ1IjoibWlrZW9tZWFyYTEiLCJhIjoiY2ppZjUybTl0MGtpbTNybnhmaW5lODF0YSJ9.Z3yxLGnip7kSCxPTxZ1oKA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-6.8313, 33.9177],
    zoom: 13
});

map.on('load', function () {
    // Ajoutez une couche 3D

});
