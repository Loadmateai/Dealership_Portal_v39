const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const LeadProduct = require('../models/LeadProduct');

const validate = require('../middleware/validate');
const { generateLeadSchema, updateLeadSchema } = require('../validations/leadValidation');

// @route   GET api/lead-products/lookup/:leadNumber
// @desc    Check if a lead FAMILY exists (searches for leads starting with the input)
router.get('/lookup/:leadNumber', auth, async (req, res) => {
    try {
        const searchTerm = req.params.leadNumber.trim();
        console.log(`[DEBUG] Searching for leads starting with: "${searchTerm}"`);

        // FIX: Use Regex to find ANY lead that starts with this ID
        // This finds "ABC-YYYY-1234-001" even if user just types "ABC-YYYY-1234"
        const lead = await LeadProduct.findOne({ 
            leadNumber: { $regex: new RegExp(`^${searchTerm}`, 'i') } 
        });
        
        if (!lead) {
            console.log(`[DEBUG] No leads found starting with "${searchTerm}"`);
            
            // Debugging helper: Show what IS in the database
            const lastLeads = await LeadProduct.find().sort({ _id: -1 }).limit(3).select('leadNumber');
            console.log("--- DB Snapshot (Last 3) ---");
            lastLeads.forEach(l => console.log(`Ex: "${l.leadNumber}"`));
            
            return res.status(404).json({ msg: 'Lead family not found' });
        }
        
        console.log(`[DEBUG] Found Family Match: ${lead.leadNumber} (Company: ${lead.companyName})`);
        
        // Return details to populate the cart form
        res.json({
            leadNumber: searchTerm, // Return the BASE ID the user typed
            companyName: lead.companyName,
            phone: lead.phone,
            email: lead.email,
            location: lead.location
        });
    } catch (err) {
        console.error("Lookup Error:", err);
        res.status(500).send('Server Error');
    }
});

