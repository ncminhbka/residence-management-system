// === Hàm tải nội dung động (AJAX) ===
async function loadContent(url) {
    const contentSection = document.querySelector(".content");
    if (!contentSection) return;

    contentSection.classList.add("loading");

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Không thể tải nội dung: ${url}`);

        const newHTML = await response.text();
        contentSection.innerHTML = newHTML;

        // Cập nhật URL (SPA-style)
        window.history.pushState({}, '', url);
    } catch (error) {
        console.error("Lỗi khi tải nội dung trang:", error);
        contentSection.innerHTML = `<p style="color: red;">Đã xảy ra lỗi khi tải nội dung.</p>`;
    } finally {
        contentSection.classList.remove("loading");
    }
}


// === Hàm nạp giao diện navbar + sidebar ===
async function loadLayout() {
    // ⚙️ Chặn việc nạp lại layout nhiều lần
    if (window.__layoutLoaded) return;
    window.__layoutLoaded = true;

    // Nạp navbar
    const navbarHTML = await fetch("partials/navbar.html").then(res => res.text());
    document.body.insertAdjacentHTML("afterbegin", navbarHTML);

    // Nếu chưa có <main>, tạo mới
    let main = document.querySelector("main");
    if (!main) {
        main = document.createElement("main");
        main.className = "dashboard";
        document.body.appendChild(main);
    }

    // Nạp sidebar
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

        window.__currentUserRole = role;

        // Cập nhật thông tin user
        const usernameEl = document.getElementById("username");
        const roleEl = document.getElementById("role");
        if (usernameEl) usernameEl.textContent = username;
        if (roleEl)
            roleEl.textContent =
                role === "TO_TRUONG" ? "Tổ trưởng"
                    : role === "TO_PHO" ? "Tổ phó"
                        : "Cán bộ nghiệp vụ";

        // Sinh menu
        renderMenu(role);

        // Tải trang mặc định nếu đang ở index.html
        const currentPath = window.location.pathname.split("/").pop();
        if (!currentPath || currentPath === "index.html") {
            loadContent("dashboard.html");
        }

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
        { name: "Quản lý tài khoản", href: "accounts.html", roles: ["TO_TRUONG", "TO_PHO"] },
        { name: "Quản lý nhà văn hóa", href: "nvh.html", roles: ["TO_TRUONG", "TO_PHO", "CAN_BO_NGHIEP_VU"] },
    ];

    menu.innerHTML = "";

    menuItems.forEach(item => {
        if (item.roles.includes("ALL") || item.roles.includes(role)) {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = item.href;
            a.textContent = item.name;

            a.addEventListener("click", e => {
                e.preventDefault();
                loadContent(item.href);
                menu.querySelectorAll("a").forEach(link => link.classList.remove("active"));
                a.classList.add("active");
            });

            li.appendChild(a);
            menu.appendChild(li);
        }
    });

    const current = window.location.pathname.split("/").pop() || "dashboard.html";
    const currentLink = Array.from(menu.querySelectorAll("a"))
        .find(a => a.getAttribute("href") === current);
    if (currentLink) currentLink.classList.add("active");
}


// === Khởi tạo layout + auth (chỉ 1 lần duy nhất) ===
document.addEventListener("DOMContentLoaded", async () => {
    if (!window.__layoutLoaded) {
        await loadLayout();
        window.__layoutLoaded = true;
    }
    await initUserAndMenu();
});


// === Hàm wrapper cho các trang con (vd: accounts.js) ===
window.initLayoutAndAuth = async function () {
    if (!window.__layoutLoaded) {
        await loadLayout();
        window.__layoutLoaded = true;
    }
    await initUserAndMenu();
};
