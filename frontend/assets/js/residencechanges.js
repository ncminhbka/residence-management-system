// frontend/assets/js/residencechanges.js

// 1. CẤU HÌNH API
const API_BASE = 'http://localhost:3000/api/v1/residencechanges'; 
// Lưu ý: Đổi cổng 3000 nếu backend bạn chạy cổng khác

document.addEventListener('DOMContentLoaded', () => {
    loadData('tamvang');
    loadData('tamtru');
    loadStats();
    setupForms();
});

// Lấy thống kê và cập nhật giao diện
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const json = await res.json();
        if (json.success && json.data) {
            document.getElementById('stat-tam-tru-active').textContent = json.data.tamTruActive;
            document.getElementById('stat-tam-tru-expiring').textContent = json.data.tamTruExpiring;
            document.getElementById('stat-tam-vang-active').textContent = json.data.tamVangActive;
            document.getElementById('stat-tam-vang-returned').textContent = json.data.tamVangReturned;
        } else {
            // Nếu lỗi, đặt về 0
            document.getElementById('stat-tam-tru-active').textContent = 0;
            document.getElementById('stat-tam-tru-expiring').textContent = 0;
            document.getElementById('stat-tam-vang-active').textContent = 0;
            document.getElementById('stat-tam-vang-returned').textContent = 0;
        }
    } catch (err) {
        document.getElementById('stat-tam-tru-active').textContent = 0;
        document.getElementById('stat-tam-tru-expiring').textContent = 0;
        document.getElementById('stat-tam-vang-active').textContent = 0;
        document.getElementById('stat-tam-vang-returned').textContent = 0;
    }
};

// --- Tab Switch Logic ---
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelector(`button[onclick="switchTab('${tabName}')"]`).classList.add('active');
}

// ==========================================
// 2. LOAD DATA (GET API)
// ==========================================
async function loadData(type) {
    const tbody = document.getElementById(`tbody-${type}`);
    // compute column count from table header to ensure correct colspan
    let colCount = 6;
    try {
        const table = tbody.closest('table');
        if (table) colCount = table.querySelectorAll('thead th').length || colCount;
    } catch (e) {}
    tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; padding: 20px;">⏳ Đang tải dữ liệu từ Server...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE}/${type}`);
        const json = await response.json();

        if (json.success) {
            // Chuyển đổi dữ liệu từ SQL (chữ hoa) sang Format Frontend (chữ thường)
            const mappedData = json.data.map(item => mapDataFromDB(type, item));
            renderTable(type, mappedData);
        } else {
            tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color:red">❌ ${json.message}</td></tr>`;
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color:red">❌ ${error.message || 'Lỗi kết nối'}</td></tr>`;
    }
}

// Hàm chuyển đổi tên cột Database -> Tên biến Frontend dùng
function mapDataFromDB(type, dbItem) {
    if (type === 'tamvang') {
        return {
            rowId: dbItem.ID,
            idNhanKhau: dbItem.MANHANKHAU,
            hoTen: dbItem.HOTEN,
            cccd: dbItem.CCCD,
            maGiay: dbItem.MAGIAYTAMVANG,
            tuNgay: dbItem.NGAYBATDAU,
            denNgay: dbItem.NGAYKETTHUC,
            noiDen: dbItem.NOITAMTRU,
            lyDo: dbItem.LYDO
        };
    } else {
        return {
            rowId: dbItem.ID,
            idNhanKhau: dbItem.MANHANKHAU,
            hoTen: dbItem.HOTEN,
            cccd: dbItem.CCCD,
            maGiay: dbItem.MAGIAYTAMTRU,
            diaChi: dbItem.DIACHITAMTRU,
            tuNgay: dbItem.NGAYBATDAU,
            denNgay: dbItem.NGAYKETTHUC,
            lyDo: dbItem.GHICHU
        };
    }
}

