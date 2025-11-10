// Cấu hình API
const API_URL = 'http://localhost:3000/api/residents';
let currentResidents = [];
let isEditMode = false;

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadResidents();
    setupSearchListener();
});

// Lắng nghe sự kiện tìm kiếm
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchResidents(query);
            } else {
                loadResidents();
            }
        }, 300);
    });
}

// Lấy token từ localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Hiển thị loading
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('tableContainer').style.display = 'none';
}

// Ẩn loading
function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

// Hiển thị empty state
function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('tableContainer').style.display = 'none';
}

// Hiển thị bảng
function showTable() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('tableContainer').style.display = 'block';
}

// Load danh sách nhân khẩu
async function loadResidents() {
    showLoading();

    try {
        const token = getAuthToken();
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            currentResidents = data.data;
            renderResidents(currentResidents);
        } else {
            showNotification('Lỗi khi tải dữ liệu', 'error');
        }
    } catch (error) {
        console.error('Load residents error:', error);
        showNotification('Không thể kết nối đến server', 'error');
    } finally {
        hideLoading();
    }
}

// Tìm kiếm nhân khẩu
async function searchResidents(query) {
    showLoading();

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            currentResidents = data.data;
            renderResidents(currentResidents);
        } else {
            showNotification('Lỗi khi tìm kiếm', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Không thể tìm kiếm', 'error');
    } finally {
        hideLoading();
    }
}

// Render danh sách nhân khẩu
function renderResidents(residents) {
    const tbody = document.getElementById('residentsTable');

    if (!residents || residents.length === 0) {
        showEmptyState();
        return;
    }

    showTable();

    tbody.innerHTML = residents.map(resident => `
        <tr>
            <td>${resident.MANHANKHAU || '-'}</td>
            <td><strong>${resident.HOTEN || '-'}</strong></td>
            <td>${formatDate(resident.NGAYSINH)}</td>
            <td>${resident.GIOITINH || '-'}</td>
            <td>${resident.SOCCCD || '-'}</td>
            <td>${resident.SOHOKHAU || '-'}</td>
            <td>${resident.QUANHECHUHO || '-'}</td>
            <td>${renderStatus(resident.TRANGTHAI)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewDetails(${resident.MANHANKHAU})">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    <button class="btn btn-sm btn-success" onclick="editResident(${resident.MANHANKHAU})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteResident(${resident.MANHANKHAU})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
        'thuong_tru': { text: 'Thường trú', class: 'status-active' },
        'tam_tru': { text: 'Tạm trú', class: 'status-active' },
        'da_chuyen_di': { text: 'Đã chuyển đi', class: 'status-moved' },
        'da_mat': { text: 'Đã mất', class: 'status-deceased' }
    };

    const statusInfo = statusMap[status] || { text: status || 'Không xác định', class: '' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Mở modal thêm mới
function openAddModal() {
    isEditMode = false;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Thêm nhân khẩu mới';
    document.getElementById('residentForm').reset();
    document.getElementById('residentId').value = '';

    // Set giá trị mặc định
    document.getElementById('quoctich').value = 'Việt Nam';

    document.getElementById('residentModal').classList.add('active');
}

// Đóng modal
function closeModal() {
    document.getElementById('residentModal').classList.remove('active');
    document.getElementById('residentForm').reset();
}

// Xem chi tiết nhân khẩu
async function viewDetails(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`,
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

// Hiển thị chi tiết nhân khẩu (có thể tùy chỉnh)
function showResidentDetails(resident) {
    alert(`
Thông tin nhân khẩu:
- Họ tên: ${resident.HOTEN}
- Ngày sinh: ${formatDate(resident.NGAYSINH)}
- Giới tính: ${resident.GIOITINH}
- CCCD: ${resident.SOCCCD || 'Chưa có'}
- Số hộ khẩu: ${resident.SOHOKHAU}
- Địa chỉ: ${resident.DIACHI || 'Chưa có'}
- Trạng thái: ${resident.TRANGTHAI}
    `);
}

// Sửa nhân khẩu
async function editResident(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            const resident = Array.isArray(data.data) ? data.data[0] : data.data;
            fillFormWithResident(resident);
            isEditMode = true;
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> Cập nhật nhân khẩu';
            document.getElementById('residentModal').classList.add('active');
        } else {
            showNotification('Không tìm thấy thông tin nhân khẩu', 'error');
        }
    } catch (error) {
        console.error('Edit resident error:', error);
        showNotification('Không thể tải thông tin', 'error');
    }
}

