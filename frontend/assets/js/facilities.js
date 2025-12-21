// frontend/assets/js/facilities.js
const API_URL = 'http://localhost:3000/api/v1/facilities';

let allEvents = []; // Store all events for filtering
let allAssets = []; // Store all assets for filtering

const currentUserRole = localStorage.getItem("userRole"); 
const isCanBo = currentUserRole === "CAN_BO_NGHIEP_VU";
const isLanhDao = ["TO_TRUONG", "TO_PHO"].includes(currentUserRole);

document.addEventListener('DOMContentLoaded', () => {
    setupRoleUI();
    loadAssets();
    loadEvents();
    setupForms();
    setupAssetSearch();
    setupEventSearch();
});

// --- HÀM MỚI: XỬ LÝ ẨN HIỆN NÚT CHỨC NĂNG ---
function setupRoleUI() {
    const btnAddAsset = document.getElementById('btnAddAsset');
    const btnAddEvent = document.getElementById('btnAddEvent');

    // Chỉ CÁN BỘ NGHIỆP VỤ mới thấy nút Thêm/Đăng ký
    if (isCanBo) {
        if(btnAddAsset) btnAddAsset.style.display = 'inline-flex';
        if(btnAddEvent) btnAddEvent.style.display = 'inline-flex';
    } else {
        // Tổ trưởng/Tổ phó hoặc người khác thì ẩn
        if(btnAddAsset) btnAddAsset.style.display = 'none';
        if(btnAddEvent) btnAddEvent.style.display = 'none';
    }
}

// --- LOGIC TÀI SẢN ---
async function loadAssets() {
    const res = await fetch(`${API_URL}/assets`);
    const json = await res.json();
    allAssets = json.data || [];
    displayAssets(allAssets);
}

// --- Hàm hiển thị danh sách tài sản ---
function displayAssets(assets) {
    const tbody = document.getElementById('tbody-assets');
    
    tbody.innerHTML = assets.map(item => `
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
    allEvents = json.data || [];
    displayEvents(allEvents);
}

// --- Hàm hiển thị danh sách sự kiện ---
function displayEvents(events) {
    const tbody = document.getElementById('tbody-events');
    
    tbody.innerHTML = events.map(evt => {
        let badgeClass = 'badge-pending';
        let statusText = 'Đang chờ duyệt'; // Sửa text mặc định cho khớp yêu cầu
        let actions = '';

        if(evt.TRANGTHAI_DUYET === 'DaDuyet') {
            badgeClass = 'badge-approved'; 
            statusText = '<i class="fas fa-check-circle"></i>Đã duyệt';
        } else if(evt.TRANGTHAI_DUYET === 'TuChoi') {
            badgeClass = 'badge-rejected'; 
            statusText = '<i class="fas fa-check-circle"></i>Từ chối';
        } else {
             // Status mặc định là ChoDuyet
             badgeClass = 'badge-pending'; statusText = 'Đang chờ duyệt';
        }

        // --- PHÂN QUYỀN NÚT DUYỆT ---
        // Chỉ hiện nút Duyệt/Từ chối nếu là TỔ TRƯỞNG/TỔ PHÓ và trạng thái là Chờ duyệt
        if(evt.TRANGTHAI_DUYET === 'ChoDuyet' && isLanhDao) {
            actions = `
                <button class="btn btn-sm btn-success" onclick="approveEvent(${evt.MASUKIEN}, 'DaDuyet')">✔ Duyệt</button>
                <button class="btn btn-sm btn-danger" onclick="approveEvent(${evt.MASUKIEN}, 'TuChoi')">✖ Từ chối</button>
            `;
        }
        // Cán bộ nghiệp vụ sẽ không thấy biến actions này (vì isLanhDao = false)

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
    const event = allEvents.find(e => e.MASUKIEN === id);
    const currentFee = event ? event.PHI_SU_DUNG : 0; 

    // 2. Gửi request kèm theo phí cũ (currentFee)
    const res = await fetch(`${API_URL}/events/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, phi: currentFee }) 
    });
    
    if(res.ok) { 
        loadEvents(); 
    } else {
        alert('Lỗi xảy ra khi duyệt sự kiện');
    }
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

// --- SETUP EVENT SEARCH ---
function setupEventSearch() {
    const searchInput = document.getElementById('eventSearchInput');
    const typeFilter = document.getElementById('eventTypeFilter');

    if (!searchInput || !typeFilter) {
        console.warn('⚠️ Không tìm thấy các phần tử tìm kiếm sự kiện');
        return;
    }

    function filterEvents() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const typeValue = typeFilter.value;

        const filtered = allEvents.filter(evt => {
            const matchesSearch =
                evt.TENSUKIEN.toLowerCase().includes(searchTerm) ||
                (evt.MO_TA && evt.MO_TA.toLowerCase().includes(searchTerm));

            const matchesType =
                typeValue === "" || evt.LOAISUKIEN === typeValue;

            return matchesSearch && matchesType;
        });

        displayEvents(filtered);
    }

    searchInput.addEventListener('input', filterEvents);
    typeFilter.addEventListener('change', filterEvents);
}

// --- SETUP ASSET SEARCH ---
function setupAssetSearch() {
    const searchInput = document.getElementById('assetSearchInput');

    if (!searchInput) {
        console.warn('⚠️ Không tìm thấy phần tử tìm kiếm tài sản');
        return;
    }

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        const filtered = allAssets.filter(asset => {
            return asset.TENTAISAN.toLowerCase().includes(searchTerm) ||
                   asset.MATAISAN.toString().includes(searchTerm);
        });

        displayAssets(filtered);
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
    // Only reset form if creating new (asset-id is empty)
    if(id === 'modal-asset' && !document.getElementById('asset-id').value) {
        document.getElementById('form-asset').reset();
    }
    if(id === 'modal-event') document.getElementById('form-event').reset(); 
};
window.closeModal = (id) => { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('show'); };
window.openAssetModal = () => {
    document.getElementById('asset-id').value = ''; // Clear ID for new asset
    openModal('modal-asset');
};
window.openEventModal = () => openModal('modal-event');