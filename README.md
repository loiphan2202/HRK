# HRK - Hệ thống Quản lý Nhà hàng

## 📋 Mục đích của Project

HRK là một hệ thống quản lý nhà hàng hiện đại được xây dựng bằng Nodejs, Next.js và TypeORM, giúp:

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

## 🛠️ Các bước Xây dựng Project (Development Steps)

### Bước 1: Khởi tạo Next.js Project

Tạo project Next.js mới với TypeScript:

```bash
npx create-next-app@latest hrk --typescript --tailwind --app --no-src-dir
cd hrk
```

---

### Bước 2: Cài đặt Dependencies cơ bản

Cài đặt các package cần thiết:

```bash
# Authentication & Security
npm install @types/bcrypt bcrypt
npm install @types/jsonwebtoken jsonwebtoken

# Database
npm install typeorm mongodb reflect-metadata

# QR Code
npm install qrcode @types/qrcode

# UI Components
npx shadcn@latest init
npx shadcn@latest add button card input label select table badge dialog toast checkbox alert-dialog dropdown-menu textarea
```

---

### Bước 3: Cấu hình TypeORM

Tạo file `src/lib/typeorm.ts` để cấu hình kết nối database với MongoDB:

```typescript
import { DataSource } from 'typeorm';
import 'reflect-metadata';
// Import các entities...

export async function getDataSource(): Promise<DataSource> {
  // Cấu hình DataSource
}
```

---

### Bước 4: Tạo Database Entities

Tạo các entity cho database:

1. **User Entity** (`src/entities/User.ts`)
   - Thông tin người dùng (email, password, role)
   - Phân quyền Admin/Customer

2. **Category Entity** (`src/entities/Category.ts`)
   - Danh mục sản phẩm

3. **Product Entity** (`src/entities/Product.ts`)
   - Thông tin sản phẩm (name, price, stock, image)

4. **ProductCategory Entity** (`src/entities/ProductCategory.ts`)
   - Quan hệ many-to-many giữa Product và Category

5. **Table Entity** (`src/entities/Table.ts`)
   - Thông tin bàn ăn (number, status, token, qrCode)

6. **Order Entity** (`src/entities/Order.ts`)
   - Thông tin đơn hàng (userId, tableId, total, status)

7. **OrderProduct Entity** (`src/entities/OrderProduct.ts`)
   - Chi tiết sản phẩm trong đơn hàng

---

### Bước 5: Tạo Repository Layer

Tạo các repository để tương tác với database:

1. `BaseRepositoryTypeORM` - Repository cơ sở
2. `UserRepositoryTypeORM` - Quản lý users
3. `ProductRepositoryTypeORM` - Quản lý products với quan hệ many-to-many
4. `CategoryRepositoryTypeORM` - Quản lý categories
5. `OrderRepositoryTypeORM` - Quản lý orders
6. `TableRepositoryTypeORM` - Quản lý tables

---

### Bước 6: Tạo Service Layer

Tạo các service để xử lý business logic:

1. `UserServiceTypeORM` - Logic xử lý user (register, login, update)
2. `ProductServiceTypeORM` - Logic xử lý product (CRUD, update stock)
3. `CategoryServiceTypeORM` - Logic xử lý category
4. `OrderServiceTypeORM` - Logic xử lý order (create, update status, validate)
5. `TableServiceTypeORM` - Logic xử lý table (generate QR, check-in)
6. `OrderStatsServiceTypeORM` - Thống kê đơn hàng

---

### Bước 7: Tạo API Routes

Tạo các API endpoints trong `src/app/api/`:

1. **Authentication APIs**
   - `POST /api/auth/register` - Đăng ký
   - `POST /api/auth/login` - Đăng nhập

2. **Product APIs**
   - `GET /api/products` - Lấy danh sách sản phẩm
   - `POST /api/products` - Tạo sản phẩm mới
   - `PUT /api/products/[id]` - Cập nhật sản phẩm
   - `DELETE /api/products/[id]` - Xóa sản phẩm

3. **Category APIs**
   - `GET /api/categories` - Lấy danh sách danh mục
   - `POST /api/categories` - Tạo danh mục mới
   - `PUT /api/categories/[id]` - Cập nhật danh mục
   - `DELETE /api/categories/[id]` - Xóa danh mục

4. **Order APIs**
   - `GET /api/orders` - Lấy danh sách đơn hàng
   - `POST /api/orders` - Tạo đơn hàng mới
   - `PUT /api/orders/[id]` - Cập nhật đơn hàng
   - `GET /api/orders/stats` - Thống kê đơn hàng

5. **Table APIs**
   - `GET /api/tables` - Lấy danh sách bàn
   - `POST /api/tables` - Tạo bàn mới
   - `POST /api/tables/[id]/qr` - Tạo QR code cho bàn
   - `POST /api/tables/check-in` - Check-in bằng token

