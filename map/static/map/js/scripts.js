$(document).ready(function() {
  $('utils.js', function() {
    //wait for loading of included script and execute init
    google.maps.event.addDomListener(window, 'load', initialize);
  });

  function initialize() {
    // URL constants
    var ISOCHRONE_URL = '/map/isochrone/';
    var STATIONS_URL = '/map/stations/';
    var CLOSEST_STOP_URL = '/map/closest-stop/';

    // all stops, with their marker
    var stops = {};
    var active_stop = null;

    // map object
    var map = new google.maps.Map(document.getElementById("map-canvas"), map_constants.options);
    map.set('styles', map_constants.styles);

    // register the listeners on the map
    google.maps.event.addListener(map, 'tilesloaded', onMapLoaded);
    google.maps.event.addListener(map, 'click', onMapClick);

    /**
    * Callback for when map is loaded
    */
    function onMapLoaded() {
      var client = new JsonClient(STATIONS_URL);
      client.get('', function(response) {
        stops = response.stops;
        createMarkerForStops();
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
        // first get the closest stop ID
        new JsonClient(CLOSEST_STOP_URL).get(latLng.lat() + ',' + latLng.lng(), function(response) {
          activateStop(resolveStop(response.closest_stop.id));

          // then query for the isochrone network
          new JsonClient(ISOCHRONE_URL).get(active_stop.id + '/' + formatTimeNow(), function(response) {
            console.log('isochrone from stop ' + active_stop + ':');
            console.log(response.reachable_stops);
          });
        });
      });

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

    }

    /**
    * Parameters:
    *   stop_id id of the Stop object we want to retrieve
    */
    function resolveStop(stop_id) {
      var res = null;
      stops.forEach(function(s) {
        if (s.id == stop_id) {
          res = s;
        }
      });
      return res;
    }

    /**
    * Creates a marker and its associated properties for each stop.
    * Each marker is registered in its corresponding Stop object.
    */
    function createMarkerForStops() {
      stops.forEach(function(s) {
        s['active'] = false;
        s['marker'] = new google.maps.Marker({
          position: new google.maps.LatLng(s.lat, s.lng),
          map: map,
          clickable: false,
          title: s.name,
          icon: map_constants.stop_icon_default,
        });
      });
    }

    /**
    * Activates (highlights and set active_stop pointer) the given Stop object.
    *
    * Parameters:
    *   stop a Stop object, not its ID.
    */
    function activateStop(stop) {
      if (active_stop != null) {
        active_stop.active = false;
        active_stop.marker.setIcon(map_constants.stop_icon_default);
      }

      active_stop = stop;
      active_stop.active = true;
      active_stop.marker.setIcon(map_constants.stop_icon_active);
      console.log('> activated stop: ' + active_stop.name);
    }
  }

});