// To this:
router.post('/generate', auth, upload.any(), validate(generateLeadSchema), async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        let subUserId = null;

        if (user.role === 'sub' && user.parentUser) {
            const parent = await User.findById(user.parentUser);
            if (parent) {
                subUserId = user.id;
                user = parent;
            }
        }

        const { companyName, phone, email, location, cartItems: cartItemsRaw, linkedSupportId, linkedLeadId } = req.body;
        const cartItems = JSON.parse(cartItemsRaw);

        const now = new Date();
        const currentYear = now.getFullYear();
        const fiscalYearStr = now.getMonth() >= 3 
            ? `${currentYear.toString().slice(-2)}${(currentYear + 1).toString().slice(-2)}` 
            : `${(currentYear - 1).toString().slice(-2)}${currentYear.toString().slice(-2)}`;

        let baseLeadId;
        let startSuffixIndex = 1; 

        // --- ID GENERATION LOGIC ---
        if (linkedLeadId) {
            // Case 1: Linking to Existing Lead (Sub-leads)
            console.log(`[DEBUG] Linking to Parent Lead: ${linkedLeadId}`);
            baseLeadId = linkedLeadId;
            
            // Search for existing sub-leads (e.g. ABC-YYYY-1234-001, -002)
            const regex = new RegExp(`^${linkedLeadId}-\\d+$`);
            const existingSubLeads = await LeadProduct.find({ leadNumber: { $regex: regex } }).select('leadNumber');
            
            if (existingSubLeads.length > 0) {
                // Logic: Extract the last segment (suffix) and find the max
                const maxSuffix = existingSubLeads.reduce((max, lead) => {
                    const parts = lead.leadNumber.split('-');
                    const suffix = parseInt(parts[parts.length - 1]);
                    return (!isNaN(suffix) && suffix > max) ? suffix : max;
                }, 0);
                
                console.log(`[DEBUG] Found Max Suffix: ${maxSuffix}. Starting next batch at: ${maxSuffix + 1}`);
                startSuffixIndex = maxSuffix + 1;
            }

        } else if (linkedSupportId) {
            // Case 2: Override with Support Ticket ID
            baseLeadId = linkedSupportId;
        } else {
            // Case 3: Standard Auto-Increment Logic
            if (!user.leadCounter || user.leadCounter.lastResetYear !== fiscalYearStr) {
                user.leadCounter = { count: 1, lastResetYear: fiscalYearStr };
            } else {
                user.leadCounter.count += 1;
            }
            await user.save(); 
            const leadSeq = user.leadCounter.count.toString().padStart(4, '0');
            baseLeadId = `${user.userCode}-${fiscalYearStr}-${leadSeq}`;
        }

        const leadPromises = cartItems.map((item, index) => {
            // Suffix generation: e.g. 001 (Normal) OR 011 (Linked Lead)
            const currentSuffix = (startSuffixIndex + index).toString().padStart(3, '0');
            const finalLeadNumber = `${baseLeadId}-${currentSuffix}`;
            
            const itemFiles = req.files
                .filter(f => f.fieldname === `attachments_${index}`)
                .map(f => f.path);

            let actionDetails = 'Created from Cart';
            if (linkedLeadId) actionDetails = `Sub-lead added to ${linkedLeadId}`;
            else if (linkedSupportId) actionDetails = `Generated from Support Ticket ${linkedSupportId}`;

            return new LeadProduct({
                user: user.id,
                subUser: subUserId,
                userCode: user.userCode,
                leadNumber: finalLeadNumber,
                companyName, phone, email, location,
                productTitle: item.title,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                specifications: item.specifications,
                notes: item.notes,
                attachments: itemFiles,
                status: 'Filtration',
                stage: 'Pending Approval', 
                statusHistory: [{ status: 'Filtration', timestamp: new Date() }],
                timeline: [{
                    action: 'Created',
                    details: actionDetails,
                    userName: user.name || 'System',
                    userRole: user.role,
                    timestamp: new Date()
                }]
            }).save();
        });

        await Promise.all(leadPromises);
        res.json({ msg: 'Leads generated successfully', batchId: baseLeadId });

    } catch (err) {
        console.error("Server Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ msg: "Lead ID conflict. Try again." });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET api/lead-products (Standard List)
router.get('/', auth, async (req, res) => {
    try {
        const { group } = req.query;
        const user = await User.findById(req.user.id).select('-password');
        let query = {};

        if (user.role === 'god') {
            if (group) {
                const groupUsers = await User.find({ groups: { $regex: group, $options: 'i' } }).select('_id');
                const groupUserIds = groupUsers.map(u => u._id);
                query = { user: { $in: groupUserIds } };
            }
        } else if (user.role === 'admin') {
            if (user.groups && user.groups.length > 0) {
                const groupUsers = await User.find({ groups: { $in: user.groups } }).select('_id');
                const groupUserIds = groupUsers.map(u => u._id);
                query = { user: { $in: groupUserIds } };
            }
        } else {
            if (user.role === 'sub' && user.parentUser) {
                query = { user: user.parentUser };
            } else {
                query = { user: user._id };
            }
        }
        
        const leads = await LeadProduct.find(query)
            .populate('user', 'name')
            .populate('subUser', 'name') 
            .sort({ date: -1 });

        res.json(leads);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// To this:
router.put('/:id', auth, upload.any(), validate(updateLeadSchema), async (req, res) => {
    try {
        const { 
            companyName, phone, email, location, 
            productTitle, quantity, unitPrice,
            status, notes, specifications, keptAttachments,
            stage 
        } = req.body;

        let leadProduct = await LeadProduct.findById(req.params.id);
        if (!leadProduct) return res.status(404).json({ msg: 'Lead Product not found' });

        const performingUser = await User.findById(req.user.id).select('name role');
        const isAdmin = ['admin', 'god'].includes(req.user.role);

        const isOwner = leadProduct.user.toString() === req.user.id;
        const canAccess = isAdmin || req.user.role === 'sub';

        if (!isOwner && !canAccess) {
            return res.status(401).json({ msg: 'Not authorized to edit this lead' });
        }

        let updateFields = {
            companyName, phone, email, location,
            quantity,
            notes 
        };

        if (isAdmin) {
            if (productTitle) updateFields.productTitle = productTitle;
        }

        const currentStage = leadProduct.stage || 'Pending Approval';
        const isStatusLocked = ['Pending Approval', 'Not Approved'].includes(currentStage);

        if (status) {
            if (isAdmin || !isStatusLocked) {
                updateFields.status = status;
            }
        }

        let timelineEntry = null;
        let actionDetails = [];
        
        if (updateFields.status && updateFields.status !== leadProduct.status) {
            actionDetails.push(`Status: ${leadProduct.status} ➝ ${updateFields.status}`);
        }
        if (notes && notes !== leadProduct.notes) actionDetails.push(`Updated Notes`);

        if (isAdmin) {
            if (stage !== undefined) {
                updateFields.stage = stage;
                if (stage !== leadProduct.stage) actionDetails.push(`Stage: ${leadProduct.stage} ➝ ${stage}`);
            }
            if (unitPrice !== undefined) updateFields.unitPrice = Number(unitPrice);
        }

        const effectiveQuantity = quantity !== undefined ? Number(quantity) : leadProduct.quantity;
        const effectiveUnitPrice = updateFields.unitPrice !== undefined ? updateFields.unitPrice : leadProduct.unitPrice;
        
        updateFields.totalPrice = effectiveQuantity * (effectiveUnitPrice || 0);

        if (specifications) {
            try {
                updateFields.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
            } catch (e) { console.error("Spec parse error", e); }
        }

        // --- ADMIN DOCUMENT UPLOAD LOGIC ---
        const specialFields = ['drawing', 'commercial', 'technicalOffer'];
        if (isAdmin) {
            if (req.files && req.files.length > 0) {
                for (const field of specialFields) {
                    const file = req.files.find(f => f.fieldname === field);
                    if (file) {
                        if (file.mimetype !== 'application/pdf') return res.status(400).json({ msg: `Field '${field}' accepts PDF only.` });
                        
                        updateFields[field] = file.path; // <--- The Fix is RETAINED here
                        actionDetails.push(`Updated Admin Doc: ${field}`);
                    }
                }
            }
        }

        let finalAttachments = [];
        if (keptAttachments) finalAttachments = Array.isArray(keptAttachments) ? keptAttachments : JSON.parse(keptAttachments);
        if (req.files && req.files.length > 0) {
            const attachmentFiles = req.files.filter(f => !specialFields.includes(f.fieldname));
            if(attachmentFiles.length > 0) {
                finalAttachments = [...finalAttachments, ...attachmentFiles.map(f => f.path)];
                actionDetails.push(`Uploaded ${attachmentFiles.length} file(s)`);
            }
        }
        updateFields.attachments = finalAttachments;

        let shouldResetStage = false;
        if (currentStage === 'Not Approved') {
            shouldResetStage = true;
        } 
        else if (currentStage === 'Approved') {
            if (updateFields.specifications) {
                const oldSpecs = leadProduct.specifications || new Map();
                const newSpecs = updateFields.specifications;
                const newKeys = Object.keys(newSpecs);
                
                if (oldSpecs.size !== newKeys.length) {
                    shouldResetStage = true;
                } else {
                    for (const key of newKeys) {
                        if (oldSpecs.get(key) !== newSpecs[key]) {
                            shouldResetStage = true;
                            break;
                        }
                    }
                }
            }
        }

        if (shouldResetStage) {
            updateFields.stage = 'Pending Approval';
            actionDetails.push('Stage reset to Pending Approval due to changes');
        }

        let updateOps = { $set: updateFields };
        let pushOps = {};

        if (updateFields.status && updateFields.status !== leadProduct.status) {
            pushOps.statusHistory = { status: updateFields.status, timestamp: new Date() };
        }

        if (actionDetails.length > 0) {
            timelineEntry = {
                action: 'Update',
                details: actionDetails.join(', '),
                userName: performingUser.name,
                userRole: performingUser.role,
                timestamp: new Date()
            };
            pushOps.timeline = timelineEntry;
        }

        if (Object.keys(pushOps).length > 0) {
            updateOps.$push = pushOps;
        }

        leadProduct = await LeadProduct.findByIdAndUpdate(
            req.params.id,
            updateOps,
            { new: true, runValidators: true } 
        );
        
        res.json(leadProduct);

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;