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

    // flag for map initial loading
    var MAP_LOADED_ONCE = false;

    //time range
    var end_time = 10 * 60 * 60;
    var start_time = 10 * 60;

    // all stops, with their bubble
    var stops = {};
    var stop_id_to_stops = {}
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
      if (MAP_LOADED_ONCE) {
        // the map is already instantiated, no need for repainting all bubbles
        return;
      }

      var client = new JsonClient(STATIONS_URL);
      client.get('', function(response) {
        stops = response.stops;
        resolveStops(stops);
        createBubbles();
      });
      MAP_LOADED_ONCE = true;
    }

    /**
    * Callback for map click
    * Parameters:
    *   event the event that triggered the callback
    */
    function onMapClick(event) {
      // get coordinates from the click
      var latLng = event.latLng;

      // first get the closest stop ID
      new JsonClient(CLOSEST_STOP_URL).get(latLng.lat() + ',' + latLng.lng(), function(response) {
        activateStop(stop_id_to_stops[response.closest_stop.id]);

        // then query for the isochrone network
        new JsonClient(ISOCHRONE_URL).get(active_stop.id + '/' + formatTimeNow(), function(response) {
          paintIsochroneBubbles(response.reachable_stops);
        });
      });
    }

    /**
    * Resolves the stop objects into their ids. Puts the ids in a dictionary.
    */
    function resolveStops(stop_list) {
      stop_list.forEach(function(s) {
        stop_id_to_stops[s.id] = s
      });
    }

    /**
    * Creates a bubble and its associated properties for each stop.
    * Each bubble is registered in its corresponding Stop object.
    */
    function createBubbles() {
      stops.forEach(function(s) {
        s['active'] = false;
        s['bubble'] = new google.maps.Circle({
          center: new google.maps.LatLng(s.lat, s.lng),
          map: map,
        });
        bubble_set_default(s.bubble);
      });
    }

    function getGradientColor(value) {
      //value from 0 to 1
      var v = Math.min(1, (value) / end_time );
      var hue=(( v )*120).toString(10);
      return ["hsl(",hue,",100%,50%)"].join("");
    }

    function getColor(value){
      var v = Math.min((value) / end_time, 1);
      var index = Math.round(red_mix_color.red_blue.length * (1-v)) - 1;
      console.log(red_mix_color.red_blue[index])
      return red_mix_color.red_blue[index];
    }

    function paintIsochroneBubbles(reachable_stops) {
      stops.forEach(function(s) {
        // reset every stop except the active one
        if (s.id != active_stop.id) {
          bubble_set_default(s.bubble);
        }
      });

      // paint every reachable stop from the active one
      reachable_stops.forEach(function(rs) {
        // TODO
        if (rs.stop_id in stop_id_to_stops && rs.stop_id != active_stop.id) {
          s = stop_id_to_stops[rs.stop_id];
          var color = getGradientColor(rs.time_arrival);
          bubble_set_reachable(s.bubble, color, color);
        }
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
        bubble_set_default(active_stop.bubble);
      }

      active_stop = stop;
      active_stop.active = true;
      bubble_set_active(active_stop.bubble);
      console.log('> activated stop: ' + active_stop.name);
    }

  }

});
