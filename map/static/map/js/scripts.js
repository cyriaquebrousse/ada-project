
$(document).ready(function(){/* google maps -----------------------------------------------------*/
google.maps.event.addDomListener(window, 'load', initialize);

  function initialize() {
    var ISOCHRONE_URL = "/map/isochrone/";
    var STATIONS_URL = "/map/stations/";

    /* position Switzerland */
    var center_lat = 46.904785;
    var center_lon = 8.243424;
    var iniLatLng = new google.maps.LatLng(center_lat, center_lon);

    var mapOptions = {
      center: iniLatLng,
      scrollWheel: false,
      zoom: 8
    };

    var styles = [
      {
        "featureType": "landscape",
        "stylers": [ {"saturation": -100}, {"lightness": 65}, {"visibility": "on"}]
      },
      {
        "featureType": "poi",
        "stylers": [{"saturation": -100}, {"lightness": 51}, {"visibility": "simplified"}]
      },
      {
        "featureType": "road.highway",
        "stylers": [{"saturation": -100}, {"visibility": "simplified"}]
      },
      {
        "featureType": "road.arterial",
        "stylers": [{"saturation": -100}, {"lightness": 30}, {"visibility": "on"}]
      },
      {
        "featureType": "road.local",
        "stylers": [{"saturation": -100}, {"lightness": 40}, {"visibility": "on"}]
      },
      {
        "featureType": "transit",
        "stylers": [{"saturation": -100}, {"visibility": "simplified"}]
      },
      {
        "featureType": "administrative.province",
        "stylers": [{"visibility": "off"}]
      },
      {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [{"visibility": "on"}, {"lightness": -25}, {"saturation": -100}]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{"hue": "#ffff00"}, {"lightness": -25}, {"saturation": -97}]
      }
    ];

    var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    map.set('styles', styles);
    map.setOptions({minZoom: 8, maxZoom: 15});

    var marker = new google.maps.Marker({
      position: iniLatLng,
      map: map
    });

    var redLine = new google.maps.Polyline();

    // register the listeners on the map
    google.maps.event.addListener(map, 'tilesloaded', onMapLoaded);
    google.maps.event.addListener(map, 'click', onMapClick);

    /**
    * Callback for when map is loaded
    */
    function onMapLoaded() {
      var client = new JsonClient(STATIONS_URL);
      client.get('', function(response) {

      });
    }

    /**
    * Callback for map click
    * Parameters:
    *   event the event that triggered the callback
    */
    function onMapClick(event) {
      // get coordinates from the click
      var latLng = event.latLng;

      checkCountryAndProceed(latLng, 'CH', function() {
        var client = new JsonClient(ISOCHRONE_URL);
        var now = new Date();
        var time = formatTime(now.getHours(), now.getMinutes());
        client.get(latLng.lat() + ',' + latLng.lng() + '/' + time,
         function(response) {
          newLatLng = new google.maps.LatLng(response.lat, response.lng)
          drawLines(newLatLng);
        });
      });

      function formatTime(hours, minutes) {
        sHours = hours < 10 ? '0' + hours : '' + hours;
        sMinutes = minutes < 10 ? '0' + minutes : '' + minutes;

        return sHours + sMinutes;
      }
    }

    /**
    * Parameters:
    *   latLng the lat/lng coordinates to check
    *   code code for the country to check against
    *   action function to execute if latlng and code matchs
    */
    function checkCountryAndProceed(latLng, code, action) {
      var geocoder = new google.maps.Geocoder();

      geocoder.geocode({'latLng': latLng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            // get the required address & check
            addrComponents = results[1].address_components;
            for (var i = 0; i < addrComponents.length; i++) {
              if (addrComponents[i].types[0] == "country"
               && addrComponents[i].short_name == code) {
                action();
                break;
              }
            }
          }
        }
      });
    }

    function drawLines(latlng) {
      // remove the previous red line
      redLine.setMap(null);

      redLine = new google.maps.Polyline({
        path : [iniLatLng, latlng],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      redLine.setMap(map)
    }

  };
  /* end google maps -----------------------------------------------------*/

  function JsonClient(baseUrl) {
    this.get = function(url, callback) {
      var httpRequest = new XMLHttpRequest();

      httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState == 4 && httpRequest.status == 200 ) {
          callback(JSON.parse(httpRequest.responseText));
          console.log(JSON.parse(httpRequest.responseText));
        }
      }

      httpRequest.open("GET", baseUrl + url, true);
      httpRequest.send();
    }
  }
});
