var map;
var infoWindow;
var bounds;

// bit of jquery to make the wikiInfo the same size as the map for non-mobile setting.

$(document).ready(function () {
  $("#wikiInfo").css({
      'width': ($("#map").width() + 'px')
  });
});

$(window).resize(function () {
  $("#wikiInfo").css({
    'width': ($("#map").width() + 'px')
  });
});
// google maps

// map initializer
function initMap() {
    var kyoto = {
        lat: parseFloat(35.0116),
        lng: parseFloat(135.7680)
    };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: kyoto,
        mapTypeControl: false
    });

    infoWindow = new google.maps.InfoWindow();

    bounds = new google.maps.LatLngBounds();
   
    ko.applyBindings(new ViewModel());
}

function mapError(){
    alert('An error has occured with the Google Maps API.');
}

var SpotMarker = function(data){
    var self = this;
    self.num = data.num;
    self.title = data.title;
    self.position = data.location;
    //TODO make address work this.address = getReverseGeocodingData(data.location);
    self.visible = ko.observable(true);
    
    // adds colors to markers
    var defaultIcon = makeMarkerIcon('BC002D');
    var focusedIcon = makeMarkerIcon('C0A740');
    //
    
    /*Wiki API
    var wikiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + this.title;
    wikiHold[this.num] = $.getJSON(wikiUrl, function(data){
        console.log(data.extract_html);
        return data.extract_html;
    });
    */
    //Create markers array
    self.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        num: this.num,
        //address: this.address,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });
    
    self.filterMarkers = ko.computed(function () {
        // sets markers and makes sure bounds fit
        if(self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });
    
    //Onclick for markers infowindow and wiki-info div
    this.marker.addListener('click', function() {
        makeInfoWindow(this, infoWindow);
        map.panTo(this.getPosition());
        //alert(JSON.stringify(wikiHold[this.num])); //show the summary
    });
    
    //change color mouseover/mouseout
    this.marker.addListener('mouseover', function() {
        this.setIcon(focusedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
    
    //show when clicked in list
     this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };
    
};

// ViewModel
var ViewModel = function(){
    var self = this;
    this.wiki = ko.observable('');
    this.searchSpot = ko.observable('');
    this.mapSideList = ko.observableArray([]);
    //markers for all spots
    spots.forEach(function(spot) {
        self.mapSideList.push( new SpotMarker(spot) );
    });
    
    // shows which spots are on the map
    this.spotList = ko.computed(function() {
        var searchFilter = self.searchSpot().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapSideList(), function(spot) {
                var name = spot.title.toLowerCase();
                var filtered = name.includes(searchFilter);
                spot.visible(filtered);
				return filtered;
			});
        }
        self.mapSideList().forEach(function(spot) {
            spot.visible(true);
        });
        return self.mapSideList();
    }, self);
};

function makeInfoWindow (marker, infowindow){
    
    this.wiki = ko.observable('');
    
    //Check if inforwindow is open
    if (infowindow.marker != marker) {
        // clear infowindow if open
        infowindow.setContent('');
        infowindow.marker = marker;
        
        //clear marker and wikiInfo on infowindow close
        infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
        $("#wikiInfo").html("");
    });

        
        var streetviewService = new google.maps.StreetViewService();
        var radius = 50;
        
        var windowContent =  '<h3>' + marker.title + '</h3>' + '<a href="#wiki-info">Click here for more</a>'; /* TODO add address '<p>' + marker.address + '</p>' */
        
        //Wiki API
        var wikiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + marker.title;
        $.getJSON(wikiUrl)
            .done(function(json){
                console.log(json.extract_html);
                $("#wikiInfo").html(json.extract_html);
            })
            .fail(alert('The Wiki API failed to respond.'));

        //find the streetview for display
        var getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearSpot = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(nearSpot, marker.position);
                infowindow.setContent(windowContent + '<div id="street-view" style="height: 20em; width: 20em;"></div>');
                var streetviewOptions = {
                    position: nearSpot,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var streetview = new google.maps.StreetViewPanorama(
                    document.getElementById('street-view'), streetviewOptions);
            } else {
                infowindow.setContent(windowContent + '<div>No Streetview Found</div>');
            }
        };
        //create streetview
        streetviewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        //open on slected marker
        infowindow.open(map, marker);
    }
}



// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34). Source: https://codepen.io/msliwka/pen/kXGpdb?editors=1000
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
    return markerImage;
}
/* gets the address to display 
//TODO make this work (problems sending latlng to function)
    function getReverseGeocodingData(lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        // This is making the Geocode request
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
            if (status !== google.maps.GeocoderStatus.OK) {
                alert(status);
        }
        // This is checking to see if the Geoeode Status is OK before proceeding
        if (status == google.maps.GeocoderStatus.OK) {
            console.log(results);
            var address = (results[0].formatted_address);
        }
    });
}
*/
