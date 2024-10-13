document.getElementById('time').addEventListener('click', function() {
    this.showPicker(); // Open the time picker dropdown programmatically
});

// Map for selecting the location
var selectionMap = L.map('selection-map').setView([37.0902, -95.7129], 4); // Centered on the U.S.
var form_lat = undefined;
var form_lng = undefined;

// Add OpenStreetMap tiles for the selection map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(selectionMap);

var selectionMarker;

// Function to get the user's current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                selectionMap.setView([lat, lng], 13); // Set the map view to the user's location
                addSelectionMarker(lat, lng); // Add a marker at the user's location

                // Optional: You can reverse geocode here if you want to display the address
                reverseGeocode(lat, lng);
            },
            function () {
                alert("Unable to retrieve your location. Please enable location services.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Call getCurrentLocation to set the map to the user's location
getCurrentLocation();

// Listen for click events on the selection map
selectionMap.on('click', function(e) {
    form_lat = e.latlng.lat;
    form_lng = e.latlng.lng;

    // Remove existing marker if present
    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    // Add a new marker at clicked location
    selectionMarker = L.marker([form_lat, form_lng]).addTo(selectionMap);

    // Reverse geocode to get the address
    reverseGeocode(form_lat, form_lng);
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

// Handle form submission
document.getElementById('location-form').addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent form from refreshing the page
    const timeValue = document.getElementById('time').value;
    const currentDateTime = new Date((new Date()).toDateString() + ' ' + timeValue);

    const formData = {
        name: document.getElementById('name').value.trim(),
        address: document.getElementById('address').value.trim(),
        lat: form_lat,
        lng: form_lng,
        time: currentDateTime.toISOString() ? currentDateTime.toISOString() : new Date(),
        reportType: document.getElementById('report-type').value.trim(),
        reportSubtype: document.getElementById('report-subtype').value.trim() ? document.getElementById('report-subtype').value.trim(): document.getElementById('recommendation-subtype').value.trim(),
        comment: document.getElementById('comment').value.trim()
    };

    const addressField = document.getElementById('address');
    const addressWarning = document.getElementById('address-warning');

    if(!form_lat || !form_lng){
        addressWarning.style.display = 'block';
        addressField.classList.add('is-invalid');
        return
    }

    addressWarning.style.display = 'none';
    addressField.classList.remove('is-invalid');

    //server call
    await fetch('/report/map', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    }).then((res) => {window.location = res.url});
});

// Loading reporting form based on recommendation
document.addEventListener('DOMContentLoaded', function() {
    const reportTypeField = document.getElementById('report-type');
    const incidentFields = document.getElementById('incident-fields');
    const recommendationFields = document.getElementById('recommendation-fields');
    const timeInput = document.getElementById('time');
    const timeDiv = document.getElementById('time-div');

    // Get the current date and time
    const now = new Date();

    // Format the time to HH:MM
    const hours = String(now.getHours()).padStart(2, '0'); // Get hours and pad with leading zero
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Get minutes and pad with leading zero

    // Set the value of the time input
    timeInput.value = `${hours}:${minutes}`;

    // Add event listener to the report type dropdown
    reportTypeField.addEventListener('change', function() {
        if (this.value === 'Incident') {
            incidentFields.style.display = 'block';
            recommendationFields.style.display = 'none';
            timeDiv.style.display = 'block'
        } else if (this.value === 'Recommendation') {
            recommendationFields.style.display = 'block';
            incidentFields.style.display = 'none';
            timeDiv.style.display = 'none'
        } else {
            incidentFields.style.display = 'none';
            recommendationFields.style.display = 'none';
            timeDiv.style.display = 'none'
        }
    });
});

// Geocode the address and display it on the main map
function geocodeAddress(address) {
    var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                var lat = parseFloat(data[0].lat);
                var lng = parseFloat(data[0].lon);
                displaySubmittedLocation(lat, lng, address);

                // Center the selection map on the new address
                selectionMap.setView([lat, lng], 13); // Zoom level can be adjusted

                // Place a pin on the selection map
                addSelectionMarker(lat, lng, address); // Pass the address to the marker
            } else {
                alert('Address not found.');
            }
        })
        .catch(err => {
            console.error('Error in geocoding:', err);
            alert('Error in geocoding the address.');
        });
}

// Add selection marker to the selection map
function addSelectionMarker(lat, lng, address) {
    // Remove existing marker if present
    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    // Add a new marker at the geocoded location
    selectionMarker = L.marker([lat, lng]).addTo(selectionMap);

    // Bind the popup to show the address above the marker
    selectionMarker.bindPopup(`<b>Selected Location:</b><br>${address}`).openPopup();
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
    var query = addressInput.value;

    // Clear suggestions if new input is entered
    if (query.length > 2) { // Trigger suggestions after 2 characters
        suggestionBox.innerHTML = ''; // Clear previous suggestions

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    data.forEach(item => {
                        var li = document.createElement('li');
                        li.innerHTML = highlightMatch(item.display_name, query); // Highlight matching part
                        li.onclick = function() {
                            // Set the input to the selected address and clear suggestions
                            addressInput.value = item.display_name; // Set the input field to the selected address
                            suggestionBox.innerHTML = ''; // Clear suggestions after selection

                            // Display the selected location on the selection map without submitting
                            form_lat = item.lat;
                            form_lng = item.lon;
                            addSelectionMarker(item.lat, item.lon, item.display_name); // Pass the address to the marker
                            selectionMap.setView([item.lat, item.lon], 13); // Center the map on the selected address
                        };
                        suggestionBox.appendChild(li);
                    });
                } else {
                    form_lat = undefined;
                    form_lng = undefined;
                    suggestionBox.innerHTML = '<li>No suggestions found</li>'; // Optional: show if no suggestions
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    }
}, 300)); // Adjust the debounce delay as needed

// Function to highlight matches in the suggestions
function highlightMatch(address, query) {
    var regex = new RegExp(`(${query})`, 'gi');
    return address.replace(regex, '<strong>$1</strong>'); // Bold matching parts
}
