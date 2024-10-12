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
var marker_circles = []

// Populate the results when the page loads
window.onload = populateResults;

document.getElementById('toggle-time-filter').addEventListener('change', function() {
    const timeRange = document.getElementById('time-filter');

    if (this.checked) {
        timeRange.disabled = false; // Show the time input
    } else {
        console.log("a")
        timeRange.disabled = true; // Hide the time input
    }
});

document.getElementById('time-filter').addEventListener('click', function() {
    this.showPicker(); // Open the time picker dropdown programmatically
});

document.addEventListener('DOMContentLoaded', function() {
    const timeInput = document.getElementById('time-filter');

    // Get the current date and time
    const now = new Date();

    // Format the time to HH:MM
    const hours = String(now.getHours()).padStart(2, '0'); // Get hours and pad with leading zero
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Get minutes and pad with leading zero

    // Set the value of the time input
    timeInput.value = `${hours}:${minutes}`;
})

function getFilterValues() {
    // Get the selected value from the dropdown
    const reportFilterValue = document.getElementById('report-filter').value;

    // Get the time input value, checking if the toggle is enabled
    const timeFilterValue = document.getElementById('toggle-time-filter').checked
        ? document.getElementById('time-filter').value
        : null; // If not checked, return null or some default value

    // Return an object containing the filter values
    return {
        reportType: reportFilterValue,
        time: timeFilterValue
    };
}

async function getReports() {
    const filters = getFilterValues()
    const address = document.getElementById('address-input').value.trim();
    const distance = document.getElementById('distance-input').value.trim();
    await geocodeAddress(address);

    if (address) {
        await fetchAndDisplayAllWithinDist(form_lat, form_lng, distance, filters)
    } else {
        //TODO
        alert('Please enter a valid address'); // Prompt for report ID if empty
    }
}

document.getElementById('fetch-reports').addEventListener('click', getReports);
document.getElementById('apply-filter').addEventListener('click', getReports)

async function fetchAndDisplayAllWithinDist(lat, lng, dist, filters){
            // Send a POST request to /show-reports/find
            await fetch('/show-reports/find', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({lat: lat, lng: lng, dist: dist, filters:filters}) // Send the report ID in the request body
            })
            .then(response => {
                console.log("gotten")
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse the JSON from the response
            })
            .then(data => {
                console.log("post response")
                clearReports()
                if (selectionMarker) {
                    selectionMap.removeLayer(selectionMarker);
                }

                if(userMarker){
                    selectionMap.removeLayer(userMarker);
                }
                
                // Add a new marker at clicked location
                userMarker = L.marker([lat, lng]).addTo(selectionMap).bindPopup('You are here!')
                .openPopup();
                userMarker._icon.style.filter = "hue-rotate(120deg)"
                console.log(userMarker)

                markers.forEach(marker => {
                    selectionMap.removeLayer(marker); // Remove each marker from the map
                });
                marker_circles.forEach(circle => {
                    selectionMap.removeLayer(circle)
                })
                markers = [];
                marker_circles = [];
    
                for (var report of data) {
                    addReport(report._id.toString(), report.subtype, report.username, report.address, report.comment, report.rating)

                    const lat = report.lat;
                    const lng = report.lng;
    
                    // Get the symbol and opacity for this report
                    const opacity = changeMarkerOpacity(report); // Assuming changeMarkerOpacity takes the report as argument
                    const symbol = changeSymbol(report); // Assuming changeSymbol takes the report as argument
    
                    const marker = L.marker([lat, lng]).addTo(selectionMap);
                    marker.bindPopup(`
                        <b>${report.subtype}</b><br>
                        Name: ${report.username ? report.username : "Anonymous"}<br>
                        Comment: ${report.comment}<br>
                        Address: ${report.address}<br>
                        `)
                        .openPopup(); // Optional: opens popup on marker
    
                    // Set the icon for the marker including opacity
                    marker.setIcon(L.divIcon({
                        className: 'custom-icon',
                        html: `<div style="opacity: ${opacity};">${symbol || ''}</div>`,
                        iconSize: [25, 41],
                        iconAnchor: [15, 15],
                    }));

                    var marker_circle = L.circle(marker.getLatLng(), {
                        color: 'steelblue',
                        fillOpacity: 0.1,
                        radius: 30
                      }).addTo(selectionMap);
    
                    markers.push(marker);
                    marker_circles.push(marker_circle)
                }
    
    
                selectionMap.setView([lat, lng], 16)
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
}

async function updateVote(id, incr){
    await fetch("/show-reports/vote", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: id, incr: incr}) // Send the report ID in the request body
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON from the response
    })
    .then(async data => {
        clearReports()
        const params = getQueryParams()
        if(Object.keys(params).length == 3){
            await fetchAndDisplayAllWithinDist(params.lat, params.lng, params.dist)
        } else {
            const address = document.getElementById('address-input').value.trim();
            const distance = document.getElementById('distance-input').value.trim();
            await geocodeAddress(address);
            await fetchAndDisplayAllWithinDist(form_lat, form_lng, distance)
        }

    })
}

