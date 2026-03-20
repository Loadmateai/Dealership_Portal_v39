const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String }, 
    
    // THE MAGIC FIELD: Points to the folder above it.
    parent: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'category', 
        default: null // null means it's a Root Category (Level 1)
    },

    // If TRUE, this is the end of the line (Level 4/5) -> Show "Add to Cart"
    isProduct: { type: Boolean, default: false },
    
    description: { type: String },
    basePrice: { type: Number },

    productCode: { type: String, default: 'N/A' },

    brochurePdf: { type: String, default: null },
    standardDrawingPdf: { type: String, default: null },
    technicalDetailsPdf: { type: String, default: null },

    // --- NEW: DYNAMIC FORM DEFINITION ---
    // This tells the frontend what fields to generate
    formFields: [{
        label: String,        // e.g. "Lifting Height"
        type: { 
            type: String, 
            enum: ['text', 'number', 'select', 'textarea'],
            default: 'text' 
        },
        options: [String],    // e.g. ["220V", "440V"] (only for 'select')
        required: { type: Boolean, default: false }
    }]
    });

// Add this to the bottom of backend/models/Category.js (before module.exports)

CategorySchema.index({ parent: 1 });

module.exports = mongoose.model('category', CategorySchema);