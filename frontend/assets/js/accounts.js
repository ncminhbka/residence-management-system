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

    try {
      const res = await fetch("/api/v1/accounts/", { credentials: "include" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể tải danh sách tài khoản");

      const accounts = result.data || [];
      tableBody.innerHTML = accounts.length
        ? ""
        : "<tr><td colspan='6'>Chưa có tài khoản nào</td></tr>";

      accounts.forEach(acc => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${acc.MATAIKHOAN}</td>
          <td>${acc.HOTEN}</td>
          <td>${acc.TENDANGNHAP}</td>
          <td>${acc.CHUCVU}</td>
          <td>${acc.TRANGTHAI === 1 ? "🟢 Kích hoạt" : "🔴 Vô hiệu"}</td>
          <td>
            <button class="btn-edit" 
                    data-id="${acc.MATAIKHOAN}"
                    data-hoten="${acc.HOTEN}"
                    data-tendangnhap="${acc.TENDANGNHAP}"
                    data-chucvu="${acc.CHUCVU}"
                    data-trangthai="${acc.TRANGTHAI}">
              ✏️
            </button>
            <button class="btn-delete" data-id="${acc.MATAIKHOAN}">🗑️</button>
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

  // === Gắn sự kiện cho nút sửa / xoá ===
  function bindRowEvents() {
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Bạn có chắc muốn xóa tài khoản này?")) {
          await deleteAccount(id);
        }
      });
    });

    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", e => {
        const b = e.currentTarget;
        openEditPopup({
          id: b.dataset.id,
          hoten: b.dataset.hoten,
          tendangnhap: b.dataset.tendangnhap,
          chucvu: b.dataset.chucvu,
          trangthai: b.dataset.trangthai,
        });
      });
    });
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

  // === Popup sửa tài khoản (giữa màn hình) ===
  function openEditPopup(account) {
    const oldPopup = document.querySelector(".popup-overlay");
    if (oldPopup) oldPopup.remove();

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.innerHTML = `
      <div class="popup-card">
        <h3>📝 Cập nhật tài khoản</h3>

        <label>Họ tên:</label>
        <input id="edit-hoten" value="${account.hoten}" />

        <label>Tên đăng nhập:</label>
        <input id="edit-tendangnhap" value="${account.tendangnhap}" />

        <label>Mật khẩu mới (nếu muốn đổi):</label>
        <input id="edit-matkhau" type="password" placeholder="Để trống nếu không đổi" />

        <label>Chức vụ:</label>
        <select id="edit-chucvu">
          <option value="TO_TRUONG" ${account.chucvu === "TO_TRUONG" ? "selected" : ""}>Tổ trưởng</option>
          <option value="TO_PHO" ${account.chucvu === "TO_PHO" ? "selected" : ""}>Tổ phó</option>
          <option value="CAN_BO_NGHIEP_VU" ${account.chucvu === "CAN_BO_NGHIEP_VU" ? "selected" : ""}>Cán bộ nghiệp vụ</option>
        </select>

        <label>Trạng thái:</label>
        <select id="edit-trangthai">
          <option value="1" ${account.trangthai == 1 ? "selected" : ""}>🟢 Kích hoạt</option>
          <option value="0" ${account.trangthai == 0 ? "selected" : ""}>🔴 Vô hiệu</option>
        </select>

        <div class="popup-btns">
          <button id="saveEdit">💾 Lưu</button>
          <button id="cancelEdit">❌ Hủy</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Style popup giữa màn hình
    const card = overlay.querySelector(".popup-card");
    Object.assign(card.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 1001,
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    });
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });

    document.getElementById("cancelEdit").onclick = () => overlay.remove();
    document.getElementById("saveEdit").onclick = async () => {
      const hoten = document.getElementById("edit-hoten").value.trim();
      const tendangnhap = document.getElementById("edit-tendangnhap").value.trim();
      const matkhau = document.getElementById("edit-matkhau").value.trim();
      const chucvu = document.getElementById("edit-chucvu").value;
      const trangthai = parseInt(document.getElementById("edit-trangthai").value);

      if (!hoten || !tendangnhap || !chucvu) {
        alert("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc!");
        return;
      }

      NProgress.start();
      try {
        const res = await fetch(`/api/v1/accounts/${account.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ hoten, tendangnhap, matkhau, chucvu, trangthai }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Cập nhật thất bại");

        if (data.forceLogout) {
          alert("✅ Cập nhật thành công. Vui lòng đăng nhập lại!");
          window.location.href = "index.html";
        } else {
          alert("✅ Cập nhật thành công!");
          overlay.remove();
          await loadAccounts();
        }
      } catch (err) {
        alert("❌ " + err.message);
      } finally {
        NProgress.done();
      }
    };
  }

  // === Gọi lần đầu ===
  await loadAccounts();
}

// Nếu người dùng F5 reload trực tiếp vào trang này
document.addEventListener("DOMContentLoaded", async () => {
  const isAccountsPage = window.location.pathname.includes("accounts.html");
  if (isAccountsPage) await initAccountsPage();
});