// --- Render Table ---
function renderTable(type, data) {
    const tbody = document.getElementById(`tbody-${type}`);
    let colCount = 8; 
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; padding: 20px; color: #888;">Chưa có dữ liệu</td></tr>`;
        return;
    }

    const renderActions = (item) => `
        <button class="btn btn-sm btn-warning" onclick='prepareEdit("${type}", ${JSON.stringify(item)})' style="margin-right:5px">✏️ Sửa</button>
        <button class="btn btn-sm btn-secondary" onclick='printPaper("${type}", ${JSON.stringify(item)})'>🖨️ In</button>
    `;

    if (type === 'tamvang') {
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.idNhanKhau}</td>
                <td><strong>${item.hoTen}</strong></td>
                <td>${item.cccd || ''}</td>
                <td>${item.maGiay || ''}</td>
                <td>${formatDate(item.tuNgay)}</td>
                <td>${formatDate(item.denNgay)}</td>
                <td>${item.noiDen}</td>
                <td>${item.lyDo}</td>
                <td style="white-space:nowrap">${renderActions(item)}</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.idNhanKhau}</td>
                <td><strong>${item.hoTen}</strong></td>
                <td>${item.cccd || ''}</td>
                <td>${item.maGiay || ''}</td>
                <td>${item.diaChi}</td>
                <td>${formatDate(item.tuNgay)} ➝ ${formatDate(item.denNgay)}</td>
                <td>${item.lyDo}</td>
                <td style="white-space:nowrap">${renderActions(item)}</td>
            </tr>
        `).join('');
    }
}

window.prepareEdit = function(type, item) {
    if (type === 'tamvang') {
        document.getElementById('modal-title-tv').textContent = 'Cập nhật Tạm vắng';
        document.getElementById('tv-row-id').value = item.rowId; // ID bản ghi
        document.getElementById('tv-id').value = item.idNhanKhau;
        document.getElementById('tv-noiden').value = item.noiDen;
        document.getElementById('tv-tungay').value = item.tuNgay ? item.tuNgay.split('T')[0] : '';
        document.getElementById('tv-denngay').value = item.denNgay ? item.denNgay.split('T')[0] : '';
        document.getElementById('tv-lydo').value = item.lyDo;
        // Mở modal
        openModal('modal-tamvang');
    } else {
        document.getElementById('modal-title-tt').textContent = 'Cập nhật Tạm trú';
        document.getElementById('tt-row-id').value = item.rowId; // ID bản ghi
        document.getElementById('tt-manhankhau').value = item.idNhanKhau;
        document.getElementById('tt-diachi').value = item.diaChi;
        document.getElementById('tt-tungay').value = item.tuNgay ? item.tuNgay.split('T')[0] : '';
        document.getElementById('tt-denngay').value = item.denNgay ? item.denNgay.split('T')[0] : '';
        document.getElementById('tt-lydo').value = item.lyDo;
        // Mở modal
        openModal('modal-tamtru');
    }
}

window.resetForm = function(type) {
    if (type === 'tamvang') {
        document.getElementById('form-tamvang').reset();
        document.getElementById('tv-row-id').value = ''; // Xóa ID
        document.getElementById('modal-title-tv').textContent = 'Khai báo Tạm vắng';
        openModal('modal-tamvang');
    } else {
        document.getElementById('form-tamtru').reset();
        document.getElementById('tt-row-id').value = ''; // Xóa ID
        document.getElementById('modal-title-tt').textContent = 'Đăng ký Tạm trú';
        openModal('modal-tamtru');
    }
}

// ==========================================
// 3. SEND DATA (POST API)
// ==========================================
function setupForms() {
    // Form Tạm Vắng
    document.getElementById('form-tamvang').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            rowId: document.getElementById('tv-row-id').value, // Lấy ID nếu có
            manhankhau: document.getElementById('tv-id').value,
            noiden: document.getElementById('tv-noiden').value,
            tungay: document.getElementById('tv-tungay').value,
            denngay: document.getElementById('tv-denngay').value,
            lydo: document.getElementById('tv-lydo').value
        };
        await handleSave('tamvang', payload, 'modal-tamvang');
    });

    // Form Tạm Trú
    document.getElementById('form-tamtru').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            rowId: document.getElementById('tt-row-id').value, // Lấy ID nếu có
            manhankhau: document.getElementById('tt-manhankhau').value,
            diachi: document.getElementById('tt-diachi').value,
            tungay: document.getElementById('tt-tungay').value,
            denngay: document.getElementById('tt-denngay').value,
            lydo: document.getElementById('tt-lydo').value
        };
        await handleSave('tamtru', payload, 'modal-tamtru');
    });
}

async function handleSave(type, data, modalId) {
    // Kiểm tra xem có ID bản ghi không -> Có thì là Sửa (PUT), Không thì là Thêm (POST)
    let method = 'POST';
    let url = `${API_BASE}/${type}`;

    if (data.rowId) {
        method = 'PUT';
        url = `${API_BASE}/${type}/${data.rowId}`;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (response.ok && json.success) {
            alert('✅ ' + json.message);
            closeModal(modalId);
            loadData(type);
        } else {
            alert('❌ Thất bại: ' + (json.message || 'Lỗi không xác định'));
        }
    } catch (error) {
        console.error("Lỗi gửi dữ liệu:", error);
        alert('❌ Lỗi kết nối đến Server');
    }
}

// --- Search Filter Client Side (Tìm trên dữ liệu đã tải về) ---
window.handleSearch = function(type) {
    const inputId = type === 'tamvang' ? 'search-tv' : 'search-tt';
    const query = document.getElementById(inputId).value.toLowerCase();
    
    const rows = document.querySelectorAll(`#tbody-${type} tr`);
    rows.forEach(row => {
        // Lấy nội dung text của cả hàng (bao gồm ID, Tên, CCCD...)
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}


// ==========================================
// 4. TIỆN ÍCH (Print, Modal, Utils)
// ==========================================
window.printPaper = function(type, data) {
    const title = type === 'tamvang' ? 'GIẤY KHAI BÁO TẠM VẮNG' : 'GIẤY KHAI BÁO TẠM TRÚ';
    const w = window.open('', '', 'height=600,width=800');
    
    w.document.write(`
        <html><head><title>In Giấy Xác Nhận</title>
        <style>
            body { font-family: "Times New Roman", serif; padding: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            h2 { text-transform: uppercase; margin: 10px 0; }
            .footer { margin-top: 50px; text-align: right; }
        </style>
        </head><body>
        <div class="header">
            <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>Độc lập - Tự do - Hạnh phúc</p>
            <hr style="width: 200px;">
            <h2>${title}</h2>
        </div>
        <div>
            <p>Kính gửi: Công an Phường La Khê</p>
            <p>Họ tên: <strong>${data.hoTen}</strong></p>
            <p>Nơi cư trú: ${type === 'tamvang' ? data.noiDen : data.diaChi}</p>
            <p>Thời gian: Từ ${formatDate(data.tuNgay)} đến ${formatDate(data.denNgay)}</p>
            <p>Lý do: ${data.lyDo}</p>
        </div>
        <div class="footer">
            <p><em>Ngày......tháng......năm......</em></p>
            <p><strong>Người khai báo</strong></p>
        </div>
        </body></html>
    `);
    
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
}

// Helpers
function formatDate(str) { 
    if(!str) return ''; 
    const d = new Date(str); 
    if(isNaN(d.getTime())) return str;
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; 
}

window.openModal = function(id) { 
    document.getElementById(id).classList.remove('hidden'); 
    document.getElementById(id).classList.add('show'); 
}
window.closeModal = function(id) { 
    document.getElementById(id).classList.add('hidden'); 
    document.getElementById(id).classList.remove('show'); 
}
window.onclick = function(e) { 
    if(e.target.classList.contains('modal-overlay')) { 
        e.target.classList.add('hidden'); 
        e.target.classList.remove('show'); 
    }
}