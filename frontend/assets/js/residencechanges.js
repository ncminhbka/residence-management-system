// frontend/assets/js/residencechanges.js

// 1. CẤU HÌNH API
const API_BASE = 'http://localhost:3000/api/v1/residencechanges'; 
// Lưu ý: Đổi cổng 3000 nếu backend bạn chạy cổng khác

document.addEventListener('DOMContentLoaded', () => {
    loadData('tamvang');
    loadData('tamtru');
    setupForms();
});

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
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">⏳ Đang tải dữ liệu từ Server...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/${type}`);
        const json = await response.json();

        if (json.success) {
            // Chuyển đổi dữ liệu từ SQL (chữ hoa) sang Format Frontend (chữ thường)
            const mappedData = json.data.map(item => mapDataFromDB(type, item));
            renderTable(type, mappedData);
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">❌ ${json.message}</td></tr>`;
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">❌ Lỗi kết nối Server (Kiểm tra xem Backend đã chạy chưa)</td></tr>`;
    }
}

// Hàm chuyển đổi tên cột Database -> Tên biến Frontend dùng
function mapDataFromDB(type, dbItem) {
    if (type === 'tamvang') {
        return {
            idNhanKhau: dbItem.MANHANKHAU, 
            hoTen: dbItem.HOTEN,
            noiDen: dbItem.NOITAMTRU, // Database: NOITAMTRU -> Frontend: noiDen
            tuNgay: dbItem.NGAYBATDAU,
            denNgay: dbItem.NGAYKETTHUC,
            lyDo: dbItem.LYDO
        };
    } else {
        return {
            hoTen: dbItem.HOTEN,
            ngaysinh: dbItem.NGAYSINH,
            cccd: dbItem.CCCD, // Lấy từ bảng NHAN_KHAU join sang
            diaChi: dbItem.DIACHITAMTRU,
            tuNgay: dbItem.NGAYBATDAU,
            denNgay: dbItem.NGAYKETTHUC,
            lyDo: dbItem.GHICHU // Database: GHICHU -> Frontend: lyDo
        };
    }
}

// --- Render Table ---
function renderTable(type, data) {
    const tbody = document.getElementById(`tbody-${type}`);
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Chưa có dữ liệu</td></tr>';
        return;
    }

    if (type === 'tamvang') {
        tbody.innerHTML = data.map(item => `
            <tr>
                <td><span style="background:#eee; padding:2px 6px; border-radius:4px; font-weight:bold;">${item.idNhanKhau}</span></td>
                <td><strong>${item.hoTen}</strong></td>
                <td>${item.noiDen}</td>
                <td>${formatDate(item.tuNgay)} <span style="color:#999">➝</span> ${formatDate(item.denNgay)}</td>
                <td>${item.lyDo}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick='printPaper("tamvang", ${JSON.stringify(item)})'>🖨️ In giấy</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = data.map(item => `
            <tr>
                <td><strong>${item.hoTen}</strong><br><small style="color:#666">${formatDate(item.ngaysinh)}</small></td>
                <td>${item.cccd || 'Chưa có'}</td>
                <td>${item.diaChi}</td>
                <td>${formatDate(item.tuNgay)} <br> <span style="color:#999">đến</span> ${formatDate(item.denNgay)}</td>
                <td><span class="badge badge-success">Đang hiệu lực</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick='printPaper("tamtru", ${JSON.stringify(item)})'>🖨️ In giấy</button>
                </td>
            </tr>
        `).join('');
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
            manhankhau: document.getElementById('tt-manhankhau').value, // DB yêu cầu Mã Nhân Khẩu
            diachi: document.getElementById('tt-diachi').value,
            tungay: document.getElementById('tt-tungay').value,
            denngay: document.getElementById('tt-denngay').value,
            lydo: document.getElementById('tt-lydo').value
        };
        await handleSave('tamtru', payload, 'modal-tamtru');
    });
}

async function handleSave(type, data, modalId) {
    try {
        const response = await fetch(`${API_BASE}/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const json = await response.json();

        if (response.ok && json.success) {
            alert('✅ ' + json.message);
            closeModal(modalId);
            loadData(type); // Tải lại bảng để thấy dữ liệu mới
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
    
    // Lưu ý: Đây là tìm kiếm tạm thời trên giao diện. 
    // Nếu dữ liệu lớn, bạn nên viết thêm API search ở Backend.
    const rows = document.querySelectorAll(`#tbody-${type} tr`);
    rows.forEach(row => {
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