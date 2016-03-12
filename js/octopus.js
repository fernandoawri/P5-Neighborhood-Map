var Octopus = function() {
  this.centers = ko.observableArray(model.centers);
  this.markers = ko.observableArray();
  this.backUp = ko.observableArray();
  this.currentInfo = ko.observable(currentInfo);
  this.addedList = ko.observableArray();
  this.newPlaceFlag = false;
  this.filterFlag = false;
  this.filtered = false;


  this.showToast = function (text){
    'use strict';
    var snackbarContainer = document.querySelector('#toast-map-message');
    var data = {message: text};
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }

  this.viewMarker = function (nameMaker, added){
      for(marker in this.markers()){
        var makerNm = this.markers()[marker].title;
        if(makerNm === nameMaker){
          if(added){
            this.newPlaceFlag = true;
          }
          google.maps.event.trigger(this.markers()[marker], 'click');
        }
      }

      if(!this.filterFlag){
        $('#menu-principal').removeClass('is-visible');
        $('.mdl-layout__obfuscator').removeClass('is-visible');
      }
  }

  this.updateList = function (text, centers){
    var count;
    if(this.filtered){
      count = this.backUp().length;
      this.centers.removeAll();
      for(var i = 0; i < count; i++){
        this.centers.push(this.backUp.pop());
      }
    }
    count = this.centers().length;
    for(var i = 0; i < count; i++){
      this.backUp.push(this.centers()[i]);
    }
    var temparray = [];
    for(var i = 0; i < count; i++){
      var namePlace = this.centers()[i].name.toLowerCase();
      if(namePlace.startsWith(text)){
        temparray.push(this.centers()[i]);
      }
    }
    this.centers.removeAll();
    for(var i = 0; i < temparray.length; i++){
      this.centers.push(temparray[i]);
    }

    this.filtered = true;
  }

  this.restoreData = function (){
    var count = this.backUp().length;
    if(count > 0){
      this.centers.removeAll();
      for(var i = 0; i < count; i++){
        this.centers.push(this.backUp.pop());
      }
    }
  }
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
    vM.viewModel.showToast('Sorry place not found');
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
    content: 'marker'
  });

  window.mapBounds = new google.maps.LatLngBounds();

  pinPoster(vM.viewModel.centers());

  google.maps.event.addListener(map, 'click', function() {
    $('#righ-sidebar').removeClass('is-visible');
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
    animation: google.maps.Animation.DROP,
    position: placeData.geometry.location,
    title: name
  });
  marker.addListener('click', function() {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    setTimeout(function(){ marker.setAnimation(null); }, 1400);
  });
  vM.viewModel.markers.push(marker);

  if(vM.viewModel.newPlaceFlag){
    var newPlace = {
      'name' : name,
      'location' : formattedAddress,
      'marker' : marker
    }
    vM.viewModel.addedList.push(newPlace);
    vM.viewModel.showToast(name + ' added to list');

    infoWindow.setContent('<h3>' + name + '</h3><h4>' + formattedAddress + '</h4><br><center><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored">More info</button></center>');
    infoWindow.open(map, marker);
    $('#more-info').click(function() {
      $('#righ-sidebar').toggleClass('is-visible');
    });
    vM.viewModel.newPlaceFlag = false;
  }

  google.maps.event.addListener(marker, 'click', function() {
    var contentString = '';

    if(vM.viewModel.newPlaceFlag){
      for(center in vM.viewModel.addedList()){
        var modelName = vM.viewModel.addedList()[center].name;
        if(modelName === name){
          contentString = '<h3>' + vM.viewModel.addedList()[center].name + '</h3><h4>' + vM.viewModel.addedList()[center].location + '</h4>';
        }
      }
      vM.viewModel.newPlaceFlag = false;
    }
    else{
      for(center in vM.viewModel.centers()){
        var modelName = vM.viewModel.centers()[center].name;
        if(modelName === name){
          contentString = '<h3>' + vM.viewModel.centers()[center].name + '</h3><h4>' + vM.viewModel.centers()[center].location + '</h4>';
        }
      }
    }

    contentString = contentString + '<br><center><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored">More info</button></center>';

    infoWindow.setContent(contentString);

    if(!vM.viewModel.filterFlag){
      infoWindow.open(map, marker);
      $('#righ-sidebar').addClass('is-visible');
      $('#more-info').text('Hide info');
    }

    $('#more-info').click(function() {
      $(this).text(function(i, text){
          return text === 'Hide info' ? 'Show info' : 'Hide info';
      })
      $('#righ-sidebar').toggleClass('is-visible');
    });
  });

  bounds.extend(new google.maps.LatLng(lat, lon));
  map.fitBounds(bounds);
  map.setCenter(bounds.getCenter());
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for(marker in vM.viewModel.markers()){
    for(item in vM.viewModel.centers()){
      if(vM.viewModel.centers()[item].name === vM.viewModel.markers()[marker].title){
        vM.viewModel.markers()[marker].setMap(map);
      }
    }
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

window.addEventListener('resize', function(e) {
  map.fitBounds(mapBounds);
});

var googleMap = '<div id="map"></div>';
$('#mapDiv').append(googleMap);

function loadlayout(){
  $('#filter-title').click(function() {
    $('#menu-filter').addClass('is-focused');
    $("#filter-input").focus();
  });

  $('#title-search').click(function() {
    $('#main-search').addClass('is-focused');
    $('#search-field').focus();
  });

  var resizeH = $( window ).innerHeight() - $('.android-header').height();
  resizeH += 'px';
  $('#mapDiv').css('height',resizeH);

  function sendNewPlace(){
    vM.viewModel.newPlaceFlag = true;
    var newPlace = {
      'name' : $('#search-field').val(),
      'location' : $('#search-field').val() + ', Harrisburg',
      'marker' : {}
    }
    pinPoster([newPlace]);
    $('#search-field').val('');
    $('#main-search').removeClass('is-dirty');
  };

  $('#search-field').keypress(function(e) {
    var key = e.which;
    if(key == 13) {
      sendNewPlace();
    }
  });

  document.querySelector('#button-show-toast').addEventListener('click', function() {
    if ($('#search-field').val() != null && $('#search-field').val() != '') {
      sendNewPlace();
    }
    else {
      vM.viewModel.showToast('Type a place');
    }
  });

  $("#filter-input").bind("keyup", function() {
    if ($(this).val() != null && $(this).val() != '') {
      vM.viewModel.filterFlag = true;
      clearMarkers();
      var text = $(this).val().toLowerCase();
      vM.viewModel.updateList(text);
      showMarkers();
      vM.viewModel.filterFlag = false;
    }
    else {
      vM.viewModel.filterFlag = true;
      vM.viewModel.restoreData();
      showMarkers();
      vM.viewModel.filterFlag = false;
      vM.viewModel.filtered = false;
    }
  });
};

$(document).bind('ready', loadlayout());
$(window).resize(loadlayout);
