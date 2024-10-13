const mongoose = require("mongoose");

//report schema
const reportSchema = new mongoose.Schema({
username: {
    type: String,
    required: true,
},
address: {
    type: String,
    required: true,
},
lat: {
    type: Number, 
    required: true
}, 
lng: {
    type: Number, 
    required: true
}, 
timestamp: {
    type: Date,
    required: true
},
reportType: {
    type: String, //incident or recommendation
    required: true,
},
subtype: {
    type: String, // subtype of type, such as event/shopping and theft/assault
    required: true,
},
comment: {
    type: String,
    required: true,
},
rating: {
    type: Number,
    default: 0
}
});

module.exports = mongoose.model('Report', reportSchema);
