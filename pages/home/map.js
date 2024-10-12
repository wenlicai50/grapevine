// Create the map focused on Boston
const selectionMap = L.map('selection-map', {
    dragging: false, // Disable dragging
    touchZoom: false, // Disable touch zoom
    scrollWheelZoom: false, // Disable scroll wheel zoom
    doubleClickZoom: false // Disable double click zoom
}).setView([42.3601, -71.0589], 13); // Set to Boston's coordinates

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
    opacity: 0.4
}).addTo(selectionMap);
var form_lat = undefined;
var form_lng = undefined;

var selectionMarker;

// Try to get the user's current location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

            // Set the view to the user's location
            selectionMap.setView([lat, lng], 13);

            // Add a marker for the user's location
         
        },
        function() {
            alert("Unable to retrieve your location.");
        }
    );
}

document.getElementById('go-button').addEventListener('click', async function() {
    const address = document.getElementById('address').value.trim();
    const coords = await geocodeAddress(address);

    if (address) {
        // Send a POST request to /show-reports/find
        fetch('/show-reports/find', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({lat: coords[0], lng: coords[1], dist: 1000, filters:{reportType:"all", time: undefined}}) // Send the report ID in the request body
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            window.location = "/show-reports?lat=" + coords[0] + "&lng=" + coords[1] + "&dist=" + 1000
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
    } else {
        //TODO
        alert('Please enter a valid address'); // Prompt for report ID if empty
    }
});


// Reverse geocoding function
function reverseGeocode(lat, lng) {
    var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var address = data.display_name || 'Unknown location';
            document.getElementById('address').value = address; // Update address input field
            selectionMarker.bindPopup(`<b>Selected Location:</b><br>${address}`).openPopup();
        })
        .catch(err => {
            console.error('Error in reverse geocoding:', err);
            document.getElementById('address').value = 'Unable to get address';
        });
}

var submittedMarkers = []; // Array to keep track of submitted markers

// Geocode the address and display it on the main map
async function geocodeAddress(address) {
    var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us`;
    var lat = undefined
    var lng = undefined

    await fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lng = parseFloat(data[0].lon);
                console.log(lat)
                console.log("lat")
            } else {
                alert('Address not found.');
            }
        })
        .catch(err => {
            console.error('Error in geocoding:', err);
            alert('Error in geocoding the address.');
        });
    return [lat, lng]
}

// Add selection marker to the selection map
function addSelectionMarker(lat, lng) {
    // Remove existing marker if present
    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    // Add a new marker at the geocoded location
    selectionMarker = L.marker([lat, lng]).addTo(selectionMap);
    selectionMarker.bindPopup(`<b>Selected Location:</b><br>${document.getElementById('address').value}`).openPopup();
}

// Address suggestion handling
var addressInput = document.getElementById('address');
var suggestionBox = document.getElementById('suggestion-box');

// Debounce function to limit API calls
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Add an input event listener for suggestions with debounce
addressInput.addEventListener('input', debounce(function() {
    console.log("a")
    var query = addressInput.value;

    // Clear suggestions if new input is entered
    if (query.length > 2) { // Trigger suggestions after 2 characters
        suggestionBox.innerHTML = ''; // Clear previous suggestions

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    suggestionBox.style.display = 'block'; 
                    data.forEach(item => {
                        console.log(item)
                        var li = document.createElement('li');
                        li.innerHTML = highlightMatch(item.display_name, query); // Highlight matching part
                        li.onclick = function() {
                            // Set the input to the selected address and clear suggestions
                            addressInput.value = item.display_name; // Set the input field to the selected address
                            suggestionBox.innerHTML = ''; // Clear suggestions after selection

                            // Store the selected location's lat/lng for later use
                            form_lat = item.lat; // Store latitude for later use
                            form_lng = item.lon; // Store longitude for later use
                        };
                        suggestionBox.appendChild(li);
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    } else {
        suggestionBox.innerHTML = ''; // Clear suggestions for empty input
    }
}, 300)); // Delay of 300 ms for debounce

// Function to highlight matching text
function highlightMatch(text, query) {
    var regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>'); // Highlight matches
}

// Function to display selected location on both maps on submit
function displaySelectedLocation() {
    // Ensure the second map is updated only on form submission
    if (form_lat && form_lng) {
        // Center the selection map on the selected location
        selectionMap.setView([form_lat, form_lng], 13); // Adjust the zoom level as needed
        addSelectionMarker(form_lat, form_lng); // Add the marker to the selection map

        // Also display it on the main map
        displaySubmittedLocation(form_lat, form_lng, document.getElementById('address').value); // Display it on the main map as well
    }
}
