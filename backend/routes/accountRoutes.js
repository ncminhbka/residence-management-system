const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const accountController = require('../controller/accountController');

// Lấy danh sách người dùng
router.get('/', auth, accountController.getAllUsers);

// Tạo tài khoản mới (chỉ tổ trưởng)
router.post('/', auth, accountController.createUser);

// Xóa tài khoản
router.delete('/:id', auth, accountController.deleteUser);

// Cập nhật thông tin tài khoản
router.put('/:id', auth, accountController.updateUser);

module.exports = router;
