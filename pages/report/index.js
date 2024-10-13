const express = require("express")
const path = require('path');
const router = express.Router()
const bodyParser = require('body-parser')
const Report = require('./../../schema/report')

router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static(path.join(__dirname)));

router.get("/", (req, res) => {
    const filepath = path.join(__dirname, '/index.html')
    res.sendFile(filepath)
})
router.get("/form_submit", (req, res) => {
    const filepath = path.join(__dirname, '/submit.html')
    res.sendFile(filepath)
})

router.post("/map", async (req, res) => {
    try {
    const report = new Report({
        username: req.body.name,
        address: req.body.address,
        lat: req.body.lat,
        lng: req.body.lng,
        timestamp: req.body.time,
        reportType: req.body.reportType,
        subtype: req.body.reportSubtype,
        comment: req.body.comment,
        rating: 0
    });
    await report.save()

    const { name, address, lat, lng, time, reportType, reportSubtype, comment } = req.body;
    res.redirect('form_submit?name=' + encodeURIComponent(name.trim()) +
    '&address=' + encodeURIComponent(address.trim()) +
    '&time=' + encodeURIComponent(time.trim()) +
    '&reportType=' + encodeURIComponent(reportType.trim()) +
    '&reportSubtype=' + encodeURIComponent(reportSubtype.trim()) +
    '&comment=' + encodeURIComponent(comment.trim())
    )

    } catch(err){
        console.log(err)
        res.send("bad request")
    }
})

module.exports = router;