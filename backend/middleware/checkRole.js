// backend/middleware/checkRole.js

module.exports = function (...allowedRoles) {
  return function (req, res, next) {
    // Chưa qua middleware auth hoặc token lỗi
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Kiểm tra vai trò (role hoặc CHUCVU)
    const userRole = req.user.role;

    if (!userRole) {
      return res.status(400).json({ message: 'User role not found in token' });
    }

    // Nếu role của user không nằm trong danh sách được phép
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }

    // Cho phép đi tiếp
    next();
  };
};
