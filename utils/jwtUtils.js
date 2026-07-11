const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'fallback_secret_key';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key';

// Generate short-lived Access Token (15 minutes)
exports.generateToken = (userData) => {
  return jwt.sign(userData, getSecret(), { expiresIn: '15m' }); 
};

// Generate long-lived Refresh Token (7 days)
exports.generateRefreshToken = (userData) => {
  return jwt.sign(userData, getRefreshSecret(), { expiresIn: '7d' });
};

// Verify Refresh Token
exports.verifyRefreshToken = (token) => {
  try {
      return jwt.verify(token, getRefreshSecret());
  } catch (err) {
      return null;
  }
};
