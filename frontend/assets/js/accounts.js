document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Chờ layout và user load xong hoàn toàn
  await initLayoutAndAuth();

  // === BẮT ĐẦU KIỂM TRA PHÂN QUYỀN ===
  const allowedRoles = ["TO_TRUONG", "TO_PHO"];
  const userRole = window.__currentUserRole;

  if (!allowedRoles.includes(userRole)) {
    // Nếu không đủ quyền, hiển thị thông báo lỗi và dừng lại
    const contentSection = document.querySelector(".content");
    if (contentSection) {
        contentSection.innerHTML = `
            <h2 style="color: red;">❌ TRUY CẬP BỊ TỪ CHỐI</h2>
            <p>Tài khoản của bạn (${userRole}) không có quyền quản lý tài khoản.</p>
        `;
    }
    console.error("❌ Người dùng không đủ quyền truy cập trang quản lý tài khoản.");
    return; // DỪNG VIỆC THỰC THI CODE TIẾP THEO
  }
  // === KẾT THÚC KIỂM TRA PHÂN QUYỀN ===

  // ✅ Đảm bảo layout render xong hẳn (đề phòng DOM chưa sẵn)
  let tableBody = null;
  for (let i = 0; i < 10; i++) {
    tableBody = document.querySelector("#accountsTable tbody");
    if (tableBody) break;
    await new Promise(r => setTimeout(r, 100));
  }

  if (!tableBody) {
    console.error("❌ Không tìm thấy bảng #accountsTable trong DOM!");
    return;
  }

  const form = document.getElementById("createAccountForm");
  const msg = document.getElementById("accountMessage");

  // ======= HÀM: Load danh sách tài khoản =======
  async function loadAccounts() {
    console.log("🔍 Bắt đầu loadAccounts()");
    tableBody.innerHTML = "<tr><td colspan='6'>Đang tải...</td></tr>";

    try {
      const res = await fetch("/api/v1/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Không thể tải danh sách tài khoản");

      const result = await res.json();
      console.log("👉 Dữ liệu từ API:", result);
      const accounts = result.data || [];

      if (accounts.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='6'>Chưa có tài khoản nào</td></tr>";
        return;
      }

      tableBody.innerHTML = "";
      accounts.forEach(acc => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${acc.MATAIKHOAN}</td>
          <td>${acc.HOTEN}</td>
          <td>${acc.TENDANGNHAP}</td>
          <td>${acc.CHUCVU}</td>
          <td>🟢 Kích hoạt</td>
          <td>---</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      tableBody.innerHTML = "<tr><td colspan='6'>Lỗi khi tải dữ liệu.</td></tr>";
    }
  }

  // ✅ Gọi khi DOM sẵn sàng
  await loadAccounts();

  // ======= HÀM: Gửi form tạo tài khoản mới =======
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const hoten = document.getElementById("hoten").value.trim();
    const tendangnhap = document.getElementById("tendangnhap").value.trim();
    const matkhau = document.getElementById("matkhau").value.trim();
    const chucvu = document.getElementById("chucvu").value;

    // Kiểm tra đầu vào cơ bản
    if (!hoten || !tendangnhap || !matkhau || !chucvu) {
      msg.style.color = "red";
      msg.textContent = "⚠️ Vui lòng nhập đầy đủ thông tin!";
      return;
    }

    try {
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hoten,
          tendangnhap,
          matkhau,
          chucvu
        }),
      });



      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo tài khoản thất bại");

      msg.style.color = "green";
      msg.textContent = "✅ Tạo tài khoản thành công!";
      form.reset();

      await loadAccounts(); // Cập nhật bảng ngay
    } catch (err) {
      console.error("❌ Lỗi khi tạo tài khoản:", err);
      msg.style.color = "red";
      msg.textContent = "❌ " + err.message;
    }
  });
});
