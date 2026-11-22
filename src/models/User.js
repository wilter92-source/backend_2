import mongoose from 'mongoose';
import { roles, USER_ROLE } from '../config/roles.js';
import { isValidEmail } from '../utils/email.js';

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: isValidEmail
    },
    // El flujo de registro guarda aquí el hash de bcrypt.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: roles, default: USER_ROLE }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
