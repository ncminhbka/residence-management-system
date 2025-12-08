// backend/routes/facilitiesRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controller/facilitiesController');

// Tài sản
router.get('/assets', controller.getAssets);
router.post('/assets', controller.addAsset);
router.put('/assets/:id', controller.updateAsset);
router.delete('/assets/:id', controller.deleteAsset);

// Sự kiện
router.get('/events', controller.getEvents);
router.post('/events', controller.registerEvent);
router.put('/events/:id/approve', controller.approveEvent);

module.exports = router;