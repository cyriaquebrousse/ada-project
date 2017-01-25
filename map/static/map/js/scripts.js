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
    var stop_ids = {};
    var stop_latlngs = {};

    var active_stop = null;
    var graph = [];

    // map object
    var map = new google.maps.Map(document.getElementById("map-canvas"), map_constants.options);
    map.set('styles', map_constants.styles);

   
    var client = new JsonClient(STATIONS_URL);
    client.get('', function(response) {
    	stops = response.stops;
      resolveStop(stops);

      // register the listeners on the map
    	google.maps.event.addListener(map, 'tilesloaded', onMapLoaded);
    	google.maps.event.addListener(map, 'click', onMapClick);
    })
    /**
    * Callback for when map is loaded
    */
    function onMapLoaded() {     
        createMarkerForStops();
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
          activateStop(stop_ids[response.closest_stop.id]);

          // then query for the isochrone network
          new JsonClient(ISOCHRONE_URL).get(active_stop.id + '/' + formatTimeNow(), function(response) {
            draw_reachable_stops(response.reachable_stops);
          });
        });
      });

      function draw_reachable_stops(reachable_stops) {
      	//console.log(reachable_stops)
      	//console.log(stop_ids)
      	cleanGraph();
      	reachable_stops.forEach( 	function(node) {
      		if(node.stop_id in stop_ids) {
	      		var stop = stop_ids[node.stop_id];
	      		var marker = stop.bubble;
	      		marker.setMap(map);
	      		graph.push(stop);
        	}
      	});
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
    }

    function cleanGraph() {
    	graph.forEach(function(stop) {
    		stop.bubble.setMap(null);
    	});
    }

    /**
    * Parameters:
    *   stop_id id of the Stop object we want to retrieve
    */
    function resolveStop(listStops) {
      listStops.forEach(function(s) {
        var latlng = new google.maps.LatLng(s.lat, s.lng)
        //console.log(s.id)
        stop_ids[s.id] = s
        stop_latlngs[latlng] = s
      });
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
        s['bubble'] = new google.maps.Circle({  
        	center: new google.maps.LatLng(s.lat, s.lng),  
        	fillColor:map_constants.bubble.fill.color,  
	        fillOpacity:map_constants.bubble.fill.opacity,  
        	strokeColour:map_constants.bubble.stroke.color,  
        	strokeWeight:map_constants.bubble.stroke.weight,  
        	strokeOpacity:map_constants.bubble.stroke.opacity,  
	        radius:1000
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
        active_stop.marker.setMap(null);
      }

      active_stop = stop;
      console.log(stop);
      active_stop.active = true;
      active_stop.marker.setIcon(map_constants.stop_icon_active);
      console.log('> activated stop: ' + active_stop);
    }
  }

});
