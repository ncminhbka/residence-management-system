const pool = require('../db');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');



const JWT_EXPIRY = '1h';


// 📌 Đăng ký tài khoản
register = async (req, res) => {
  const { full_name, username, password, role } = req.body;

  // Kiểm tra đầu vào
  if (!username || !password)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ username và mật khẩu.' });
  if (username.length < 4)
    return res.status(400).json({ message: 'Username phải có ít nhất 4 ký tự.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });

  try {
    // Kiểm tra trùng username
    const existingUser = await userModel.findByUsername(username);
    if (existingUser)
      return res.status(400).json({ message: 'Username đã được sử dụng. Vui lòng chọn username khác.' });

    // Mã hóa mật khẩu
    const hash = await bcrypt.hash(password, 10);

    // Thêm user mới
    const result = await userModel.createUser(username, hash, full_name, role);

    // Trả về phản hồi
    res.json({
      message: 'Đăng ký thành công, đang chuyển về trang đăng nhập...',
      userId: result.insertId,
      redirect: '/login'
    });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
}



getDashboard = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id, full_name, username FROM users WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




login = async (req, res) => {
  // res.clearCookie('token'); // Xóa cookie cũ nếu có
  
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Vui lòng nhập username và mật khẩu.' });

  try {
    const user = await userModel.findByUsername(username);
    if (!user)
      return res.status(400).json({ message: 'Username hoặc mật khẩu không chính xác.' });

    // So sánh mật khẩu
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(400).json({ message: 'Username hoặc mật khẩu không chính xác.' });

    // Tạo JWT
    const token = generateToken({
      id: user.user_id,
      username: user.username,
      role: user.role,
    }, JWT_EXPIRY);

    // Lưu token vào cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 // 1 giờ
    });

    res.json({ message: 'Đăng nhập thành công!', role: user.role });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
}

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
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
module.exports = {
  register,
  login,
  logout,
  getMe
};