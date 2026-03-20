const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register Route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // Save the user (documents will be created with defaults defined in Schema)
        await user.save();

        const payload = { 
            user: { 
                name: user.name,
                id: user.id, 
                role: user.role,
                documents: user.documents 
            } 
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { 
            user: { 
                name: user.name,
                id: user.id, 
                role: user.role,
                documents: user.documents 
            } 
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    role: user.role,
                    documents: user.documents 
                } 
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get User Data Route
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTES FOR VENDOR CREDIT MANAGEMENT ---

// @route   GET api/auth/vendor-status/:code
// @desc    Get vendor credit status (Admin/God)
router.get('/vendor-status/:code', auth, async (req, res) => {
    try {
        // Only Admin or God can view this, though functionality is primarily for God
        if (!['admin', 'god'].includes(req.user.role)) return res.status(401).json({ msg: 'Not authorized' });
        
        // Find user by userCode
        const user = await User.findOne({ userCode: req.params.code }).select('name userCode creditLimitBreached email');
        if (!user) return res.status(404).json({ msg: 'Vendor not found' });
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/auth/vendor-status/:code
// @desc    Toggle credit limit breached (God only)
router.put('/vendor-status/:code', auth, async (req, res) => {
    try {
        // Only GOD can set this
        if (req.user.role !== 'god') return res.status(401).json({ msg: 'Not authorized' });
        
        const { creditLimitBreached } = req.body;
        if (!['ON', 'OFF'].includes(creditLimitBreached)) return res.status(400).json({ msg: 'Invalid value' });

        const user = await User.findOneAndUpdate(
            { userCode: req.params.code },
            { creditLimitBreached },
            { new: true }
        ).select('name userCode creditLimitBreached');

        if (!user) return res.status(404).json({ msg: 'Vendor not found' });
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// ----------------------------------------------
// Search function 

router.get('/users', auth, async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) return res.json([]);

    // Find users where name OR userCode matches the search string (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { userCode: { $regex: search, $options: 'i' } }
      ]
    }).select('name userCode role').limit(10); // Limit to 10 results for speed

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;