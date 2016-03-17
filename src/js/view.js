
var map;//this object keeps the map
var infoWindow;//this object keeps the infoWindow
var service;//this object keeps the google PlacesService results
var modelName;//this object is used to keep the name of a city
var streetviewUrl;//keeps the url for google streetview
var newPlace;//keeps the new place information to create a new marker

//when service.textSearch is called the callback will handle the results
function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    createMapMarker(results[0]);
  }
  else{
    vM.viewModel.showToast('Sorry place not found');
  }
}
//this method finds the locations parameter to create the marker using the google PlacesService
function pinPoster(locations) {
  for (var place in locations) {
    var request = {
      query: locations[place].location
    };
    service.textSearch(request, callback);
  }
}
//initializeMap is called when the app is lunched
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
//this function is to create the markers and set them into the map
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
  vM.viewModel.markers.push(marker);
  var newPlaceFromDB = false;
  for(item in vM.viewModel.addedPlacesList){
    newPlace = vM.viewModel.addedPlacesList[item];
    if(marker.title === newPlace.name){
      newPlaceFromDB = true;
    }
  }
  if(vM.viewModel.newFrom === 'APP' || (vM.viewModel.newFrom === 'FIREBASE' && newPlaceFromDB)){
    var newPlace = {
      'name' : name,
      'location' : formattedAddress
    };
    vM.viewModel.addedList.push(newPlace);
    var addedfromDB = true;
    if(vM.viewModel.dbLoaded === false){
      vM.viewModel.updatedFirebase();
      addedfromDB = false;
    }

    vM.viewModel.showToast(name + ' added to list');
    var streetviewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location=' + formattedAddress + '';
    infoWindow.setContent('<h3>' + name + '</h3><h4>' + formattedAddress + '</h4><br><center><img class="street-view-img" src="' + streetviewUrl + '"><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"><i class="material-icons mdl-list__item-icon" style="color: white;">visibility</i> - Show info</button></center>');
    if(addedfromDB === false){
      infoWindow.open(map, marker);
    }
    $('#more-info').click(function() {
      $(this).text(function(i, text){
          return text === 'Hide info' ? 'Show info' : 'Hide info';
      });
      $('#righ-sidebar').toggleClass('is-visible');
    });
    if(vM.viewModel.newFrom === 'APP'){
      vM.viewModel.newFrom = 'NULL';
    }

    vM.viewModel.currentInfo(newPlace);
    vM.viewModel.loadInfoSelected();
  }
  google.maps.event.addListener(marker, 'click', function() {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    setTimeout(function(){ marker.setAnimation(null); }, 1400);
    var contentString = '';
    var findMarker = true;
    for(center in vM.viewModel.addedList()){
      modelName = vM.viewModel.addedList()[center].name;
      if(modelName === name){
        findMarker = false;
        streetviewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location=' + vM.viewModel.addedList()[center].location + '';
        contentString = '<h3>' + vM.viewModel.addedList()[center].name + '</h3><h4>' + vM.viewModel.addedList()[center].location + '</h4><center><img class="street-view-img" src="' + streetviewUrl + '">';
        vM.viewModel.currentInfo(vM.viewModel.addedList()[center]);
      }
    }
    if(findMarker){
      for(center in vM.viewModel.centers()){
        modelName = vM.viewModel.centers()[center].name;
        if(modelName === name){
          streetviewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location=' + vM.viewModel.centers()[center].location + '';
          contentString = '<h3>' + vM.viewModel.centers()[center].name + '</h3><h4>' + vM.viewModel.centers()[center].location + '</h4><center><img class="street-view-img" src="' + streetviewUrl + '">';
          vM.viewModel.currentInfo(vM.viewModel.centers()[center]);
        }
      }
    }
    vM.viewModel.loadInfoSelected();
    var textButton;
    if($('#more-info').text() === 'Hide info'){
      textButton = 'Hide info';
    }
    else{
      textButton = 'Show info';
    }

    contentString = contentString + '<br><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-js-ripple-effect"><i class="material-icons mdl-list__item-icon" style="color: white;">visibility</i> - ' + textButton + '</button></center>';
    infoWindow.setContent(contentString);

    if(!vM.viewModel.filterFlag){
      infoWindow.open(map, marker);
    }
    $('#more-info').click(function() {
      $(this).text(function(i, text){
        return text === 'Hide info' ? 'Show info' : 'Hide info';
      });
      $('#righ-sidebar').toggleClass('is-visible');
    });
  });
  bounds.extend(new google.maps.LatLng(lat, lon));
  map.fitBounds(bounds);
  map.setCenter(bounds.getCenter());
}
//lunch the application when the window it's loaded
window.addEventListener('load', initializeMap);
//resize the map
window.addEventListener('resize', function(e) {
  map.fitBounds(mapBounds);
});
//add map to the mapDiv
var googleMap = '<div id="map"></div>';
$('#mapDiv').append(googleMap);
