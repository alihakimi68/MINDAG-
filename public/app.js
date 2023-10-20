
//Global variables
let PickLatValue;
let PickLonValue;
let userLocationAvailable = false;

document.addEventListener("DOMContentLoaded", function () {
    const apiKey = '35a4bdb07a454d9b9bedcfbe1497e315';
    const fromDateInput = document.getElementById("pickFromDate");
    const fromTimeInput = document.getElementById("pickFromTIme");
    const toTimeInput = document.getElementById("pickToTime");
    const eventList = document.getElementById("eventList");
    const eventCategoriesList = document.getElementById("eventCategoriesList");
    let eventID = []; // Declare eventID at a higher scope
    let data = [];
    let control = null;

    //    read the data based on the user inputs
    const fetchEvents = async() => {
        const fromDate = fromDateInput.value;
        const fromTime = fromTimeInput.value;
        const toTime = toTimeInput.value;
        const fromDateTime = new Date(`${fromDate}T${fromTime}`); //convert date and time to the API format
        const toDateTime = new Date(`${fromDate}T${toTime}`); //convert date and time to the API format

        //        Create the Url
        const endpoint = `/proxy/events?apiKey=${apiKey}&fromDate=${fromDateTime.toISOString()}&toDate=${toDateTime.toISOString()}`;

        //        Check if the there are any responses from API Server
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            //            The whole data from API
            data = await response.json();

            // Call display event function
            displayEvents(data);
        } catch (error) {
            console.error(error);
            eventList.innerHTML = 'An error occurred while fetching events.';
        }
    };


    //    ##################################################### //
    //    Display a list of events catergory for user to select //
    //    ##################################################### //
    const displayEvents = (data) => {
		
        eventCategoriesList.innerHTML = '<h2>Event Categories:</h2>'; // Initialize the list for event categories

        const eventCategories = []; // Create an array to store unique event categories
        eventID = [];

        //        Check if the categories are an array
        if (data && Array.isArray(data.items)) {
            data.items.forEach(event => {
                
				const categoriesID = event._id
				const categories = event.eventCategory

                //				Create the categories list for the check boxes
				categories.forEach(cat =>{
					if (typeof cat === 'string') {

						// Iterate through the categories and add them individually
						if (!eventCategories.includes(cat.trim())) {
						  eventCategories.push(cat.trim());
						  eventID.push(categoriesID);
						}
					}	
				})
            });
        } else {

            // Handle the case where 'items' is not an array or is missing (e.g., display an error message)
        }

		// Create a container div to hold the checkboxes
		const categoriesContainer = document.createElement('div');
		eventCategoriesList.appendChild(categoriesContainer);

        eventCategories.forEach(category => {

            //            Check boxes
			const categoriesSelect = document.createElement('input');
			categoriesSelect.type = 'checkbox';
			categoriesSelect.value = category;

            //			labels
			const label = document.createElement('label');
			label.textContent = category;

            //			appending the check boxe
			categoriesContainer.appendChild(categoriesSelect);
			categoriesContainer.appendChild(label);

            // Add a line break to separate each checkbox and label pair
            categoriesContainer.appendChild(document.createElement('br'));
        });

        // Create a submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.addEventListener('click', handleButtonClick); // Add a click event listener
        eventCategoriesList.appendChild(submitButton);

    };


    //    ########################################################## //
    //    sort the categories based on the distance nad show on map  //
    //    ########################################################## //
    const handleButtonClick = () => {

        //        Check if the map is populated with layers and remove them
        map.eachLayer(layer => {
            if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        //        Get the selected items from check boxes
        const selectedCategories = Array.from(eventCategoriesList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const eventsForToday = []

        // Iterate through the data.items and check if their ._id is in the eventID array
        data.items.forEach(event => {

            if (eventID.includes(event._id)) {

                // Check if the event's category is in the selectedCategories
                const categories = event.eventCategory;
                const matchingCategory = categories.find(cat => selectedCategories.includes(cat.trim()));
                if (matchingCategory) {
                    eventsForToday.push(event);
                } else {
                    console.log('there no events in based on your taste')
                }
            }
        });
        const eventsForTodayWithoutDuplicates = eventsForToday.filter((event, index, self) => {
            const eventIndex = self.findIndex(e => e._id === event._id);
            return eventIndex === index;
            });

        // Helper function to calculate the distance between two sets of coordinates using the Haversine formula
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance;
        }

        //            Sor the events by distance to the user location
        const sortEventsByDistance = (events, targetLat, targetLon) => {

            // Calculate the distance for each event
            events.forEach(event => {
                event.distance = calculateDistance(PickLatValue, PickLonValue, event.mapCoordinates.lat, event.mapCoordinates.lng);
            });

            // Sort events by distance
            events.sort((a, b) => a.distance - b.distance);
        };

        //            Keep the sorted events
        const sortedEvents = [...eventsForTodayWithoutDuplicates]; // Create a copy of the array
        sortEventsByDistance(sortedEvents, PickLatValue, PickLonValue);

        //            Empty the way points
        const waypoints = [];
        if (PickLatValue && PickLonValue){
            waypoints.push(L.latLng(PickLatValue, PickLonValue))
        }
        // Iterate through the sortedEvents and add their coordinates to the waypoints
        sortedEvents.forEach(event => {
            waypoints.push(L.latLng(event.mapCoordinates.lat, event.mapCoordinates.lng));
        });
        console.log(sortedEvents)
        // Create a routing control instance with the calculated waypoints
        if (control != null) {
            map.removeControl(control);
            control = null;
        }
        control = L.Routing.control({
                waypoints: waypoints, // Use the waypoints array
                routeWhileDragging: true,
                createMarker: function (i, waypoint, n) {
                    var marker = L.marker(waypoint.latLng, {
                        draggable: false
                    });
                    const event = sortedEvents[i];
                    console.log(event);

                    let tooltipContent; // Define tooltipContent here
                    if (!userLocationAvailable) {
                        const event = sortedEvents[i]; // Use i - 1 to access the corresponding event
                        tooltipContent = `<div class="tooltip-style"><strong>${event.eventName}</strong></br>
                            Event Address: ${event.eventAddress}</br></br>
                            Event Description: ${event.eventDescription}</br>
                            Email: ${event.eventEmail}</br>
                            Start Date: ${event.eventStartDate}</br>
                            End Date: ${event.eventEndDate}</br>
                            Website: ${event.eventWebsite}</dv>`;
                    }else if (i === 0 && userLocationAvailable){
                        const customIcon = L.icon({
                        iconUrl: 'img/StartPoint.png', // Replace with the URL to your custom icon image
                        iconSize: [128, 128], // Set the size of the icon
                        iconAnchor: [60, 100], // Set the anchor point (center of the icon)
                        });
                        marker = L.marker(waypoint.latLng, {
                            draggable: false,
                            icon: customIcon, // Apply the custom icon
                        });

                        tooltipContent = `<strong>Starting Point</strong></br>`;
                    }
                    else{
                        const event = sortedEvents[i - 1]; // Use i - 1 to access the corresponding event
                        tooltipContent = `<div class="tooltip-style"><strong>${event.eventName}</strong></br>
                            Event Address: ${event.eventAddress}</br></br>
                            Event Description: ${event.eventDescription}</br>
                            Email: ${event.eventEmail}</br>
                            Start Date: ${event.eventStartDate}</br>
                            End Date: ${event.eventEndDate}</br>
                            Website: ${event.eventWebsite}</dv>`;
                    }

                    marker.bindTooltip(tooltipContent, { direction: 'auto' });

                    return marker;
                }
            }).addTo(map);

            // Calculate and display the route
        control.route();
    };


    //    ################################ //
    //    Main submit button of the form  //
    //    ################################ //
    const form = document.getElementById("dateForm");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        fetchEvents();
    });
});

