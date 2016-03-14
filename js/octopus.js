var Octopus = function() {
  var self = this;
  self.centers = ko.observableArray(model.centers);
  self.markers = ko.observableArray();
  self.wikiList = ko.observableArray();
  self.yelpList = ko.observableArray();
  self.nyTimesList = ko.observableArray();
  self.backUp = ko.observableArray();
  self.currentInfo = ko.observable();
  self.addedList = ko.observableArray();
  self.newPlaceFlag = false;
  self.filterFlag = false;
  self.filtered = false;

  self.showToast = function (text){
    'use strict';
    var snackbarContainer = document.querySelector('#toast-map-message');
    var data = {message: text};
    snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }

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

  self.restoreData = function (){
    var count = self.backUp().length;
    if(count > 0){
      self.centers.removeAll();
      for(var i = 0; i < count; i++){
        self.centers.push(self.backUp.pop());
      }
    }
  }

  self.loadWikiInfo = function (){
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.currentInfo().name + '&format=json&callback=wikiCallback';
    self.wikiList.removeAll();
    $.ajax({
      url: wikiUrl,
      dataType: 'jsonp',
      success: function(response) {
       var asticleList = response[1];
       for (var i = 0; i < asticleList.length; i++) {
         var articleStr = asticleList[i];
         var url = 'https://en.wikipedia.org/wiki/' + articleStr;
         self.wikiList.push('<a href="' + url + '" class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon">book</i> - ' + articleStr + '</a><div class="android-drawer-separator"></div>');
       }
      }
    }).error(function(e){
      self.wikiList.push('<a class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;">Relevant Wikipedia Links could not be loaded</a>');
    });
  }

  self.loadNYTimesInfo = function (){
    var urlNYT = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?&fq=glocations.contains:("' + self.currentInfo().name + '")&api-key=0ed05b060b420f576bcfaffb4d33d845:10:74237526';
    self.nyTimesList.removeAll();
    $.getJSON(urlNYT, function(data){
      var docsArray = data.response.docs;
      for (doc in docsArray) {
        var article = docsArray[doc];
        self.nyTimesList.push('<a href="' + article.web_url + '" class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon">line_style</i> - ' + article.headline.main + '</a><p class="mdl-card__supporting-text">' + article.snippet + '</p><div class="android-drawer-separator"></div>');
  		}
    }).error(function(e){
      self.nyTimesList.push('<a class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;">Relevant NY-Times Links could not be loaded</a>');
    });
  }

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
          console.log(businesses[business]);
          self.yelpList.push('<a href="' + businesses[business].url + '" class="mdl-navigation__link fix-pading-menu" style="padding: 5px 5px;"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon">face</i> - <div class="material-icons mdl-badge mdl-badge--overlap" data-badge="' + businesses[business].rating + '">start_rate</div>' + businesses[business].name + '</a><p class="mdl-card__supporting-text">' + businesses[business].snippet_text + '</p><div class="android-drawer-separator"></div>');
    		}
      }
    });
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
    infoWindow.setContent('<h3>' + name + '</h3><h4>' + formattedAddress + '</h4><br><center><img class="street-view-img" src="' + streetviewUrl + '"><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored">Show info</button></center>');
    infoWindow.open(map, marker);
    $('#more-info').click(function() {
      $(this).text(function(i, text){
          return text === 'Hide info' ? 'Show info' : 'Hide info';
      })
      $('#righ-sidebar').toggleClass('is-visible');
    });
    vM.viewModel.newPlaceFlag = false;
    vM.viewModel.currentInfo(newPlace);
    vM.viewModel.loadWikiInfo();
    vM.viewModel.loadNYTimesInfo();
    vM.viewModel.loadYelpInfo();
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
    vM.viewModel.loadWikiInfo();
    vM.viewModel.loadNYTimesInfo();
    vM.viewModel.loadYelpInfo();

    var textButton;
    if($('#more-info').text() === 'Hide info')
      textButton = 'Hide info';
    else
      textButton = 'Show info';

    contentString = contentString + '<br><button id="more-info" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-js-ripple-effect">' + textButton + '</button></center>';


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
      'location' : $('#search-field').val() + ', PA',
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
  $('#more-info-sidebar').click(function() {
    $('#more-info').text(function(i, text){
        return text === 'Hide info' ? 'Show info' : 'Hide info';
    })
    $('#righ-sidebar').toggleClass('is-visible');
  });
};

$(document).bind('ready', loadlayout());
$(window).resize(loadlayout);
