const express = require("express")
const path = require('path');
const mongoose = require('mongoose')
const haversine = require('haversine-distance')
const router = express.Router()
const Report = require('./../../schema/report')

router.use(express.static(path.join(__dirname)));
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

router.post('/find', async (req, res) => {
    const filters = req.body.filters
    var reports;
    console.log(req.body)
    if(filters.reportType == "all"){
        reports = await Report.find({})
    } else {
        reports = await Report.find({reportType: filters.reportType})
    }

    if(filters.time){
        reports = reports.filter(report => {
            let hour = parseInt(filters.time.substring(0,2))
            let minute = parseInt(filters.time.substring(3))
            reportDate = new Date(report.timestamp)
            console.log(reportDate.getHours())
            console.log(Math.abs(reportDate.getHours() - hour))

            return Math.abs(reportDate.getHours() - hour) < 3
        })
    }

    var returned_reports = []
    for(const report of reports){
        if(haversine({latitude: report.lat, longitude: report.lng}, {latitude: req.body.lat, longitude: req.body.lng}) < req.body.dist){
            // console.log(report)
            returned_reports.push(report)
        }
    }
    console.log("sending")
    res.send(JSON.stringify(returned_reports))
})

router.post('/vote', async (req, res) => {
    console.log(req.body.id)
    const report = await findReportById(new mongoose.Types.ObjectId(req.body.id))
    console.log(report)
    report.updateOne({rating: report.rating += req.body.incr})
    report.save()

    res.send(JSON.stringify(report))
})

async function findReportById(id){
    const reports = await Report.findById(id);
    return reports
}

module.exports = router;