const express = require("express")
const path = require('path');
const haversine = require('haversine-distance')
const router = express.Router()
const Report = require('./../../schema/report')

router.use(express.static(path.join(__dirname)));
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

router.post('/find', async (req, res) => {
    const reports = await closeReports();
    var returned_reports = []
    for(const report of reports){
        if(haversine({latitude: report.lat, longitude: report.lng}, {latitude: req.body.lat, longitude: req.body.lng}) < req.body.dist){
            console.log(report)
            returned_reports.push(report)
        }
    }
    res.send(JSON.stringify(returned_reports))
})

async function closeReports() {
    const reports = await Report.find();
    // console.log(reports);
    return reports
}

module.exports = router;