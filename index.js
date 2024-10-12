const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const app = express();
const User = require("./schema/user.js")
const Report = require("./schema/report.js")

const db_url = 'mongodb+srv://Cluster01447:ZFRsXVRDQ3x2@cluster01447.fa45q.mongodb.net/test-db?retryWrites=true&w=majority'

connect().catch((err) => {console.log(err)})
async function connect(){
    await mongoose.connect(db_url);
}

//user report => map => DONE
//fix navbar => DONE
//make form dependant on report type DONE
//add circles to points DONE
//differentiate user and report points (by color?)  DONE
//user ratings => DONE
//add sidebar for report viewing => basically done


//highlight dangerous areas (harder) color based on timestamp
    // incident filter
    // rotate time (3 before 3 after)


//filter reports when displayed on map => FUCK SHIT FUCK SHIT FUCK 
//display points near user location => literally just get user location and query in url


//bonus points for highlighting dangerous areas between user and destination

const homeRoute = require("./pages/home/index.js")
const reportRoute = require("./pages/report/index.js")
const showReportsRoute = require("./pages/show-reports/index.js")

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", homeRoute)
app.use("/report", reportRoute)
app.use("/show-reports", showReportsRoute)


// Set the server to listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//IMPORTANT: mongodb+srv://cluster01447.fa45q.mongodb.net/test-db?retryWrites=true&w=majority"

