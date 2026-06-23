import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Vendor, VendorService } from './models/Models.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/funchero';

const seed = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // 1. Delete existing dummy users to avoid duplication
    await User.deleteMany({ email: { $in: ['user@123', 'vendor@123'] } });
    console.log('Cleared existing dummy users');

    // 2. Create Dummy User
    const hashedUserPass = await bcrypt.hash('123', 10);
    const dummyUser = await User.create({
      name: 'Vijai Customer',
      email: 'user@123',
      password: hashedUserPass,
      role: 'user'
    });
    console.log('Created Dummy User: user@123');

    // 3. Create Dummy Vendor User (Vijai)
    const hashedVendorPass = await bcrypt.hash('123', 10);
    const dummyVendorUser = await User.create({
      name: 'Vijai',
      email: 'vendor@123',
      password: hashedVendorPass,
      role: 'vendor'
    });
    console.log('Created Dummy Vendor User: vendor@123');

    // Delete existing vendor profiles linked to this email/mobile
    await Vendor.deleteMany({ mobile: { $in: ['12345678', '12345679', '12345680'] } });
    
    // 4. Create Catering Vendor Profile for Vijai
    const cateringVendor = await Vendor.create({
      userId: dummyVendorUser._id,
      businessName: 'Vijai Catering & Feasts',
      category: 'Catering',
      rating: 4.9,
      mobile: '12345678',
      priceRange: '$$',
      address: 'Chennai, Tamil Nadu',
      verified: true
    });
    console.log('Created Catering Vendor Profile');

    // 5. Create Jewellery Vendor Profile for Vijai
    const jewelsVendor = await Vendor.create({
      userId: dummyVendorUser._id,
      businessName: 'Vijai Premium Jewellery',
      category: 'Jewellery',
      rating: 4.8,
      mobile: '12345679',
      priceRange: '$$$',
      address: 'Chennai, Tamil Nadu',
      verified: true
    });
    console.log('Created Jewellery Vendor Profile');

    // 6. Create Decoration Vendor Profile for Vijai
    const decorVendor = await Vendor.create({
      userId: dummyVendorUser._id,
      businessName: 'Vijai Grand Decors',
      category: 'Decoration',
      rating: 4.7,
      mobile: '12345680',
      priceRange: '$$',
      address: 'Chennai, Tamil Nadu',
      verified: true
    });
    console.log('Created Decoration Vendor Profile');

    // Clear existing services for these vendors
    await VendorService.deleteMany({ vendorId: { $in: [cateringVendor._id, jewelsVendor._id, decorVendor._id] } });

    // 7. Add Catering Service: Biriyani per person 200
    await VendorService.create({
      vendorId: cateringVendor._id,
      name: 'Wedding Biriyani Feast',
      description: 'Traditional wood-fired Dum Biriyani (Chicken/Mutton/Veg) served with raita, brinjal curry, and bread halwa. Price listed per person.',
      price: 200,
      category: 'Catering'
    });
    console.log('Added Catering Biriyani Service (200 per person)');

    // 8. Add Jewels Set Service: 1000 rupees
    await VendorService.create({
      vendorId: jewelsVendor._id,
      name: 'Premium Jewels Set Hire',
      description: 'Elegant golden bridal/ceremonial jewellery set including necklace, earrings, and bangles. Special flat rate for all functions.',
      price: 1000,
      category: 'Jewellery'
    });
    console.log('Added Jewels Set Service (1000 flat rate)');

    // 9. Add Decoration Service: 1000 rupees
    await VendorService.create({
      vendorId: decorVendor._id,
      name: 'Traditional Floral Stage Decoration',
      description: 'Classic banana leaf, marigold garland, and stage backdrop flower decoration. Flat rate for all functions.',
      price: 1000,
      category: 'Decoration'
    });
    console.log('Added Decoration Stage Service (1000 flat rate)');

    console.log('Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seed();
