  
$(document).ready(function(){/* google maps -----------------------------------------------------*/
google.maps.event.addDomListener(window, 'load', initialize);
  
  function initialize() {

    var URL = "http://127.0.0.1:8000/map/isochrone/";
    /* position Switzerland */
    var center_lat = 46.904785;
    var center_lon = 8.243424;
    var  iniLatLng = new google.maps.LatLng(center_lat, center_lon);

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
    map.setOptions({ minZoom: 8, maxZoom: 15 });

    var marker = new google.maps.Marker({
      position: iniLatLng,
      map: map
    });

    var redLine = new google.maps.Polyline();
   
    google.maps.event.addListener(map, 'click', function(event) {
      redLine.setMap(null);

      var lat = event.latLng.lat();
      var lng = event.latLng.lng();

      checkPos(lat, lng);     
    });

    function drawLines(latlng) {
      redLine.setMap(null);

      redLine = new google.maps.Polyline({
            path : [iniLatLng,  latlng],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
      });

      redLine.setMap(map)
    }

    function checkPos(lat, lng) {
      var geocoder = new google.maps.Geocoder();
      var latlng = new google.maps.LatLng(lat, lng);
      geocoder.geocode({ 'latLng': latlng }, function (results, status) {
        res = false;
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[1]) {                
            //get the required address & check
            if(getCountry(results[1].address_components)) {
              var client = new HttpClient();
              client.get(URL + lat + ',' + lng, function(response) {
                newLatLag = new google.maps.LatLng(response.lat, response.log)
                drawLines(newLatLag);
              });
            }
          }
        }
      });
    };

    function getCountry(addrComponents) {
      for (var i = 0; i < addrComponents.length; i++) {
        if (addrComponents[i].types[0] == "country"){ //||
          //(addrComponents[i].types.leng >= 2 && addrComponents[i].types[1] == "country" )) {
            
          if(addrComponents[i].short_name == "CH") {
            return true;
          }
          return false;
        }
      }
      return false;
    }

  };
  /* end google maps -----------------------------------------------------*/

  function HttpClient() {
    this.get = function(aUrl, aCallback) {
      var anHttpRequest = new XMLHttpRequest();
      anHttpRequest.onreadystatechange = function() { 
          console.log(anHttpRequest);
          if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200 ) {
              aCallback(JSON.parse(anHttpRequest.responseText));              
          }
      }
      anHttpRequest.open( "GET", aUrl, true );            
      anHttpRequest.send();
    }
  }
});