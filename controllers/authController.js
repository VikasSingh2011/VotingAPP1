const User = require('../models/user');
const OtpVerification = require('../models/otpVerification');
const VoteTracker = require('../models/voteTracker');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { sendWelcomeEmail } = require('../services/emailService');

// Helper to set cookies
const isSecureRequest = (req) => req.secure || req.get('x-forwarded-proto') === 'https';

const sendTokenResponse = (req, res, user, statusCode, message) => {
    const payload = { id: user.id, role: user.role };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    const secureCookie = isSecureRequest(req);
    
    // Short-lived access token (15 mins)
    res.cookie('token', accessToken, {
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'strict'
    });

    // Long-lived refresh token (7 days)
    res.cookie('refreshToken', refreshToken, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'strict'
    });

    res.status(statusCode).json({ 
        success: true, 
        message, 
        user: { id: user.id, name: user.name, role: user.role } 
    });
};

// Helper to generate and log/save OTP
const generateAndSendOTP = async (user) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Clear previous verification attempts
    await OtpVerification.deleteMany({ userId: user._id });

    await OtpVerification.create({
        userId: user._id,
        otp,
        expiresAt
    });

    console.log(`\n=========================================`);
    console.log(`🔑 SIMULATED OTP FOR USER ${user.name} (${user.aadharCardNumber}): ${otp}`);
    console.log(`=========================================\n`);

    return otp;
};

// @desc    Refresh access token using refresh token
// @route   POST /api/user/refresh
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ success: false, error: 'Not authorized, no refresh token' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ success: false, error: 'Invalid refresh token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        const payload = { id: user.id, role: user.role };
        const newAccessToken = generateToken(payload);
        
        res.cookie('token', newAccessToken, {
            expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            httpOnly: true,
            secure: isSecureRequest(req),
            sameSite: 'strict'
        });

        res.status(200).json({ success: true, message: 'Token refreshed' });
    } catch (err) {
        next(err);
    }
};

// @desc    Register user
// @route   POST /api/user/signup
exports.signup = async (req, res, next) => {
    try {
        const data = req.body;

        if (data.role === "admin") {
            const existingAdmin = await User.findOne({ role: "admin" });
            if (existingAdmin) {
                return res.status(400).json({ success: false, error: "Only one admin is allowed in the system" });
            }
        }

        const newUser = new User(data);
        newUser.isVerified = false; // Require OTP verification
        const savedUser = await newUser.save();
        
        // Generate simulated OTP
        const otp = await generateAndSendOTP(savedUser);

        // Send welcome email with OTP (non-blocking)
        if (savedUser.email) {
            sendWelcomeEmail(savedUser.email, savedUser.name, otp);
        }
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please verify your OTP to activate.',
            userId: savedUser._id,
            simulatedOtp: otp
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/user/login
exports.login = async (req, res, next) => {
    try {
        const { aadharCardNumber, password } = req.body;

        if (!aadharCardNumber || !password) {
            return res.status(400).json({ success: false, error: 'Please provide Aadhar number and password' });
        }

        const user = await User.findOne({ aadharCardNumber }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            // Trigger an OTP send automatically for verification
            const otp = await generateAndSendOTP(user);
            return res.status(403).json({
                success: false,
                isUnverified: true,
                message: 'Account is not verified. A verification code has been sent to your device.',
                simulatedOtp: otp
            });
        }

        sendTokenResponse(req, res, user, 200, 'Login successful');
    } catch (err) {
        next(err);
    }
};

// @desc    Verify OTP
// @route   POST /api/user/verify-otp
exports.verifyOtp = async (req, res, next) => {
    try {
        const { aadharCardNumber, otp } = req.body;

        if (!aadharCardNumber || !otp) {
            return res.status(400).json({ success: false, error: 'Aadhar Card Number and OTP are required' });
        }

        const user = await User.findOne({ aadharCardNumber });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, error: 'User is already verified' });
        }

        const otpRecord = await OtpVerification.findOne({
            userId: user._id,
            otp,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        otpRecord.verified = true;
        await otpRecord.save();

        user.isVerified = true;
        await user.save();

        sendTokenResponse(req, res, user, 200, 'OTP verified successfully. Account activated.');
    } catch (err) {
        next(err);
    }
};

// @desc    Resend OTP
// @route   POST /api/user/resend-otp
exports.resendOtp = async (req, res, next) => {
    try {
        const { aadharCardNumber } = req.body;
        if (!aadharCardNumber) {
            return res.status(400).json({ success: false, error: 'Aadhar Card Number is required' });
        }

        const user = await User.findOne({ aadharCardNumber });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, error: 'User is already verified' });
        }

        const otp = await generateAndSendOTP(user);
        res.status(200).json({
            success: true,
            message: 'OTP resent successfully.',
            simulatedOtp: otp
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/user/logout
exports.logout = async (req, res, next) => {
    try {
        const options = {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        };
        res.cookie('token', 'none', options);
        res.cookie('refreshToken', 'none', options);
        
        res.status(200).json({ success: true, message: 'User logged out' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current user profile
// @route   GET /api/user/profile
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).lean();
        if (user) {
            const votedElections = await VoteTracker.find({ userId }).select('electionId');
            user.votedElectionIds = votedElections.map(vt => vt.electionId.toString());
        }
        res.status(200).json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/user/profile/password
exports.updatePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ success: false, error: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        next(err);
    }
};
