const express = require('express');
const householdController = require('../controller/householdController');
const checkRole = require('../middleware/checkRole');
const auth = require('../middleware/auth');

const router = express.Router();

// QUAN TRỌNG: Các route cụ thể phải đặt TRƯỚC các route động (:id)
// Nếu không, '/search' và '/split' sẽ bị hiểu là '/:id'

// Lấy tất cả hộ khẩu
router.get('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.getAllHouseholds);

// Tìm kiếm hộ khẩu (phải đặt trước /:id)
router.get('/search', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.searchHouseholds);

// Tạo mới hộ khẩu
router.post('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.createHousehold);

// Tách hộ (phải đặt trước /:id)
router.post('/split', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.splitHousehold);

// Lấy thông tin chi tiết hộ khẩu (route động, đặt sau)
router.get('/:id/details', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.getHouseholdDetails);

// Cập nhật hộ khẩu
router.put('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.updateHousehold);

// Xóa hộ khẩu
router.delete('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.deleteHousehold);

module.exports = router;