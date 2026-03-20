const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ProductOrder = require('../models/ProductOrder');
const LeadProduct = require('../models/LeadProduct');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User'); 

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics (Filtered by Role, Group, Date, and Vendor Code)
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const { startDate, endDate, vendorCode, group } = req.query; // Added 'group'
        
        // 1. Determine Permission Scope (User Role + Group Filter)
        const user = await User.findById(req.user.id);
        let userFilter = {};

        if (user.role === 'god') {
            // --- NEW: God Mode Group Filter ---
            if (group) {
                // If God types a group, find all users in that group first
                // Using Regex for case-insensitive match (e.g. "north" matches "North Region")
                const groupUsers = await User.find({ groups: { $regex: group, $options: 'i' } }).select('_id');
                const groupUserIds = groupUsers.map(u => u._id);
                
                // Filter orders belonging to those users
                userFilter = { user: { $in: groupUserIds } };
            } else {
                // If no group typed, show EVERYTHING
                userFilter = {};
            }
        } 
        else if (req.isAdmin()) { // New Line
            if (user.groups && user.groups.length > 0) {
                const groupUsers = await User.find({ groups: { $in: user.groups } }).select('_id');
                const groupUserIds = groupUsers.map(u => u._id);
                userFilter = { user: { $in: groupUserIds } };
            } else {
                userFilter = {};
            }
        } 
        else {
            userFilter = { user: req.user.id };
        }

        // 2. Parse Dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // 3. Vendor Filter Logic (Keeping your working Regex Logic)
        let vendorFilter = {};
        if (vendorCode) {
            // Matches if leadNumber starts with the vendor code
            vendorFilter = { leadNumber: { $regex: `^${vendorCode}`, $options: 'i' } };
        }

        // 4. Fetch Data (Applying userFilter, date range, AND vendorFilter)
        
        // --- A. Product Orders ---
        // Uses 'date' and 'flag' (from your models)
        const productOrders = await ProductOrder.find({
            ...userFilter, 
            ...vendorFilter, 
            date: { $gte: start, $lte: end }
        });

        // Initialize counters
        let orderCounts = {
            'Pending Approval': 0,
            'Ordered': 0,
            'Rejected': 0
        };
        let totalRevenue = 0;

        productOrders.forEach(order => {
            if (orderCounts[order.flag] !== undefined) {
                orderCounts[order.flag]++;
            } else {
                orderCounts[order.flag] = (orderCounts[order.flag] || 0) + 1;
            }
            
            if (order.flag === 'Ordered') {
                totalRevenue += (order.totalPrice || 0);
            }
        });

        // --- B. Lead Products: Won Status Percentage ---
        // Uses 'date' (from your models)
        const allLeads = await LeadProduct.find({
            ...userFilter,
            ...vendorFilter,
            date: { $gte: start, $lte: end }
        });
        
        const totalLeads = allLeads.length;
        const wonLeads = allLeads.filter(lead => lead.status === 'Won').length;
        const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

        // --- C. Support Tickets ---
        // Support Tickets usually don't have leadNumbers, so we use userFilter ONLY
        // Uses 'createdAt' (from your models)
        const supportTicketsCount = await SupportTicket.countDocuments({
            ...userFilter,
            createdAt: { $gte: start, $lte: end }
        });

        // 5. Return Response
        res.json({
            productOrders: {
                count: orderCounts['Ordered'], 
                revenue: totalRevenue,
                breakdown: orderCounts 
            },
            leads: {
                total: totalLeads,
                won: wonLeads,
                conversionRate: conversionRate
            },
            supportTickets: {
                count: supportTicketsCount
            }
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;