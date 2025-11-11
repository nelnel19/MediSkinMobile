import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  birthday: { type: Date, required: true },
  profileImage: {
    public_id: String,
    url: String
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;