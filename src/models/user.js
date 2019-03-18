const mongoose = require('mongoose'),
passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    username: String, //{type: String, unique: true, required: true}
    password: String,
    avatar: String,
    imageId: String,
    firstname: String,
    lastname: String,
    email: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {
        type: Boolean,
        default: false
    }
})
UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model('User', UserSchema);