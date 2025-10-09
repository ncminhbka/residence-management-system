// app.js
// Dùng chung cho toàn hệ thống frontend
// Có thể chứa hàm tiện ích như: gọi API, xử lý token, format ngày...

async function fetchWithAuth(url, options = {}) {
  // Không dùng localStorage nữa
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  return fetch(url, { ...options, headers, credentials: 'include' });
}
