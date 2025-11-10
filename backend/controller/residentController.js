const Resident = require('../models/residentModel');

// Lấy tất cả nhân khẩu
exports.getAllResidents = async (req, res) => {
    try {
        const residents = await Resident.getAllResidents();
        res.status(200).json({ success: true, data: residents });
    } catch (error) {
        console.error("Get all residents error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Tìm kiếm nhân khẩu
exports.searchResidents = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });
        }

        const residents = await Resident.searchResidents(query);
        res.status(200).json({ success: true, data: residents });
    } catch (error) {
        console.error("Search residents error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Lấy chi tiết nhân khẩu
exports.getResidentDetails = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const residents = await Resident.getAllResidents();
        const resident = residents.find(r => r.MANHANKHAU == manhankhau);

        if (!resident) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy nhân khẩu' });
        }

        res.status(200).json({ success: true, data: resident });
    } catch (error) {
        console.error("Get resident details error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Thêm nhân khẩu mới
exports.createResident = async (req, res) => {
    try {
        const {
            hoten, ngaysinh, gioitinh, socccd, ngaycap, noicap,
            sohokhau, quanhechuho, diachi, nghenghiep, trangthai, ghichu
        } = req.body;

        // Kiểm tra trường bắt buộc
        if (!hoten || !ngaysinh || !gioitinh || !sohokhau || !trangthai) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin bắt buộc (họ tên, ngày sinh, giới tính, số hộ khẩu, trạng thái)'
            });
        }

        const result = await Resident.addResident({
            hoten, ngaysinh, gioitinh, socccd, ngaycap, noicap,
            sohokhau, quanhechuho, diachi, nghenghiep, trangthai, ghichu
        });

        res.status(201).json({
            success: true,
            message: 'Thêm nhân khẩu thành công',
            data: { manhankhau: result.insertId }
        });

    } catch (error) {
        console.error("Create resident error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cập nhật nhân khẩu
exports.updateResident = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const updatedData = {};

        // Chỉ thêm các field có giá trị vào updatedData
        const allowedFields = [
            'HOTEN', 'NGAYSINH', 'GIOITINH', 'SOCCCD', 'NGAYCAP', 'NOICAP',
            'SOHOKHAU', 'QUANHECHUHO', 'DIACHI', 'NGHENGHIEP', 'TRANGTHAI', 'GHICHU'
        ];

        // Map từ lowercase sang UPPERCASE
        const fieldMap = {
            'hoten': 'HOTEN',
            'ngaysinh': 'NGAYSINH',
            'gioitinh': 'GIOITINH',
            'socccd': 'SOCCCD',
            'ngaycap': 'NGAYCAP',
            'noicap': 'NOICAP',
            'sohokhau': 'SOHOKHAU',
            'quanhechuho': 'QUANHECHUHO',
            'diachi': 'DIACHI',
            'nghenghiep': 'NGHENGHIEP',
            'trangthai': 'TRANGTHAI',
            'ghichu': 'GHICHU'
        };

        for (const [key, value] of Object.entries(req.body)) {
            const upperKey = fieldMap[key.toLowerCase()];
            if (upperKey && value !== undefined && value !== '') {
                updatedData[upperKey] = value;
            }
        }

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ success: false, error: 'Không có dữ liệu để cập nhật' });
        }

        const result = await Resident.updateResident(manhankhau, updatedData);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Nhân khẩu không tồn tại' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật nhân khẩu thành công' });

    } catch (error) {
        console.error("Update resident error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Xóa nhân khẩu (soft delete)
exports.deleteResident = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const result = await Resident.deleteResident(manhankhau);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Nhân khẩu không tồn tại' });
        }

        res.status(200).json({ success: true, message: 'Xóa nhân khẩu thành công' });
    } catch (error) {
        console.error("Delete resident error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};