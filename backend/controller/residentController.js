const Resident = require('../models/residentModel');


const formatDatabaseDate = (dateString) => {
    // Nếu không có chuỗi ngày, hoặc không phải là chuỗi, trả về null
    if (!dateString || typeof dateString !== 'string') {
        return null;
    }

    // Tách chuỗi bằng dấu '/'
    const parts = dateString.split('/');

    // Nếu có đủ 3 phần (ngày, tháng, năm) thì đảo ngược lại
    if (parts.length === 3) {
        // parts[0] = DD, parts[1] = MM, parts[2] = YYYY
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // Trả về YYYY-MM-DD
    }

    // Nếu định dạng không đúng, trả về null (hoặc dateString nếu bạn muốn CSDL báo lỗi)
    return null;
};

// === LẤY TẤT CẢ NHÂN KHẨU ===
exports.getAllResidents = async (req, res) => {
    try {
        const residents = await Resident.getAllResidents();
        res.status(200).json({ success: true, data: residents });
    } catch (error) {
        console.error("Get all residents error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// === TÌM KIẾM NHÂN KHẨU ===
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

// === LẤY CHI TIẾT NHÂN KHẨU ===
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

// === THÊM NHÂN KHẨU MỚI ===
exports.createResident = async (req, res) => {
    try {
        const {
            hoten, bidanh, ngaysinh, gioitinh, noisinh, nguyenquan,
            dantoc, quoctich, nghenghiep, ngaycap, noicap,
            sohokhau, quanhechuho, trangthai, noithuongtrucu
        } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!hoten || !ngaysinh || !gioitinh || !noisinh || !nguyenquan || !dantoc || !quoctich || !trangthai) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin bắt buộc (họ tên, ngày sinh, giới tính, nơi sinh, nguyên quán, dân tộc, quốc tịch, trạng thái)'
            });
        }

        // ✅ CHUẨN HÓA ĐỊNH DẠNG NGÀY
        const formattedNgaysinh = formatDatabaseDate(ngaysinh);
        const formattedNgaycap = formatDatabaseDate(ngaycap);

        const result = await Resident.addResident({
            hoten,
            bidanh,
            ngaysinh: formattedNgaysinh,
            gioitinh,
            noisinh,
            nguyenquan,
            dantoc,
            quoctich,
            nghenghiep,
            ngaycap: formattedNgaycap,
            noicap,
            sohokhau,
            quanhechuho,
            trangthai,
            noithuongtrucu
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


// === CẬP NHẬT NHÂN KHẨU ===
exports.updateResident = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const allowedFields = [
            'HOTEN', 'BIDANH', 'NGAYSINH', 'GIOITINH', 'NOISINH', 'NGUYENQUAN',
            'DANTOC', 'QUOCTICH', 'NGHENGHIEP', 'NGAYCAP', 'NOICAP',
            'SOHOKHAU', 'QUANHECHUHO', 'TRANGTHAI', 'NOITHUONGTRUCU'
        ];

        const fieldMap = Object.fromEntries(allowedFields.map(f => [f.toLowerCase(), f]));
        const updatedData = {};

        for (const [key, value] of Object.entries(req.body)) {
            const dbKey = fieldMap[key.toLowerCase()];
            if (dbKey && value !== undefined && value !== '') {
                // Nếu là trường ngày => chuyển định dạng
                if (dbKey === 'NGAYSINH' || dbKey === 'NGAYCAP') {
                    const formattedDate = formatDatabaseDate(value);
                    if (formattedDate) {
                        updatedData[dbKey] = formattedDate;
                    }
                } else {
                    updatedData[dbKey] = value;
                }
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


// === XÓA NHÂN KHẨU ===
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

// === LẤY LỊCH SỬ BIẾN ĐỘNG ===
exports.getResidentHistory = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const history = await Resident.getResidentHistory(manhankhau);

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("Get resident history error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
