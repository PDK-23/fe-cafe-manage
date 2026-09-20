# Cafe Flow · Frontend

React 19, Vite 7, TypeScript, Tailwind CSS, TanStack Query và Zustand. MVVM: `src/models`, `src/viewmodels`, `src/views`.

Toàn bộ màn hình dùng [shadcn/ui](https://ui.shadcn.com/docs/installation/vite). Component chuẩn nằm trong `src/components/ui/`: Sidebar/Sheet, Dialog/AlertDialog, Button, Input/Textarea/NativeSelect, Checkbox/RadioGroup, Tabs/ToggleGroup, Table, Card, Badge, Avatar, Alert, Empty, Spinner, Tooltip, Progress và Chart. Thông báo dùng Sonner; biểu đồ dùng Chart của shadcn với Recharts.

Cấu hình ở `components.json`, alias `@/` trỏ tới `src/`, màu và token giao diện ở `src/shadcn.css`. `src/components/ui.tsx` chỉ ghép các component chuẩn thành hộp thoại, trường nhập và trạng thái dùng chung. CSS riêng dành cho bố cục POS, trang nghiệp vụ và hóa đơn in. Sidebar giữ kiểu xanh đậm, icon phía trên và tên mục phía dưới. Khung làm việc vừa chiều cao màn hình; bảng, danh sách món và danh sách quyền cuộn bên trong, giữ tiêu đề và nút thao tác ở vị trí cố định. POS dưới 1200px chuyển giữa Bàn / Thực đơn / Đơn hàng, giữ nguyên đơn đang thao tác. Các nhóm màn hình được tải theo nhu cầu bằng `React.lazy`.

Thêm component bằng `npx shadcn@latest add <tên-component>`. shadcn đưa mã component vào dự án, vì vậy thư mục `src/components/ui/` chứa mã thư viện để tái sử dụng và cập nhật; không viết lại các primitive này trong màn hình. Component dùng hàm `cn` từ `@/lib/utils` và icon Lucide.

```powershell
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Cần bốn backend service ở cổng 8080–8083. Vite proxy `/api/auth`, `/api/catalog`, `/api/pos`, `/api/permissions` sang service tương ứng.

`npm run lint`, `npm run build` kiểm tra tĩnh/build. `npm test` chạy Playwright với Edge, cần frontend và backend demo đã khởi động. Test tạo dữ liệu: không chạy trên dữ liệu bán hàng thật.

Xem [README chính](../README.md) để cấu hình backend/MySQL và tài khoản mẫu.

Admin mở `/phan-quyen` → **Cấp quyền theo vai trò**, chọn Thu ngân hoặc Quản lý, tích chức năng và bấm **Lưu phân quyền**. Menu và quyền API được lưu cùng nhau; cấu hình này thay thế quyền riêng hiện tại của vai trò đang chọn. Tab **Quyền API nâng cao** vẫn cho phép cấu hình endpoint riêng.

`npm run test:isolated` khởi động các JAR đã build với H2 riêng trên cổng 8180–8183 và Vite trên 5174, chạy Playwright rồi dừng các tiến trình kiểm thử. Không sửa dữ liệu MySQL local. Chạy `mvnw.cmd package` tại backend trước khi kiểm thử. Cần Java 21 và Microsoft Edge.
