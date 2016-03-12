var Octopus = function() {
  this.centers = ko.observableArray(model.centers);
  this.markers = ko.observableArray();
  this.addedList = ko.observableArray();
  this.newPlaceFlag = false;
};

var vM = { viewModel: new Octopus() };
ko.applyBindings(vM.viewModel);

var map;
var infoWindow;
var service;

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    createMapMarker(results[0]);
  }
  else{
    'use strict';
    var snackbarContainer = document.querySelector('#demo-toast-example');
    var data = {message: 'Sorry place not found'};
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }
}

function pinPoster(locations) {
  for (var place in locations) {
    var request = {
      query: locations[place].location
    };
    service.textSearch(request, callback);
  }
}

function initializeMap() {
  var locations;
  var mapOptions = {
    disableDefaultUI: true
  };

  map = new google.maps.Map(document.querySelector('#map'), mapOptions);
  service = new google.maps.places.PlacesService(map);

  infoWindow = new google.maps.InfoWindow({
    content: "marker"
  });

  window.mapBounds = new google.maps.LatLngBounds();

  pinPoster(vM.viewModel.centers());

  google.maps.event.addListener(map, 'click', function() {
      infoWindow.close();
  });
}

function createMapMarker(placeData) {
  var lat = placeData.geometry.location.lat();
  var lon = placeData.geometry.location.lng();
  var name = placeData.name;
  var bounds = window.mapBounds;
  var formattedAddress = placeData.formatted_address;

  var marker = new google.maps.Marker({
    map: map,
    position: placeData.geometry.location,
    title: name
  });

  vM.viewModel.markers.push(marker);

  if(vM.viewModel.newPlaceFlag){
    var newPlace = {
      'name' : name,
      'location' : formattedAddress,
      'marker' : marker
    }
    vM.viewModel.addedList.push(newPlace);
    showToast(name + ' added to list');

    infoWindow.setContent('<h2>' + name + '</h2>' + formattedAddress);
    infoWindow.open(map, marker);
  }


  google.maps.event.addListener(marker, 'click', function() {
    var contentString = '';

    if(vM.viewModel.newPlaceFlag){
      for(center in vM.viewModel.addedList()){
        var modelName = vM.viewModel.addedList()[center].name;
        if(modelName === name){
          contentString = '<h2>' + vM.viewModel.addedList()[center].name + '</h2>' + vM.viewModel.addedList()[center].location;
        }
      }
      vM.viewModel.newPlaceFlag = false;
    }
    else{
      for(center in vM.viewModel.centers()){
        var modelName = vM.viewModel.centers()[center].name;
        if(modelName === name){
          contentString = '<h2>' + vM.viewModel.centers()[center].name + '</h2>' + vM.viewModel.centers()[center].location;
        }
      }
    }

    infoWindow.setContent(contentString);
    infoWindow.open(map, marker);
  });

  bounds.extend(new google.maps.LatLng(lat, lon));
  map.fitBounds(bounds);
  map.setCenter(bounds.getCenter());
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for(marker in vM.viewModel.markers()){
    vM.viewModel.markers()[marker].setMap(map);
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}

window.addEventListener('load', initializeMap);

function viewMarker (nameMaker, added){
  for(marker in vM.viewModel.markers()){
    var makerNm = vM.viewModel.markers()[marker].title;
    if(makerNm === nameMaker){
      console.log(added);
      if(added){
        vM.viewModel.newPlaceFlag = true;
      }
      google.maps.event.trigger(vM.viewModel.markers()[marker], 'click');
    }
  }

  $('#menu-principal').removeClass('is-visible');
  $('.mdl-layout__obfuscator').removeClass('is-visible');
}



var googleMap = '<div id="map"></div>';
$('#mapDiv').append(googleMap);

$( "#filter-title" ).click(function() {
  $('#menu-filter').addClass('is-focused');
  $( "#filter-input" ).focus();
});

$( "#title-search" ).click(function() {
  $('#main-search').addClass('is-focused');
  $( "#search-field" ).focus();
});


window.addEventListener('resize', function(e) {
  map.fitBounds(mapBounds);
});

function resizeMap(){
  var resizeH = $( window ).innerHeight() - $('.android-header').height();
  resizeH += 'px';
  $('#mapDiv').css("height",resizeH);
};
$(document ).bind( "ready", resizeMap());
$( window ).resize(resizeMap);

function sendNewPlace(){
  vM.viewModel.newPlaceFlag = true;
  var newPlace = {
    'name' : $('#search-field').val(),
    'location' : $('#search-field').val() + ', Harrisburg',
    'marker' : {}
  }
  pinPoster([newPlace]);
  $('#search-field').val("");
  $('#main-search').removeClass('is-dirty');

};

document.querySelector('#demo-show-toast').addEventListener('click', function() {
  sendNewPlace();
});

$( "#search-field" ).keypress(function(e) {
  var key = e.which;
  if(key == 13) {
    sendNewPlace();
  }
});

function showToast(text){
  'use strict';
  var snackbarContainer = document.querySelector('#demo-toast-example');
  var data = {message: text};
  snackbarContainer.MaterialSnackbar.showSnackbar(data);
}
(function($){
$(document).ready(function(){
$('#menuToggle').click(function(e){
var $parent = $(this).parent('nav');
$parent.toggleClass("open");
var navState = $parent.hasClass('open') ? "hide" : "show";
$(this).attr("title", navState + " navigation");
// Set the timeout to the animation length in the CSS.
setTimeout(function(){
console.log("timeout set");
$('#menuToggle > span').toggleClass("navClosed").toggleClass("navOpen");
}, 200);
e.preventDefault();
});
});
})(jQuery);
