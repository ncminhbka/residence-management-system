// backend/routes/residencechangesRoutes.js
const express = require('express');
const router = express.Router();

// <--- QUAN TRỌNG: Import đúng file Controller
const controller = require('../controller/residencechangesController'); 

// Debug: Kiểm tra xem controller có load được không
if (!controller) {
    console.error("❌ Lỗi: Không thể load residencechangesController. Kiểm tra lại tên file!");
}


// API Tạm Vắng
router.get('/tamvang', controller.getTamVang);
router.post('/tamvang', controller.createTamVang);
router.put('/tamvang/:id', controller.updateTamVang);

// API Tạm Trú
router.get('/tamtru', controller.getTamTru);
router.post('/tamtru', controller.createTamTru);
router.put('/tamtru/:id', controller.updateTamTru);

// API Thống kê
router.get('/stats', controller.getStats);

module.exports = router;