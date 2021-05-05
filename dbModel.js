import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  state: Number,
  district: Number,
  pin: Number,
  sessionMailed: [String],
  message: [String],

});

// collection inside db
export default mongoose.model('vaccineUser', userSchema)
