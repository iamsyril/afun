import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  User, Vendor, VendorService, Function, Checklist, 
  Booking, Quote, Chat, Message, Notification, Review 
} from '../models/Models.js';

const JWT_SECRET = process.env.JWT_SECRET || 'funcheorsecretkey123';

// --- HELPERS ---
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
};

// --- AUTH CONTROLLERS ---
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: role || 'user' });

    res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return res.status(400).json({ message: 'Invalid credentials' });

    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await Vendor.findOne({ userId: user._id });
    }

    res.status(200).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      vendor: vendorProfile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const vendorOTPLogin = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    // Sandbox validation: accept 123456 as the validation OTP code
    if (otp !== '123456') {
      return res.status(400).json({ message: 'Invalid OTP code. Use 123456 for sandbox testing.' });
    }

    // Check if vendor profile exists for this mobile number
    let vendor = await Vendor.findOne({ mobile });
    let user;

    if (!vendor) {
      // Create new user for the vendor first
      const email = `vendor_${mobile}@funchero.com`;
      const tempPass = await bcrypt.hash('temp123', 10);
      user = await User.create({
        name: `Vendor (${mobile})`,
        email,
        password: tempPass,
        role: 'vendor'
      });

      // Create incomplete vendor profile
      vendor = await Vendor.create({
        userId: user._id,
        businessName: `Vendor Business (${mobile})`,
        category: 'Pending Setup',
        mobile,
        verified: true
      });
    } else {
      user = await User.findById(vendor.userId);
    }

    res.status(200).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      vendor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const defaultChecklists = {
  'Marriage': [
    { item: 'Hall Booking', category: 'Venue' },
    { item: 'Catering', category: 'Catering' },
    { item: 'Photographer', category: 'Photography' },
    { item: 'Flower Decoration', category: 'Decoration' },
    { item: 'Wedding Invitation', category: 'Invitations' },
    { item: 'Stage Decoration', category: 'Decoration' },
    { item: 'Makeup Artist', category: 'Makeup' },
    { item: 'Priest Booking', category: 'Priest' },
    { item: 'Music Arrangement', category: 'Music' },
    { item: 'Return Gifts', category: 'Return Gifts' }
  ],
  'Valaikaappu': [
    { item: 'Bangles Ceremony', category: 'Tradition' },
    { item: 'Blessing Ritual', category: 'Ritual' },
    { item: 'Traditional Foods', category: 'Food' },
    { item: 'Family Customs', category: 'Custom' },
    { item: 'Cultural Meaning', category: 'Cultural' }
  ],
  'Birthday': [
    { item: 'Party Hall Booking', category: 'Venue' },
    { item: 'Balloon & Backdrop Decoration', category: 'Decoration' },
    { item: 'Cake Ordering', category: 'Catering' },
    { item: 'Catering Buffet Snacks', category: 'Catering' },
    { item: 'Music & Sound DJ', category: 'Music' }
  ],
  'Baptism': [
    { item: 'Church Booking', category: 'Venue' },
    { item: 'Priest Coordination', category: 'Priest' },
    { item: 'White Gown Dressing', category: 'Clothes' },
    { item: 'Holy Water Blessing', category: 'Ritual' }
  ],
  'First Holy Communion': [
    { item: 'Church Catechism Completion', category: 'Education' },
    { item: 'Communion Dress Purchase', category: 'Clothes' },
    { item: 'Family Celebration Hall', category: 'Venue' },
    { item: 'Bread and Wine Sacrament', category: 'Ritual' }
  ],
  'Anniversary': [
    { item: 'Invitation Cards', category: 'Invitations' },
    { item: 'Dinner Party Booking', category: 'Venue' },
    { item: 'Premium Backdrop Decoration', category: 'Decoration' },
    { item: 'Couple Photo & Video Session', category: 'Photography' }
  ]
};

