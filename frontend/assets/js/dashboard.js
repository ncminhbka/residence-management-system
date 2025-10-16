// dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  // Chờ layout load xong
  setTimeout(() => {
    const statsDiv = document.getElementById("quick-stats");
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div class="stat">👪 Tổng hộ khẩu: 123</div>
        <div class="stat">👤 Tổng nhân khẩu: 456</div>
      `;
    }
  }, 500);
});
