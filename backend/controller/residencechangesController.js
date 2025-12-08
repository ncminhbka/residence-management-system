// backend/controller/residencechangesController.js
const Model = require('../models/residencechangesModel'); // <--- QUAN TRỌNG: Phải đúng tên file model

// 1. Tạm Vắng
exports.createTamVang = async (req, res) => {
  try {
    await Model.addTamVang(req.body);
    res.json({ success: true, message: 'Khai báo tạm vắng thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server hoặc Mã nhân khẩu không tồn tại.' });
  }
};

exports.getTamVang = async (req, res) => {
  try {
    const [rows] = await Model.getAllTamVang();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Tạm Trú
exports.createTamTru = async (req, res) => {
  try {
    await Model.addTamTru(req.body);
    res.json({ success: true, message: 'Đăng ký tạm trú thành công!' });
  } catch (err) {
    console.error(err);
    if(err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ success: false, message: 'Mã nhân khẩu không tồn tại.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

exports.getTamTru = async (req, res) => {
  try {
    const [rows] = await Model.getAllTamTru();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};