// Điền dữ liệu vào form
function fillFormWithResident(resident) {
    document.getElementById('residentId').value = resident.MANHANKHAU;
    document.getElementById('hoten').value = resident.HOTEN || '';
    document.getElementById('bidanh').value = resident.BIDANH || '';
    document.getElementById('ngaysinh').value = formatDateForInput(resident.NGAYSINH);
    document.getElementById('gioitinh').value = resident.GIOITINH || '';
    document.getElementById('noisinh').value = resident.NOISINH || '';
    document.getElementById('nguyenquan').value = resident.NGUYENQUAN || '';
    document.getElementById('dantoc').value = resident.DANTOC || '';
    document.getElementById('quoctich').value = resident.QUOCTICH || 'Việt Nam';
    document.getElementById('socccd').value = resident.SOCCCD || '';
    document.getElementById('ngaycap').value = formatDateForInput(resident.NGAYCAP);
    document.getElementById('noicap').value = resident.NOICAP || '';
    document.getElementById('nghenghiep').value = resident.NGHENGHIEP || '';
    document.getElementById('sohokhau').value = resident.SOHOKHAU || '';
    document.getElementById('quanhechuho').value = resident.QUANHECHUHO || '';
    document.getElementById('trangthai').value = resident.TRANGTHAI || '';
    document.getElementById('noithuongtrucu').value = resident.NOITHUONGTRUCU || '';
    document.getElementById('diachi').value = resident.DIACHI || '';
    document.getElementById('ghichu').value = resident.GHICHU || '';
}

// Format ngày cho input date
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Lưu nhân khẩu
async function saveResident() {
    const form = document.getElementById('residentForm');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const residentData = {
        hoten: document.getElementById('hoten').value,
        bidanh: document.getElementById('bidanh').value,
        ngaysinh: document.getElementById('ngaysinh').value,
        gioitinh: document.getElementById('gioitinh').value,
        noisinh: document.getElementById('noisinh').value,
        nguyenquan: document.getElementById('nguyenquan').value,
        dantoc: document.getElementById('dantoc').value,
        quoctich: document.getElementById('quoctich').value,
        socccd: document.getElementById('socccd').value,
        ngaycap: document.getElementById('ngaycap').value || null,
        noicap: document.getElementById('noicap').value,
        nghenghiep: document.getElementById('nghenghiep').value,
        sohokhau: document.getElementById('sohokhau').value,
        quanhechuho: document.getElementById('quanhechuho').value,
        trangthai: document.getElementById('trangthai').value,
        noithuongtrucu: document.getElementById('noithuongtrucu').value,
        diachi: document.getElementById('diachi').value,
        ghichu: document.getElementById('ghichu').value
    };

    try {
        const token = getAuthToken();
        let url = API_URL;
        let method = 'POST';

        if (isEditMode) {
            const id = document.getElementById('residentId').value;
            url = `${API_URL}/${id}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(residentData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(isEditMode ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success');
            closeModal();
            loadResidents();
        } else {
            showNotification(data.error || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Save resident error:', error);
        showNotification('Không thể lưu dữ liệu', 'error');
    }
}

// Xóa nhân khẩu
async function deleteResident(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân khẩu này?')) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Xóa thành công', 'success');
            loadResidents();
        } else {
            showNotification(data.error || 'Không thể xóa', 'error');
        }
    } catch (error) {
        console.error('Delete resident error:', error);
        showNotification('Không thể xóa nhân khẩu', 'error');
    }
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Tạo element thông báo
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Đóng modal khi click bên ngoài
window.onclick = function (event) {
    const modal = document.getElementById('residentModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Thêm CSS cho animation thông báo
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);