const Household = require('../models/householdModel');

// Tạo mới một hộ khẩu
exports.createHousehold = async (req, res) => {
    try {
        const { hotenchuho, manhankhauchuho , diachi, hososo, sodangkyso, toso } = req.body;
        if(!hotenchuho || !manhankhauchuho || !diachi || !hososo || !sodangkyso || !toso) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
        }
        const isTaken = await Household.isHoKhauTaken(hotenchuho, manhankhauchuho);
        if (isTaken) return res.status(400).json({ success: false, error: 'Chủ hộ khẩu đã đứng tên hộ khẩu khác hoặc không tồn tại' });

        const newHousehold = await Household.addHouseholds(hotenchuho, diachi, hososo, sodangkyso, toso);
        res.status(201).json({ success: true, message: 'Tạo mới hộ khẩu thành công', data: { sohokhau: newHousehold.insertId, hotenchuho, diachi, hososo, sodangkyso, toso } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// Lấy tất danh sách hộ khẩu
exports.getAllHouseholds = async (req, res) => {
    try {
        const households = await Household.getAllHousehold();
        res.status(200).json({ success: true, data: households, 
            pagination: { totalItems: households.length, totalPages: Math.ceil(households.length / 10), currentPage: 1 } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// Xóa hộ khẩu bằng số hộ khẩu
exports.deleteHousehold = async (req, res) => {
    try {
        const result = await Household.deleteHouseholds(req.params.sohokhau);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Hộ khẩu không tồn tại' });
        }
        res.status(200).json({ success: true, message: 'Xóa hộ khẩu thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// Cập nhật hộ khẩu bằng số hộ khẩu
exports.updateHousehold = async (req, res) => {
    try {
        const sohokhau = req.params.sohokhau;
        const { hotenchuho, diachi, hososo, sodangkyso, toso } = req.body;
        const result = await Household.updateHouseholds(sohokhau, hotenchuho, diachi, hososo, sodangkyso, toso);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Hộ khẩu không tồn tại' });
        }
        res.status(200).json({ success: true, message: 'Cập nhật hộ khẩu thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// Tìm kiếm hộ khẩu theo tên chủ hộ hoặc số hộ khẩu
exports.searchHouseholds = async (req, res) => {
    try {
        const { query } = req.query;    
        if (!query) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin tìm kiếm' });
        }
        const households = await Household.searchHouseholds(query);
        res.status(200).json({ success: true, data: households });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// Lấy thông tin chi tiết hộ khẩu
exports.getHouseholdDetails = async (req, res) => {
    try {
        const sohokhau = req.params.sohokhau;
        const household = await Household.searchHouseholds(sohokhau);
        if (!houshold || household.length === 0) {
            return res.status(404).json({ success: false, error: 'Hộ khẩu không tồn tại' });
        }
        const members = await Household.getHouseholdDetails(sohokhau);
        if (!members || members.length === 0) {
            return res.status(404).json({ success: false, error: 'Lỗi khi lấy thông tin chi tiết hộ khẩu' });
        }
        res.status(200).json({ success: true, data1: household, data2: members });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// Tách hộ mới nhưng vẫn giữ nguyên chủ hộ khẩu cũ
exports.splitHousehold = async (req, res) => {
    try {
        const sohokhaugoc = req.body.sohokhaugoc;
        const { hotenchuhomoi, diachimoi, hososomoi, sodangkysomoi, tosomoi } = req.body.thongtinhokhaumoi;
        const membersToMove = req.body.thanhviensanghokhaumoi; // Mảng mã nhân khẩu
        // Kiểm tra thông tin đầu vào
        if (!sohokhaugoc || !hotenchuhomoi || !diachimoi || !hososomoi || !sodangkysomoi || !tosomoi || membersToMove.length === 0) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
        }
        // Tạo hộ khẩu mới
        const newHousehold = await Household.addHouseholds(hotenchuhomoi, diachimoi, hososomoi, sodangkysomoi, tosomoi);
        // Chuyển thành viên sang hộ khẩu mới
        const result = await Household.moveMembersToNewHousehold(membersToMove, newHousehold.insertId);
        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, error: 'Lỗi khi chuyển thành viên sang hộ khẩu mới' });
        }
        res.status(200).json({ success: true, message: 'Tách hộ khẩu thành công', data: { sohokhaumoi: newHousehold.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
