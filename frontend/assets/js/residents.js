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

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput?.value?.trim() || '';
            if (query) {
                searchResidents(query);
            } else {
                loadResidents();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            loadResidents();
        });
    }
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
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('show');
                }
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
        form.addEventListener('submit', (e) => {
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
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Đang tải dữ liệu...</td></tr>';
    }
}

// Hiển thị trạng thái rỗng
function showEmptyDataState() {
    const tbody = document.getElementById('residents-table-body');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Không tìm thấy nhân khẩu nào.</td></tr>';
    }
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

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

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

// Render danh sách nhân khẩu
function renderResidents(residents) {
    const tbody = document.getElementById('residents-table-body');
    if (!tbody) return;

    if (!residents || residents.length === 0) {
        showEmptyDataState();
        return;
    }

    tbody.innerHTML = residents
        .map(resident => `
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
        </tr>`)
        .join('');
}

// Format ngày tháng
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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

    const dantoc = document.getElementById('dantoc');
    if (dantoc) dantoc.value = 'Kinh';

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

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

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

    Object.keys(fields).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.textContent = fields[fieldId] || '-';
        }
    });

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
        const response = await fetch(`${API_URL}/${id}/details`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("Edit resident data:", data);

        if (data.success && data.data) {
            isEditMode = true;
            const resident = Array.isArray(data.data) ? data.data[0] : data.data;

            if (!resident) {
                return showNotification('Không tìm thấy thông tin nhân khẩu', 'error');
            }

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
    const fieldMappings = {
        'resident-id': 'MANHANKHAU',
        'hoten': 'HOTEN',
        'bidanh': 'BIDANH',
        'ngaysinh': 'NGAYSINH',
        'gioitinh': 'GIOITINH',
        'noisinh': 'NOISINH',
        'nguyenquan': 'NGUYENQUAN',
        'dantoc': 'DANTOC',
        'quoctich': 'QUOCTICH',
        'socccd': 'SOCCCD',
        'nghenghiep': 'NGHENGHIEP',
        'quanhechuho': 'QUANHECHUHO',
        'trangthai': 'TRANGTHAI',
        'sohokhau': 'SOHOKHAU'
    };

    Object.keys(fieldMappings).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        const dataKey = fieldMappings[fieldId];
        if (element && resident[dataKey]) {
            // Xử lý format ngày nếu cần
            if (fieldId === 'ngaysinh' && resident[dataKey]) {
                const date = new Date(resident[dataKey]);
                element.value = date.toISOString().split('T')[0];
            } else {
                element.value = resident[dataKey];
            }
        }
    });
}

// Thay thế toàn bộ hàm saveResident bằng đoạn này
async function saveResident() {
    try {
        const getVal = (id) => {
            const el = document.getElementById(id);
            if (!el) return '';
            // nếu là select hoặc input type=date/value: trả value
            return (el.value ?? '').toString().trim();
        };

        // Xây form data với key viết thường (phù hợp backend)
        const formData = {
            hoten: getVal('hoten'),
            bidanh: getVal('bidanh'),
            ngaysinh: getVal('ngaysinh'), // dạng yyyy-mm-dd từ <input type="date">
            gioitinh: getVal('gioitinh'),
            noisinh: getVal('noisinh'),
            nguyenquan: getVal('nguyenquan'),
            dantoc: getVal('dantoc'),
            quoctich: getVal('quoctich'),
            quanhechuho: getVal('quanhechuho'),
            trangthai: getVal('trangthai'),
            sohokhau: getVal('sohokhau'),
            socccd: getVal('socccd'),
            nghenghiep: getVal('nghenghiep')
        };

        // Validate required (key viết thường)
        const requiredFields = ['hoten', 'ngaysinh', 'gioitinh', 'noisinh', 'nguyenquan',
            'dantoc', 'quoctich', 'trangthai', 'sohokhau'];

        const missing = requiredFields.filter(f => !formData[f]);
        if (missing.length) {
            showNotification(`Vui lòng điền các trường bắt buộc: ${missing.join(', ')}`, 'error');
            return;
        }

        // Nếu backend muốn dd/mm/yyyy, chuyển ở đây (nếu backend chấp nhận ISO thì có thể bỏ)
        if (formData.ngaysinh) {
            const dateObj = new Date(formData.ngaysinh);
            if (!isNaN(dateObj)) {
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                formData.ngaysinh = `${day}/${month}/${year}`; // dd/mm/yyyy
            }
        }

        const residentId = document.getElementById('resident-id')?.value;
        const isEdit = isEditMode && residentId;

        const token = getAuthToken();
        const url = isEdit ? `${API_URL}/${residentId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        // Debug: in ra payload trước khi gửi
        console.log('Sending request payload:', { url, method, formData });

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showNotification(`Lỗi ${response.status}: ${response.statusText}`, 'error');
            return;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            showNotification('Server trả về dữ liệu không hợp lệ', 'error');
            return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            showNotification(isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success');
            closeModal();
            await loadResidents();
        } else {
            showNotification(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Save resident error:', error);
        showNotification('Không thể lưu thông tin: ' + error.message, 'error');
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
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            showNotification('Xóa thành công', 'success');
            closeDeleteModal();
            await loadResidents();
        } else {
            showNotification(data.message || 'Không thể xóa', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Không thể xóa nhân khẩu: ' + error.message, 'error');
    } finally {
        deleteId = null;
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
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