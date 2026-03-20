const Joi = require('joi');

const createFromLeadsSchema = Joi.object({
    // Expects an array of lead objects, and requires at least 1 item
    leads: Joi.array().items(
        Joi.object({
            leadNumber: Joi.string().required()
        }).unknown(true) // Allows other fields in the lead object to pass through
    ).min(1).required()
});

const updateOrderSchema = Joi.object({
    notes: Joi.string().allow('', null),
    flag: Joi.string().valid('Pending Approval', 'Ordered', 'Rejected').optional(),
    companyName: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null), // Strict email format validation
    location: Joi.string().allow('', null),
    quantity: Joi.number().min(0).optional(),
    totalPrice: Joi.number().min(0).optional(),
    stage: Joi.string().valid('Under Process', 'In Production', 'Testing', 'Dispatch', 'Delivered').optional(),
    
    // Dates can come in as strings, Joi will verify they are valid dates
    expectedRequiredDate: Joi.date().allow('', null),
    expectedDispatchDate: Joi.date().allow('', null),

    // These come through multipart form-data as JSON strings, so we allow them safely
    specifications: Joi.any(),
    keptAttachments: Joi.any()
}).unknown(true); // Safety net: prevents Multer artifacts from crashing the request

module.exports = { createFromLeadsSchema, updateOrderSchema };