$(document).ready(function() {
  $.when(
    $('utils.js'), 
    $('stop_weights.js')
  ).done( function() {
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
    var stop_id_to_stops = {};
    var active_stop = null;
    var id_to_reachable_stops = {};

    var visible_stops = {};
    var nb_stops = 1801;
    var data_loaded = false;

    //path
    var flightPath = new google.maps.Polyline(lines);

    // map object
    var map = new google.maps.Map(document.getElementById("map-canvas"), map_constants.options);
    map.set('styles', map_constants.styles);

    // shortest path from active stop to hovered stop
    var flightPath = new google.maps.Polyline(lines);

    // zoom level of the map
    var zoom = map_constants.options.zoom;

    // departure time
    var dep_time = map_constants.default_dep_time;

    var bounds = google.maps.LatLngBounds();


    /* **************************************
                    INIT TASKS
    **************************************** */
    // register the listeners on the map
    google.maps.event.addListener(map, 'tilesloaded', onMapLoaded);
    google.maps.event.addListener(map, 'click', onMapClick);
    google.maps.event.addListener(map, 'zoom_changed', onZoomChanged);
    google.maps.event.addListener(map, 'bounds_changed', setMapBounds);

    // register change listener on dep_time selector
    document.getElementById('deptime_select').addEventListener('change', onDepTimeChanged);
    document.getElementById('deptime_select').value = map_constants.default_dep_time_js;
    
    var stop_slider = document.getElementById('slider');
    stop_slider.oninput = function() {
      document.getElementById('value').innerHTML = stop_slider.value;
    };
    stop_slider.onchange = function() {
      nb_stops = document.getElementById('value').innerHTML = stop_slider.value;
      updateStopsVisibility();
    }

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
        data_loaded = true;
        setMapBounds();
      });

      MAP_LOADED_ONCE = true;
    }

    function setMapBounds() {
      if(data_loaded) {
        bounds = map.getBounds();
        updateStopsVisibility();
      }
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

        setStopsInfo(active_stop.name);

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
            var edge = id_to_reachable_stops[s.id];
            var time_arrival = edge.time_arrival;

            setPathInfo(active_stop.name, s.name, time_arrival);
            draw_path(edge);
          }
        });

        // when the user finishes hovering, we delete the path
        s.bubble.addListener('mouseout', function() {
          flightPath.setMap(null);
          if(s.id in id_to_reachable_stops) {
            setStopsInfo(active_stop.name);
          }
        })
      });
      
    }

    /**
    * Draw the lines of a path from a given stop edge til the current activate stop
    */
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
          setVisibility(s);
        }
      });

      // Setup color scale
      var data = reachable_stops.map(rs => rs.time_arrival);
      data.sort();
      var limits = chroma.limits(data, 'q', 20);
      var color_scale = chroma.scale(['green', 'yellow', 'orange', 'red', 'red']).mode('lab').domain(limits, 20, 'quantiles');

      // Compute statistics
      var median = data[ ~~(data.length / 2) ];
      $("#stat-median").text(format(median));
      $("#stat-std").text(format(~~standardDeviation(data)));

      // paint every reachable stop from the active one
      reachable_stops.forEach(function(rs) {
        if (rs.stop_id in stop_id_to_stops && rs.stop_id != active_stop.id) {
          s = stop_id_to_stops[rs.stop_id];
	  var color = color_scale(rs.time_arrival);
          //var color = getGradientColor(rs.time_arrival);
          //var color = getColor(rs.time_arrival);
          bubble_set_reachable(s.bubble, color, color, zoom);
        }
      });
    }

    /**
    * Set the visibility for a given stop
    */
    function setVisibility(stop) {
      if(stop.id != active_stop.id || active_stop.active == false) {
        var visible = Boolean(stop.id in visible_stops);
        stop.bubble.setVisible(visible);
      } else {
        stop.bubble.setVisible(true);
      }
    }

    /**
    * Update visibility for all stops
    */
    function updateStopsVisibility() {
      visible_stops = getVisitbleStops();
      //console.log(Object.keys(visible_stops).length);
      stops.forEach( function(s) {
        var visible = Boolean(s.id in visible_stops);
        s.bubble.setVisible(visible);
      });
      if(active_stop != null) {
        active_stop.bubble.setVisible(true);
      }
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
        setVisibility(active_stop);
        bubble_set_default(active_stop.bubble, zoom);
      }

      active_stop = stop;
      active_stop.active = true;
      active_stop.bubble.setVisible(true);
      bubble_set_active(active_stop.bubble, zoom);
    }

    /**
    * Set of stops that are visible in the current level of zoom and are bounded by the selected maximum number of stops
    */
    function getVisitbleStops() {
      visible_stops = {};
      var count = 0;
      var i;
      for(i = 0; count < nb_stops && i < stop_weigthed_order.length; i++) {
        var stop_id = stop_weigthed_order[i][0];
        var stop = stop_id_to_stops[stop_id];
        var stop_latlng = new google.maps.LatLng(stop.lat, stop.lng);
        
        if(bounds.contains(stop_latlng)) {
          visible_stops[stop_id] = stop_weigthed_order[i][1];
          count++;
        }
      }
      return visible_stops;
    }
  }

});
