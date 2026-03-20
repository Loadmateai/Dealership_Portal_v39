const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload'); 
const ProductOrder = require('../models/ProductOrder');
const LeadProduct = require('../models/LeadProduct');
const User = require('../models/User');
// New const
const validate = require('../middleware/validate');
const { createFromLeadsSchema, updateOrderSchema } = require('../validations/orderValidation');

// To this:
router.post('/create-from-leads', auth, validate(createFromLeadsSchema), async (req, res) => {
    try {
        const { leads } = req.body; 
        if (!leads || leads.length === 0) return res.status(400).json({ msg: 'No leads selected' });

        const results = await Promise.all(leads.map(async (lead) => {
            const existingOrder = await ProductOrder.findOne({ leadNumber: lead.leadNumber });
            if (existingOrder) {
                await LeadProduct.findOneAndUpdate({ leadNumber: lead.leadNumber }, { isOrdered: true });
                return 'skipped';
            }

            const originLead = await LeadProduct.findOne({ leadNumber: lead.leadNumber });
            if (!originLead) return 'skipped'; 

            await new ProductOrder({
                user: originLead.user,          
                subUser: originLead.subUser,     
                leadNumber: lead.leadNumber,
                companyName: lead.companyName,
                phone: lead.phone,
                email: lead.email,
                location: lead.location,
                productTitle: lead.productTitle,
                quantity: lead.quantity,
                unitPrice: lead.unitPrice,
                totalPrice: lead.totalPrice,
                specifications: lead.specifications,
                notes: lead.notes,
                attachments: lead.attachments,
                drawing: originLead.drawing,
                commercial: originLead.commercial,
                technicalOffer: originLead.technicalOffer,
                status: 'Order Placed',        
                flag: 'Pending Approval',
                stage: 'Under Process',
                // --- NEW: Init History ---
                statusHistory: [
                    { value: 'Pending Approval', type: 'flag', timestamp: new Date() },
                    { value: 'Under Process', type: 'stage', timestamp: new Date() }
                ]
            }).save();

            await LeadProduct.findOneAndUpdate({ leadNumber: lead.leadNumber }, { isOrdered: true });
            return 'created';
        }));

        const createdCount = results.filter(r => r === 'created').length;
        const skippedCount = results.filter(r => r === 'skipped').length;
        let message = createdCount === 0 && skippedCount > 0 ? 'Already Ordered' : 'Product Orders created successfully';

        res.json({ msg: message, created: createdCount, skipped: skippedCount });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/product-orders
router.get('/', auth, async (req, res) => {
    try {
        const { group } = req.query;
        const user = await User.findById(req.user.id);
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

        const orders = await ProductOrder.find(query)
            .populate('user', 'name')
            .populate('subUser', 'name') 
            .sort({ date: -1 }); // Using creation date for sort

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// To this:
router.put('/:id', auth, upload.any(), validate(updateOrderSchema), async (req, res) => {
    try {
        const { 
            notes, flag, companyName, phone, email, location, quantity, totalPrice, specifications, keptAttachments,
            expectedRequiredDate, expectedDispatchDate, stage
        } = req.body;

        const user = await User.findById(req.user.id);
        let order = await ProductOrder.findById(req.params.id);

        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (order.user.toString() !== req.user.id && !req.isAdmin()) { // New Line
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // --- 1. REJECTED EDIT LOGIC ---
        if (order.flag === 'Rejected') {
            let isModified = false;
            
            if (companyName) { order.companyName = companyName; isModified = true; }
            if (phone) { order.phone = phone; isModified = true; }
            if (email) { order.email = email; isModified = true; }
            if (location) { order.location = location; isModified = true; }
            if (quantity) { order.quantity = quantity; isModified = true; }
            if (totalPrice) { order.totalPrice = totalPrice; isModified = true; }
            
            if (specifications) { order.specifications = JSON.parse(specifications); isModified = true; }

            let finalAttachments = order.attachments || [];
            let attachmentsChanged = false;
            if (keptAttachments) {
                const keptList = JSON.parse(keptAttachments);
                if (keptList.length !== finalAttachments.length) { finalAttachments = keptList; attachmentsChanged = true; }
            }
            if (req.files && req.files.length > 0) {
                const genericFiles = req.files.filter(f => f.fieldname === 'newAttachments');
                if (genericFiles.length > 0) {
                    finalAttachments = [...finalAttachments, ...genericFiles.map(f => f.path)];
                    attachmentsChanged = true;
                }
            }
            if (attachmentsChanged) { order.attachments = finalAttachments; isModified = true; }

            if (isModified && !req.isAdmin()) { // New Line
                // Changing back to Pending Approval logic
                order.flag = 'Pending Approval';
                // --- HISTORY TRACK ---
                order.statusHistory.push({ value: 'Pending Approval', type: 'flag', timestamp: new Date() });
            }
        } 
        else {
             // Normal attachments logic for non-rejected
             let finalAttachments = order.attachments || [];
             let attachmentsChanged = false;
             if (keptAttachments) {
                const keptList = JSON.parse(keptAttachments);
                if (keptList.length !== finalAttachments.length) { finalAttachments = keptList; attachmentsChanged = true; }
             }
             if (req.files && req.files.length > 0) {
                const genericFiles = req.files.filter(f => f.fieldname === 'newAttachments');
                if (genericFiles.length > 0) {
                    finalAttachments = [...finalAttachments, ...genericFiles.map(f => f.path)];
                    attachmentsChanged = true;
                }
             }
             if (attachmentsChanged) order.attachments = finalAttachments;
        }

        // --- ADMIN FIELDS ---
        const specialFields = ['drawing', 'commercial', 'technicalOffer', 'adminDoc'];
        if (req.isAdmin()) { // New Line 
            if (req.files && req.files.length > 0) {
                for (const field of specialFields) {
                    const file = req.files.find(f => f.fieldname === field);
                    if (file) {
                        if (file.mimetype !== 'application/pdf') return res.status(400).json({ msg: `Field '${field}' accepts PDF only.` });
                        order[field] = file.path;
                    }
                }
            }
            if (expectedDispatchDate !== undefined) order.expectedDispatchDate = expectedDispatchDate;
            
            // STAGE CHANGE & HISTORY
            if (stage !== undefined && stage !== order.stage) {
                order.stage = stage;
                order.statusHistory.push({ value: stage, type: 'stage', timestamp: new Date() });
            }
        }

        // --- COMMON FIELDS ---
        const allowedStatuses = ['Pending Approval', 'Rejected'];
        const canEditCommon = req.isAdmin() || allowedStatuses.includes(order.flag);

        if (expectedRequiredDate !== undefined) {
             if (canEditCommon) order.expectedRequiredDate = expectedRequiredDate;
             else return res.status(400).json({ msg: 'Cannot edit Expected Date in current status.' });
        }

        // FLAG CHANGE & HISTORY
        if (flag && flag !== order.flag) {
            if (req.isAdmin()) { // New Line
                
                // --- NEW: CHECK CREDIT LIMIT BREACH ---
                if (flag === 'Ordered') {
                    // Check if the Order Creator (Vendor) has breached credit limit
                    const orderOwner = await User.findById(order.user);
                    if (orderOwner && orderOwner.creditLimitBreached === 'ON') {
                        return res.status(400).json({ msg: 'Cannot approve order: Vendor Credit Limit Breached (ON).' });
                    }
                }
                // --------------------------------------

                order.flag = flag;
                order.statusHistory.push({ value: flag, type: 'flag', timestamp: new Date() });
            } else {
                return res.status(403).json({ msg: 'Not authorized to change status flag.' });
            }
        }

        if (notes !== undefined && notes !== order.notes) {
            if (canEditCommon) {
                order.notes = notes;
                if (!req.isAdmin() && order.flag !== 'Rejected') { // New Line 
                     // Check if not already Pending
                     if (order.flag !== 'Pending Approval') {
                         order.flag = 'Pending Approval'; 
                         order.statusHistory.push({ value: 'Pending Approval', type: 'flag', timestamp: new Date() });
                     }
                }
            } else {
                return res.status(400).json({ msg: 'Cannot edit notes in current status.' });
            }
        }

        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;