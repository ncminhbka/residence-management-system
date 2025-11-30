// assets/js/residencechanges.js

// ==========================================
// 1. MOCK DATA (DỮ LIỆU GIẢ LẬP)
// ==========================================
const MOCK_TAM_VANG = [
    { id: 1, idNhanKhau: 101, hoTen: 'Nguyễn Văn A', noiDen: 'Quận 1, TP.HCM', tuNgay: '2023-11-01', denNgay: '2023-12-01', lyDo: 'Đi công tác dài ngày' },
    { id: 2, idNhanKhau: 105, hoTen: 'Trần Thị Mai', noiDen: 'Đà Nẵng', tuNgay: '2023-10-15', denNgay: '2023-11-15', lyDo: 'Thăm người thân ốm' },
    { id: 3, idNhanKhau: 202, hoTen: 'Phạm Văn Hùng', noiDen: 'Nhật Bản', tuNgay: '2024-01-01', denNgay: '2024-12-31', lyDo: 'Xuất khẩu lao động' }
];

const MOCK_TAM_TRU = [
    { id: 1, hoTen: 'Lê Văn Khách', ngaysinh: '1999-05-20', cccd: '038099000111', diaChi: 'Số 10, Ngõ 5, Tổ 7', tuNgay: '2024-01-01', denNgay: '2024-06-01', lyDo: 'Sinh viên thuê trọ' },
    { id: 2, hoTen: 'Hoàng Thị Bích', ngaysinh: '1995-08-12', cccd: '001095000222', diaChi: 'Số 15A, Đường Chiến Thắng', tuNgay: '2023-12-01', denNgay: '2024-03-01', lyDo: 'Làm việc thời vụ' }
];

// ==========================================
// 2. GIẢ LẬP API (MOCKING API CALLS)
// ==========================================
function mockApiCall(type, method, data = null) {
    return new Promise((resolve) => {
        // Giả lập độ trễ mạng 500ms
        setTimeout(() => {
            console.log(`[MOCK API] ${method} /api/${type}`, data);

            if (method === 'GET') {
                if (type === 'tamvang') resolve({ success: true, data: [...MOCK_TAM_VANG] });
                else if (type === 'tamtru') resolve({ success: true, data: [...MOCK_TAM_TRU] });
            } 
            else if (method === 'POST') {
                // Giả lập lưu dữ liệu mới vào mảng
                const newItem = { 
                    ...data, 
                    id: Date.now(),
                    // Nếu là tạm vắng, giả lập việc Backend tự tìm tên từ ID nhân khẩu
                    hoTen: type === 'tamvang' ? `Cư dân (Mã ${data.idNhanKhau})` : data.hoTen 
                };
                
                if (type === 'tamvang') MOCK_TAM_VANG.unshift(newItem);
                else MOCK_TAM_TRU.unshift(newItem);

                resolve({ success: true, message: 'Lưu dữ liệu thành công! (Mock)' });
            }
        }, 500); 
    });
}

// ==========================================
// 3. LOGIC CHÍNH CỦA TRANG
// ==========================================
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

// --- Load Data ---
async function loadData(type) {
    const tbody = document.getElementById(`tbody-${type}`);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">⏳ Đang tải dữ liệu...</td></tr>';

    const res = await mockApiCall(type, 'GET');
    
    if (res.success) {
        renderTable(type, res.data);
    }
}

