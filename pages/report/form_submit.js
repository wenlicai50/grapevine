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

// Function to populate the list with query parameters
function populateResults() {
    let fieldMap = {
        "name": "Name",
        "address": "Address",
        "time": "Time",
        "reportType": "Report Type",
        "reportSubtype": "Report Subtype",
        "comment": "Comment"
    }
    const params = getQueryParams();
    const resultList = document.getElementById('submission-details');
    for (const [key, value] of Object.entries(params)) {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<strong>${fieldMap[key]}:</strong> ${key != "time" ? value : formatISODate(value)}`;
        resultList.appendChild(li);
    }
}

function formatISODate(isoString) {
    const date = new Date(isoString);
    
    // Options for formatting the date
    const options = {
        year: 'numeric',
        month: 'long', // You can use 'short' for abbreviated month names
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true // Set to false for 24-hour format
    };

    return date.toLocaleString('en-US', options); // Adjust locale as needed
}

// Populate the results when the page loads
window.onload = populateResults;