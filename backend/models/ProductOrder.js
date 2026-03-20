const mongoose = require('mongoose');

const ProductOrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    leadNumber: { type: String }, 
    companyName: { type: String },
    phone: { type: String },
    email: { type: String },
    location: { type: String },
    
    productTitle: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number },
    totalPrice: { type: Number },
    
    specifications: { type: Map, of: String },
    notes: { type: String },
    attachments: [{ type: String }],

    drawing: { type: String },
    commercial: { type: String},
    technicalOffer: { type: String },

    expectedRequiredDate: { type: Date },
    expectedDispatchDate: { type: Date },

    stage: { 
        type: String, 
        enum: ['Under Process', 'In Production', 'Testing', 'Dispatch', 'Delivered'],
        default: 'Under Process'
    },

    adminDoc: { type: String },

    status: { type: String, default: 'Order Placed' }, 
    flag: { type: String, enum : ['Pending Approval', 'Ordered','Rejected'] ,default: 'Pending Approval', required: true }, 
    
    // --- NEW: History Tracking ---
    statusHistory: [{
        value: String,       // Stores the Flag or Stage name
        type: { type: String, enum: ['flag', 'stage'] }, // Distinguishes between Flag vs Stage changes
        timestamp: { type: Date, default: Date.now }
    }],
    // -----------------------------

    date: { type: Date, default: Date.now }
});
// Add this to the bottom of backend/models/ProductOrder.js (before module.exports)

ProductOrderSchema.index({ user: 1 });
ProductOrderSchema.index({ leadNumber: 1 });
ProductOrderSchema.index({ flag: 1 });

// 🚀 COMPOUND INDEX: Supercharges the Dashboard Stats Route!
// Instantly finds orders for a specific user within a specific date range
ProductOrderSchema.index({ user: 1, date: -1 }); 
ProductOrderSchema.index({ date: -1 }); // Speeds up the "God Mode" dashboard

module.exports = mongoose.model('productOrder', ProductOrderSchema);