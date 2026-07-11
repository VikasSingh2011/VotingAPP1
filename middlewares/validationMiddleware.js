const { check, validationResult } = require('express-validator');

// Validation error handler middleware
exports.validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Validation rules
exports.signupValidationRules = [
    check('name', 'Name is required').not().isEmpty(),
    check('age', 'Age must be 18 or older').isInt({ min: 18 }),
    check('aadharCardNumber', 'Aadhar Card Number must be 12 digits').isLength({ min: 12, max: 12 }).isNumeric(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('address', 'Address is required').not().isEmpty()
];

exports.loginValidationRules = [
    check('aadharCardNumber', 'Please include a valid 12 digit Aadhar number').isLength({ min: 12, max: 12 }).isNumeric(),
    check('password', 'Password is required').exists()
];

exports.candidateValidationRules = [
    check('name', 'Candidate name is required').not().isEmpty(),
    check('party', 'Party name is required').not().isEmpty(),
    check('age', 'Age must be at least 25 to be a candidate').custom((value, { req }) => {
        if (req.body.name && req.body.name.trim().toUpperCase() === 'NOTA') {
            return true;
        }
        const ageVal = parseInt(value, 10);
        if (isNaN(ageVal) || ageVal < 25) {
            throw new Error('Age must be at least 25 to be a candidate');
        }
        return true;
    })
];
