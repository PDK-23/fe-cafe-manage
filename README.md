# Cafe Flow · Frontend

React 19, Vite 7, TypeScript, Tailwind CSS, TanStack Query và Zustand. MVVM: `src/models`, `src/viewmodels`, `src/views`.

```powershell
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Cần bốn backend service ở cổng 8080–8083. Vite proxy `/api/auth`, `/api/catalog`, `/api/pos`, `/api/permissions` sang service tương ứng.

`npm run lint`, `npm run build` kiểm tra tĩnh/build. `npm test` chạy Playwright với Edge, cần frontend và backend demo đã khởi động. Test tạo dữ liệu: không chạy trên dữ liệu bán hàng thật.

Xem [README chính](../README.md) để cấu hình backend/MySQL và tài khoản mẫu.

Admin mở `/phan-quyen` → **Cấp quyền theo vai trò**, chọn Thu ngân hoặc Quản lý, tích chức năng và bấm **Lưu phân quyền**. Menu và quyền API được lưu cùng nhau; cấu hình này thay thế quyền riêng hiện tại của vai trò đang chọn. Tab **Quyền API nâng cao** vẫn cho phép cấu hình endpoint riêng.

`npm run test:isolated` khởi động các JAR đã build với H2 riêng trên cổng 8180–8183 và Vite trên 5174, chạy Playwright rồi dừng các tiến trình kiểm thử. Không sửa dữ liệu MySQL local. Chạy `mvnw.cmd package` tại backend trước khi kiểm thử. Cần Java 21 và Microsoft Edge.