function clearReports(){
    const reportsContainer = document.getElementById('reports-container');
    
    // This will remove all child elements from the container
    while (reportsContainer.firstChild) {
        reportsContainer.removeChild(reportsContainer.firstChild);
    }
}

function addReport(id, title, name, address, description, rating) {
    const reportsContainer = document.getElementById('reports-container');

    // Create a new div for the report
    const reportBlock = document.createElement('div');
    reportBlock.classList.add('card', 'mb-3');  // Bootstrap card component
    reportBlock.id = `report-${id}`;

    // Create card body
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    // Create card title
    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title');
    cardTitle.textContent = title;

    // Create card text
    const nameParagraph = document.createElement('p');
    nameParagraph.textContent = `Name: ${name}`;

    const addressParagraph = document.createElement('p');
    addressParagraph.textContent = `Address: ${address}`;

    const commentParagraph = document.createElement('p');
    commentParagraph.textContent = `Description: ${description}`;

    // Create upvote/downvote buttons and number
    const voteContainer = document.createElement('div');
    voteContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mt-3'); // Flex container for buttons and number

    const downVoteBtn = document.createElement('button');
    downVoteBtn.classList.add('btn', 'btn-outline-secondary');
    downVoteBtn.innerHTML = '&darr;'; // Down arrow
    downVoteBtn.addEventListener('click', function() {
        updateVote(id, -1); // Call the updateVote function when clicked
    });

    const voteNumber = document.createElement('span');
    voteNumber.classList.add('mx-2'); // Margin on both sides
    voteNumber.textContent = `${rating}`; // Initial vote number (can be updated)

    const upVoteBtn = document.createElement('button');
    upVoteBtn.classList.add('btn', 'btn-outline-secondary');
    upVoteBtn.innerHTML = '&uarr;'; // Up arrow
    upVoteBtn.addEventListener('click', function() {
        updateVote(id, 1); // Call the updateVote function when clicked
    });

    voteContainer.appendChild(downVoteBtn);
    voteContainer.appendChild(voteNumber);
    voteContainer.appendChild(upVoteBtn);

    // Append title and text to the card body
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(nameParagraph);
    cardBody.appendChild(addressParagraph);
    cardBody.appendChild(commentParagraph);
    cardBody.appendChild(voteContainer);

    // Append card body to the report block (card)
    reportBlock.appendChild(cardBody);

    // Append the report block to the reports container
    reportsContainer.appendChild(reportBlock);
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
            userMarker._icon.style.filter = "hue-rotate(120deg)"
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
        form_lat = params.lat
        form_lng = params.lng
        await fetchAndDisplayAllWithinDist(params.lat, params.lng, params.dist, {reportType:"all", time: undefined})
        console.log("post await")
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

// Address suggestion handling
var addressInput = document.getElementById('address-input');
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
                                // Remove existing marker if present
                            if (selectionMarker) {
                                selectionMap.removeLayer(selectionMarker);
                            }

                            // Add a new marker at the geocoded location
                            selectionMarker = L.marker([item.lat, item.lon]).addTo(selectionMap);

                            // Bind the popup to show the address above the marker
                            selectionMarker.bindPopup(`<b>Selected Location:</b><br>${item.display_name}`).openPopup();
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
