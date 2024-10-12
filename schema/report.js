const mongoose = require("mongoose");

// Define Report schema
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
    required: function() {
        return this.reportType === 'crime'; // Timestamp required only for "crime" reports
    },
},
reportType: {
    type: String, // e.g., "crime", "recommendation", etc.
    required: true,
},
subtype: {
    type: String, // e.g., "subtype1", "subtype2", etc.
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

// Create the Report model
module.exports = mongoose.model('Report', reportSchema);
