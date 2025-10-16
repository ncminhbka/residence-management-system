const express = require('express');
const authController = require('../controller/authController');
const auth = require('../middleware/auth');
const router = express.Router();
// Đăng ký, đăng nhập, đăng xuất
//router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;