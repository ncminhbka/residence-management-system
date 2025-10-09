const jwt = require('jsonwebtoken');
require('dotenv').config();

// Xuất ra 1 hàm tên generateToken
function generateToken(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

module.exports = { generateToken };
