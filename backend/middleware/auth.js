// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

//middleware nay
module.exports = function (req, res, next) {
  const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // gắn thông tin người dùng vào req để sử dụng trong các route sau
    req.user = payload;
    // chuyển tiếp đến middleware hoặc route tiếp theo
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