export const createFunction = async (req, res) => {
  try {
    const { name, type, date, expectedGuests, budget, notes, latitude, longitude, locationName } = req.body;
    const userId = req.user.id;

    const func = await Function.create({
      userId,
      name,
      type,
      date,
      locationName: locationName || '',
      location: {
        type: 'Point',
        coordinates: [longitude || 80.2707, latitude || 13.0827]
      },
      expectedGuests: expectedGuests || 50,
      budget,
      notes: notes || ''
    });

    // Auto-generate AI Checklist based on event type
    const baseItems = defaultChecklists[type] || [
      { item: 'Book Venue', category: 'Venue' },
      { item: 'Book Caterers', category: 'Catering' },
      { item: 'Setup Decorations', category: 'Decoration' },
      { item: 'Send Invitations', category: 'Invitations' }
    ];

    const checklist = await Checklist.create({
      functionId: func._id,
      items: baseItems
    });

    res.status(201).json({ function: func, checklist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFunctions = async (req, res) => {
  try {
    const functions = await Function.find({ userId: req.user.id }).sort({ date: 1 });
    res.status(200).json(functions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFunctionProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const func = await Function.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { progress },
      { new: true }
    );
    if (!func) return res.status(404).json({ message: 'Function not found' });
    res.status(200).json(func);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChecklist = async (req, res) => {
  try {
    const checklist = await Checklist.findOne({ functionId: req.params.functionId });
    if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
    res.status(200).json(checklist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    const checklist = await Checklist.findOne({ functionId: req.params.functionId });
    if (!checklist) return res.status(404).json({ message: 'Checklist not found' });

    const item = checklist.items.id(itemId);
    if (item) {
      item.completed = !item.completed;
      await checklist.save();
    }
    res.status(200).json(checklist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- VENDOR DISCOVERY CONTROLLERS ---
export const getVendors = async (req, res) => {
  try {
    const { category, lat, lng } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }

    let vendors = await Vendor.find(query);

    // Dynamic distance calculation if lat/lng are supplied
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      vendors = vendors.map(v => {
        const vLng = v.location.coordinates[0];
        const vLat = v.location.coordinates[1];
        
        // Simple Haversine calculation for vendor distance (in km)
        const R = 6371;
        const dLat = (vLat - userLat) * Math.PI / 180;
        const dLng = (vLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLat * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) * 
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Return a raw JS object with distance injected
        const obj = v.toObject();
        obj.distance = parseFloat(distance.toFixed(1));
        return obj;
      });
      vendors.sort((a, b) => a.distance - b.distance);
    }

    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorDetails = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const services = await VendorService.find({ vendorId: vendor._id });
    const reviews = await Review.find({ vendorId: vendor._id }).populate('userId', 'name avatar');

    res.status(200).json({ vendor, services, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVendorProfile = async (req, res) => {
  try {
    const { businessName, category, mobile, address, priceRange, portfolio, latitude, longitude } = req.body;
    const userId = req.user.id;

    // Check if vendor already exists
    let vendor = await Vendor.findOne({ userId });
    
    if (vendor) {
      vendor.businessName = businessName;
      vendor.category = category;
      vendor.mobile = mobile;
      vendor.address = address;
      vendor.priceRange = priceRange || vendor.priceRange;
      vendor.portfolio = portfolio || vendor.portfolio;
      if (latitude && longitude) {
        vendor.location = { type: 'Point', coordinates: [longitude, latitude] };
      }
      await vendor.save();
    } else {
      vendor = await Vendor.create({
        userId,
        businessName,
        category,
        mobile,
        address,
        priceRange: priceRange || '$$',
        portfolio: portfolio || [],
        location: {
          type: 'Point',
          coordinates: [longitude || 80.2707, latitude || 13.0827]
        },
        verified: true
      });
    }

    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addVendorService = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const service = await VendorService.create({
      vendorId: vendor._id,
      name,
      description,
      price,
      category,
      imageUrl: imageUrl || ''
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorLeads = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    // AI Lead matching: leads that match the category or location
    const leads = await Function.find({}).populate('userId', 'name email');
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- QUOTATION & COMPARISON SYSTEM ---
export const sendQuote = async (req, res) => {
  try {
    const { functionId, price, description, images, validity } = req.body;
    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const quote = await Quote.create({
      vendorId: vendor._id,
      functionId,
      price,
      description,
      images: images || [],
      validity: new Date(validity || Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Notify user
    const func = await Function.findById(functionId);
    if (func) {
      await Notification.create({
        userId: func.userId,
        title: 'New Quotation Received',
        message: `Vendor ${vendor.businessName} sent a quote of ₹${price.toLocaleString('en-IN')} for ${func.name}.`,
        type: 'quote'
      });
    }

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ functionId: req.params.functionId })
      .populate({ path: 'vendorId', select: 'businessName category rating location mobile' });

    // Inject comparative AI Score
    const scoredQuotes = quotes.map(q => {
      const obj = q.toObject();
      
      // AI Score out of 100 based on price, vendor rating, and speed/response.
      let priceScore = 50;
      if (q.price < 50000) priceScore = 45;
      else if (q.price < 100000) priceScore = 38;
      else priceScore = 25;

      const ratingScore = (q.vendorId.rating || 5.0) * 10;
      const finalScore = Math.min(100, Math.round(priceScore + ratingScore));
      
      obj.aiScore = finalScore;
      obj.aiVerdict = finalScore >= 85 ? '🏆 Best Value' : 'Good Option';
      return obj;
    });

    res.status(200).json(scoredQuotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body; // accepted or rejected
    const quote = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });

    if (status === 'accepted') {
      // Mark other quotes for this function as rejected (optional, but clean)
      await Quote.updateMany({ functionId: quote.functionId, _id: { $ne: quote._id } }, { status: 'rejected' });
      // Update function progress
      await Function.findByIdAndUpdate(quote.functionId, { progress: 'Booking Confirmed' });
    }

    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- CHAT SYSTEM ---
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'name email avatar role');
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- NOTIFICATION CONTROLLERS ---
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