// Initialize the map centered on Lund
const map = L.map('map').setView([55.7047, 13.1910], 14); // Center the map on Lund and set an appropriate zoom level

// Add a base layer (you can use other tile layers as well)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a click event listener to the map
map.on('click', function (e) {
    // Get the latitude and longitude of the clicked point
    const userSelectedLat = e.latlng.lat;
    const userSelectedLon = e.latlng.lng;

    // Now you can use userSelectedLat and userSelectedLon in your handleButtonClick function
    handleButtonClickOnMapClick (userSelectedLat, userSelectedLon);
});


// Initialize the coordinatesDiv
const coordinatesDiv = L.control({ position: 'bottomleft' });
coordinatesDiv.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'coordinates');
    this.update();
    return this._div;
};
coordinatesDiv.update = function (lat, lon) {
    this._div.innerHTML = `<b>Latitude:</b> ${lat}, <b>Longitude:</b> ${lon}`;
};
coordinatesDiv.addTo(map);

//Ge the user location from the click on the map
const handleButtonClickOnMapClick  = (userSelectedLat, userSelectedLon) => {
    PickLatValue = userSelectedLat;
    PickLonValue = userSelectedLon;
    coordinatesDiv.update(PickLatValue, PickLonValue);
    userLocationAvailable = true;
};




