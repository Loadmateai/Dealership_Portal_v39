const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lead: { type: String, required: true },
    product: { 
        type: String, 
        enum :['Electric Wire Hoist','Electric Chain Hoist','Overhead EOT Cranes','Goliath Cranes','Blocks','Trolley','Manual Push Pull Block','JIB Crane'],
        default : 'Electric Chain Hoist',
        required: true 
    },
    issueType: { type: String, required: true },
    
    priority: { 
        type: String, 
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium' 
    },
    // --- NEW FIELDS ---
    contactPersonName: { type: String },
    contactPersonEmail: { type: String },
    
    customerName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    issueDescription: { type: String, required: true },
    attachments: { type: [String] , default :[]},
    
    // --- UPDATED STATUSES ---
    status: { 
        type: String, 
        enum: ['Pending Approval', 'Approved', 'In Progress', 'Closed'],
        default: 'Pending Approval', // Default for everyone
        required: true
    },
    remarks: { type: String },
    createdAt: {
        type: Date,
        default: Date.now
    },
    timeline: [{
        action: String,       // e.g., "Status Change", "Update"
        details: String,      // e.g., "Changed status from Filtration to Won"
        userName: String,     // Snapshot of user name
        userRole: String,     // Snapshot of user role
        timestamp: { type: Date, default: Date.now }
    }]
});

// Indexing for faster dashboard loading
SupportTicketSchema.index({ user: 1 });      // Speeds up "Get My Tickets"
SupportTicketSchema.index({ status: 1 });    // CRITICAL: Used for Admin Dashboard (Pending vs Closed)
SupportTicketSchema.index({ lead: 1 });      // speeds up finding tickets related to a specific lead
SupportTicketSchema.index({ createdAt: -1 }); // Speeds up "Most Recent Tickets" sorting

// 🚀 COMPOUND INDEX: Supercharges Ticket Stats
SupportTicketSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('supportTicket', SupportTicketSchema);