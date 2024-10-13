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

window.onload = populateResults;