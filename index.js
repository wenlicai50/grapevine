const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const express = require('express');
const bodyParser = require('body-parser')
const app = express();

const db_url = 'mongodb+srv://Cluster01447:ZFRsXVRDQ3x2@cluster01447.fa45q.mongodb.net/test-db?retryWrites=true&w=majority'

connect().catch((err) => {console.log(err)})
async function connect(){
    await mongoose.connect(db_url);
}

const homeRoute = require("./pages/home/index.js")
const reportRoute = require("./pages/report/index.js")
const showReportsRoute = require("./pages/show-reports/index.js")

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", homeRoute)
app.use("/report", reportRoute)
app.use("/show-reports", showReportsRoute)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

