// === Khởi tạo trang Quản lý tài khoản ===
async function initAccountsPage() {
  console.log("🚀 initAccountsPage() running...");

  const tableBody = document.querySelector("#accountsTable tbody");
  const form = document.getElementById("createAccountForm");
  const msg = document.getElementById("accountMessage");

  if (!tableBody || !form) {
    console.warn("⚠️ Không tìm thấy phần tử #accountsTable hoặc #createAccountForm");
    return;
  }

  // === Load danh sách tài khoản ===
  async function loadAccounts() {
    NProgress.start();
    tableBody.innerHTML = "<tr><td colspan='6'>Đang tải...</td></tr>";
    accountsMap.clear();

    try {
      const res = await fetch("/api/v1/accounts/", { credentials: "include" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể tải danh sách tài khoản");

      const accounts = result.data || [];
      tableBody.innerHTML = accounts.length
        ? ""
        : "<tr><td colspan='6'>Chưa có tài khoản nào</td></tr>";

      accounts.forEach(acc => {
        // Lưu vào cache để dùng khi bấm Sửa
        accountsMap.set(String(acc.MATAIKHOAN), acc);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${acc.MATAIKHOAN}</td>
          <td>${acc.HOTEN}</td>
          <td>${acc.TENDANGNHAP}</td>
          <td>${acc.CHUCVU}</td>
          <td>${acc.TRANGTHAI ? "🟢 Kích hoạt" : "🔴 Vô hiệu"}</td>
          <td>
            <button class="btn btn-sm btn-success" onclick="editAccount(${acc.MATAIKHOAN})">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAccount(${acc.MATAIKHOAN})">Xóa</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      bindRowEvents();
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", err);
      tableBody.innerHTML = "<tr><td colspan='6'>Lỗi khi tải dữ liệu.</td></tr>";
    } finally {
      NProgress.done();
    }
  }

  // Cache hiện tại các tài khoản để dùng nhanh khi chỉnh sửa
  const accountsMap = new Map();

  // === Gắn sự kiện cho nút sửa / xoá ===
  function bindRowEvents() {
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Bạn có chắc muốn xóa tài khoản này?")) {
          await deleteAccount(id);
        }
      });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.currentTarget.dataset.id;
        const acc = accountsMap.get(String(id));
        if (acc) showAccountModal(acc);
        else alert('Không tìm thấy thông tin tài khoản');
      });
    });

    // Global wrapper to allow onclick handlers (keeps API similar to residents.js)
    window.editAccount = function(id) {
      const acc = accountsMap.get(String(id));
      if (acc) showAccountModal(acc);
      else alert('Không tìm thấy thông tin tài khoản');
    };
  }

  // === Xử lý form thêm mới ===
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const hoten = document.getElementById("hoten").value.trim();
    const tendangnhap = document.getElementById("tendangnhap").value.trim();
    const matkhau = document.getElementById("matkhau").value.trim();
    const chucvu = document.getElementById("chucvu").value;

    if (!hoten || !tendangnhap || !matkhau || !chucvu) {
      msg.style.color = "red";
      msg.textContent = "⚠️ Vui lòng nhập đầy đủ thông tin!";
      return;
    }

    NProgress.start();
    try {
      const res = await fetch("/api/v1/accounts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ hoten, tendangnhap, matkhau, chucvu }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo tài khoản thất bại");

      msg.style.color = "green";
      msg.textContent = "✅ Tạo tài khoản thành công!";
      form.reset();
      await loadAccounts();
    } catch (err) {
      msg.style.color = "red";
      msg.textContent = "❌ " + err.message;
    } finally {
      NProgress.done();
    }
  });

  // === Xoá tài khoản ===
  async function deleteAccount(id) {
    NProgress.start();
    try {
      const res = await fetch(`/api/v1/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể xóa tài khoản");
      await loadAccounts();
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      NProgress.done();
    }
  }

  // --- Global wrapper so onclick="deleteAccount(id)" works from DOM ---
  window.deleteAccount = async function(id) {
    // Confirm and call inner function
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    await deleteAccount(id);
  };

  // === Modal sửa tài khoản (sử dụng modal DOM trong accounts.html) ===
  function showAccountModal(account) {
    const modal = document.getElementById('account-modal');
    if (!modal) return alert('Modal chỉnh sửa không tồn tại');

    document.getElementById('acc-hoten').value = account.HOTEN || '';
    document.getElementById('acc-tendangnhap').value = account.TENDANGNHAP || '';
    document.getElementById('acc-matkhau').value = '';
    document.getElementById('acc-chucvu').value = account.CHUCVU || 'CAN_BO_NGHIEP_VU';
    document.getElementById('acc-trangthai').value = account.TRANGTHAI ? 'true' : 'false';

    modal.dataset.editId = account.MATAIKHOAN;
    modal.classList.add('show');

    document.getElementById('acc-cancel').onclick = () => hideAccountModal();
    document.getElementById('acc-save').onclick = async () => {
      const hoten = document.getElementById('acc-hoten').value.trim();
      const tendangnhap = document.getElementById('acc-tendangnhap').value.trim();
      const matkhau = document.getElementById('acc-matkhau').value.trim();
      const chucvu = document.getElementById('acc-chucvu').value;
      const trangthai = document.getElementById('acc-trangthai').value === 'true';
      const id = modal.dataset.editId;

      if (!hoten || !tendangnhap || !chucvu) {
        alert('⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc!');
        return;
      }

      NProgress.start();
      try {
        const res = await fetch(`/api/v1/accounts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ hoten, tendangnhap, matkhau, chucvu, trangthai })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Cập nhật thất bại');

        if (data.forceLogout) {
          alert('✅ Cập nhật thành công. Vui lòng đăng nhập lại!');
          window.location.href = 'index.html';
          return;
        }

        alert('✅ Cập nhật thành công!');
        hideAccountModal();
        await loadAccounts();
      } catch (err) {
        alert('❌ ' + err.message);
      } finally {
        NProgress.done();
      }
    };

    // Close button (x)
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) closeBtn.onclick = () => hideAccountModal();
  }

  function hideAccountModal() {
    const modal = document.getElementById('account-modal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.dataset.editId = '';
    document.getElementById('acc-matkhau').value = '';
  }

  // === Gọi lần đầu ===
  await loadAccounts();
}

// Nếu người dùng F5 reload trực tiếp vào trang này
document.addEventListener("DOMContentLoaded", async () => {
  const isAccountsPage = window.location.pathname.includes("accounts.html");
  if (isAccountsPage) await initAccountsPage();
});