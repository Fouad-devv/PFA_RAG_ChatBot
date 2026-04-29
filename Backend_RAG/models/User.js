import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // Keycloak user ID
    email: { type: String, required: true },
    username: { type: String, required: true },
    roles: { type: [String]},
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);