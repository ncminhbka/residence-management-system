/**
 * households.js
 * Quản lý logic phía client cho trang Quản lý Hộ khẩu.
 */

// Biến toàn cục
let allHouseholds = [];
let currentPage = 1;
const rowsPerPage = 10;
const API_BASE_URL = '/api/v1/households';

// State cho modal tách hộ
let splitHouseholdMembers = [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchHouseholds();
});

/**
 * Gắn tất cả event listeners
 */
function setupEventListeners() {
    // Tìm kiếm
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearch);
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Thêm hộ khẩu
    document.getElementById('add-household-btn').addEventListener('click', openAddModal);

    // Form submit
    document.getElementById('household-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('split-form').addEventListener('submit', handleSplitSubmit);

    // Xác nhận xóa
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);

    // Đóng modal
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
            const modalId = e.target.getAttribute('data-modal');
            closeModal(modalId);
        }
    });

    // Event delegation cho bảng
    document.getElementById('household-table-body').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.getAttribute('data-id');

        if (target.classList.contains('view-btn')) {
            handleViewDetails(id);
        } else if (target.classList.contains('edit-btn')) {
            handleEdit(id);
        } else if (target.classList.contains('delete-btn')) {
            openDeleteModal(id);
        }
    });
}

// ============================================
// API CALLS
// ============================================

/**
 * Tải danh sách tất cả hộ khẩu
 */
async function fetchHouseholds() {
    try {
        showLoading();
        const response = await fetch(API_BASE_URL, {
            credentials: 'include'
        });
        
        // Kiểm tra authentication
        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        
        if (!response.ok) throw new Error('Không thể tải danh sách hộ khẩu');
        
        const result = await response.json();

        if (result.success) {
            allHouseholds = result.data;
            currentPage = 1;
            displayPage(currentPage);
        } else {
            showAlert('Lỗi: ' + (result.message || result.error), 'error');
            showEmptyTable();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showAlert(error.message, 'error');
        showEmptyTable();
    }
}

/**
 * Tìm kiếm hộ khẩu
 */
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();

    if (!query) {
        showAlert('Vui lòng nhập từ khóa tìm kiếm', 'warning');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
            credentials: 'include'
        });
        
        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        
        if (!response.ok) throw new Error('Lỗi khi tìm kiếm');
        
        const result = await response.json();
        
        if (result.success) {
            if (result.data.length === 0) {
                showAlert('Không tìm thấy kết quả phù hợp', 'info');
                showEmptyTable('Không tìm thấy kết quả');
            } else {
                renderHouseholdTable(result.data, 0);
                document.getElementById('pagination-controls').innerHTML = '';
            }
        } else {
            showAlert(result.error || 'Không tìm thấy kết quả', 'error');
            showEmptyTable();
        }
    } catch (error) {
        console.error('Search error:', error);
        showAlert(error.message, 'error');
        showEmptyTable();
    }
}

/**
 * Xóa tìm kiếm và tải lại toàn bộ dữ liệu
 */
function clearSearch() {
    document.getElementById('search-input').value = '';
    fetchHouseholds();
}

/**
 * Xử lý submit form thêm/sửa
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const soHoKhau = document.getElementById('soHoKhau').value;
    const isEdit = !!soHoKhau;

    const formData = {
        manhankhauchuho: parseInt(document.getElementById('maNhanKhauChuHo').value),
        diachi: document.getElementById('diaChi').value.trim(),
        hososo: parseInt(document.getElementById('hoSoSo').value),
        sodangkyso: parseInt(document.getElementById('soDangKySo').value),
        toso: parseInt(document.getElementById('toSo').value),
    };

    // Khi edit, API updateHouseholds nhận hotenchuho (thực ra là mã chủ hộ)
    if (isEdit) {
        formData.hotenchuho = formData.manhankhauchuho;
        delete formData.manhankhauchuho;
    }

    const url = isEdit ? `${API_BASE_URL}/${soHoKhau}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData),
        });

        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            closeModal('household-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Form submit error:', error);
        showAlert(error.message, 'error');
    }
}

/**
 * Xem chi tiết hộ khẩu
 */
async function handleViewDetails(id) {
    try {
        const url = `${API_BASE_URL}/${id}/details`;
        console.log('Fetching details from:', url);
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        // Kiểm tra authentication
        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        
        // Kiểm tra content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server trả về HTML thay vì JSON. Kiểm tra route API hoặc đăng nhập.');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Không thể tải chi tiết hộ khẩu');
        }

        const result = await response.json();
        console.log('Details result:', result);

        if (result.success) {
            renderDetailModal(result.data1[0], result.data2);
            openModal('detail-modal');
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error('View details error:', error);
        showAlert(error.message, 'error');
    }
}

/**
 * Sửa hộ khẩu
 */
