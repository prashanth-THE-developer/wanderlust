const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: { type: String, required: true },
});

// adds username, hashed password, register(), authenticate() automatically
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
