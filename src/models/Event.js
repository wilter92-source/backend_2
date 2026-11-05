import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);
