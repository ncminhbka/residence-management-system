const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// === Lấy danh sách người dùng ===
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi server khi lấy danh sách tài khoản' });
  }
};

// === Tạo tài khoản mới ===
exports.createUser = async (req, res) => {
  try {
    const { hoten, tendangnhap, matkhau, chucvu } = req.body;
    if (!tendangnhap || !matkhau || !hoten || !chucvu)
      return res.status(400).json({ success: false, error: 'Thiếu thông tin đăng ký' });

    const isTaken = await User.isUsernameTaken(tendangnhap);
    if (isTaken)
      return res.status(400).json({ success: false, error: 'Tên đăng nhập đã tồn tại' });

    const hashed = await bcrypt.hash(matkhau, 10);

    // Mặc định tài khoản mới được kích hoạt (true)
    const result = await User.createUser(tendangnhap, hashed, hoten, chucvu, true);

    res.json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: { id: result.insertId, username: tendangnhap, role: chucvu }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi server khi tạo tài khoản' });
  }
};

// === Xóa tài khoản ===
exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId))
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

    if (userId === 1)
      return res.status(403).json({ success: false, error: 'Không được xóa tài khoản quản trị viên' });

    if (req.user && req.user.id === userId)
      return res.status(403).json({ success: false, error: 'Không thể xóa chính bạn' });

    const result = await User.deleteUser(userId);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Tài khoản không tồn tại' });

    res.json({ success: true, message: 'Xóa tài khoản thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi server khi xóa tài khoản' });
  }
};

// === Cập nhật tài khoản ===
exports.updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId))
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

    const { hoten, tendangnhap, matkhau, chucvu, trangthai } = req.body;

    const existing = await User.getUserById(userId);
    if (!existing)
      return res.status(404).json({ success: false, error: 'Tài khoản không tồn tại' });

    const newHoten = hoten?.trim() || existing.HOTEN;
    const newUsername = tendangnhap?.trim() || existing.TENDANGNHAP;
    const newRole = chucvu?.trim() || existing.CHUCVU;
    const newStatus = typeof trangthai === 'boolean' ? trangthai : !!existing.TRANGTHAI;

    let newPasswordHash = existing.MATKHAU;
    if (matkhau && matkhau.trim() !== '') {
      newPasswordHash = await bcrypt.hash(matkhau, 10);
    }

    let forceLogout = false;
    if (req.user && req.user.id === userId) {
      const usernameChanged = newUsername !== existing.TENDANGNHAP;
      const passwordChanged = !!matkhau;
      forceLogout = usernameChanged || passwordChanged;
    }

    const result = await User.updateUser(userId, newHoten, newUsername, newPasswordHash, newRole, newStatus);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Tài khoản không tồn tại' });

    if (forceLogout) {
      res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
      return res.json({ success: true, message: 'Cập nhật thành công. Vui lòng đăng nhập lại.', forceLogout: true });
    }

    res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Lỗi server khi cập nhật tài khoản' });
  }
};
