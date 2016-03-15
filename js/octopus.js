var Octopus = function() {
  //observable objects
  var self = this;
  self.centers = ko.observableArray(model.centers);//this array keeps all default locations from model.js
  self.markers = ko.observableArray();//this array keeps all the markers to be dsiplayed on the map
  self.wikiList = ko.observableArray();//this array keeps all the infirmation found from wiki API for the currentInfo object
  self.yelpList = ko.observableArray();//this array keeps all the infirmation found from yelp API for the currentInfo object
  self.nyTimesList = ko.observableArray();//this array keeps all the infirmation found from NYT API for the currentInfo object
  self.flickrList = ko.observableArray();//this array keeps all the infirmation found flickr API for the currentInfo object
  self.backUp = ko.observableArray();//this array keeps all the models that are hidden while filtering the links
  self.currentInfo = ko.observable();//this object keeps the information for the selected Marker or link
  self.addedList = ko.observableArray();//this array keeps all new locations added to the map
  self.newPlaceFlag = false;//this flag is to check if a new location was entered on the search input
  self.filterFlag = false;//this flag is to check if the user is filtering some values
  self.filtered = false;//this flag is to check if the list has been filtered

  //This method shows the Toast that display the message if a new city was added to the addedList
  self.showToast = function (text){
    'use strict';
    var snackbarContainer = document.querySelector('#toast-map-message');
    var data = {message: text};
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }
  //this method actives the selected marker from the list
  self.viewMarker = function (nameMaker){
    for(marker in self.markers()){
      var makerNm = self.markers()[marker].title;
      if(makerNm === nameMaker){
        google.maps.event.trigger(self.markers()[marker], 'click');
      }
    }
    if(!self.filterFlag){
      $('#menu-principal').removeClass('is-visible');
      $('.mdl-layout__obfuscator').removeClass('is-visible');
    }
  }
  self.sendNewPlace = function (){
    this.newPlaceFlag = true;
    var newPlace = {
      'name' : $('#search-field').val(),
      'location' : $('#search-field').val() + ', PA'
    }
    pinPoster([newPlace]);
    $('#search-field').val('');
    $('#main-search').removeClass('is-dirty');
  };
  //this method is called when the user is start typing into the filter input
  // and updates the list on the screen
  self.updateList = function (text, centers){
    var count;
    if(self.filtered){
      count = self.backUp().length;
      self.centers.removeAll();
      for(var i = 0; i < count; i++){
        self.centers.push(self.backUp.pop());
      }
    }
    count = self.centers().length;
    for(var i = 0; i < count; i++){
      self.backUp.push(self.centers()[i]);
    }
    var temparray = [];
    for(var i = 0; i < count; i++){
      var namePlace = self.centers()[i].name.toLowerCase();
      if(namePlace.startsWith(text)){
        temparray.push(self.centers()[i]);
      }
    }
    self.centers.removeAll();
    for(var i = 0; i < temparray.length; i++){
      self.centers.push(temparray[i]);
    }

    self.filtered = true;
  }
  //this method is called when the user removed all charachters from the
  //filter input and restores the list to the original list
  self.restoreData = function (){
    var count = self.backUp().length;
    if(count > 0){
      self.centers.removeAll();
      for(var i = 0; i < count; i++){
        self.centers.push(self.backUp.pop());
      }
    }
  }
  //this method is called when the user select one marker and retrives
  //all information found in Wiki API and stores the data into wikiList
  self.loadWikiInfo = function (){
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.currentInfo().name + '&format=json&callback=wikiCallback';
    self.wikiList.removeAll();
    $.ajax({
      url: wikiUrl,
      dataType: 'jsonp',
      success: function(response) {
       var asticleList = response[1];
       var asticlePhraseList = response[2];
       for (var i = 0; i < asticleList.length; i++) {
         var articleStr = asticleList[i];
         var phrase = asticlePhraseList[i];
         var url = 'https://en.wikipedia.org/wiki/' + articleStr;
         self.wikiList.push('<a href="' + url + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary" style="padding: 5px 5px;width:100%"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon" style="color: white;">find_in_page</i> - ' + articleStr + '</a><p class="mdl-card__supporting-text">' + phrase + '</p><div class="android-drawer-separator"></div>');
       }
      }
    }).error(function(e){
      self.wikiList.push('<a class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;">Relevant Wikipedia Links could not be loaded</a>');
    });
  }
  //this method is called when the user select one marker and retrives
  //all information found in NYT API and stores the data into nyTimesList
  self.loadNYTimesInfo = function (){
    var urlNYT = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?&fq=glocations.contains:("' + self.currentInfo().name + '")&api-key=0ed05b060b420f576bcfaffb4d33d845:10:74237526';
    self.nyTimesList.removeAll();
    $.getJSON(urlNYT, function(data){
      var docsArray = data.response.docs;
      for (doc in docsArray) {
        var article = docsArray[doc];
        self.nyTimesList.push('<a href="' + article.web_url + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary" style="padding: 5px 5px;"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon" style="color: white;">line_style</i> - ' + article.headline.main + '</a><p class="mdl-card__supporting-text">' + article.snippet + '</p><div class="android-drawer-separator"></div>');
  		}
    }).error(function(e){
      self.nyTimesList.push('<a class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;">Relevant NY-Times Links could not be loaded</a>');
    });
  }
  //this method is called when the user select one marker and retrives
  //all information found in yelp API and stores the data into yelpList
  self.loadYelpInfo = function (){
    var auth = {
      consumerKey : "uX9urW8948FOK9NL8FNgAw",
      consumerSecret : "UrfgKHHtzdnFN2irv2PcOWi0jio",
      accessToken : "9juC59OZki6K6aS-FhO_hTU6JSsiQofJ",
      accessTokenSecret : "g4Pg14xztkTCQrETWru_79xgODg",
      serviceProvider : {
        signatureMethod : "HMAC-SHA1"
      }
    };
    var accessor = {
      consumerSecret : auth.consumerSecret,
      tokenSecret : auth.accessTokenSecret
    };
    parameters = [];
    parameters.push(['callback', 'cb']);
    parameters.push(['oauth_consumer_key', auth.consumerKey]);
    parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
    parameters.push(['oauth_token', auth.accessToken]);
    parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
    var message = {
      'action' : 'https://api.yelp.com/v2/search/?location=' + self.currentInfo().location,
      'method' : 'GET',
      'parameters' : parameters
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);
    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)
    self.yelpList.removeAll();
    $.ajax({
      'url' : message.action,
      'data' : parameterMap,
      'cache' : true,
      'dataType' : 'jsonp',
      'jsonpCallback' : 'cb',
      'success' : function(data, textStats, XMLHttpRequest) {
        var businesses = data.businesses
        for (business in businesses) {
          self.yelpList.push('<a href="' + businesses[business].url + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary" style="padding: 5px 5px; width:100%;"><i class="material-icons mdl-list__item-icon" style="color: white;">filter_tilt_shift</i> - ' + businesses[business].name + '</a><div class="material-icons mdl-badge mdl-badge--overlap" data-badge="' + businesses[business].rating + '" style="width: 30px;float: right;">start_rate</div><p class="mdl-card__supporting-text">' + businesses[business].snippet_text + '</p><div class="android-drawer-separator"></div>');
    		}
      }
    }).error(function(e){
      self.yelpList.push('<a class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;">Relevant yelp Links could not be loaded</a>');
    });
  }
  //this method is called when the user select one marker and retrives
  //all information found in flickr API and stores the data into flickrList
  self.loadFlickrImages = function (){
    var flickerAPI = 'http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?';
    self.flickrList.removeAll();
    $.getJSON( flickerAPI, {
      tags: self.currentInfo().name,
      tagmode: 'any',
      format: 'json'
    }).done(function( data ) {
      $.each( data.items, function( i, item ) {
        var img = '<div class="demo-card-image mdl-card mdl-shadow--2dp" style="width: 230px;margin-left: 5px;">';
        img = img + '<img src="' + item.media.m + '" class="img-flickr"><div class="mdl-card__actions"><a href="' + item.link + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary" style="width:100%;padding: 0;"><i class="material-icons mdl-list__item-icon" style="color: white;">collections</i> - ' + item.title + '</a></div></div>';
        self.flickrList.push(img);
        if(i === 9)
          return false;
      });
    }).error(function(e){
      self.flickrList.push('<a class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;">Relevant flickr photos could not be loaded</a>');
    });
  }
  //this method calls loadWikiInfo, loadNYTimesInfo, loadYelpInfo, & loadFlickrImages
  //to load the information in right sidebar when a marker is selected
  self.loadInfoSelected = function (){
    self.loadWikiInfo();
    self.loadNYTimesInfo();
    self.loadYelpInfo();
    self.loadFlickrImages();
  }
};
//vM is an instance Octopus and it will keep all the app info
var vM = { viewModel: new Octopus() };
//applying the Bindings to the new instance
ko.applyBindings(vM.viewModel);

var map;//this object keeps the map
var infoWindow;//this object keeps the infoWindow
var service;//this object keeps the google PlacesService results

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
  if(vM.viewModel.newPlaceFlag){
    var newPlace = {
      'name' : name,
      'location' : formattedAddress,
      'marker' : marker
    }
    vM.viewModel.addedList.push(newPlace);
    vM.viewModel.showToast(name + ' added to list');
    var streetviewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location=' + formattedAddress + '';
    infoWindow.setContent('<h3>' + name + '</h3><h4>' + formattedAddress + '</h4><br><center><img class="street-view-img" src="' + streetviewUrl + '"><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"><i class="material-icons mdl-list__item-icon" style="color: white;">visibility</i> - Show info</button></center>');
    infoWindow.open(map, marker);
    $('#more-info').click(function() {
      $(this).text(function(i, text){
          return text === 'Hide info' ? 'Show info' : 'Hide info';
      })
      $('#righ-sidebar').toggleClass('is-visible');
    });
    vM.viewModel.newPlaceFlag = false;
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
      var modelName = vM.viewModel.addedList()[center].name;
      if(modelName === name){
        findMarker = false;
        var streetviewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location=' + vM.viewModel.addedList()[center].location + '';
        contentString = '<h3>' + vM.viewModel.addedList()[center].name + '</h3><h4>' + vM.viewModel.addedList()[center].location + '</h4><center><img class="street-view-img" src="' + streetviewUrl + '">';
        vM.viewModel.currentInfo(vM.viewModel.addedList()[center]);
      }
    }
    if(findMarker){
      for(center in vM.viewModel.centers()){
        var modelName = vM.viewModel.centers()[center].name;
        if(modelName === name){
          var streetviewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location=' + vM.viewModel.centers()[center].location + '';
          contentString = '<h3>' + vM.viewModel.centers()[center].name + '</h3><h4>' + vM.viewModel.centers()[center].location + '</h4><center><img class="street-view-img" src="' + streetviewUrl + '">';
          vM.viewModel.currentInfo(vM.viewModel.centers()[center]);
        }
      }
    }
    vM.viewModel.loadInfoSelected();
    var textButton;
    if($('#more-info').text() === 'Hide info')
      textButton = 'Hide info';
    else
      textButton = 'Show info';

    contentString = contentString + '<br><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-js-ripple-effect"><i class="material-icons mdl-list__item-icon" style="color: white;">visibility</i> - ' + textButton + '</button></center>';
    infoWindow.setContent(contentString);

    if(!vM.viewModel.filterFlag){
      infoWindow.open(map, marker);
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
//lunch the application when the window it's loaded
window.addEventListener('load', initializeMap);
//resize the map
window.addEventListener('resize', function(e) {
  map.fitBounds(mapBounds);
});
//add map to the mapDiv
var googleMap = '<div id="map"></div>';
$('#mapDiv').append(googleMap);
//this function is called when the document is ready and everytime the window is resized
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
  var sidebarHeigh = resizeH - 100;
  resizeH += 'px';
  sidebarHeigh += 'px';
  $('#mapDiv').css('height',resizeH);
  $('#contest').css('height',sidebarHeigh);
  $('#search-field').keypress(function(e) {
    var key = e.which;
    if(key == 13) {
      vM.viewModel.sendNewPlace();
    }
  });
  document.querySelector('#button-show-toast').addEventListener('click', function() {
    if ($('#search-field').val() != null && $('#search-field').val() != '') {
      vM.viewModel.sendNewPlace();
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
  $('#more-info-sidebar').click(function() {
    $('#more-info').text(function(i, text){
        return text === 'Hide info' ? 'Show info' : 'Hide info';
    })
    $('#righ-sidebar').toggleClass('is-visible');
  });
};
//loadlayout is called when the document is ready and everytime the window is resized
$(document).bind('ready', loadlayout());
$(window).resize(loadlayout);
