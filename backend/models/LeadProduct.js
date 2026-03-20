const mongoose = require('mongoose');

const LeadProductSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    leadNumber: { type: String, required: true },
    
    // User/Cart level details
    companyName: { type: String },
    phone: { type: String },
    email: { type: String },
    location: { type: String },
    
    // Product details
    productTitle: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
    specifications: { type: Map, of: String },
    notes: { type: String },
    attachments: [{ type: String }],

    drawing: { type: String },
    commercial: { type: String },
    technicalOffer: { type: String },

    status: { 
        type: String, 
        enum: ['Filtration', 'Qualified', 'Under Discussion', 'Quoted', 'Negotiation', 'Won', 'Lost'],
        default: 'Filtration',
        required: true 
    },

    stage: {
        type: String,
        enum: ['Pending Approval', 'Approved', 'Not Approved'],
        default: 'Pending Approval'
    },
    
    // --- NEW: History Tracking ---
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now }
    }],
    // -----------------------------

    isOrdered: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    timeline: [{
        action: String,       // e.g., "Status Change", "Update"
        details: String,      // e.g., "Changed status from Filtration to Won"
        userName: String,     // Snapshot of user name
        userRole: String,     // Snapshot of user role
        timestamp: { type: Date, default: Date.now }
    }]
});

// Indexing for faster lookups
LeadProductSchema.index({ user: 1 });        // Speeds up "Get My Leads"
LeadProductSchema.index({ leadNumber: 1 });  // CRITICAL: Used when converting Lead -> Order
LeadProductSchema.index({ status: 1 });      // Speeds up filtering (e.g., "Show Won leads")
LeadProductSchema.index({ isOrdered: 1 });   // Speeds up filtering out already ordered leads

// 🚀 COMPOUND INDEX: Supercharges the Dashboard Conversion Rate calculation!
LeadProductSchema.index({ user: 1, date: -1 });
LeadProductSchema.index({ date: -1 });

module.exports = mongoose.model('leadProduct', LeadProductSchema);