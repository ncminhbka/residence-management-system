// Cấu hình API
const API_URL = '/api/v1/residents';
let currentResidents = [];
let isEditMode = false;

// [CẤU HÌNH PHÂN TRANG]
let currentPage = 1;
const itemsPerPage = 10;

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadResidents();
    setupSearchListener();
    setupModalListeners();
    setupFormListener();
    setupStatusChangeListener();
});

// === 1. LOGIC RENDER & PHÂN TRANG ===
function renderResidents(residents) {
    const tbody = document.getElementById('residents-table-body');
    const paginationContainer = document.getElementById('pagination-controls');

    if (!tbody) return;

    if (!residents || residents.length === 0) {
        showEmptyDataState();
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = residents.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedItems
        .map(resident => {
            const isInactive = resident.TRANGTHAI === 'ChuyenDi' || resident.TRANGTHAI === 'DaQuaDoi';
            const rowClass = isInactive ? 'row-dimmed' : '';

            let statusNote = '';
            if (resident.TRANGTHAI === 'ChuyenDi') statusNote = '(Đã chuyển)';
            if (resident.TRANGTHAI === 'DaQuaDoi') statusNote = '(Đã mất)';

            return `
            <tr class="${rowClass}">
                <td>${resident.MANHANKHAU || '-'}</td>
                <td>
                    <strong>${resident.HOTEN || '-'}</strong>
                    ${statusNote ? `<span style="font-size: 11px; color: #dc3545; margin-left: 5px;">${statusNote}</span>` : ''}
                </td>
                <td>${resident.NGAYSINH ? formatDate(resident.NGAYSINH) : '-'}</td>
                <td>${resident.CCCD || '<span class="text-muted">Chưa có</span>'}</td> 
                <td>${resident.DIACHI_HK || resident.NOITHUONGTRUCU || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="viewDetails(${resident.MANHANKHAU})">Xem</button>
                        <button class="btn btn-sm btn-success" onclick="editResident(${resident.MANHANKHAU})">Sửa</button>
                    </div>
                </td>
            </tr>`
        })
        .join('');

    renderPaginationControls(residents.length);
}

function renderPaginationControls(totalItems) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Trước</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Sau</button>`;
    paginationContainer.innerHTML = html;
}

window.changePage = function (page) {
    if (page < 1) return;
    currentPage = page;
    renderResidents(currentResidents);
};

// === 2. LOGIC FORM & MODAL ===
function setupStatusChangeListener() {
    const statusSelect = document.getElementById('trangthai');
    const moveSection = document.getElementById('move-info-section');
    const divNoiChuyen = document.getElementById('div-noichuyen');
    const inputGhiChu = document.getElementById('ghichu');

    if (statusSelect && moveSection) {
        statusSelect.addEventListener('change', (e) => {
            const status = e.target.value;
            moveSection.style.display = 'none';
            divNoiChuyen.style.display = 'flex';

            if (status === 'ChuyenDi') {
                moveSection.style.display = 'block';
                if (inputGhiChu.value === 'Đã qua đời') inputGhiChu.value = '';
            }
            else if (status === 'DaQuaDoi') {
                moveSection.style.display = 'block';
                divNoiChuyen.style.display = 'none';
                inputGhiChu.value = 'Đã qua đời';
            }
        });
    }
}

function showResidentDetails(resident) {
    const fields = {
        'detail-manhankhau': resident.MANHANKHAU,
        'detail-sohokhau': resident.SOHOKHAU,
        'detail-hoten': resident.HOTEN,
        'detail-bidanh': resident.BIDANH,
        'detail-ngaysinh': formatDate(resident.NGAYSINH),
        'detail-gioitinh': resident.GIOITINH,
        'detail-noisinh': resident.NOISINH,
        'detail-nguyenquan': resident.NGUYENQUAN,
        'detail-dantoc': resident.DANTOC,
        'detail-quoctich': resident.QUOCTICH,
        'detail-cccd': resident.CCCD,
        'detail-noilamviec': resident.NOILAMVIEC,
        'detail-nghenghiep': resident.NGHENGHIEP,
        'detail-ngaycap': formatDate(resident.NGAYCAP_CCCD),
        'detail-noicap': resident.NOICAP_CCCD,
        'detail-quanhechuho': resident.QUANHECHUHO,
        'detail-trangthai': resident.TRANGTHAI,
        'detail-noithuongtrucu': resident.NOITHUONGTRUCU,

        'detail-ngaychuyendi': resident.NGAYCHUYENDI ? formatDate(resident.NGAYCHUYENDI) : '-',
        'detail-noichuyen': resident.NOICHUYEN || '-',
        'detail-ghichu': resident.GHICHU || '-'
    };

    Object.keys(fields).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.textContent = fields[fieldId] || '-';
    });

    // [CẬP NHẬT] Logic hiển thị thông minh cho Modal Xem
    const moveSection = document.getElementById('detail-move-section');
    const divDetailNoiChuyen = document.getElementById('detail-noichuyen') ? document.getElementById('detail-noichuyen').parentElement : null;

    if (moveSection) {
        const isMoved = resident.TRANGTHAI === 'ChuyenDi';
        const isDeceased = resident.TRANGTHAI === 'DaQuaDoi';

        if (isMoved || isDeceased) {
            moveSection.style.display = 'block';

            // Nếu đã qua đời -> Ẩn dòng "Nơi chuyển đến"
            if (isDeceased && divDetailNoiChuyen) {
                divDetailNoiChuyen.style.display = 'none';
            } else if (divDetailNoiChuyen) {
                divDetailNoiChuyen.style.display = 'flex'; // Hiện lại nếu là Chuyển đi
            }
        } else {
            moveSection.style.display = 'none';
        }
    }

    document.getElementById('resident-detail-modal').classList.add('show');
}

// --- 3. HÀM HỖ TRỢ (Load, Search, Save...) ---
function setupSearchListener() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-search-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput?.value?.trim() || '';
            currentPage = 1;
            if (query) searchResidents(query);
            else loadResidents();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentPage = 1;
            loadResidents();
        });
    }
}

function setupModalListeners() {
    const addBtn = document.getElementById('add-resident-btn');
    if (addBtn) addBtn.addEventListener('click', openAddModal);
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) document.getElementById(modalId)?.classList.remove('show');
        });
    });
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', executeDelete);
}

function setupFormListener() {
    const form = document.getElementById('resident-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveResident();
        });
    }
}

function getAuthToken() { return localStorage.getItem('token'); }

function showLoadingState() {
    const tbody = document.getElementById('residents-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Đang tải dữ liệu...</td></tr>';
}

function showEmptyDataState() {
    const tbody = document.getElementById('residents-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Không tìm thấy nhân khẩu nào.</td></tr>';
}

async function loadResidents() {
    showLoadingState();
    try {
        const token = getAuthToken();
        const response = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.success) {
            currentResidents = data.data;
            renderResidents(currentResidents);
        } else {
            showNotification('Lỗi khi tải dữ liệu', 'error');
            showEmptyDataState();
        }
    } catch (error) { console.error('Load error:', error); showEmptyDataState(); }
}

async function searchResidents(query) {
    showLoadingState();
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.success) {
            currentResidents = data.data;
            renderResidents(currentResidents);
        } else { showEmptyDataState(); }
    } catch (error) { console.error('Search error:', error); showEmptyDataState(); }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function openAddModal() {
    isEditMode = false;
    document.getElementById('modal-title').textContent = 'Thêm nhân khẩu mới';
    document.getElementById('resident-form').reset();
    document.getElementById('resident-id').value = '';
    document.getElementById('move-info-section').style.display = 'none';
    document.getElementById('quoctich').value = 'Việt Nam';
    document.getElementById('dantoc').value = 'Kinh';
    document.getElementById('resident-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('resident-modal').classList.remove('show');
    document.getElementById('resident-form').reset();
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('show');
}

async function viewDetails(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}/details`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.success && data.data) {
            const resident = Array.isArray(data.data) ? data.data[0] : data.data;
            showResidentDetails(resident);
        } else { showNotification('Không tìm thấy thông tin', 'error'); }
    } catch (error) { console.error('View details error:', error); }
}

