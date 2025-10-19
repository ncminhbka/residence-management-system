const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Lấy danh sách người dùng
exports.getAllUsers = async (req, res) => {
    try {
        // Nếu bạn chưa bật xác thực thì tạm bỏ check này
        // if (req.user.role !== 'TO_TRUONG' && req.user.role !== 'TO_PHO') {
        //   return res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
        // }

        const users = await User.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Lỗi server khi lấy danh sách tài khoản' });
    }
};

// Tạo tài khoản mới
exports.createUser = async (req, res) => {
    try {
        // Nếu bạn chưa bật phân quyền thì tạm tắt kiểm tra này
        // if (req.user.role !== 'TO_TRUONG') {
        //   return res.status(403).json({ success: false, error: 'Chỉ tổ trưởng được phép tạo tài khoản' });
        // }

        const { hoten, tendangnhap, matkhau, chucvu } = req.body;

        if (!tendangnhap || !matkhau)
            return res.status(400).json({ success: false, error: 'Thiếu thông tin đăng ký' });

        const isTaken = await User.isUsernameTaken(tendangnhap);
        if (isTaken)
            return res.status(400).json({ success: false, error: 'Tên đăng nhập đã tồn tại' });

        const hashed = await bcrypt.hash(matkhau, 10);
        const result = await User.createUser(tendangnhap, hashed, hoten, chucvu);

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
