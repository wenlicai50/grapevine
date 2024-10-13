const selectionMap = L.map('selection-map', {
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false
}).setView([42.3601, -71.0589], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
    opacity: 0.4
}).addTo(selectionMap);
var form_lat = undefined;
var form_lng = undefined;

var selectionMarker;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        async function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                selectionMap.setView([lat, lng], 13);
                document.getElementById('address').value = await reverseGeocode(lat, lng)
            },
            function () {
                alert("Unable to retrieve your location.");
            }
    );
}

document.getElementById('go-button').addEventListener('click', async function () {
    const address = document.getElementById('address').value.trim();
    const coords = await geocodeAddress(address);

    if (address) {
        fetch('/show-reports/find', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat: coords[0],
                    lng: coords[1],
                    dist: 1000,
                    filters: {
                        genReportType: "all",
                        reportType: "all",
                        time: undefined
                    }
                })
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
        alert('Please enter a valid address');
    }
});


function reverseGeocode(lat, lng) {
    var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var address = data.display_name || 'Unknown location';
            document.getElementById('address').value = address;
        })
        .catch(err => {
            console.error('Error in reverse geocoding:', err);
            document.getElementById('address').value = 'Unable to get address';
        });
}

var submittedMarkers = [];

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

function addSelectionMarker(lat, lng) {
    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    selectionMarker = L.marker([lat, lng]).addTo(selectionMap);
    selectionMarker.bindPopup(`<b>Selected Location:</b><br>${document.getElementById('address').value}`).openPopup();
}

var addressInput = document.getElementById('address');
var suggestionBox = document.getElementById('suggestion-box');

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

addressInput.addEventListener('input', debounce(function () {
    var query = addressInput.value;

    if (query.length > 2) {
        suggestionBox.innerHTML = '';

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    suggestionBox.style.display = 'block';
                    data.forEach(item => {
                        var li = document.createElement('li');
                        li.innerHTML = highlightMatch(item.display_name, query);
                        li.onclick = function () {
                            addressInput.value = item.display_name;
                            suggestionBox.innerHTML = '';

                            form_lat = item.lat;
                            form_lng = item.lon;
                        };
                        suggestionBox.appendChild(li);
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    } else {
        suggestionBox.innerHTML = '';
    }
}, 300));

function highlightMatch(text, query) {
    var regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function displaySelectedLocation() {
    if (form_lat && form_lng) {
        selectionMap.setView([form_lat, form_lng], 13);
        addSelectionMarker(form_lat, form_lng);

        displaySubmittedLocation(form_lat, form_lng, document.getElementById('address').value);
    }
}