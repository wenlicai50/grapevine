const mongoose = require("mongoose");

//Define users schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,

    },
    password: {
        type: String,
        required: true,
    },
});
// Hash the password before saving the user document
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const saltRounds = 10; // Number of rounds for salting
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});

// Method to compare password for authentication
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Create the user model
module.exports = mongoose.model('User', userSchema);