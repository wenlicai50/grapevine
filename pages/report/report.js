document.getElementById('time').addEventListener('click', function () {
    this.showPicker();
});

var selectionMap = L.map('selection-map').setView([37.0902, -95.7129], 4);
var form_lat = undefined;
var form_lng = undefined;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(selectionMap);

var selectionMarker;

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                form_lat = lat
                form_lng = lng
                selectionMap.setView([lat, lng], 13);
                addSelectionMarker(lat, lng);

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

getCurrentLocation();

selectionMap.on('click', function (e) {
    form_lat = e.latlng.lat;
    form_lng = e.latlng.lng;

    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    selectionMarker = L.marker([form_lat, form_lng]).addTo(selectionMap);

    reverseGeocode(form_lat, form_lng);
});

function reverseGeocode(lat, lng) {
    var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var address = data.display_name || 'Unknown location';
            document.getElementById('address').value = address;
            selectionMarker.bindPopup(`<b>Selected Location:</b><br>${address}`).openPopup();
        })
        .catch(err => {
            console.error('Error in reverse geocoding:', err);
            document.getElementById('address').value = 'Unable to get address';
        });
}

document.getElementById('location-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const timeValue = document.getElementById('time').value;
    const currentDateTime = new Date((new Date()).toDateString() + ' ' + timeValue);

    const formData = {
        name: document.getElementById('name').value.trim(),
        address: document.getElementById('address').value.trim(),
        lat: form_lat,
        lng: form_lng,
        time: currentDateTime.toISOString() ? currentDateTime.toISOString() : new Date(),
        reportType: document.getElementById('report-type').value.trim(),
        reportSubtype: document.getElementById('report-subtype').value.trim() ? document.getElementById('report-subtype').value.trim() : document.getElementById('recommendation-subtype').value.trim(),
        comment: document.getElementById('comment').value.trim()
    };

    const addressField = document.getElementById('address');
    const addressWarning = document.getElementById('address-warning');

    if (!form_lat || !form_lng) {
        addressWarning.style.display = 'block';
        addressField.classList.add('is-invalid');
        return
    }

    addressWarning.style.display = 'none';
    addressField.classList.remove('is-invalid');

    await fetch('/report/map', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    }).then((res) => {
        window.location = res.url
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const reportTypeField = document.getElementById('report-type');
    const incidentFields = document.getElementById('incident-fields');
    const recommendationFields = document.getElementById('recommendation-fields');
    const timeInput = document.getElementById('time');
    const timeDiv = document.getElementById('time-div');

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    timeInput.value = `${hours}:${minutes}`;

    reportTypeField.addEventListener('change', function () {
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

function geocodeAddress(address) {
    var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                var lat = parseFloat(data[0].lat);
                var lng = parseFloat(data[0].lon);
                displaySubmittedLocation(lat, lng, address);

                selectionMap.setView([lat, lng], 13);

                addSelectionMarker(lat, lng, address);
            } else {
                alert('Address not found.');
            }
        })
        .catch(err => {
            console.error('Error in geocoding:', err);
            alert('Error in geocoding the address.');
        });
}

function addSelectionMarker(lat, lng, address) {
    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    selectionMarker = L.marker([lat, lng]).addTo(selectionMap);

    selectionMarker.bindPopup(`<b>Selected Location:</b><br>${address}`).openPopup();
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
                    data.forEach(item => {
                        var li = document.createElement('li');
                        li.innerHTML = highlightMatch(item.display_name, query);
                        li.onclick = function () {
                            addressInput.value = item.display_name;
                            suggestionBox.innerHTML = '';

                            form_lat = item.lat;
                            form_lng = item.lon;
                            addSelectionMarker(item.lat, item.lon, item.display_name);
                            selectionMap.setView([item.lat, item.lon], 13);
                        };
                        suggestionBox.appendChild(li);
                    });
                } else {
                    form_lat = undefined;
                    form_lng = undefined;
                    suggestionBox.innerHTML = '<li>No suggestions found</li>';
                }
            })
            .catch(err => {
                console.error('Error fetching suggestions:', err);
            });
    }
}, 300));

function highlightMatch(address, query) {
    var regex = new RegExp(`(${query})`, 'gi');
    return address.replace(regex, '<strong>$1</strong>');
}