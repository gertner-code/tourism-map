var map;
var infoWindow;
var bounds;

// google maps

// map initializer
function initMap() {
    var kyoto = {
        lat: 35.0116,
        lng: 135.7680
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
    
    this.title = data.title;
    this.position = data.location
    
    this.visible = ko.observable(true);
    
    // adds colors to markers
    var defaultIcon = makeMarkerIcon('BC002D');
    var focusedIcon = makeMarkerIcon('C0A740');
    //
    
    //Create markers array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animations.DROP,
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
    
    //Onclick window for markers
    this.marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
        toggleBounce(this);
        map.panTo(this.getPosition());
    });
    
    //change color mouseover/mouseout
    this.marker.addListener('mouseover', function() {
        this.setIcon(focusedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
    
    //show when clicked in list
     this.show = function(spot) {
        google.maps.event.trigger(self.marker, 'click');
    };
    
};

// ViewModel
var ViewModel = function(){
    var self = this;
    
    this.searchSpot = ko.observable('');
    this.mapSideList = ko.observableArray([]);
    
    //markers for all spots
    spots.forEach(function(spot) {
        self.mapSideList.push( new LocationMarker(spot) );
    });
    
    // shows which spots are on the map
    this.spotList = ko.computed(function() {
        var searchFilter = self.searchSpot().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapSideList(), function(spot) {
                var name = spot.title.toLowerCase();
                var filtered = name.includes(searchFilter);
                spot.visible(result);
				return filtered;
			});
        }
        self.mapSideList().forEach(function(spot) {
            spot.visible(true);
        });
        return self.mapSideList();
    }, self);
};

function InfoWindow (marker, infowindow){
    //Check if inforwindow is open
    if (infowindow.marker != marker) {
        // clear infowindow if open
        infowindow.setContent('');
        infowindow.marker = marker;
        
        //clear marker on infowindow close
        infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
    });
    
    //gets the address to display
    function getReverseGeocodingData(marker.position.lat, marker.position.lng) {
        var latlng = new google.maps.LatLng(marker.position);
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
        
        var streetViewStart = new google.maps.StreetViewService();
        var radius = 50;
        
        var windowContent =  '<h3>' + marker.title + '</h3>' + '<p>' + address + '</p>'
        
        //find the streetview for display
        var getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearSpot = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(nearSpot, marker.position);
                infowindow.setContent(windowContent + '<div id="street-view"></div>');
                var streetviewOptions = {
                    position: nearSpot,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var streetview = new google.maps.StreetViewPanorama(
                    document.getElementById('street-view'), panoramaOptions);
            } else {
                infowindow.setContent(windowContent + '<div>No Streetview Found</div>');
            }
        };
        //create streetview
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        //open on slected marker
        infowindow.open(map, marker);
    }
}
