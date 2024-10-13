var form_lat = undefined
var form_lng = undefined
var selectionMap = L.map('selection-map').setView([37.0902, -95.7129], 4);
var userMarker;
var selectionMarker;
var markers = []
var marker_circles = []
const optionMap = {
    "food": "Food",
    "attractions": "Attractions",
    "activities": "Activities",
    "transportation": "Transportation",
    "accommodation": "Accommodation",
    "shopping": "Shopping",
    "events": "Events",
    "nature-outdoors": "Nature & Outdoors",
    "culture": "Culture",
    "theft": "Theft",
    "vandalism": "Vandalism",
    "assault": "Assault",
    "burglary": "Burglary",
    "robbery": "Robbery",
    "drug-related incidents": "Drug-Related Incidents",
    "domestic-violence": "Domestic Violence"
};

window.onload = populateResults;

document.getElementById('toggle-time-filter').addEventListener('change', function () {
    const timeRange = document.getElementById('time-filter');

    if (this.checked) {
        timeRange.disabled = false;
    } else {
        timeRange.disabled = true;
    }
});

document.getElementById('time-filter').addEventListener('click', function () {
    this.showPicker();
});

document.addEventListener('DOMContentLoaded', function () {
    const timeInput = document.getElementById('time-filter');

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    timeInput.value = `${hours}:${minutes}`;
})

function getFilterValues() {
    const genReportFilterValue = document.getElementById('general-report-filter').value ?
        document.getElementById('general-report-filter').value : undefined;

    const reportFilterValue = document.getElementById('report-filter').value ?
        document.getElementById('report-filter').value : undefined;

    const timeFilterValue = document.getElementById('toggle-time-filter').checked ?
        document.getElementById('time-filter').value :
        undefined;
    let date;
    if (timeFilterValue) {
        date = new Date()
        date.setHours(timeFilterValue.substring(0, 2))
        date.setMinutes(timeFilterValue.substring(3))
    }

    return {
        genReportType: genReportFilterValue,
        reportType: reportFilterValue,
        time: timeFilterValue ? date : undefined
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
        alert('Please enter a valid address');
    }
}

document.getElementById('fetch-reports').addEventListener('click', getReports);
document.getElementById('apply-filter').addEventListener('click', getReports)

async function fetchAndDisplayAllWithinDist(lat, lng, dist, filters) {
    await fetch('/show-reports/find', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lat: lat,
                lng: lng,
                dist: dist,
                filters: filters
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            clearReports()
            if (selectionMarker) {
                selectionMap.removeLayer(selectionMarker);
            }

            if (userMarker) {
                selectionMap.removeLayer(userMarker);
            }

            userMarker = L.marker([lat, lng]).addTo(selectionMap).bindPopup('You are here!')
                .openPopup();
            userMarker._icon.style.filter = "hue-rotate(120deg)"

            markers.forEach(marker => {
                selectionMap.removeLayer(marker);
            });
            marker_circles.forEach(circle => {
                selectionMap.removeLayer(circle)
            })
            markers = [];
            marker_circles = [];

            for (var report of data) {
                addReport(report._id.toString(), optionMap[report.subtype], report.username, report.address, report.comment, report.rating, new Date(report.timestamp))

                const lat = report.lat;
                const lng = report.lng;

                const opacity = changeMarkerOpacity(report);
                const symbol = changeSymbol(report);

                const marker = L.marker([lat, lng]).addTo(selectionMap);
                marker.bindPopup(`
                        <b>${optionMap[report.subtype]}</b><br>
                        Name: ${report.username ? report.username : "Anonymous"}<br>
                        Comment: ${report.comment}<br>
                        Address: ${report.address}<br>
                        ${formatISODate(new Date(report.timestamp))}<br>
                        `)
                    .openPopup();

                marker.setIcon(L.divIcon({
                    className: 'custom-icon',
                    html: `<div style="opacity: ${opacity};">${symbol || ''}</div>`,
                    iconSize: [100, 100],
                    iconAnchor: [15, 15],
                }));

                var marker_circle = L.circle(marker.getLatLng(), {
                    color: report.reportType == "Incident" ? 'red' : 'steelblue',
                    fillOpacity: 0.5 * opacity,
                    radius: 30
                }).addTo(selectionMap);
                marker_circles.push(marker_circle)

                markers.push(marker);

            }

            selectionMap.setView([lat, lng], 16)
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

async function updateVote(id, incr) {
    await fetch("/show-reports/vote", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
                incr: incr
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(async data => {
            const reportBlock = document.getElementById(`report-${id}`);
            if (reportBlock) {
                const voteNumber = reportBlock.querySelector('span.mx-2');
                voteNumber.textContent = data.rating;
            }
        })
}

function clearReports() {
    const reportsContainer = document.getElementById('reports-container');

    while (reportsContainer.firstChild) {
        reportsContainer.removeChild(reportsContainer.firstChild);
    }
}

function addReport(id, title, name, address, description, rating, timestamp) {
    const reportsContainer = document.getElementById('reports-container');

    const reportBlock = document.createElement('div');
    reportBlock.classList.add('card', 'mb-3');
    reportBlock.id = `report-${id}`;

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title');
    cardTitle.textContent = title;

    const nameParagraph = document.createElement('p');
    nameParagraph.textContent = `Name: ${name}`;

    const addressParagraph = document.createElement('p');
    addressParagraph.textContent = `Address: ${address}`;

    const commentParagraph = document.createElement('p');
    commentParagraph.textContent = `Description: ${description}`;

    const timestampParagraph = document.createElement('p');
    timestampParagraph.textContent = `${formatISODate(timestamp)}`;

    const voteContainer = document.createElement('div');
    voteContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mt-3');

    const downVoteBtn = document.createElement('button');
    downVoteBtn.classList.add('btn', 'btn-outline-secondary');
    downVoteBtn.innerHTML = '&darr;';
    downVoteBtn.addEventListener('click', function () {
        updateVote(id, -1);
    });

    const voteNumber = document.createElement('span');
    voteNumber.classList.add('mx-2');
    voteNumber.textContent = `${rating}`;

    const upVoteBtn = document.createElement('button');
    upVoteBtn.classList.add('btn', 'btn-outline-secondary');
    upVoteBtn.innerHTML = '&uarr;';
    upVoteBtn.addEventListener('click', function () {
        updateVote(id, 1);
    });

    voteContainer.appendChild(downVoteBtn);
    voteContainer.appendChild(voteNumber);
    voteContainer.appendChild(upVoteBtn);

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(nameParagraph);
    cardBody.appendChild(addressParagraph);
    cardBody.appendChild(commentParagraph);
    cardBody.appendChild(timestampParagraph);
    cardBody.appendChild(voteContainer);

    reportBlock.appendChild(cardBody);

    reportsContainer.appendChild(reportBlock);
}

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(selectionMap);

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

            form_lat = lat
            form_lng = lng

            selectionMap.setView([lat, lng], 13);

            if (userMarker) {
                selectionMap.removeLayer(userMarker);
            }

            userMarker = L.marker([lat, lng]).addTo(selectionMap)
                .bindPopup('You are here!')
                .openPopup();
            userMarker._icon.style.filter = "hue-rotate(120deg)"
        }
    );
}

