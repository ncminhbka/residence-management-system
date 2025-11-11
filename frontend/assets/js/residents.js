// Cấu hình API
const API_URL = '/api/v1/residents';
let currentResidents = [];
let isEditMode = false;

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadResidents();
    setupSearchListener();
    setupModalListeners();
    setupFormListener();
});

// Lắng nghe sự kiện tìm kiếm
function setupSearchListener() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-search-btn');

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchResidents(query);
        } else {
            loadResidents();
        }
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        loadResidents();
    });
}

// Gắn các trình nghe sự kiện cho modal và form
function setupModalListeners() {
    const addBtn = document.getElementById('add-resident-btn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                document.getElementById(modalId).classList.add('hidden');
                document.getElementById(modalId).classList.remove('show');
            }
        });
    });

    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', executeDelete);
    }
}

// Gắn trình nghe sự kiện submit cho form
function setupFormListener() {
    const form = document.getElementById('resident-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            saveResident();
        });
    }
}

// Lấy token từ localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Hiển thị trạng thái đang tải
function showLoadingState() {
    const tbody = document.getElementById('residents-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Đang tải dữ liệu...</td></tr>';
}

// Hiển thị trạng thái rỗng
function showEmptyDataState() {
    const tbody = document.getElementById('residents-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Không tìm thấy nhân khẩu nào.</td></tr>';
}

// Load danh sách nhân khẩu
async function loadResidents() {
    showLoadingState();
    try {
        const token = getAuthToken();
        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            currentResidents = data.data;
            renderResidents(currentResidents);
        } else {
            showNotification('Lỗi khi tải dữ liệu', 'error');
            showEmptyDataState();
        }
    } catch (error) {
        console.error('Load residents error:', error);
        showNotification('Không thể kết nối đến server', 'error');
        showEmptyDataState();
    }
}

// Tìm kiếm nhân khẩu
async function searchResidents(query) {
    showLoadingState();
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            currentResidents = data.data;
            renderResidents(currentResidents);
        } else {
            showNotification('Lỗi khi tìm kiếm', 'error');
            showEmptyDataState();
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Không thể tìm kiếm', 'error');
        showEmptyDataState();
    }
}

// Render danh sách nhân khẩu - CHỈ HIỂN THỊ 4 CỘT + THAO TÁC
function renderResidents(residents) {
    const tbody = document.getElementById('residents-table-body');
    if (!residents || residents.length === 0) {
        showEmptyDataState();
        return;
    }

    tbody.innerHTML = residents
        .map(
            resident => `
        <tr>
            <td>${resident.MANHANKHAU || '-'}</td>
            <td><strong>${resident.HOTEN || '-'}</strong></td>
            <td>${resident.NOISINH || '-'}</td>
            <td>${resident.NGUYENQUAN || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewDetails(${resident.MANHANKHAU})">
                        Xem
                    </button>
                    <button class="btn btn-sm btn-success" onclick="editResident(${resident.MANHANKHAU})">
                        Sửa
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteResident(${resident.MANHANKHAU})">
                        Xóa
                    </button>
                </div>
            </td>
        </tr>`
        )
        .join('');
}

// Format ngày tháng
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Render trạng thái
function renderStatus(status) {
    const statusMap = {
        thuong_tru: { text: 'Thường trú', class: 'status-active' },
        tam_tru: { text: 'Tạm trú', class: 'status-active' },
        da_chuyen_di: { text: 'Đã chuyển đi', class: 'status-moved' },
        da_mat: { text: 'Đã mất', class: 'status-deceased' }
    };

    const statusInfo = statusMap[status] || { text: status || 'Không xác định', class: '' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Mở modal thêm mới
function openAddModal() {
    isEditMode = false;
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('resident-form');
    const modal = document.getElementById('resident-modal');

    if (modalTitle) modalTitle.textContent = 'Thêm nhân khẩu mới';
    if (form) form.reset();

    const residentId = document.getElementById('resident-id');
    if (residentId) residentId.value = '';

    const quoctich = document.getElementById('quoctich');
    if (quoctich) quoctich.value = 'Việt Nam';

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }
}

// Đóng modal
function closeModal() {
    const modal = document.getElementById('resident-modal');
    const form = document.getElementById('resident-form');

    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }
    if (form) form.reset();
}

// Đóng modal xóa
function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('show');
    }
}