async function editResident(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}/details`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.success && data.data) {
            isEditMode = true;
            const resident = Array.isArray(data.data) ? data.data[0] : data.data;
            fillFormWithResident(resident);
            document.getElementById('modal-title').textContent = 'Chỉnh sửa nhân khẩu';
            document.getElementById('resident-modal').classList.add('show');
            const statusSelect = document.getElementById('trangthai');
            if (statusSelect) { const event = new Event('change'); statusSelect.dispatchEvent(event); }
        }
    } catch (error) { console.error('Edit error:', error); }
}

function fillFormWithResident(resident) {
    const fieldMappings = {
        'resident-id': 'MANHANKHAU', 'hoten': 'HOTEN', 'bidanh': 'BIDANH', 'ngaysinh': 'NGAYSINH',
        'gioitinh': 'GIOITINH', 'noisinh': 'NOISINH', 'nguyenquan': 'NGUYENQUAN', 'dantoc': 'DANTOC',
        'quoctich': 'QUOCTICH', 'cccd': 'CCCD', 'noilamviec': 'NOILAMVIEC', 'nghenghiep': 'NGHENGHIEP',
        'ngaycap': 'NGAYCAP', 'noicap': 'NOICAP', 'quanhechuho': 'QUANHECHUHO', 'trangthai': 'TRANGTHAI',
        'sohokhau': 'SOHOKHAU', 'noithuongtrucu': 'NOITHUONGTRUCU', 'ngaychuyendi': 'NGAYCHUYENDI',
        'noichuyen': 'NOICHUYEN', 'ghichu': 'GHICHU'
    };
    Object.keys(fieldMappings).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        const dataKey = fieldMappings[fieldId];
        if (element && resident[dataKey] !== undefined && resident[dataKey] !== null) {
            if ((fieldId === 'ngaysinh' || fieldId === 'ngaycap' || fieldId === 'ngaychuyendi') && resident[dataKey]) {
                const date = new Date(resident[dataKey]);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                element.value = `${yyyy}-${mm}-${dd}`;
            } else { element.value = resident[dataKey]; }
        }
    });
}

async function saveResident() {
    try {
        const getVal = (id) => { const el = document.getElementById(id); return el ? (el.value ?? '').toString().trim() : ''; };
        const formData = {
            hoten: getVal('hoten'), bidanh: getVal('bidanh'), ngaysinh: getVal('ngaysinh'),
            gioitinh: getVal('gioitinh'), noisinh: getVal('noisinh'), nguyenquan: getVal('nguyenquan'),
            dantoc: getVal('dantoc'), quoctich: getVal('quoctich'), cccd: getVal('cccd'),
            noilamviec: getVal('noilamviec'), nghenghiep: getVal('nghenghiep'), ngaycap: getVal('ngaycap'),
            noicap: getVal('noicap'), quanhechuho: getVal('quanhechuho'), trangthai: getVal('trangthai'),
            sohokhau: getVal('sohokhau') || null, noithuongtrucu: getVal('noithuongtrucu'),
            ngaychuyendi: getVal('ngaychuyendi'), noichuyen: getVal('noichuyen'), ghichu: getVal('ghichu')
        };
        const requiredFields = ['hoten', 'ngaysinh', 'gioitinh', 'trangthai'];
        if (requiredFields.some(f => !formData[f])) { showNotification('Vui lòng điền các trường bắt buộc', 'error'); return; }

        // Nếu có số hộ khẩu thì phải có quan hệ chủ hộ
        if (formData.sohokhau && !formData.quanhechuho) {
            showNotification('Vui lòng chọn quan hệ với chủ hộ khi thuộc hộ khẩu', 'error');
            return;
        }

        const residentId = document.getElementById('resident-id')?.value;
        const isEdit = isEditMode && residentId;
        const token = getAuthToken();
        const url = isEdit ? `${API_URL}/${residentId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success');
            closeModal();
            await loadResidents();
        } else { showNotification(data.error || data.message || 'Có lỗi xảy ra', 'error'); }
    } catch (error) { console.error('Save error:', error); showNotification('Lỗi: ' + error.message, 'error'); }
}

let deleteId = null;
function executeDelete() { /* code xóa */ }

function showNotification(message, type = 'info') {
    if (typeof Toastify === 'function') Toastify({ text: message, duration: 3000, backgroundColor: type === 'error' ? "#ff5f6d" : "#00b09b" }).showToast();
    else alert(message);
}

window.onclick = function (event) {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (event.target === modal) modal.classList.remove('show');
    });
};