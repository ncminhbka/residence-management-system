const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();
const JWT_EXPIRY = '1h';

// 📌 Đăng ký tài khoản
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu.' });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length)
      return res.status(400).json({ message: 'Email đã được sử dụng. Vui lòng chọn email khác.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name || '', email, hash]
    );

    // ✅ Thông báo tiếng Việt + hướng dẫn frontend chuyển hướng
    res.json({
      message: 'Đăng ký thành công, đang chuyển về trang đăng nhập...',
      userId: result.insertId,
      redirect: '/login' // 👉 frontend có thể dựa vào đây để chuyển hướng
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// 📌 Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác.' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác.' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 // 1h
    });

    res.json({ message: 'Đăng nhập thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
  }
});

// 📌 Đăng xuất
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Đã đăng xuất.' });
});

module.exports = router;