async function handleEdit(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/details`, {
            credentials: 'include'
        });
        
        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        
        if (!response.ok) throw new Error('Không thể tải thông tin hộ khẩu');

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        const household = result.data1[0];

        // Reset và điền form
        document.getElementById('household-form').reset();
        document.getElementById('modal-title').textContent = 'Sửa hộ khẩu';
        
        document.getElementById('soHoKhau').value = household.SOHOKHAU;
        document.getElementById('maNhanKhauChuHo').value = household.MACHUHO;
        document.getElementById('diaChi').value = household.DIACHI;
        document.getElementById('hoSoSo').value = household.HOSOSO;
        document.getElementById('soDangKySo').value = household.SODANGKYSO;
        document.getElementById('toSo').value = household.TOSO;

        // Disable mã nhân khẩu khi edit
        document.getElementById('maNhanKhauChuHo').disabled = true;

        openModal('household-modal');
    } catch (error) {
        console.error('Edit error:', error);
        showAlert(error.message, 'error');
    }
}

/**
 * Xác nhận xóa hộ khẩu
 */
async function confirmDelete() {
    const id = document.getElementById('confirm-delete-btn').dataset.id;
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }

        const result = await response.json();

        if (result.success) {
            showAlert(result.message, 'success');
            closeModal('delete-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert(error.message, 'error');
    }
}

/**
 * Xử lý tách hộ
 */
async function handleSplitRequest(soHoKhauGoc) {
    try {
        const response = await fetch(`${API_BASE_URL}/${soHoKhauGoc}/details`, {
            credentials: 'include'
        });
        
        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        
        if (!response.ok) throw new Error('Không thể tải thông tin hộ khẩu');

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        splitHouseholdMembers = result.data2;
        
        if (splitHouseholdMembers.length === 0) {
            showAlert('Hộ khẩu này chưa có thành viên nào để tách', 'warning');
            return;
        }
        
        // Hiển thị modal tách hộ
        document.getElementById('split-soHoKhauGoc').value = soHoKhauGoc;
        document.getElementById('split-form').reset();
        document.getElementById('split-soHoKhauGoc').value = soHoKhauGoc; // Keep after reset
        
        renderSplitMembersList(splitHouseholdMembers);
        
        closeModal('detail-modal');
        openModal('split-modal');
    } catch (error) {
        console.error('Split request error:', error);
        showAlert(error.message, 'error');
    }
}

/**
 * Submit form tách hộ
 */
async function handleSplitSubmit(e) {
    e.preventDefault();

    const sohokhaugoc = document.getElementById('split-soHoKhauGoc').value;
    
    // Lấy danh sách thành viên được chọn
    const checkboxes = document.querySelectorAll('#split-members-list input[type="checkbox"]:checked');
    const membersToMove = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (membersToMove.length === 0) {
        showAlert('Vui lòng chọn ít nhất một thành viên để chuyển sang hộ mới', 'warning');
        return;
    }

    const requestBody = {
        sohokhaugoc: parseInt(sohokhaugoc),
        thongtinhokhaumoi: {
            hotenchuhomoi: parseInt(document.getElementById('split-maChuHoMoi').value),
            diachimoi: document.getElementById('split-diaChi').value.trim(),
            hososomoi: parseInt(document.getElementById('split-hoSoSo').value),
            sodangkysomoi: parseInt(document.getElementById('split-soDangKySo').value),
            tosomoi: parseInt(document.getElementById('split-toSo').value),
        },
        thanhviensanghokhaumoi: membersToMove
    };

    try {
        const response = await fetch(`${API_BASE_URL}/split`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody),
        });

        if (response.status === 401 || response.status === 403) {
            showAlert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
            return;
        }

        const result = await response.json();

        if (result.success) {
            showAlert(result.message + `. Số hộ khẩu mới: ${result.data.sohokhaumoi}`, 'success');
            closeModal('split-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error || 'Có lỗi khi tách hộ khẩu', 'error');
        }
    } catch (error) {
        console.error('Split submit error:', error);
        showAlert(error.message, 'error');
    }
}

// ============================================
// MODAL HELPERS
// ============================================

function openAddModal() {
    document.getElementById('household-form').reset();
    document.getElementById('modal-title').textContent = 'Thêm hộ khẩu';
    document.getElementById('soHoKhau').value = '';
    document.getElementById('maNhanKhauChuHo').disabled = false;
    openModal('household-modal');
}

function openDeleteModal(id) {
    document.getElementById('confirm-delete-btn').dataset.id = id;
    openModal('delete-modal');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showAlert(message, type = 'info') {
    const icon = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    }[type] || 'ℹ';
    
    alert(`${icon} ${message}`);
}

// ============================================
// RENDERING
// ============================================

function displayPage(page) {
    currentPage = page;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = allHouseholds.slice(start, end);

    renderHouseholdTable(paginatedItems, start);
    renderPagination();
}

function renderHouseholdTable(households, startIndex = 0) {
    const tableBody = document.getElementById('household-table-body');
    tableBody.innerHTML = '';

    if (households.length === 0) {
        showEmptyTable();
        return;
    }

    households.forEach((hh, index) => {
        const stt = startIndex + index + 1;
        const row = `
            <tr>
                <td>${stt}</td>
                <td>${hh.SOHOKHAU}</td>
                <td>${hh.HOTENCHUHO || 'N/A'}</td>
                <td>${hh.DIACHI}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm view-btn" data-id="${hh.SOHOKHAU}">Xem</button>
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${hh.SOHOKHAU}">Sửa</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${hh.SOHOKHAU}">Xóa</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function renderDetailModal(household, members) {
    const content = document.getElementById('detail-content');
    
    let membersHtml = '';
    if (members && members.length > 0) {
        membersHtml = members.map(m => `
            <tr>
                <td>${m.MANHANKHAU}</td>
                <td>${m.HOTEN}</td>
                <td>${m.GIOITINH}</td>
                <td>${formatDate(m.NGAYSINH)}</td>
                <td>${m.QUANHECHUHO || 'N/A'}</td>
            </tr>
        `).join('');
    } else {
        membersHtml = '<tr><td colspan="5">Chưa có thành viên nào</td></tr>';
    }

    content.innerHTML = `
        <h4>Thông tin hộ khẩu</h4>
        <div class="info-grid">
            <p><strong>Số hộ khẩu:</strong> ${household.SOHOKHAU}</p>
            <p><strong>Mã chủ hộ:</strong> ${household.MACHUHO}</p>
            <p><strong>Tên chủ hộ:</strong> ${household.HOTENCHUHO || 'N/A'}</p>
            <p><strong>Địa chỉ:</strong> ${household.DIACHI}</p>
            <p><strong>Hồ sơ số:</strong> ${household.HOSOSO}</p>
            <p><strong>Sổ đăng ký số:</strong> ${household.SODANGKYSO}</p>
            <p><strong>Tổ số:</strong> ${household.TOSO}</p>
        </div>
        
        <hr style="margin: 20px 0;">
        <h4>Danh sách thành viên (${members ? members.length : 0} người)</h4>
        <table class="data-table small">
            <thead>
                <tr>
                    <th>Mã NK</th>
                    <th>Họ tên</th>
                    <th>Giới tính</th>
                    <th>Ngày sinh</th>
                    <th>Quan hệ</th>
                </tr>
            </thead>
            <tbody>
                ${membersHtml}
            </tbody>
        </table>
        
        <div class="form-actions" style="margin-top: 20px;">
            <button id="request-split-btn" class="btn btn-primary" data-id="${household.SOHOKHAU}" ${!members || members.length === 0 ? 'disabled' : ''}>
                Tách hộ khẩu
            </button>
            <button class="btn btn-secondary close-btn" data-modal="detail-modal">Đóng</button>
        </div>
    `;

    // Event cho nút tách hộ
    const splitBtn = document.getElementById('request-split-btn');
    if (splitBtn && !splitBtn.disabled) {
        splitBtn.addEventListener('click', (e) => {
            handleSplitRequest(e.target.dataset.id);
        });
    }
}

function renderSplitMembersList(members) {
    const container = document.getElementById('split-members-list');
    container.innerHTML = '';

    if (members.length === 0) {
        container.innerHTML = '<p>Không có thành viên nào trong hộ khẩu này.</p>';
        return;
    }

    members.forEach(m => {
        const div = document.createElement('div');
        div.className = 'member-checkbox-item';
        div.innerHTML = `
            <label>
                <input type="checkbox" name="member" value="${m.MANHANKHAU}">
                <span>${m.HOTEN} - ${m.GIOITINH} - ${formatDate(m.NGAYSINH)} (Quan hệ: ${m.QUANHECHUHO || 'N/A'})</span>
            </label>
        `;
        container.appendChild(div);
    });
}

function renderPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';
    
    const pageCount = Math.ceil(allHouseholds.length / rowsPerPage);
    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.classList.add('page-btn');
        if (i === currentPage) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => displayPage(i));
        paginationControls.appendChild(btn);
    }
}

function showLoading() {
    const tableBody = document.getElementById('household-table-body');
    tableBody.innerHTML = '<tr><td colspan="5">Đang tải dữ liệu...</td></tr>';
}

function showEmptyTable(message = 'Không có dữ liệu') {
    const tableBody = document.getElementById('household-table-body');
    tableBody.innerHTML = `<tr><td colspan="5">${message}</td></tr>`;
}

// ============================================
// UTILITIES
// ============================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}