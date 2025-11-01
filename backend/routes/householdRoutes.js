const express = require('express');
const householdController = require('../controller/householdController');
const checkRole = require('../middleware/checkRole');
const auth = require('../middleware/auth');

const router = express.Router();

// Lấy tất cả hộ khẩu
router.get('/',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.getAllHouseholds);

// Tạo mới hộ khẩu
router.post('/',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.createHousehold);

// Tìm kiếm hộ khẩu
router.get('/search',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.searchHouseholds);

// Tách hộ
router.post('/split',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.splitHousehold);

// Lấy thông tin chi tiết hộ khẩu
router.get('/:id',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.getHouseholdDetails);

// Cập nhật hộ khẩu
router.put('/:id',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.updateHousehold);

// Xóa hộ khẩu
router.delete('/:id',auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.deleteHousehold);


module.exports = router;