// --- Render Table ---
function renderTable(type, data) {
    const tbody = document.getElementById(`tbody-${type}`);
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Chưa có dữ liệu</td></tr>';
        return;
    }

    if (type === 'tamvang') {
        tbody.innerHTML = data.map(item => `
            <tr>
                <td><span style="background:#eee; padding:2px 6px; border-radius:4px; font-weight:bold;">${item.idNhanKhau}</span></td>
                <td><strong>${item.hoTen}</strong></td>
                <td>${item.noiDen}</td>
                <td>
                    ${formatDate(item.tuNgay)} <span style="color:#999">➝</span> ${formatDate(item.denNgay)}
                </td>
                <td>${item.lyDo}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick='printPaper("tamvang", ${JSON.stringify(item)})'>🖨️ In giấy</button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = data.map(item => `
            <tr>
                <td><strong>${item.hoTen}</strong><br><small style="color:#666">${item.ngaysinh}</small></td>
                <td>${item.cccd}</td>
                <td>${item.diaChi}</td>
                <td>
                    ${formatDate(item.tuNgay)} <br> <span style="color:#999">đến</span> ${formatDate(item.denNgay)}
                </td>
                <td><span class="badge badge-success">Đang hiệu lực</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick='printPaper("tamtru", ${JSON.stringify(item)})'>🖨️ In giấy</button>
                </td>
            </tr>
        `).join('');
    }
}

// --- Form Handling ---
function setupForms() {
    // Xử lý Form Tạm Vắng
    document.getElementById('form-tamvang').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            idNhanKhau: document.getElementById('tv-id').value,
            noiden: document.getElementById('tv-noiden').value,
            tuNgay: document.getElementById('tv-tungay').value,
            denNgay: document.getElementById('tv-denngay').value,
            lyDo: document.getElementById('tv-lydo').value
        };
        await handleSave('tamvang', data, 'modal-tamvang');
    });

    // Xử lý Form Tạm Trú
    document.getElementById('form-tamtru').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            hoTen: document.getElementById('tt-hoten').value,
            ngaysinh: document.getElementById('tt-ngaysinh').value,
            cccd: document.getElementById('tt-cccd').value,
            gioiTinh: document.getElementById('tt-gioitinh').value,
            queQuan: document.getElementById('tt-quequan').value,
            diaChi: document.getElementById('tt-diachi').value,
            tuNgay: document.getElementById('tt-tungay').value,
            denNgay: document.getElementById('tt-denngay').value,
            lyDo: document.getElementById('tt-lydo').value
        };
        await handleSave('tamtru', data, 'modal-tamtru');
    });
}

async function handleSave(type, data, modalId) {
    const res = await mockApiCall(type, 'POST', data);
    if (res.success) {
        alert('✅ ' + res.message);
        closeModal(modalId);
        loadData(type); // Reload bảng
        
        if (confirm('Bạn có muốn in giấy xác nhận ngay không?')) {
            printPaper(type, { ...data, hoTen: data.hoTen || `Người dân (ID: ${data.idNhanKhau})` });
        }
    }
}

// --- Search Filter (Client Side) ---
window.handleSearch = function(type) {
    const inputId = type === 'tamvang' ? 'search-tv' : 'search-tt';
    const query = document.getElementById(inputId).value.toLowerCase();
    
    // Chọn nguồn dữ liệu
    const sourceData = type === 'tamvang' ? MOCK_TAM_VANG : MOCK_TAM_TRU;

    // Lọc
    const filtered = sourceData.filter(item => {
        return (item.hoTen && item.hoTen.toLowerCase().includes(query)) ||
               (item.cccd && item.cccd.includes(query)) ||
               (item.idNhanKhau && item.idNhanKhau.toString().includes(query));
    });

    renderTable(type, filtered);
}

// ==========================================
// 4. TIỆN ÍCH (Print, Modal, Utils)
// ==========================================
window.printPaper = function(type, data) {
    const title = type === 'tamvang' ? 'GIẤY KHAI BÁO TẠM VẮNG' : 'GIẤY KHAI BÁO TẠM TRÚ';
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>In Giấy Xác Nhận</title>');
    printWindow.document.write(`
        <style>
            body { font-family: "Times New Roman", serif; padding: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            h2 { text-transform: uppercase; margin: 10px 0; }
            .content p { margin: 10px 0; font-size: 14pt; }
            .footer { margin-top: 50px; text-align: right; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    
    printWindow.document.write(`
        <div class="header">
            <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>Độc lập - Tự do - Hạnh phúc</p>
            <hr style="width: 200px;">
            <h2>${title}</h2>
        </div>
        <div class="content">
            <p>Kính gửi: Công an Phường La Khê</p>
    `);

    if (type === 'tamvang') {
        printWindow.document.write(`
            <p>Tôi tên là: (Chủ hộ/Người khai báo)............................</p>
            <p>Xin khai báo tạm vắng cho nhân khẩu: <strong>${data.hoTen}</strong> (Mã: ${data.idNhanKhau})</p>
            <p>Nơi đến tạm trú: <strong>${data.noiDen || data.noiden}</strong></p>
            <p>Thời gian: Từ ${formatDate(data.tuNgay)} đến ${formatDate(data.denNgay)}</p>
            <p>Lý do: ${data.lyDo}</p>
        `);
    } else {
        printWindow.document.write(`
            <p>Họ tên người đăng ký: <strong>${data.hoTen}</strong></p>
            <p>Ngày sinh: ${formatDate(data.ngaysinh)} - CCCD: ${data.cccd}</p>
            <p>Quê quán: ${data.queQuan || '....................'}</p>
            <p>Nay xin đăng ký tạm trú tại: <strong>${data.diaChi}</strong></p>
            <p>Thời gian: Từ ${formatDate(data.tuNgay)} đến ${formatDate(data.denNgay)}</p>
            <p>Lý do: ${data.lyDo}</p>
        `);
    }

    printWindow.document.write(`
        </div>
        <div class="footer">
            <p><em>Hà Nội, ngày......tháng......năm......</em></p>
            <p><strong>Người khai báo</strong><br>(Ký và ghi rõ họ tên)</p>
        </div>
    </body></html>`);
    
    printWindow.document.close();
    // setTimeout để đảm bảo nội dung load xong mới in
    setTimeout(() => { printWindow.print(); }, 500);
}

// Helpers
function formatDate(str) { 
    if(!str) return ''; 
    const d = new Date(str); 
    if(isNaN(d.getTime())) return str; // Nếu không phải ngày thì trả về nguyên gốc
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

// Đóng modal khi click ra ngoài
window.onclick = function(e) { 
    if(e.target.classList.contains('modal-overlay')) { 
        e.target.classList.add('hidden'); 
        e.target.classList.remove('show'); 
    }
}