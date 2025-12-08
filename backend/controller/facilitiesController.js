
// backend/controller/facilitiesController.js
const Model = require('../models/facilitiesModel');

// --- TÀI SẢN ---
exports.getAssets = async (req, res) => {
    try {
        const [rows] = await Model.getAllAssets();
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addAsset = async (req, res) => {
    try {
        await Model.addAsset(req.body);
        res.json({ success: true, message: 'Thêm tài sản thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateAsset = async (req, res) => {
    try {
        await Model.updateAsset(req.params.id, req.body);
        res.json({ success: true, message: 'Cập nhật tài sản thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteAsset = async (req, res) => {
    try {
        await Model.deleteAsset(req.params.id);
        res.json({ success: true, message: 'Xóa tài sản thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- SỰ KIỆN ---
exports.getEvents = async (req, res) => {
    try {
        const [rows] = await Model.getAllEvents();
        res.json({ success: true, data: rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.registerEvent = async (req, res) => {
    try {
        const { ten, mota, start, end, loai, phi, nguoitao } = req.body;

        // 1. Kiểm tra trùng lịch
        const [overlaps] = await Model.checkOverlap(start, end);
        if (overlaps.length > 0) {
            return res.status(400).json({ success: false, message: '⚠️ Thời gian này đã có sự kiện khác!' });
        }

        // 2. Xác định trạng thái ban đầu
        // Nếu là hoạt động công cộng (Họp, Vệ sinh) -> Tự động duyệt
        // Nếu là cá nhân (Đám cưới, Thuê sân) -> Chờ duyệt
        const isPublic = ['HopToDanPho', 'VeSinhMoiTruong', 'TuyenTruyen'].includes(loai);
        const trangthai = isPublic ? 'DaDuyet' : 'ChoDuyet';

        await Model.addEvent({ ten, mota, start, end, loai, phi, trangthai, nguoitao });
        res.json({ success: true, message: isPublic ? 'Đã tạo lịch hoạt động chung' : 'Đã gửi yêu cầu thuê, vui lòng chờ duyệt' });

    } catch (err) { 
        console.error(err);
        res.status(500).json({ success: false, message: err.message }); 
    }
};

exports.approveEvent = async (req, res) => {
    try {
        const { status, phi } = req.body; // status: 'DaDuyet', 'TuChoi'
        await Model.updateEventStatus(req.params.id, status, phi);
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};