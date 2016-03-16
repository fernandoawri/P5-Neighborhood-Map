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
  self.dbLoaded = false;//this flag is to check if the list has been filtered
  self.LoadedComplete = false;//this flag is to check if the list has been filtered
  self.myDataRef = new Firebase('https://glaring-fire-483.firebaseio.com/');

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
  //this method sends the city from the search input to add a new place
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
  //this method loads the added markers from firebase
  self.loadFromFirebase = function (addedDBList){
    this.newPlaceFlag = true;
    pinPoster(addedDBList);
  };
  //this method updates the addedlist on firebase
  self.updatedFirebase = function () {
    self.myDataRef.on('value', function(db) {
    	self.myDataRef.child('addedPlacesList').set(vM.viewModel.addedList());
    });
  }
  //this method loads the infor from firebase
  self.loadFirebase = function () {
    self.myDataRef.on('value', function(db) {
      var dataExist = db.exists();
    	if(dataExist && self.LoadedComplete === false){
        self.dbLoaded = true;
        var addedDbList = db.val();
        var addedPlacesList = addedDbList.addedPlacesList;
        self.loadFromFirebase(addedPlacesList);
    	}
      self.LoadedComplete = true;
    });
  }
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
  // Sets the map on all markers in the array.
  self.setMapOnAll = function (map) {
    console.log(self.markers());
    console.log(self.centers());
    for(marker in self.markers()){
      for(item in self.centers()){
        if(self.centers()[item].name === self.markers()[marker].title){
          self.markers()[marker].setMap(map);
        }
      }
    }
  }
  // Removes the markers from the map, but keeps them in the array.
  self.clearMarkers = function () {
    self.setMapOnAll(null);
  }
  // Shows any markers currently in the array.
  self.showMarkers = function (map) {
    self.setMapOnAll(map);
  }
};
//vM is an instance Octopus and it will keep all the app info
var vM = { viewModel: new Octopus() };
//applying the Bindings to the new instance
ko.applyBindings(vM.viewModel);
