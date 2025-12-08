// frontend/assets/js/facilities.js
const API_URL = 'http://localhost:3000/api/v1/facilities';

document.addEventListener('DOMContentLoaded', () => {
    loadAssets();
    loadEvents();
    setupForms();
});

// --- LOGIC TÀI SẢN ---
async function loadAssets() {
    const res = await fetch(`${API_URL}/assets`);
    const json = await res.json();
    const tbody = document.getElementById('tbody-assets');
    
    tbody.innerHTML = json.data.map(item => `
        <tr>
            <td>${item.MATAISAN}</td>
            <td><strong>${item.TENTAISAN}</strong></td>
            <td>${item.DON_VI_TINH}</td>
            <td style="color:green; font-weight:bold">${item.SOLUONG_TOT}</td>
            <td style="color:red">${item.SOLUONG_HONG}</td>
            <td>${item.SOLUONG_TOT + item.SOLUONG_HONG}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick='editAsset(${JSON.stringify(item)})'>Sửa</button>
                <button class="btn btn-sm btn-danger" onclick="deleteAsset(${item.MATAISAN})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

async function editAsset(item) {
    document.getElementById('asset-id').value = item.MATAISAN;
    document.getElementById('asset-name').value = item.TENTAISAN;
    document.getElementById('asset-unit').value = item.DON_VI_TINH;
    document.getElementById('asset-good').value = item.SOLUONG_TOT;
    document.getElementById('asset-bad').value = item.SOLUONG_HONG;
    openModal('modal-asset');
}

async function deleteAsset(id) {
    if(!confirm('Xóa tài sản này?')) return;
    await fetch(`${API_URL}/assets/${id}`, { method: 'DELETE' });
    loadAssets();
}

// --- LOGIC SỰ KIỆN ---
async function loadEvents() {
    const res = await fetch(`${API_URL}/events`);
    const json = await res.json();
    const tbody = document.getElementById('tbody-events');

    tbody.innerHTML = json.data.map(evt => {
        let badgeClass = 'badge-pending';
        let statusText = 'Chờ duyệt';
        let actions = '';

        if(evt.TRANGTHAI_DUYET === 'DaDuyet') {
            badgeClass = 'badge-approved'; statusText = 'Đã duyệt';
        } else if(evt.TRANGTHAI_DUYET === 'TuChoi') {
            badgeClass = 'badge-rejected'; statusText = 'Từ chối';
        }

        // Logic nút duyệt (Chỉ hiện nếu đang chờ)
        if(evt.TRANGTHAI_DUYET === 'ChoDuyet') {
            actions = `
                <button class="btn btn-sm btn-success" onclick="approveEvent(${evt.MASUKIEN}, 'DaDuyet')">✔ Duyệt</button>
                <button class="btn btn-sm btn-danger" onclick="approveEvent(${evt.MASUKIEN}, 'TuChoi')">✖ Từ chối</button>
            `;
        }

        return `
        <tr>
            <td><strong>${evt.TENSUKIEN}</strong><br><small>${evt.MO_TA || ''}</small></td>
            <td>
                Bắt đầu: ${formatDateTime(evt.NGAYBATDAU)}<br>
                Kết thúc: ${formatDateTime(evt.NGAYKETTHUC)}
            </td>
            <td>${evt.LOAISUKIEN}</td>
            <td><span class="${badgeClass}">${statusText}</span></td>
            <td>${Number(evt.PHI_SU_DUNG).toLocaleString()} đ</td>
            <td>${actions}</td>
        </tr>
    `}).join('');
}

async function approveEvent(id, status) {
    let fee = 0;
    if(status === 'DaDuyet') {
        const feeInput = prompt("Nhập số tiền thu phí (VNĐ) nếu có:", "0");
        if(feeInput === null) return;
        fee = parseInt(feeInput) || 0;
    }

    const res = await fetch(`${API_URL}/events/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, phi: fee })
    });
    
    if(res.ok) { alert('Thao tác thành công'); loadEvents(); }
    else alert('Lỗi xảy ra');
}

// --- XỬ LÝ FORM ---
function setupForms() {
    // Form Tài sản
    document.getElementById('form-asset').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('asset-id').value;
        const data = {
            ten: document.getElementById('asset-name').value,
            donvi: document.getElementById('asset-unit').value,
            slTot: document.getElementById('asset-good').value,
            slHong: document.getElementById('asset-bad').value,
            giatri: 0 // Mock giá trị
        };
        
        const url = id ? `${API_URL}/assets/${id}` : `${API_URL}/assets`;
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method, headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        closeModal('modal-asset');
        loadAssets();
    });

    // Form Sự kiện
    document.getElementById('form-event').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            loai: document.getElementById('evt-type').value,
            ten: document.getElementById('evt-name').value,
            start: document.getElementById('evt-start').value,
            end: document.getElementById('evt-end').value,
            phi: document.getElementById('evt-fee').value,
            mota: document.getElementById('evt-desc').value,
            nguoitao: 1 // Mock user ID (sau này lấy từ localStorage)
        };

        const res = await fetch(`${API_URL}/events`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const json = await res.json();
        
        if(json.success) {
            alert(json.message);
            closeModal('modal-event');
            loadEvents();
        } else {
            alert(json.message);
        }
    });
}

// --- UTILS ---
window.toggleFeeInput = function() {
    const type = document.getElementById('evt-type').value;
    const feeDiv = document.getElementById('div-fee');
    if(type === 'VanHoaGiaiTri') {
        feeDiv.classList.remove('hidden');
    } else {
        feeDiv.classList.add('hidden');
        document.getElementById('evt-fee').value = 0;
    }
}

function formatDateTime(str) {
    if(!str) return '';
    const d = new Date(str);
    return d.toLocaleString('vi-VN');
}

// Tabs & Modals
window.switchTab = function(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
    document.querySelector(`button[onclick="switchTab('${id}')"]`).classList.add('active');
}
window.openModal = (id) => { 
    document.getElementById(id).classList.remove('hidden'); 
    document.getElementById(id).classList.add('show');
    if(id === 'modal-asset') document.getElementById('form-asset').reset(); 
    if(id === 'modal-event') document.getElementById('form-event').reset(); 
};
window.closeModal = (id) => { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('show'); };
window.openAssetModal = () => openModal('modal-asset');
window.openEventModal = () => openModal('modal-event');