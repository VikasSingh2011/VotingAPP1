const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);
module.exports = OtpVerification;
