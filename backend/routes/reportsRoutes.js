// backend/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controller/reportsController');

router.get('/fluctuation', reportsController.getFluctuationReport);
router.get('/population-month', reportsController.getPopulationReport);

module.exports = router;