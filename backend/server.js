const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================
// Middleware
// =============================
app.use(express.json());
app.use(cookieParser());

// =============================
// Routes (API)
// =============================

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const householdRoutes = require('./routes/householdRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/households', householdRoutes);

// =============================
// Serve Frontend (Static Files)
// =============================

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Nếu người dùng nhập URL khác, vẫn trả về index.html
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// =============================
// Khởi động Server
// =============================
app.listen(PORT, () => {
  console.log(`✅ App running at http://localhost:${PORT}`);
});

// =============================
// Tạo tài khoản admin mặc định
// =============================

const bcrypt = require('bcrypt');
const db = require('./db');

(async () => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM TAI_KHOAN WHERE CHUCVU = 'TO_TRUONG'"
    );

    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.query(
        "INSERT INTO TAI_KHOAN (HOTEN, CHUCVU, TENDANGNHAP, MATKHAU) VALUES (?, ?, ?, ?)",
        ['Admin Gốc', 'TO_TRUONG', 'admin', hash]
      );
      console.log('✅ Đã tạo tài khoản admin mặc định (admin / admin123)');
    } else {
      console.log('⚙️ Admin đã tồn tại, bỏ qua.');
    }
  } catch (err) {
    console.error('❌ Lỗi khởi tạo admin:', err);
  }
})();
