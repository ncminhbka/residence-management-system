const Household = require('../models/householdModel');

// Tạo mới một hộ khẩu
exports.createHousehold = async (req, res) => {
    try {
        const { manhankhauchuho, diachi, hososo, sodangkyso, toso } = req.body;
        
        // BUG FIX: Controller cũ kiểm tra hotenchuho (không tồn tại trong request)
        if (!manhankhauchuho || !diachi || !hososo || !sodangkyso || !toso) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' });
        }
        
        // BUG FIX: isHoKhauTaken chỉ nhận 1 tham số (maChuHo), không phải 2
        const isTaken = await Household.isHoKhauTaken(manhankhauchuho);
        if (isTaken) {
            return res.status(400).json({ success: false, error: 'Chủ hộ khẩu đã đứng tên hộ khẩu khác' });
        }

        const newHousehold = await Household.addHouseholds(manhankhauchuho, diachi, hososo, sodangkyso, toso);

        res.status(201).json({ 
            success: true, 
            message: 'Tạo mới hộ khẩu thành công', 
            data: { 
                sohokhau: newHousehold.insertId,
                manhankhauchuho,
                diachi, 
                hososo, 
                sodangkyso, 
                toso 
            } 
        });
    } catch (error) {
        console.error('Create household error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
    }
};

// Lấy tất cả danh sách hộ khẩu
exports.getAllHouseholds = async (req, res) => {
    try {
        const households = await Household.getAllHousehold();
        res.status(200).json({
            success: true, 
            data: households,
            pagination: { 
                totalItems: households.length, 
                totalPages: Math.ceil(households.length / 10), 
                currentPage: 1 
            }
        });
    } catch (error) {
        console.error('Get all households error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
    }
};

// Xóa hộ khẩu bằng số hộ khẩu
exports.deleteHousehold = async (req, res) => {
    try {
        // BUG FIX: Route dùng :id, không phải :sohokhau
        const result = await Household.deleteHouseholds(req.params.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Hộ khẩu không tồn tại' });
        }
        res.status(200).json({ success: true, message: 'Xóa hộ khẩu thành công' });
    } catch (error) {
        console.error('Delete household error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
    }
};

// Cập nhật hộ khẩu bằng số hộ khẩu
exports.updateHousehold = async (req, res) => {
    try {
        // BUG FIX: Route dùng :id, không phải :sohokhau
        const sohokhau = req.params.id;
        const { hotenchuho, diachi, hososo, sodangkyso, toso } = req.body;
        
        // BUG FIX: hotenchuho thực ra là mã nhân khẩu (do frontend gửi)
        // Model updateHouseholds nhận: (sohokhau, newMaChuHo, newDiaChi, newHosoSo, newSoDangKySo, newToSo)
        const result = await Household.updateHouseholds(sohokhau, hotenchuho, diachi, hososo, sodangkyso, toso);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Hộ khẩu không tồn tại' });
        }
        res.status(200).json({ success: true, message: 'Cập nhật hộ khẩu thành công' });
    } catch (error) {
        console.error('Update household error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
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
        console.error('Search households error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
    }
};

// Lấy thông tin chi tiết hộ khẩu
exports.getHouseholdDetails = async (req, res) => {
    try {
        // BUG FIX: Route dùng :id, không phải :sohokhau
        const sohokhau = req.params.id;
        
        // Lấy thông tin hộ khẩu
        const household = await Household.searchHouseholds(sohokhau);
        if (!household || household.length === 0) {
            return res.status(404).json({ success: false, error: 'Hộ khẩu không tồn tại' });
        }
        
        // Lấy danh sách thành viên (có thể rỗng)
        const members = await Household.getHouseholdDetails(sohokhau);
        
        // BUG FIX CRITICAL: Không trả về 404 nếu không có thành viên
        // Một hộ khẩu mới tạo có thể chưa có thành viên nào
        res.status(200).json({ 
            success: true, 
            data1: household, 
            data2: members || []  // Trả về array rỗng nếu không có thành viên
        });
    } catch (error) {
        console.error('Get household details error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
    }
};

// Tách hộ mới nhưng vẫn giữ nguyên chủ hộ khẩu cũ
exports.splitHousehold = async (req, res) => {
    try {
        const sohokhaugoc = req.body.sohokhaugoc;
        const { hotenchuhomoi, diachimoi, hososomoi, sodangkysomoi, tosomoi } = req.body.thongtinhokhaumoi;
        const membersToMove = req.body.thanhviensanghokhaumoi;
        
        // Kiểm tra thông tin đầu vào
        if (!sohokhaugoc || !hotenchuhomoi || !diachimoi || !hososomoi || !sodangkysomoi || !tosomoi) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin hộ khẩu mới' });
        }
        
        if (!membersToMove || membersToMove.length === 0) {
            return res.status(400).json({ success: false, error: 'Vui lòng chọn ít nhất một thành viên để chuyển' });
        }
        
        // BUG FIX: Kiểm tra chủ hộ mới có bị trùng không
        const isTaken = await Household.isHoKhauTaken(hotenchuhomoi);
        if (isTaken) {
            return res.status(400).json({ success: false, error: 'Chủ hộ mới đã đứng tên hộ khẩu khác' });
        }

        /*
        const isExistCitizen = await Household.searchCitizen(sohokhaugoc){
        }

        */
        
        // Tạo hộ khẩu mới
        const newHousehold = await Household.addHouseholds(hotenchuhomoi, diachimoi, hososomoi, sodangkysomoi, tosomoi);
        
        // Chuyển thành viên sang hộ khẩu mới
        const result = await Household.moveMembersToNewHousehold(membersToMove, newHousehold.insertId);
        
        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, error: 'Lỗi khi chuyển thành viên sang hộ khẩu mới' });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Tách hộ khẩu thành công', 
            data: { sohokhaumoi: newHousehold.insertId } 
        });
    } catch (error) {
        console.error('Split household error:', error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
    }
};