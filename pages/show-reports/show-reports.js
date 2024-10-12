var form_lat = undefined
var form_lng = undefined

// fetch-reports.js
//60, Shepard Street, Old Cambridge, Cambridge, Middlesex County, Massachusetts, 02140, United States

// Map for selecting the location
var selectionMap = L.map('selection-map').setView([37.0902, -95.7129], 4); // Centered on the U.S.
//user location
var userMarker;
//NOT user location, this is the location they click on
var selectionMarker;
var markers = []

// Populate the results when the page loads
window.onload = populateResults;

document.getElementById('fetch-reports').addEventListener('click', async function() {
    const address = document.getElementById('address-input').value.trim();
    const distance = document.getElementById('distance-input').value.trim();
    await geocodeAddress(address);
    console.log(form_lat)

    if (address) {
        await fetchAndDisplayAllWithinDist(form_lat, form_lng, distance)
    } else {
        //TODO
        alert('Please enter a valid address'); // Prompt for report ID if empty
    }
});

async function fetchAndDisplayAllWithinDist(lat, lng, dist){
            // Send a POST request to /show-reports/find
            await fetch('/show-reports/find', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({lat: lat, lng: lng, dist: dist}) // Send the report ID in the request body
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse the JSON from the response
            })
            .then(data => {
                if (selectionMarker) {
                    selectionMap.removeLayer(selectionMarker);
                }

                if(userMarker){
                    selectionMap.removeLayer(userMarker);
                }
    
                // Add a new marker at clicked location
                userMarker = L.marker([lat, lng]).addTo(selectionMap).bindPopup('You are here!')
                .openPopup();

                markers.forEach(marker => {
                    selectionMap.removeLayer(marker); // Remove each marker from the map
                });
                markers = [];
    
                for (var report of data) {
                    const lat = report.lat;
                    const lng = report.lng;
    
                    // Get the symbol and opacity for this report
                    const opacity = changeMarkerOpacity(report); // Assuming changeMarkerOpacity takes the report as argument
                    const symbol = changeSymbol(report); // Assuming changeSymbol takes the report as argument
    
                    const marker = L.marker([lat, lng]).addTo(selectionMap);
                    marker.bindPopup(`
                        <b>${report.reportType.toLowerCase() == "recommendation" ? report.reportType : report.subtype}</b><br>
                        Name: ${report.username ? report.username : "Anonymous"}<br>
                        Comment: ${report.comment}<br>
                        Address: ${report.address}<br>`)
                        .openPopup(); // Optional: opens popup on marker
    
                    // Set the icon for the marker including opacity
                    marker.setIcon(L.divIcon({
                        className: 'custom-icon',
                        html: `<div style="opacity: ${opacity};">${symbol || ''}</div>`,
                        iconSize: [25, 41],
                        iconAnchor: [0, 0],
                    }));
    
                    markers.push(marker);
                }
    
    
                selectionMap.setView([lat, lng], 16)
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
}






// Add OpenStreetMap tiles for the selection map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(selectionMap);

// Try to get the user's current location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

            form_lat = lat
            form_lng = lng

            // Set the view to the user's location
            selectionMap.setView([lat, lng], 13);

            if (userMarker) {
                selectionMap.removeLayer(userMarker);
            }

            // Add a marker for the user's location
            userMarker = L.marker([lat, lng]).addTo(selectionMap)
                .bindPopup('You are here!')
                .openPopup();
        }
    );
}

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

async function geocodeAddress(address) {
    var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us`;

    await fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                var lat = parseFloat(data[0].lat);
                var lng = parseFloat(data[0].lon);

                console.log(lat)
                form_lat = lat ? lat : form_lat
                form_lng = lng ? lng : form_lng

                // Center the selection map on the new address
                selectionMap.setView([lat, lng], 16); // Zoom level can be adjusted

                // Remove existing marker if present
                if (selectionMarker) {
                    selectionMap.removeLayer(selectionMarker);
                }

                // Add a new marker at clicked location
                selectionMarker = L.marker([lat, lng]).addTo(selectionMap).bindPopup('You are here!')
                .openPopup();;

                return true;
            } else {
                alert('Address not found.');
            }
        })
        .catch(err => {
            console.error('Error in geocoding:', err);
            alert('Error in geocoding the address.');
            return false;
        });
}

// Reverse geocoding function
function reverseGeocode(lat, lng) {
    var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var address = data.display_name || 'Unknown location';
            document.getElementById('address-input').value = address; // Update address input field
            selectionMarker.bindPopup(`<b>Selected Location:</b><br>${address}`).openPopup();
        })
        .catch(err => {
            console.error('Error in reverse geocoding:', err);
        });
}

function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m;
    while (m = regex.exec(queryString)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;  
}
//60, Shepard Street, Old Cambridge, Cambridge, Middlesex County, Massachusetts, 02140, United States
// Function to populate the list with query parameters
async function populateResults() {
    const params = getQueryParams();
    console.log(Object.keys(params))
    if(Object.keys(params).length == 3){
        console.log("b ")
        await fetchAndDisplayAllWithinDist(params.lat, params.lng, params.dist)
    }
}

function changeMarkerOpacity(report){
    const reportDate = new Date(report.timestamp); //time from report object
    const currentDate = new Date(); 
    const timeElapsed = currentDate - reportDate; //returns milliseconds
    const minOpacity = 24 * 60 * 60 * 1000; 
    const opacity = 1 - Math.min(Math.max(timeElapsed / minOpacity, 0), 1); //return opacity between 0 and 1
    console.log(`Opacity Level: ${opacity}`);
    return opacity;
}

function changeSymbol(report) {
    let symbol = ""; //initialize
    const reportTypeLower = report.reportType.toLowerCase();
    const reportSubtypeLower = report.subtype.toLowerCase();
    if (reportTypeLower=== "incident") {
        switch (reportSubtypeLower) {
            case "theft":
                symbol = '<img src="assets/theft.png" alt="theft" width="30" height="30">'; 
                break;
            case "vandalism":
                symbol = "🎨"; 
                break;
            case "assault":
                symbol = "⚠️"; 
                break;
            case "burglary":
                symbol = "🏠🔓"; 
                break;
            case "robbery":
                symbol = "🕵️‍♂️"; 
                break;
            case "public disorder":
                symbol = "👥"; 
                break;
            case "drug-related incidents":
                symbol = "💊"; 
                break;
            case "domestic violence":
                symbol = "🏠❤️"; 
                break;
            default:
                symbol = "❓"; //no input
                break;
        }
    } else if (reportTypeLower === "recommendation") {
        switch (reportSubtypeLower) {
            case "food":
                symbol = "🍽️"; 
                break;
            case "attractions":
                symbol = "🏛️"; 
                break;
            case "activities":
                symbol = "🚴"; 
                break;
            case "transportation":
                symbol = "🚌";
                break;
            case "accommodation":
                symbol = "🏨";
                break;
            case "shopping":
                symbol = "🛍️"; 
                break;
            case "events":
                symbol = "🎉"; 
                break;
            case "nature & outdoors":
                symbol = "🌳"; 
                break;
            case "culture":
                symbol = "🎨"; 
                break;
            default:
                symbol = "❓"; //no input
                break;
        }
    }
    console.log(`Symbol for ${report.reportType} - ${report.reportSubtype}: ${symbol}`);
    return symbol; 
}
