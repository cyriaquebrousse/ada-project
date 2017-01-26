$(document).ready(function() {
  $('utils.js', function() {
    //wait for loading of included script and execute init
    google.maps.event.addDomListener(window, 'load', initialize);
  });

  function initialize() {
    /* **************************************
                   CONSTANTS
    **************************************** */
    // URL constants
    var ISOCHRONE_URL = '/map/isochrone/';
    var STATIONS_URL = '/map/stations/';
    var CLOSEST_STOP_URL = '/map/closest-stop/';

    // flag for map initial loading
    var MAP_LOADED_ONCE = false;

    // time range
    var START_TIME = 10 * 60;
    var END_TIME = 10 * 60 * 60;

    // all stops, with their bubble
    var stops = {};
    var stop_id_to_stops = {}
    var active_stop = null;
    var id_to_reachable_stops = {};

    // map object
    var map = new google.maps.Map(document.getElementById("map-canvas"), map_constants.options);
    map.set('styles', map_constants.styles);

    // shortest path from active stop to hovered stop
    var flightPath = new google.maps.Polyline(lines);

    // zoom level of the map
    var zoom = map_constants.options.zoom;

    // departure time
    var dep_time = map_constants.default_dep_time;

    /* **************************************
                    INIT TASKS
    **************************************** */
    // register the listeners on the map
    google.maps.event.addListener(map, 'tilesloaded', onMapLoaded);
    google.maps.event.addListener(map, 'click', onMapClick);
    google.maps.event.addListener(map, 'zoom_changed', onZoomChanged);

    // register change listener on dep_time selector
    document.getElementById('deptime_select').addEventListener('change', onDepTimeChanged);
    document.getElementById('deptime_select').value = map_constants.default_dep_time_js;

     /* **************************************
                    FUNCTIONS
      **************************************** */
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
        change_tips_text('You can now hover on stations to show the shortest path, or click on another stop.');
        document.getElementById('visible_on_active_stop').style.display = 'block';
        document.getElementById('active_stop_text').innerHTML = active_stop.name;

        // then query for the isochrone network
        fireIsochroneQuery();
      });
    }

    /**
    * Callback for when zoom level was changed
    */
    function onZoomChanged() {
      var old_zoom = zoom;
      zoom = map.getZoom();

      // scale the radius for each bubble
      stops.forEach(function(s) {
        s.bubble.setRadius(bubble_radius_for_new_zoom(s.bubble.getRadius(), old_zoom, zoom));
      });
    }

    /*
    * Callback for when the user changed the departure time in the control panel
    */
    function onDepTimeChanged() {
      var new_deptime = document.getElementById('deptime_select').value;
      dep_time = formatTime(new_deptime, 0);
      console.log('departure time changed to '+ dep_time);

      if (active_stop != null && active_stop.id > 0) {
        fireIsochroneQuery();
      }
    }

    /*
    * Triggers the query for the isochrone network.
    * When calling, make sure a stop is active by checking:
    *   active_stop != null && active_stop.id > 0
    */
    function fireIsochroneQuery() {
      new JsonClient(ISOCHRONE_URL).get(active_stop.id + '/' + dep_time, function(response) {
        id_to_reachable_stops = {};
        var reachable_stops = response.reachable_stops;

        resolveRechableStops(response.reachable_stops);
        paintIsochroneBubbles(response.reachable_stops);
      });
    }

    /**
    * Resolves the stop objects into their ids. Puts the ids in a dictionary.
    */
    function resolveStops(stop_list) {
      stop_list.forEach(function(s) {
        stop_id_to_stops[s.id] = s;
      });
    }

    /**
    * Resolves the rechable stops (edge) objects into their ids. Puts the ids in a dictionary.
    */
    function resolveRechableStops(stop_list) {
      stop_list.forEach(function(s) {
        id_to_reachable_stops[s.stop_id] = s; 
      })
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
          //clickable: false,
          map: map,
        });
        bubble_set_default(s.bubble, zoom);

        // add listener for hovering. we then need to draw the shortest path from the active stop
        s.bubble.addListener('mouseover', function(){
          if(s.id in id_to_reachable_stops) {
            var l = s.bubble.center;
            draw_path(id_to_reachable_stops[s.id])
          }
        });

        // when the user finishes hovering, we delete the path
        s.bubble.addListener('mouseout', function() {
          flightPath.setMap(null);
        })
      });
      
    }

    function draw_path(edge) {
      path_coordinates = [];
      var current_edge = edge;
      while(current_edge.stop_id != active_stop.id) {
        var stop = stop_id_to_stops[current_edge.stop_id];
        path_coordinates.push({lat: stop.lat, lng: stop.lng});
        current_edge = id_to_reachable_stops[current_edge.prev_stop_id];
      }

      path_coordinates.push({lat: active_stop.lat, lng: active_stop.lng})

      flightPath.setOptions({
        path: path_coordinates
      });
      flightPath.setMap(map);
    }

    function getGradientColor(value) {
      //value from 0 to 1
      var v = Math.min(1, (value) / END_TIME );
      var hue=(( v )*120).toString(10);
      return ["hsl(",hue,",100%, 50%)"].join("");
    }

    function getColor(value){
      var v = Math.min((value) / end_time, 1);
      var index = Math.round(red_mix_color.red_yellow.length * (1-v)) - 1;
      return red_mix_color.red_yellow[index];
    }

    function paintIsochroneBubbles(reachable_stops) {
      stops.forEach(function(s) {
        // reset every stop except the active one
        if (s.id != active_stop.id) {
          bubble_set_default(s.bubble, zoom);
        }
      });

      // paint every reachable stop from the active one
      reachable_stops.forEach(function(rs) {
        if (rs.stop_id in stop_id_to_stops && rs.stop_id != active_stop.id) {
          s = stop_id_to_stops[rs.stop_id];
          var color = getGradientColor(rs.time_arrival);
          //var color = getColor(rs.time_arrival);
          bubble_set_reachable(s.bubble, color, color, zoom);
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
        bubble_set_default(active_stop.bubble, zoom);
      }

      active_stop = stop;
      active_stop.active = true;
      bubble_set_active(active_stop.bubble, zoom);
    }
  }

});
