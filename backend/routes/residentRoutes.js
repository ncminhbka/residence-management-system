const express = require('express');
const residentController = require('../controller/residentController');
const checkRole = require('../middleware/checkRole');
const auth = require('../middleware/auth');

const router = express.Router();

// ==================================================================
// QUAN TRỌNG: Thứ tự khai báo route rất quan trọng trong Express
// Các route cụ thể (static paths) phải đặt TRƯỚC các route động (:id)
// ==================================================================

// 1. Tìm kiếm nhân khẩu (Phải đặt ĐẦU TIÊN để tránh bị hiểu nhầm là :id)
// GET /api/residents/search?q=...
router.get('/search', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.searchResidents);

// 2. Lấy tất cả nhân khẩu
// GET /api/residents
router.get('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.getAllResidents);

// 3. Tạo mới nhân khẩu
// POST /api/residents
router.post('/', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.createResident);

// ==================================================================
// CÁC ROUTE ĐỘNG (CÓ THAM SỐ :id) - ĐẶT Ở DƯỚI CÙNG
// ==================================================================

// 4. Lấy thông tin chi tiết nhân khẩu
// GET /api/residents/1/details
router.get('/:id/details', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.getResidentDetails);

// 5. [MỚI] Xem lịch sử biến động của nhân khẩu (Khớp với Controller vừa sửa)
// GET /api/residents/1/history
router.get('/:id/history', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.getResidentHistory);

// 6. Cập nhật nhân khẩu
// PUT /api/residents/1
router.put('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.updateResident);

// 7. Xóa nhân khẩu
// DELETE /api/residents/1
router.delete('/:id', auth, checkRole('TO_TRUONG', 'TO_PHO'), residentController.deleteResident);

module.exports = router;