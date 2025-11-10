const express = require('express');
const residentController = require('../controller/residentController');
const checkRole = require('../middleware/checkRole');
const auth = require('../middleware/auth');

const router = express.Router();

// QUAN TRỌNG: Các route cụ thể phải đặt TRƯỚC các route động (:id)
// Nếu không, '/search' và '/split' sẽ bị hiểu là '/:id'

// Lấy tất cả nhân khẩu
router.get('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.getAllResidents);

// Tạo mới nhân khẩu
router.post('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.createResident);

// Tìm kiếm nhân khẩu (phải đặt trước /:id)
router.get('/search', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.searchResidents);

// Lấy thông tin chi tiết nhân khẩu khẩu (route động, đặt sau)
router.get('/:id/details', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.getResidentDetails);

// Xóa nhân khẩu
router.delete('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.deleteResident);

// Cập nhật nhân khẩu
router.put('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.updateResident);

module.exports = router;