---

### Bước 8: Tạo UI Components

Sử dụng Shadcn UI để tạo các components:

1. **Layout Components**
   - `MainNav` - Navigation bar với authentication
   - `Footer` - Footer của trang

2. **Product Components**
   - `ProductCard` - Card hiển thị sản phẩm
   - `ProductList` - Danh sách sản phẩm với filter
   - `CreateProduct` - Form tạo sản phẩm
   - `EditProduct` - Form chỉnh sửa sản phẩm

3. **Order Components**
   - Cart context và components

4. **Admin Components**
   - Admin dashboard
   - Order management với modal chi tiết
   - Table management với QR code
   - Product management

---

### Bước 9: Tạo Pages

Tạo các trang cho ứng dụng:

**Customer Pages:**
1. `/` - Trang chủ (danh sách sản phẩm)
2. `/[id]` - Chi tiết sản phẩm
3. `/cart` - Giỏ hàng và checkout
4. `/check-in?token=...` - Check-in bàn bằng QR code
5. `/login` - Đăng nhập
6. `/register` - Đăng ký

**Admin Pages:**
1. `/admin` - Dashboard admin
2. `/admin/products` - Quản lý sản phẩm
3. `/admin/categories` - Quản lý danh mục
4. `/admin/orders` - Quản lý đơn hàng
5. `/admin/tables` - Quản lý bàn ăn

---

### Bước 10: Implement Authentication

1. Tạo `AuthContext` để quản lý authentication state
2. Tạo middleware để protect admin routes
3. Implement JWT token storage và validation
4. Tạo protected routes

---

### Bước 11: Implement Cart Functionality

1. Tạo `CartContext` để quản lý giỏ hàng
2. Implement add/remove/update cart items
3. Tích hợp với localStorage để lưu cart
4. Checkout với table selection và QR check-in

---

### Bước 12: Implement QR Code Check-in

1. Tạo QR code generator service
2. Implement check-in API với token validation
3. Auto-select table khi check-in thành công
4. Lưu check-in state trong localStorage

---

### Bước 13: Implement Order Management

1. Tạo order với validation
2. Update order status với thời gian thanh toán
3. Order detail modal với invoice export
4. Excel export với statistics

---

### Bước 14: Testing và Debugging

1. Test các tính năng cơ bản
2. Fix các lỗi TypeScript và ESLint
3. Test với nhiều scenarios
4. Optimize performance

---

## 🚀 Các bước để Setup và Chạy Project

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd hrk
```

---

### Bước 2: Cài đặt Dependencies

Mở terminal và chạy lệnh:

```bash
npm install
```

---

### Bước 3: Cấu hình Database

Tạo file `.env` trong thư mục gốc với nội dung:

```env
DATABASE_URL=mongodb://localhost:27017/hrk
JWT_SECRET=your-secret-key-here
NODE_ENV=development (tùy chọn)
```

---

### Bước 4: Chạy Project

Chạy lệnh để khởi động development server:

```bash
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:3000`

**Thông tin đăng nhập admin mặc định:**
- Email: `admin1@gmail.com`
- Password: `123456`

---

### Bước 6: Build Production

Để build project cho production:

```bash
npm run build
```

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

---

### Bước 2: Đăng nhập Heroku

Mở terminal và đăng nhập vào Heroku:

```bash
heroku login
```

---

### Bước 3: Tạo Heroku App

Tạo một ứng dụng mới trên Heroku:

```bash
heroku create hrk
```

---

### Bước 4: Thêm MongoDB Atlas

1. Truy cập MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Tạo cluster mới
3. Tạo database user
4. Whitelist IP `0.0.0.0/0` để cho phép kết nối từ mọi nơi
5. Lấy connection string

---

### Bước 5: Cấu hình Environment Variables

Thiết lập các biến môi trường trên Heroku:

```bash
heroku config:set DATABASE_URL="your-mongodb-atlas-connection-string"
heroku config:set JWT_SECRET="your-random-secret-key"
```

**Hoặc thông qua Heroku Dashboard:**
1. Vào Settings → Config Vars
2. Thêm `DATABASE_URL` và `JWT_SECRET`

---

### Bước 6: Deploy Code lên Heroku

Nếu đã có git repository:

```bash
git push heroku main
```

**Nếu chưa có git repository:**

```bash
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a hrk
git push heroku main
```

---

### Bước 7: Kiểm tra Deployment

Truy cập ứng dụng tại:

```
https://your-app-name.herokuapp.com
```

---

### Bước 8: Xem Logs (Nếu có lỗi)

Để xem logs của ứng dụng:

```bash
heroku logs --tail
```

---

## 📝 Scripts có sẵn

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Kiểm tra lỗi linting

