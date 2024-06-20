// Global variables
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
    let eventID = [];
    let data = [];
    let control = null;

    // Fetch events based on user inputs
    const fetchEvents = async () => {
        const fromDate = fromDateInput.value;
        const fromTime = fromTimeInput.value;
        const toTime = toTimeInput.value;
        const fromDateTime = new Date(`${fromDate}T${fromTime}`);
        const toDateTime = new Date(`${fromDate}T${toTime}`);

        const endpoint = `/proxy/events?apiKey=${apiKey}&fromDate=${fromDateTime.toISOString()}&toDate=${toDateTime.toISOString()}`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const eventData = await response.json();
            console.log('Fetched data:', eventData);

            // Check if eventData.items is defined and an array before passing to displayEvents
            if (eventData && Array.isArray(eventData.items)) {
                data = eventData; // Assign fetched data to the global 'data' variable
                displayEvents(eventData);
            } else {
                console.error('Invalid data format: "items" is not an array.');
                if (eventList) {
                    eventList.innerHTML = 'An error occurred while fetching events.';
                }
            }
        } catch (error) {
            console.error(error);
            if (eventList) {
                eventList.innerHTML = 'An error occurred while fetching events.';
            }
        }
    };

    // Display a list of event categories for user to select
    const displayEvents = (data) => {
        if (!eventCategoriesList) {
        return;
    }

        eventCategoriesList.innerHTML = '';
        const eventCategories = [];
        eventID = [];

        // Check if data.items is defined and an array
        if (data && Array.isArray(data.items)) {
            data.items.forEach(event => {
                const categoriesID = event.id;
                const categories = event.categories;
                categories.forEach(cat => {
                    if (typeof cat === 'string') {
                        if (!eventCategories.includes(cat.trim())) {
                            eventCategories.push(cat.trim());
                            eventID.push(categoriesID);
                        }
                    }
                });
            });
        } else {
            console.error('Invalid data format: "items" is not an array.');
        }

        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = "categories-container";
        eventCategoriesList.appendChild(categoriesContainer);

        eventCategories.forEach(category => {
            const categoriesSelect = document.createElement('input');
            categoriesSelect.type = 'checkbox';
            categoriesSelect.className = 'catCheckbox';
            categoriesSelect.value = category;

            const label = document.createElement('label');
            label.className = 'catLabel';
            label.textContent = category;

            categoriesContainer.appendChild(categoriesSelect);
            categoriesContainer.appendChild(label);
            categoriesContainer.appendChild(document.createElement('br'));
        });

        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.className = "custom-submit-button";
        submitButton.addEventListener('click', () => handleButtonClick(data));
        eventCategoriesList.appendChild(submitButton);
    };

    // Sort categories based on distance and show on map
    const handleButtonClick = (data) => {
        map.eachLayer(layer => {
            if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        const selectedCategories = Array.from(eventCategoriesList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const eventsForToday = [];



        data.items.forEach(event => {

            if (eventID.includes(event.id)) {
                const categories = event.categories;

                const matchingCategory = categories.find(cat => selectedCategories.includes(cat.trim()));

                if (matchingCategory) {
                    eventsForToday.push(event);
                } else {
                    console.log('No events match your selected categories.');
                }
            }
        });

        const eventsForTodayWithoutDuplicates = eventsForToday.filter((event, index, self) => {
            const eventIndex = self.findIndex(e => e.id === event.id);
            return eventIndex === index;
        });

        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance;
        }

        const sortEventsByDistance = (events, targetLat, targetLon) => {
            events.forEach(event => {
                event.distance = calculateDistance(PickLatValue, PickLonValue, event.mapCoordinates.lat, event.mapCoordinates.lng);
            });

            events.sort((a, b) => a.distance - b.distance);
        };

        const sortedEvents = [...eventsForTodayWithoutDuplicates];
        sortEventsByDistance(sortedEvents, PickLatValue, PickLonValue);

        const waypoints = [];
        if (PickLatValue && PickLonValue) {
            waypoints.push(L.latLng(PickLatValue, PickLonValue));
        }

        sortedEvents.forEach(event => {
            waypoints.push(L.latLng(event.mapCoordinates.lat, event.mapCoordinates.lng));
        });


        if (control != null) {
            map.removeControl(control);
            control = null;
        }
        control = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: true,
            createMarker: function (i, waypoint, n) {
                var marker = L.marker(waypoint.latLng, {
                    draggable: false
                });
                let tooltipContent;

                if (!userLocationAvailable) {
                    const event = sortedEvents[i];
                    tooltipContent = `<div class="tooltip-style"><strong>${event.name}</strong><br>
                        Event Address: ${event.address}<br><br>
                        Event Description: ${event.description}<br>
                        Email: ${event.email}<br>
                        Start Date: ${event.startDate}<br>
                        End Date: ${event.endDate}<br>
                        Website: ${event.website}</div>`;
                } else if (i === 0 && userLocationAvailable) {
                    const customIcon = L.icon({
                        iconUrl: 'img/Letsgo.gif',
                        iconSize: [128, 128],
                        iconAnchor: [65, 100]
                    });
                    marker = L.marker(waypoint.latLng, {
                        draggable: false,
                        icon: customIcon
                    });

                    tooltipContent = `<div class="tooltip-start"><img src="img/StartPoint.gif" width="200px" height="100%"></div>`;
                } else {
                    const event = sortedEvents[i - 1];
                    tooltipContent = `<div class="tooltip-style"><strong>${event.name}</strong><br>
                        Event Address: ${event.address}<br><br>
                        Event Description: ${event.description}<br>
                        Email: ${event.email}<br>
                        Start Date: ${event.startDate}<br>
                        End Date: ${event.endDate}<br>
                        Website: ${event.website}</div>`;
                }

                marker.bindTooltip(tooltipContent, { direction: 'auto' });
                return marker;
            }
        }).addTo(map);

        control.route();
    };

    // Main submit button of the form
    const form = document.getElementById("dateForm");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        fetchEvents();
    });
});

// Initialize the map centered on Lund
const map = L.map('map').setView([55.7047, 13.1910], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', function (e) {
    const userSelectedLat = e.latlng.lat;
    const userSelectedLon = e.latlng.lng;
    handleButtonClickOnMapClick(userSelectedLat, userSelectedLon);
});

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

const handleButtonClickOnMapClick = (userSelectedLat, userSelectedLon) => {
    PickLatValue = userSelectedLat;
    PickLonValue = userSelectedLon;

    coordinatesDiv.update(PickLatValue, PickLonValue);
    userLocationAvailable = true;
};
