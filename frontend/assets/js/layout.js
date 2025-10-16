// layout.js — dùng chung cho mọi trang
document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ Nạp navbar và sidebar từ partials
  await loadLayout();

  // 2️⃣ Sau khi layout sẵn sàng, gọi API user
  await initUserAndMenu();
});

// === Hàm nạp giao diện navbar + sidebar ===
async function loadLayout() {
  // Thêm navbar vào đầu body
  const navbarHTML = await fetch("partials/navbar.html").then(res => res.text());
  document.body.insertAdjacentHTML("afterbegin", navbarHTML);

  // Nếu chưa có main, tạo main
  let main = document.querySelector("main");
  if (!main) {
    main = document.createElement("main");
    main.className = "dashboard";
    document.body.appendChild(main);
  }

  // Thêm sidebar vào đầu main
  const sidebarHTML = await fetch("partials/sidebar.html").then(res => res.text());
  main.insertAdjacentHTML("afterbegin", sidebarHTML);

  setupLayoutEvents();
}

// === Hàm gắn sự kiện toggle + logout ===
function setupLayoutEvents() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("menuToggle");
  const logoutBtn = document.getElementById("logoutBtn");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
      localStorage.setItem("sidebarHidden", sidebar.classList.contains("hidden"));
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "index.html";
    });
  }

  // Giữ trạng thái sidebar
  const wasHidden = localStorage.getItem("sidebarHidden") === "true";
  if (wasHidden) sidebar.classList.add("hidden");
}

// === Hàm khởi tạo user + menu ===
async function initUserAndMenu() {
  try {
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    if (!res.ok) throw new Error("Token không hợp lệ");

    const user = await res.json();
    const { username, role } = user;

    // Cập nhật thông tin user
    document.getElementById("username").textContent = username;
    document.getElementById("role").textContent =
      role === "TO_TRUONG"
        ? "Tổ trưởng"
        : role === "TO_PHO"
        ? "Tổ phó"
        : "Cán bộ nghiệp vụ";

    // Sinh menu theo vai trò
    renderMenu(role);
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
  }
}

// === Hàm sinh menu động theo vai trò ===
function renderMenu(role) {
  const menu = document.getElementById("menu");
  if (!menu) return;

  const menuItems = [
    { name: "Dashboard", href: "dashboard.html", roles: ["ALL"] },
    { name: "Quản lý hộ khẩu", href: "households.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Quản lý nhân khẩu", href: "citizens.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Tạm trú / Tạm vắng", href: "temp.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Thống kê & Báo cáo", href: "reports.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Quản lý tài khoản", href: "accounts.html", roles: ["TO_TRUONG","TO_PHO"] },
    { name: "Quản lý nhà văn hóa", href: "nvh.html", roles: ["TO_TRUONG","TO_PHO", "CAN_BO_NGHIEP_VU"] },
  ];

  menu.innerHTML = "";

  menuItems.forEach(item => {
    if (item.roles.includes("ALL") || item.roles.includes(role)) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${item.href}">${item.name}</a>`;
      menu.appendChild(li);
    }
  });

  // Đánh dấu trang hiện tại
  const current = window.location.pathname.split("/").pop();
  const currentLink = Array.from(menu.querySelectorAll("a")).find(a => a.getAttribute("href") === current);
  if (currentLink) currentLink.classList.add("active");
}
