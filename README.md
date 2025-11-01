# HRK - Hệ thống Quản lý Nhà hàng

## 📋 Mục đích của Project

HRK là một hệ thống quản lý nhà hàng hiện đại được xây dựng bằng Next.js và TypeORM, giúp:

- **Quản lý menu và sản phẩm**: Quản trị viên có thể dễ dàng thêm, sửa, xóa sản phẩm và danh mục
- **Quản lý đơn hàng**: Theo dõi và xử lý đơn hàng từ khách hàng một cách hiệu quả
- **Quản lý bàn ăn**: Quản lý trạng thái bàn và tích hợp QR code check-in
- **Báo cáo và thống kê**: Xuất báo cáo Excel với đầy đủ thông tin doanh thu và sản phẩm bán chạy
- **Trải nghiệm khách hàng**: Giao diện thân thiện, đặt món dễ dàng, thanh toán tiện lợi

## ✨ Chức năng của Project

### 👨‍💼 Dành cho Admin

#### 1. Quản lý Sản phẩm
- Thêm, sửa, xóa sản phẩm
- Upload hình ảnh sản phẩm
- Gán nhiều danh mục cho một sản phẩm
- Quản lý số lượng tồn kho (stock)
- Hiển thị sản phẩm ngay sau khi tạo (không cần reload)

#### 2. Quản lý Danh mục
- Tạo, sửa, xóa danh mục
- Phân loại sản phẩm theo danh mục

#### 3. Quản lý Đơn hàng
- Xem tất cả đơn hàng với bộ lọc theo trạng thái
- Cập nhật trạng thái đơn hàng (Chờ xử lý, Đang xử lý, Hoàn thành, Đã hủy)
- Xem chi tiết đơn hàng (click vào mã đơn)
- Xuất hóa đơn PDF cho từng đơn hàng
- Xuất báo cáo Excel theo tuần/tháng/quý/năm
- Thống kê doanh thu và sản phẩm bán chạy

#### 4. Quản lý Bàn ăn
- Tạo và quản lý bàn ăn
- Tạo QR code cho từng bàn
- Theo dõi trạng thái bàn (Trống, Đang dùng, Đã đặt)
- Thanh toán và xuất hóa đơn cho bàn
- Chọn trạng thái đơn hàng khi thanh toán (Xác nhận thanh toán, Đã xử lý, Đã hủy)

#### 5. Quản lý Người dùng
- Xem danh sách người dùng
- Quản lý quyền truy cập (Admin/Customer)

### 👤 Dành cho Khách hàng

#### 1. Xem Menu
- Duyệt sản phẩm theo danh mục
- Tìm kiếm sản phẩm
- Xem chi tiết sản phẩm

#### 2. Đặt món
- Thêm sản phẩm vào giỏ hàng
- Chọn bàn để đặt món
- Check-in bằng QR code và tự động chọn bàn
- Thanh toán và đặt đơn hàng

#### 3. Theo dõi đơn hàng
- Xem lịch sử đơn hàng của mình
- Theo dõi trạng thái đơn hàng

## 🚀 Các bước để Hoàn thành Project (Setup)

### Bước 1: Cài đặt Dependencies

Mở terminal và chạy lệnh:

```bash
npm install
```

**Hình ảnh minh họa:**
<!-- ![npm install](images/setup-1-npm-install.png) -->

---

### Bước 2: Cấu hình Database

Tạo file `.env` trong thư mục gốc với nội dung:

```env
DATABASE_URL=mongodb://localhost:27017/hrk
JWT_SECRET=your-secret-key-here
```

**Hình ảnh minh họa:**
<!-- ![.env file](images/setup-2-env-file.png) -->

**Lưu ý:**
- Thay `your-secret-key-here` bằng một chuỗi bí mật ngẫu nhiên
- Đảm bảo MongoDB đang chạy trên máy của bạn

---

### Bước 3: Khởi tạo Admin User

Chạy lệnh để tạo tài khoản admin mặc định:

```bash
npm run dev
```

Sau đó truy cập: `http://localhost:3000/api/init-admin`

**Hình ảnh minh họa:**
<!-- ![Init admin](images/setup-3-init-admin.png) -->

---

### Bước 4: Chạy Project

Chạy lệnh để khởi động development server:

```bash
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`

**Hình ảnh minh họa:**
<!-- ![Running project](images/setup-4-running.png) -->

**Thông tin đăng nhập mặc định:**
- Email: `admin@example.com`
- Password: `admin123`

**Hình ảnh minh họa:**
<!-- ![Login page](images/setup-5-login.png) -->

---

### Bước 5: Build Production

Để build project cho production:

```bash
npm run build
```

