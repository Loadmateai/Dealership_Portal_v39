const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User'); 
const upload = require('../middleware/upload'); 
// New 
const validate = require('../middleware/validate');
const { createTicketSchema } = require('../validations/ticketValidation');
// @route   POST api/support
// @desc    Create a new Support Ticket
router.post('/', auth, upload.array('attachments'), validate(createTicketSchema), async (req, res) => {
    try {
        const { 
            product, issueType, priority, 
            customerName, contactNumber, issueDescription, remarks,
            contactPersonName, contactPersonEmail 
        } = req.body;

        const userDoc = await User.findById(req.user.id);
        if (!userDoc) return res.status(404).json({ msg: 'User not found' });

        if (!userDoc.ticketCounter) {
            userDoc.ticketCounter = { count: 8999, lastResetYear: "" };
        }

        const date = new Date();
        const month = date.getMonth(); 
        const year = date.getFullYear();
        const fyStart = month >= 3 ? year : year - 1;
        const fyEnd = fyStart + 1;
        const fyString = `${String(fyStart).slice(-2)}${String(fyEnd).slice(-2)}`;

        if (userDoc.ticketCounter.lastResetYear !== fyString) {
            userDoc.ticketCounter.count = 8999; 
            userDoc.ticketCounter.lastResetYear = fyString;
        }
        userDoc.ticketCounter.count += 1;
        await userDoc.save();

        const vendorCode = userDoc.userCode || 'GEN'; 
        const ticketNumber = userDoc.ticketCounter.count;
        const generatedLead = `${vendorCode}-${fyString}-${ticketNumber}`;

        let attachmentPaths = [];
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => file.path);
        }

        const newTicket = new SupportTicket({
            user: req.user.id,
            lead: generatedLead,
            product, issueType, priority,
            customerName, contactNumber, issueDescription, remarks,
            contactPersonName, contactPersonEmail,
            attachments: attachmentPaths,
            status: 'Pending Approval',
            // --- NEW: Timeline ---
            timeline: [{
                action: 'Created',
                details: 'Ticket Created',
                userName: userDoc.name,
                userRole: userDoc.role,
                timestamp: new Date()
            }]
        });

        const ticket = await newTicket.save();
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/lookup/:leadId', auth, async (req, res) => {
    try {
        // Search for the ticket using the 'lead' field (e.g., GEN-2526-9000)
        const ticket = await SupportTicket.findOne({ lead: req.params.leadId });
        
        if (!ticket) {
            return res.status(404).json({ msg: 'Support ticket not found' });
        }
        
        // Return only necessary details
        res.json({
            lead: ticket.lead,
            customerName: ticket.customerName,
            contactNumber: ticket.contactNumber
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/support
router.get('/', auth, async (req, res) => {
    try {
        const { group } = req.query; 
        const userDoc = await User.findById(req.user.id);
        if (!userDoc) return res.status(404).json({ msg: 'User not found' });

        let query = {};

        if (userDoc.role === 'god') {
            if (group) {
                const groupUsers = await User.find({ groups: { $regex: group, $options: 'i' } }).select('_id');
                const groupUserIds = groupUsers.map(u => u._id);
                query = { user: { $in: groupUserIds } };
            } else {
                query = {}; 
            }
        }
        else if (userDoc.role === 'admin') {
            if (userDoc.groups && userDoc.groups.length > 0) {
                const groupUsers = await User.find({ groups: { $in: userDoc.groups } }).select('_id');
                const groupUserIds = groupUsers.map(u => u._id);
                query = { user: { $in: groupUserIds } };
            } else {
                query = {};
            }
        }
        else {
            query = { user: req.user.id };
        }

        const tickets = await SupportTicket.find(query)
            .populate('user', 'name') 
            .sort({ createdAt: -1 });
            
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/support/:id
router.put('/:id', auth, upload.array('attachments'), async (req, res) => {
    try {
        let ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        const userDoc = await User.findById(req.user.id);
        if (!userDoc) return res.status(401).json({ msg: 'User not found' });

        const isManager = req.isAdmin(); // New Line
        
        if (ticket.user.toString() !== req.user.id && !isManager) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { 
            lead, product, issueType, priority, 
            customerName, contactNumber, issueDescription, remarks, status,
            contactPersonName, contactPersonEmail
        } = req.body;

        // --- NEW: Timeline Tracking ---
        let changes = [];
        if (status && status !== ticket.status) changes.push(`Status: ${ticket.status} ➝ ${status}`);
        if (priority && priority !== ticket.priority) changes.push(`Priority: ${ticket.priority} ➝ ${priority}`);
        if (remarks && remarks !== ticket.remarks) changes.push(`Remarks updated`);
        if (req.files && req.files.length > 0) changes.push(`Uploaded ${req.files.length} files`);
        
        if (changes.length > 0) {
            ticket.timeline.push({
                action: 'Update',
                details: changes.join(', '),
                userName: userDoc.name,
                userRole: userDoc.role,
                timestamp: new Date()
            });
        }
        // -----------------------------

        if (isManager) {
            if (lead) ticket.lead = lead;
            if (product) ticket.product = product;
            if (issueType) ticket.issueType = issueType;
            if (priority) ticket.priority = priority;
            if (customerName) ticket.customerName = customerName;
            if (contactNumber) ticket.contactNumber = contactNumber;
            if (contactPersonName) ticket.contactPersonName = contactPersonName;
            if (contactPersonEmail) ticket.contactPersonEmail = contactPersonEmail;
            if (status) ticket.status = status;
        }

        if (issueDescription) ticket.issueDescription = issueDescription;
        if (remarks) ticket.remarks = remarks;

        if (req.files && req.files.length > 0) {
            const newPaths = req.files.map(file => file.path);
            ticket.attachments = [...ticket.attachments, ...newPaths];
        }

        if (!isManager) {
            ticket.status = 'Pending Approval';
        }

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;