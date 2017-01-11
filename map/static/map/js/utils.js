/* **************************************
                CONSTANTS
**************************************** */
// styles for the Google map
var map_constants = {
  'styles' : [
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
  ],

  // options for the Google map
  'options' : {
    center: new google.maps.LatLng(46.904785, 8.243424),
    scrollWheel: false,
    zoom: 8,
    minZoom: 8,
    maxZoom: 15,
  },

  'stop_icon_default' : '/static/map/icon/cross_black.png',
  'stop_icon_active'  : '',
};

/* **************************************
                OBJECTS
**************************************** */
function JsonClient(baseUrl) {
    this.get = function(url, callback) {
      var httpRequest = new XMLHttpRequest();

      httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState == 4 && httpRequest.status == 200 ) {
          callback(JSON.parse(httpRequest.responseText));
        }
      }

      httpRequest.open("GET", baseUrl + url, true);
      httpRequest.send();
    }
  }

/* **************************************
                FUNCTIONS
**************************************** */
/**
* Parameters:
*   hours, minutes: integers
*
* Returns:
*   the time in format HHMM, including zeros
*/
function formatTime(hours, minutes) {
  sHours = hours < 10 ? '0' + hours : '' + hours;
  sMinutes = minutes < 10 ? '0' + minutes : '' + minutes;

  return sHours + sMinutes;
}
