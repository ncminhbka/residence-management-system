1. Trước khi chạy dự án cần
- Node.js (tải trên mạng)
- MySQL (tải trên mạng)
2. Clone dự án
- VSCode -> new terminal -> git clone https://github.com/ncminhbka/residence-management-system -> cd backend
- chạy tiếp npm install những thứ sau: express, mysql2, jsonwebtoken, dotenv, cookie-parser, nodemon
3. Tạo file .env trong thư mục backend với nội dung (thay your_password bằng pass MySQL lúc cài đặt)
  PORT=3000
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_password
  DB_NAME=ToDanPho7
4. Mở folder database copy file QLDanCu.sql rồi vào Workbrench chạy query 
5. Đảm bảo server MySQL đã chạy, vào terminal backend chạy nodemon server.js và vào localhost:4000 để xem kết quả
