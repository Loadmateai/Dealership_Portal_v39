const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userCode: { 
        type: String, 
        uppercase: true, 
        maxlength: 3, 
        // unique: true ,
        // sparse : true// Ensures no two users have the same code
    },
    documents: {
        privacyPolicy: { type: String, default: 'privacy-policy.pdf' },
        privacyPolicyDate: { type: Date, default: Date.now }, // Default file
        discountStructure: { type: String, default: null },
        discountStructureDate: { type: Date, default: null }, // User specific
        accountLedger: { type: String, default: null },
        accountLedgerDate: { type: Date, default: null }     // User specific
    },
    leadCounter: {
        count: { 
            type: Number, 
            default: 0 
        },
        lastResetYear: { 
            type: String, 
            default: "" 
        }
    },
    // --- NEW TICKET COUNTER ---
    ticketCounter: {
        count: { 
            type: Number, 
            default: 8999 // Starts at 9999 so the first increment is 10000
        },
        lastResetYear: { 
            type: String, 
            default: "" 
        }
    },
    role: { type: String, enum: ['user', 'admin','god','sub'], default: 'user' },
    creditLimitBreached: { 
        type: String, 
        enum: ['ON', 'OFF'], 
        default: 'OFF' 
    }, // new field
    groups: {
        type: [String], 
        default: []
    },
    parentUser: { // New field for sub 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null 
    },

    createdAt: { type: Date, default: Date.now }
});

// Add this to the bottom of backend/models/User.js (before module.exports)

UserSchema.index({ userCode: 1 }); 

UserSchema.index({ groups: 1 });

module.exports = mongoose.model('User', UserSchema);