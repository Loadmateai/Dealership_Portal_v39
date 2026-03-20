// backend/middleware/validate.js
const validate = (schema) => {
    return (req, res, next) => {
        // We validate the incoming request body against the Joi schema
        // abortEarly: false ensures it returns ALL errors, not just the first one it finds
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            // Extract the readable error messages
            const errors = error.details.map(detail => detail.message);
            console.error("Validation Failed:", errors);
            return res.status(400).json({ msg: "Invalid request data", errors });
        }
        
        // If data is perfect, proceed to the actual route controller
        next();
    };
};

module.exports = validate;