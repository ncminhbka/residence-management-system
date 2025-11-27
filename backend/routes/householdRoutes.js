const express = require('express');
const householdController = require('../controller/householdController');
const checkRole = require('../middleware/checkRole');
const auth = require('../middleware/auth');

const router = express.Router();

// Tìm kiếm hộ khẩu
router.get('/search', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.searchHouseholds);

// Tách hộ khẩu
router.post('/split', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.splitHousehold);

// Lấy tất cả hộ khẩu
router.get('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.getAllHouseholds);

// Tạo hộ khẩu mới
router.post('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.createHousehold);

// ============================================
// DYNAMIC ROUTES (Có :id)
// ============================================

// Lấy chi tiết hộ khẩu
router.get('/:id/details', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.getHouseholdDetails);

// Thêm thành viên vào hộ (MỚI)
router.post('/:id/add-member', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.addMemberToHousehold);

// XÓA THÀNH VIÊN KHỎI HỘ (MỚI)
router.delete('/:id/remove-member', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.removeMemberFromHousehold);

// Đổi chủ hộ (MỚI)
router.put('/:id/change-owner', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.changeOwner);

// Cập nhật quan hệ thành viên (MỚI)
router.put('/:id/update-relation', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.updateMemberRelation);

// Cập nhật thông tin hộ khẩu
router.put('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.updateHousehold);

// Xóa hộ khẩu
router.delete('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), householdController.deleteHousehold);

module.exports = router;