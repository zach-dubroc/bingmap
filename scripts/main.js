//globals
let myLocation = { latitude: 0, longitude: 0};
let map;
let directionsManager;
let poiResults = document.getElementById("poiText");
let poiType = document.getElementById("locations");
let radius = 10;
//link goes to to the poi data source using the query spatial data service query API
let sdsDataSourceUrl = 'https://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest';

function GetLocation() {

    const success = (position) => {
        let lat = position.coords.latitude;
        let lng = position.coords.longitude;
        //fill myLocation object with latitude and longitude
        //latitude invalid but still works??
        myLocation.latitude = lat;
        myLocation.longitude = lng;
        //create first map instance using myLocation
        GetMap();
    }
    const error = (error) => {
        alert("error");
    }
    navigator.geolocation.getCurrentPosition(success, error);
}//location

function GetMap() {
    //draw map
    map = new Microsoft.Maps.Map('#myMap');
    //clear text from html element
    poiResults.innerHTML = "";
    //Add a pushpin at the user's location.
    var pin = new Microsoft.Maps.Pushpin(myLocation, {
        title: "Me",
        color: "red"
    });
    
    map.setView({
        center: myLocation,
        zoom: 14
    });
    
    map.entities.push(pin);

    //Load Spatial Data Services module.
    Microsoft.Maps.loadModule('Microsoft.Maps.SpatialDataService');
}

function getNearByLocations() {
    //draw new map to clear old entities
    GetMap

    //Create a query to get nearby data
    var queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: map.getCenter(),
            radius: radius
        },
        //Filter to retrieve pois using entity id type listed in html element values
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', poiType.value),
    };



    //use data from query to fill out map based on users selection/clicks
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, map, function (data) {

        //set result header
        if (poiType.value == 0) {
            document.getElementById("searchHead").innerHTML = "";
        } else {
            document.getElementById("searchHead").innerHTML = "Results: ";
        }
        
        //loop over and load pushpin data to map
        for (i = 0; i < data.length; i++) {

            //format poi card with Location name, address, and distance to user
            //round to one decimal point??
            let miles = Math.round((parseFloat(data[i].metadata.__Distance) + Number.EPSILON) * 10) / 10;

            let poiCard = `<div class="poiCard"><h3>${data[i].metadata.DisplayName}</h3>
             <p>${data[i].metadata.AddressLine}</p>
             <p>${miles} mile(s)</p>
             </div>
            `;
            
            poiResults.innerHTML += poiCard;

            //get pin location into new object for maps class
            let pinLocation = {
                latitude: data[i].metadata.Latitude,
                longitude: data[i].metadata.Longitude
            };

            //set pin titles and events
            let pins = new Microsoft.Maps.Pushpin(pinLocation, {
                title: data[i].metadata.DisplayName,
                color: "purple",
                text: 0.5,
            });

            Microsoft.Maps.Events.addHandler(pins, "mouseover", function (e) {
                e.target.setOptions({
                    color: "blue",
                    enableHoverStyle: true,
                });
            });
            Microsoft.Maps.Events.addHandler(pins, "mouseout", function (e) {
                e.target.setOptions({
                    color: "purple",
                    text: 0.5,
                });
            });

            //display route to clicked push pin
            Microsoft.Maps.Events.addHandler(pins, "click", function (e) {
                //clears other push pins but 
                GetMap();
                poiResults.innerHTML = poiCard;
                //test event fire
                e.target.setOptions({
                    color: "black",
                    text: 0.5,
                });

                //Load the directions module.
                Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {

                    //Create an instance of the directions manager.
                    directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
                    //Create waypoints to route between.

                    //set A/B waypoints from user location to clicked waypoint
                    //Point A
                    directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({ location: myLocation }));
                    //Point B
                    directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({ location: pinLocation }));
                    //Replace the title of waypoints with an empty string to hide the default text that appears.
                    directionsManager.setRenderOptions({
                        drivingPolylineOptions: {
                            strokeColor: 'blue',
                            strokeThickness: 6,
                            title: ""
                        },
                    });
                    //draws the route 
                    directionsManager.calculateDirections();
                });

            });
            //push pins
            map.entities.push(pins);
        }
    });
}

function sliderChange(val) {
    document.getElementById("miles").innerHTML = `${val} mile(s)`;
    radius = val;
}



