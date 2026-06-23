import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// --- USER SCHEMA ---
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'vendor'], default: 'user' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// --- VENDOR SCHEMA ---
const VendorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  businessName: { type: String, required: true },
  category: { type: String, required: true, index: true }, // e.g. Catering, Decoration
  rating: { type: Number, default: 5.0 },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [80.2707, 13.0827] } // [longitude, latitude] (Chennai default)
  },
  address: { type: String, default: '' },
  mobile: { type: String, required: true, unique: true },
  priceRange: { type: String, default: '$$' }, // $, $$, $$$, $$$$
  portfolio: [{ type: String }], // URLs of photos
  reviewsCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false }
});
VendorSchema.index({ location: '2dsphere' });

// --- VENDOR SERVICE SCHEMA ---
const VendorServiceSchema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, default: '' }
});

// --- FUNCTION SCHEMA ---
const FunctionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true }, // Marriage, Birthday, etc.
  date: { type: Date, required: true },
  locationName: { type: String, default: '' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [80.2707, 13.0827] }
  },
  expectedGuests: { type: Number, default: 50 },
  budget: { type: Number, required: true },
  progress: {
    type: String,
    enum: ['Planning', 'Vendor Selection', 'Booking Confirmed', 'In Progress', 'Completed'],
    default: 'Planning'
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// --- CHECKLIST SCHEMA ---
const ChecklistItemSchema = new Schema({
  item: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Catering, Venue
  completed: { type: Boolean, default: false }
});

const ChecklistSchema = new Schema({
  functionId: { type: Schema.Types.ObjectId, ref: 'Function', required: true, unique: true, index: true },
  items: [ChecklistItemSchema]
});

// --- BOOKING SCHEMA ---
const BookingSchema = new Schema({
  functionId: { type: Schema.Types.ObjectId, ref: 'Function', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'VendorService', required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// --- QUOTE SCHEMA ---
const QuoteSchema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  functionId: { type: Schema.Types.ObjectId, ref: 'Function', required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  validity: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// --- CHAT SCHEMA ---
const ChatSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

// --- MESSAGE SCHEMA ---
const MessageSchema = new Schema({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  images: [{ type: String }],
  quotation: {
    price: Number,
    description: String,
    quoteId: Schema.Types.ObjectId,
    validity: Date
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// --- NOTIFICATION SCHEMA ---
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['quote', 'checklist', 'message', 'booking'], default: 'message' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// --- REVIEW SCHEMA ---
const ReviewSchema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// --- PAYMENT SCHEMA ---
const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  transactionId: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// Models export
export const User = mongoose.model('User', UserSchema);
export const Vendor = mongoose.model('Vendor', VendorSchema);
export const VendorService = mongoose.model('VendorService', VendorServiceSchema);
export const Function = mongoose.model('Function', FunctionSchema);
export const Checklist = mongoose.model('Checklist', ChecklistSchema);
export const Booking = mongoose.model('Booking', BookingSchema);
export const Quote = mongoose.model('Quote', QuoteSchema);
export const Chat = mongoose.model('Chat', ChatSchema);
export const Message = mongoose.model('Message', MessageSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
export const Review = mongoose.model('Review', ReviewSchema);
export const Payment = mongoose.model('Payment', PaymentSchema);
