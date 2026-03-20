const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// GET /api/products?parent=ROOT_ID_OR_NULL
router.get('/', async (req, res) => {
    try {
        const parentId = req.query.parent;
        
        // If parent is 'root', we look for items with NO parent (Level 1)
        // Otherwise, we look for items belonging to that specific parent ID
        const query = (parentId === 'root' || !parentId) 
            ? { parent: null } 
            : { parent: parentId };
        
        const items = await Category.find(query);
        res.json(items);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;