import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  registerUser, loginUser, vendorOTPLogin,
  createFunction, getFunctions, updateFunctionProgress,
  getChecklist, toggleChecklistItem,
  getVendors, getVendorDetails, createVendorProfile, addVendorService, getVendorLeads,
  sendQuote, getQuotes, updateQuoteStatus,
  getChats, getMessages,
  getNotifications, markRead
} from '../controllers/Controllers.js';

const router = express.Router();

// --- Auth Routes ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/vendor/otp', vendorOTPLogin);

// --- Function & Planning Routes ---
router.post('/functions', protect, createFunction);
router.get('/functions', protect, getFunctions);
router.put('/functions/:id/progress', protect, updateFunctionProgress);
router.get('/functions/:functionId/checklist', getChecklist);
router.put('/functions/:functionId/checklist/toggle', protect, toggleChecklistItem);

// --- Vendor Discovery Routes ---
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorDetails);
router.post('/vendors/profile', protect, createVendorProfile);
router.post('/vendors/service', protect, addVendorService);
router.get('/vendors/leads', protect, getVendorLeads);

// --- Quotation Routes ---
router.post('/quotes', protect, sendQuote);
router.get('/quotes/function/:functionId', getQuotes);
router.put('/quotes/:id', protect, updateQuoteStatus);

// --- Chat Routes ---
router.get('/chats', protect, getChats);
router.get('/chats/:chatId/messages', protect, getMessages);

// --- Notification Routes ---
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markRead);

export default router;