**Hình ảnh minh họa:**
<!-- ![Build production](images/setup-6-build.png) -->

---

## 📦 Công nghệ sử dụng

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **ORM**: TypeORM
- **Authentication**: JWT
- **File Upload**: Next.js API với multer

---

## 🌐 Deploy lên Heroku

### Bước 1: Cài đặt Heroku CLI

Tải và cài đặt Heroku CLI từ: https://devcenter.heroku.com/articles/heroku-cli

**Hình ảnh minh họa:**
<!-- ![Heroku CLI installation](images/deploy-1-heroku-cli.png) -->

---

### Bước 2: Đăng nhập Heroku

Mở terminal và đăng nhập vào Heroku:

```bash
heroku login
```

**Hình ảnh minh họa:**
<!-- ![Heroku login](images/deploy-2-heroku-login.png) -->

---

### Bước 3: Tạo Heroku App

Tạo một ứng dụng mới trên Heroku:

```bash
heroku create hrk-restaurant-app
```

**Lưu ý**: Thay `hrk-restaurant-app` bằng tên bạn muốn (phải unique)

**Hình ảnh minh họa:**
<!-- ![Create Heroku app](images/deploy-3-create-app.png) -->

---

### Bước 4: Thêm MongoDB Atlas

1. Truy cập MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Tạo cluster mới
3. Tạo database user
4. Whitelist IP `0.0.0.0/0` để cho phép kết nối từ mọi nơi
5. Lấy connection string

**Hình ảnh minh họa:**
<!-- ![MongoDB Atlas setup](images/deploy-4-mongodb-atlas.png) -->

---

### Bước 5: Cấu hình Environment Variables

Thiết lập các biến môi trường trên Heroku:

```bash
heroku config:set DATABASE_URL="your-mongodb-atlas-connection-string"
heroku config:set JWT_SECRET="your-random-secret-key"
```

**Hình ảnh minh họa:**
<!-- ![Heroku config vars](images/deploy-5-config-vars.png) -->

**Hoặc thông qua Heroku Dashboard:**
1. Vào Settings → Config Vars
2. Thêm `DATABASE_URL` và `JWT_SECRET`

**Hình ảnh minh họa:**
<!-- ![Heroku dashboard config](images/deploy-5-dashboard-config.png) -->

---

### Bước 6: Deploy Code lên Heroku

Nếu đã có git repository:

```bash
git push heroku main
```

**Hình ảnh minh họa:**
<!-- ![Git push to Heroku](images/deploy-6-git-push.png) -->

**Nếu chưa có git repository:**

```bash
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a hrk-restaurant-app
git push heroku main
```

**Hình ảnh minh họa:**
<!-- ![Git init and push](images/deploy-6-git-init.png) -->

---

### Bước 7: Chạy Migration và Init Admin

Sau khi deploy thành công, khởi tạo admin user:

```bash
heroku run npm run init:admin
```

Hoặc truy cập: `https://your-app-name.herokuapp.com/api/init-admin`

**Hình ảnh minh họa:**
<!-- ![Init admin on Heroku](images/deploy-7-init-admin.png) -->

---

### Bước 8: Kiểm tra Deployment

Truy cập ứng dụng của bạn tại:

```
https://your-app-name.herokuapp.com
```

**Hình ảnh minh họa:**
<!-- ![Heroku app running](images/deploy-8-app-running.png) -->

---

### Bước 9: Xem Logs (Nếu có lỗi)

Để xem logs của ứng dụng:

```bash
heroku logs --tail
```

**Hình ảnh minh họa:**
<!-- ![Heroku logs](images/deploy-9-logs.png) -->

---

## 📝 Scripts có sẵn

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Kiểm tra lỗi linting

---

## 🔒 Bảo mật

- Passwords được hash bằng bcrypt
- JWT tokens cho authentication
- Role-based access control (Admin/Customer)
- Environment variables cho sensitive data

---

## 📄 License

MIT License

---

## 👥 Contributors

- Development Team

---

## 📞 Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên repository.

---

## 🎯 Roadmap

- [ ] Thêm tính năng đánh giá sản phẩm
- [ ] Tích hợp payment gateway
- [ ] Thêm notification system
- [ ] Mobile app development
- [ ] Multi-language support

---

## 📸 Hướng dẫn thêm ảnh

Để thêm ảnh vào README:

1. Tạo thư mục `images/` trong project root
2. Thêm file ảnh vào thư mục đó
3. Uncomment các dòng `<!-- ![description](images/filename.png) -->` trong README
4. Thay `filename.png` bằng tên file ảnh của bạn

**Ví dụ:**
```markdown
![npm install](images/setup-1-npm-install.png)
```
