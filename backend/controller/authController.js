const pool = require('../db');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');


const JWT_EXPIRY = '1h';


login = async (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!username || !password)
    return res.status(400).json({ message: 'Vui lòng nhập username và mật khẩu.' });

  try {
    const user = await userModel.findByUsername(username);
    if (!user)
      return res.status(400).json({ message: 'Username hoặc mật khẩu không chính xác.' });

    // 🔒 Kiểm tra trạng thái tài khoản
    if (user.TRANGTHAI === 0 || user.TRANGTHAI === false)
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' });

    // ✅ Kiểm tra mật khẩu (nếu có mã hóa bằng bcrypt)
    const isMatch = await bcrypt.compare(password, user.MATKHAU);
    if (!isMatch)
      return res.status(400).json({ message: 'Username hoặc mật khẩu không chính xác.' });

    // ✅ Tạo JWT token AE CHÚ Ý CÁI NÀY QUAN TRỌNG
    const token = generateToken({
      id: user.MATAIKHOAN,
      username: user.TENDANGNHAP,
      role: user.CHUCVU
    }, JWT_EXPIRY);

    // ✅ Lưu token vào cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 // 1 giờ
    });

    res.json({ message: 'Đăng nhập thành công!', role: user.CHUCVU });

  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
};


logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Đã đăng xuất.' });
  console.log('User logged out, token cookie cleared.');
}

getMe = async (req, res) => {
  try {
    const username = req.user.username;
    const user = await userModel.findByUsername(username);

    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    // chỉ trả về thông tin cơ bản, không gửi password
    res.json({
      user_id: user.MATAIKHOAN,
      username: user.TENDANGNHAP,
      full_name: user.HOTEN,
      role: user.CHUCVU
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};


module.exports = {
  login,
  logout,
  getMe
};