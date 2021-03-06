var map;
var infoWindow;
var bounds;
var vm;

// ViewModel
var ViewModel = function(){
    var self = this;
    this.searchSpot = ko.observable('');
    this.mapSideList = ko.observableArray([]);
    this.wiki = ko.observable(' ');
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
   
    vm = new ViewModel();
    ko.applyBindings(vm);
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
        toggleBounce(this);
        wikiContent(self.title);
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



function makeInfoWindow (marker, infowindow){
    
    
    //Check if inforwindow is open
    if (infowindow.marker != marker) {
        // clear infowindow if open
        infowindow.setContent('');
        infowindow.marker = marker;
        
        //clear marker and wikiInfo on infowindow close
        infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
        vm.wiki("");
    });

        
        var streetviewService = new google.maps.StreetViewService();
        var radius = 50;
        
        var windowContent =  '<h3>' + marker.title + '</h3>' + '<a href="#wiki-info">Click here for more</a>'; /* TODO add address '<p>' + marker.address + '</p>' */
        
        //Wiki API
        /*var wikiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + marker.title;
        $.getJSON(wikiUrl)
            .done(function(json){
                console.log(json.extract_html);
                $("#wikiInfo").html(json.extract_html);
            })
            .fail(alert('The Wiki API failed to respond.')); */

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

function wikiContent(title){
    var summary = title
    var wikiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + summary;
    $.ajax({
			url: wikiUrl, 
			type: "GET", 
			success: function(data){
				var object = data.extract_html;
                    console.log(object);
					vm.wiki(object);
		}}).fail(function(){
				alert("We are sorry, but Wikipedia content is not available at the moment. Try again soon.");
			});
}

// Function for toggling bounce. 
function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1400);
  }
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
