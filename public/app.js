document.addEventListener("DOMContentLoaded", function () {
    const apiKey = '35a4bdb07a454d9b9bedcfbe1497e315';
    const fromDateInput = document.getElementById("pickFromDate");
    const fromTimeInput = document.getElementById("pickFromTIme");
    /* const toDateInput = document.getElementById("pickToDate"); */
    const toTimeInput = document.getElementById("pickToTime");
    const eventList = document.getElementById("eventList");
    const eventCategoriesList = document.getElementById("eventCategoriesList"); // Add a DOM element to display event categories


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

    const displayEvents = (data) => {
        eventCategoriesList.innerHTML = '<h2>Event Categories:</h2>'; // Initialize the list for event categories

        const ul = document.createElement('ul');
        const eventCategories = []; // Create an array to store unique event categories

        if (data && Array.isArray(data.items)) {
            data.items.forEach(event => {
                const li = document.createElement('li');
                li.textContent = event.eventAddress + '(' + event.mapCoordinates.lat + ',' + event.mapCoordinates.lng + ')' + event.eventCategory; // Display the event address (customize as needed)
                ul.appendChild(li);
				
				const categories = event.eventCategory
				categories.forEach(cat =>{
					if (typeof cat === 'string') {
						/* console.log(cat) */
						// Iterate through the categories and add them individually
						if (!eventCategories.includes(cat.trim())) {
						  eventCategories.push(cat.trim());
						}
					}	
				})
				
            });
        } else {
            // Handle the case where 'items' is not an array or is missing (e.g., display an error message)
            const li = document.createElement('li');
            li.textContent = 'No events found'; // Customize this error message
            ul.appendChild(li);
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