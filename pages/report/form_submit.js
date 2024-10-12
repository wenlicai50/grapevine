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
    const params = getQueryParams();
    const resultList = document.getElementById('submission-details');
    for (const [key, value] of Object.entries(params)) {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}`;
        resultList.appendChild(li);
    }
}

// Populate the results when the page loads
window.onload = populateResults;