selectionMap.on('click', function (e) {
    form_lat = e.latlng.lat;
    form_lng = e.latlng.lng;

    if (selectionMarker) {
        selectionMap.removeLayer(selectionMarker);
    }

    selectionMarker = L.marker([form_lat, form_lng]).addTo(selectionMap);

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

                form_lat = lat ? lat : form_lat
                form_lng = lng ? lng : form_lng

                selectionMap.setView([lat, lng], 16);

                if (selectionMarker) {
                    selectionMap.removeLayer(selectionMarker);
                }

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

function reverseGeocode(lat, lng) {
    var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=us`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var address = data.display_name || 'Unknown location';
            document.getElementById('address-input').value = address;
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
async function populateResults() {
    const params = getQueryParams();
    if (Object.keys(params).length == 3) {
        form_lat = params.lat
        form_lng = params.lng
        let address = await reverseGeocode(form_lat, form_lng)
        document.getElementById("address-input").value = address
        await fetchAndDisplayAllWithinDist(params.lat, params.lng, params.dist, getFilterValues())
    }
}

function changeMarkerOpacity(report) {
    const reportDate = new Date(report.timestamp);
    const currentDate = new Date();
    const timeElapsed = Math.abs(currentDate - reportDate);
    const minOpacity = 2 * 24 * 60 * 60 * 1000;
    const opacity = 1 - Math.min(Math.max(timeElapsed / minOpacity, 0), 1);
    return opacity;
}

function changeSymbol(report) {
    let symbol = "";
    const reportTypeLower = report.reportType.toLowerCase();
    const reportSubtypeLower = report.subtype.toLowerCase();
    if (reportTypeLower === "incident") {
        switch (reportSubtypeLower) {
            case "theft":
                symbol = '<img src="assets/theft.png" alt="theft" width="30" height="30">';
                break;
            case "assault":
                symbol = '<img src="assets/assault.png" alt="theft" width="30" height="30">';
                break;
            case "drug-related incidents":
                symbol = '<img src="assets/drug-related-incidents.png" alt="theft" width="30" height="30">';
                break;
            default:
                symbol = "❓";
                break;
        }
    } else if (reportTypeLower === "recommendation") {
        switch (reportSubtypeLower) {
            case "shopping":
                symbol = '<img src="assets/shopping.png" alt="theft" width="30" height="30">';
                break;
            case "events":
                symbol = '<img src="assets/events.png" alt="theft" width="30" height="30">';
                break;
            case "nature-outdoors":
                symbol = '<img src="assets/nature-outdoors.png" alt="theft" width="30" height="30">';
                break;
            default:
                symbol = "❓";
                break;
        }
    }
    return symbol;
}

var addressInput = document.getElementById('address-input');
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
                            if (selectionMarker) {
                                selectionMap.removeLayer(selectionMarker);
                            }

                            selectionMarker = L.marker([item.lat, item.lon]).addTo(selectionMap);

                            selectionMarker.bindPopup(`<b>Selected Location:</b><br>${item.display_name}`).openPopup();
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

function formatISODate(isoString) {
    const date = new Date(isoString);

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    return date.toLocaleString('en-US', options);
}