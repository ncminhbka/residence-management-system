const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const accountController = require('../controller/accountController');

// Lấy danh sách người dùng
router.get('/', auth, accountController.getAllUsers);

// Tạo tài khoản mới (chỉ tổ trưởng)
router.post('/', auth, accountController.createUser);

module.exports = router;
