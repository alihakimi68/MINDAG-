document.addEventListener("DOMContentLoaded", function () {
    const apiKey = '35a4bdb07a454d9b9bedcfbe1497e315';
    const fromDateInput = document.getElementById("pickFromDate");
    const fromTimeInput = document.getElementById("pickFromTIme");
    /* const toDateInput = document.getElementById("pickToDate"); */
    const toTimeInput = document.getElementById("pickToTime");
    const eventList = document.getElementById("eventList");
    const eventCategoriesList = document.getElementById("eventCategoriesList");
    const fetchEvents = async() => {
        const fromDate = fromDateInput.value;
        const fromTime = fromTimeInput.value;
        /* const toDate = toDateInput.value; */
        const toTime = toTimeInput.value;

        const fromDateTime = new Date(`${fromDate}T${fromTime}`);
        const toDateTime = new Date(`${fromDate}T${toTime}`);

        const endpoint = `/proxy/events?apiKey=${apiKey}&fromDate=${fromDateTime.toISOString()}&toDate=${toDateTime.toISOString()}`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            /* console.log('data',data) */
            displayEvents(data);
        } catch (error) {
            console.error(error);
            eventList.innerHTML = 'An error occurred while fetching events.';
        }
    };

    //    Display a list of events catergory for user to select //
    const displayEvents = (data) => {
		
        eventCategoriesList.innerHTML = '<h2>Event Categories:</h2>'; // Initialize the list for event categories
        
        const eventCategories = []; // Create an array to store unique event categories
        const eventID = [];

        if (data && Array.isArray(data.items)) {
            data.items.forEach(event => {
                
				const categoriesID = event._id
				const categories = event.eventCategory
				categories.forEach(cat =>{
					if (typeof cat === 'string') {
						/* console.log(cat) */
						// Iterate through the categories and add them individually
						if (!eventCategories.includes(cat.trim())) {
						  eventCategories.push(cat.trim());
						  eventID.push(categoriesID);
						}
					}	
				})
				console.log(eventID)

            });
        } else {
            // Handle the case where 'items' is not an array or is missing (e.g., display an error message)

        }

		// Create a container div to hold the checkboxes
		const categoriesContainer = document.createElement('div');
		eventCategoriesList.appendChild(categoriesContainer);

        eventCategories.forEach(category => {

			const categoriesSelect = document.createElement('input');
			categoriesSelect.type = 'checkbox';
			categoriesSelect.value = category;
			
			const label = document.createElement('label');
			label.textContent = category;
			
			categoriesContainer.appendChild(categoriesSelect);
			categoriesContainer.appendChild(label);

            // Add a line break to separate each checkbox and label pair
            categoriesContainer.appendChild(document.createElement('br'));

        });
    };

    const form = document.getElementById("dateForm");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        fetchEvents();
    });
});




/* Load the Map */

// Initialize the map centered on Lund
const map = L.map('map').setView([55.7047, 13.1910], 14); // Center the map on Lund and set an appropriate zoom level

// Add a base layer (you can use other tile layers as well)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Specify the origin and destination points
const origin = L.latLng(55.7047, 13.1910); // Lund coordinates
const destination = L.latLng(55.7033, 13.1944); // Example destination coordinates
const destination1 = L.latLng(55.7055, 13.1920); // Example destination coordinates


// Create markers for the origin and destination

L.marker(origin).addTo(map).bindPopup('Lund');
L.marker(destination).addTo(map).bindPopup('Destination');

// Create a routing control instance
const control = L.Routing.control({
    waypoints: [
        origin,
        destination,
		destination1
    ],
    routeWhileDragging: true,
}).addTo(map);

// Calculate and display the route
control.route();
