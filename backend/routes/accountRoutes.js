const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const accountController = require('../controller/accountController');
const checkRole = require('../middleware/checkRole');

// Lấy danh sách người dùng
router.get('/',auth, checkRole('TO_TRUONG', 'TO_PHO'), accountController.getAllUsers);

// Tạo tài khoản mới (chỉ tổ trưởng)
router.post('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), accountController.createUser);

// Xóa tài khoản
router.delete('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), accountController.deleteUser);

// Cập nhật thông tin tài khoản
router.put('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), accountController.updateUser);

module.exports = router;
