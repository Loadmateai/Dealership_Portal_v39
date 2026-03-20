const Joi = require('joi');

const generateLeadSchema = Joi.object({
    companyName: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    location: Joi.string().allow('', null),
    cartItems: Joi.string().required(), // The frontend sends this as a parsed JSON string
    linkedSupportId: Joi.string().allow('', null),
    linkedLeadId: Joi.string().allow('', null)
}).unknown(true);

const updateLeadSchema = Joi.object({
    companyName: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    location: Joi.string().allow('', null),
    productTitle: Joi.string().allow('', null),
    quantity: Joi.number().min(0).optional(),
    unitPrice: Joi.number().min(0).optional(),
    status: Joi.string().valid('Filtration', 'Qualified', 'Under Discussion', 'Quoted', 'Negotiation', 'Won', 'Lost').optional(),
    stage: Joi.string().valid('Pending Approval', 'Approved', 'Not Approved').optional(),
    notes: Joi.string().allow('', null),
    specifications: Joi.any(),
    keptAttachments: Joi.any()
}).unknown(true);

module.exports = { generateLeadSchema, updateLeadSchema };