// Xem chi tiết nhân khẩu
async function viewDetails(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}/details`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success && data.data) {
            const resident = Array.isArray(data.data) ? data.data[0] : data.data;
            showResidentDetails(resident);
        } else {
            showNotification('Không tìm thấy thông tin nhân khẩu', 'error');
        }
    } catch (error) {
        console.error('View details error:', error);
        showNotification('Không thể xem chi tiết', 'error');
    }
}

// Hiển thị chi tiết nhân khẩu trong modal
function showResidentDetails(resident) {
    // Cập nhật tất cả các trường theo cấu trúc database
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
        'detail-nghenghiep': resident.NGHENGHIEP,
        'detail-ngaycap': formatDate(resident.NGAYCAP),
        'detail-noicap': resident.NOICAP,
        'detail-quanhechuho': resident.QUANHECHUHO,
        'detail-trangthai': resident.TRANGTHAI,
        'detail-noithuongtrucu': resident.NOITHUONGTRUCU
    };

    // Cập nhật giá trị cho các trường
    Object.keys(fields).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.textContent = fields[fieldId] || '-';
        }
    });

    // Hiển thị modal
    const modal = document.getElementById('resident-detail-modal');
    if (modal) {
        modal.classList.add('show');
        modal.classList.remove('hidden');
    }
}

// Chỉnh sửa nhân khẩu
async function editResident(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success && data.data) {
            isEditMode = true;
            const resident = Array.isArray(data.data) ? data.data[0] : data.data;
            fillFormWithResident(resident);

            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) modalTitle.textContent = 'Chỉnh sửa nhân khẩu';

            const modal = document.getElementById('resident-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('show');
            }
        } else {
            showNotification('Không tìm thấy thông tin nhân khẩu', 'error');
        }
    } catch (error) {
        console.error('Edit resident error:', error);
        showNotification('Không thể tải thông tin nhân khẩu', 'error');
    }
}

// Điền dữ liệu vào form
function fillFormWithResident(resident) {
    const fields = [
        'resident-id', 'hoten', 'bidanh', 'ngaysinh', 'gioitinh',
        'noisinh', 'nguyenquan', 'dantoc', 'quoctich', 'socccd',
        'nghenghiep', 'quanhechuho', 'trangthai', 'sohokhau'
    ];

    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && resident[field.toUpperCase().replace('-', '')]) {
            element.value = resident[field.toUpperCase().replace('-', '')];
        }
    });

    // Đặt ID để biết đang edit
    const residentId = document.getElementById('resident-id');
    if (residentId) residentId.value = resident.MANHANKHAU;
}

// Lưu nhân khẩu (thêm mới hoặc cập nhật)
async function saveResident() {
    const formData = {
        HOTEN: document.getElementById('hoten')?.value,
        BIDANH: document.getElementById('bidanh')?.value,
        NGAYSINH: document.getElementById('ngaysinh')?.value,
        GIOITINH: document.getElementById('gioitinh')?.value,
        NOISINH: document.getElementById('noisinh')?.value,
        NGUYENQUAN: document.getElementById('nguyenquan')?.value,
        DANTOC: document.getElementById('dantoc')?.value,
        QUOCTICH: document.getElementById('quoctich')?.value,
        SOCCCD: document.getElementById('socccd')?.value,
        NGHENGHIEP: document.getElementById('nghenghiep')?.value,
        QUANHECHUHO: document.getElementById('quanhechuho')?.value,
        TRANGTHAI: document.getElementById('trangthai')?.value,
        SOHOKHAU: document.getElementById('sohokhau')?.value
    };

    const residentId = document.getElementById('resident-id')?.value;
    const isEdit = isEditMode && residentId;

    try {
        const token = getAuthToken();
        const url = isEdit ? `${API_URL}/${residentId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
            showNotification(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success');
            closeModal();
            loadResidents();
        } else {
            showNotification(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Save resident error:', error);
        showNotification('Không thể lưu thông tin', 'error');
    }
}

// Xóa nhân khẩu
let deleteId = null;
function deleteResident(id) {
    deleteId = id;
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }
}

async function executeDelete() {
    if (!deleteId) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${deleteId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            showNotification('Xóa thành công', 'success');
            closeDeleteModal();
            loadResidents();
        } else {
            showNotification(data.message || 'Không thể xóa', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Không thể xóa nhân khẩu', 'error');
    }
    deleteId = null;
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Nếu có hệ thống notification, dùng nó
    // Nếu không, dùng alert tạm thời
    if (typeof toast !== 'undefined') {
        toast(message, type);
    } else {
        alert(message);
    }
}

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('show');
        }
    });
};