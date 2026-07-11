const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    let token;

    // Check cookies first
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } 
    // Fallback to Bearer token in headers for backward compatibility
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token || token === 'none') {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_key';
        const decoded = jwt.verify(token, secret);
        
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ success: false, error: 'Not authorized: Invalid or expired token' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                error: `User role is not authorized to access this route` 
            });
        }
        next();
    };
};
