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

};

// styles for the bubbles
var bubbles = {
  default_stroke_color: 'gray',
  default_stroke_opacity: 0.8,
  default_stroke_weight: 0.5,
  default_fill_color: 'gray',
  default_fill_opacity: 0.3,
  default_radius: 2000,

  active_stroke_color: 'black',
  active_stroke_opacity: 1,
  active_stroke_weight: 0.5,
  active_fill_color: 'black',
  active_fill_opacity: 1,
  active_radius: 4000,

  reachable_stroke_opacity: 0.8,
  reachable_stroke_weight: 0.5,
  reachable_fill_opacity: 0.5,
  reachable_radius: 2000,
}

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
  var sHours = hours < 10 ? '0' + hours : '' + hours;
  var sMinutes = minutes < 10 ? '0' + minutes : '' + minutes;

  return sHours + sMinutes;
}

/**
* Returns:
*   the time it is now, according to the specification for #formatTime(hours, minutes)
*/
function formatTimeNow() {
  var now = new Date();
  return formatTime(now.getHours(), now.getMinutes());
}


/**
* Parameters:
*   curr_radius the current radius of the bubble, in meters
*   old_zoom the previous zoom level, integer
*   new_zoom the new zoom level, integer
*
* Returns:
*   the new radius of the bubble for the new zoom level, in meters
*/
function bubble_radius_for_new_zoom(curr_radius, old_zoom, new_zoom) {
  var delta_zoom = new_zoom - old_zoom;
  return curr_radius / Math.pow(2, delta_zoom);
}

/**
* Parameters:
*   radius the radius corresponding to the default zoom level, in meters
*   zoom the current zoom level
*
* Returns:
*   the new radius of the bubble, in meters
*/
function bubble_radius_for_zoom(radius, zoom) {
  var delta_zoom = zoom - map_constants.options.zoom;
  return radius / Math.pow(2, delta_zoom);
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

function bubble_set_default(bubble, zoom) {
  bubble.setOptions({
    strokeColor: bubbles.default_stroke_color,
    strokeOpacity: bubbles.default_stroke_opacity,
    strokeWeight: bubbles.default_stroke_weight,
    fillColor: bubbles.default_fill_color,
    fillOpacity: bubbles.default_fill_opacity,
    radius: bubble_radius_for_zoom(bubbles.default_radius, zoom),
  });
}

function bubble_set_active(bubble, zoom) {
  bubble.setOptions({
    strokeColor: bubbles.active_stroke_color,
    strokeOpacity: bubbles.active_stroke_opacity,
    strokeWeight: bubbles.active_stroke_weight,
    fillColor: bubbles.active_fill_color,
    fillOpacity: bubbles.active_fill_opacity,
    radius: bubble_radius_for_zoom(bubbles.active_radius, zoom),
  });
}

function bubble_set_reachable(bubble, strokeColor, fillColor, zoom) {
  bubble.setOptions({
    strokeColor: strokeColor,
    strokeOpacity: bubbles.reachable_stroke_opacity,
    strokeWeight: bubbles.reachable_stroke_weight,
    fillColor: fillColor,
    fillOpacity: bubbles.reachable_fill_opacity,
    radius: bubble_radius_for_zoom(bubbles.reachable_radius, zoom),
  });
}
