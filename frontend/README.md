# Hệ thống quản lý file và dữ liệu

Hệ thống quản lý file và dữ liệu cho phép người dùng lưu trữ,
quản lý, chia sẻ và kiểm soát quyền truy cập đối với file và thư mục.

## 1. Chức năng chính

- Đăng ký tài khoản
- Đăng nhập
- Refresh Access Token
- Đăng xuất
- Quản lý thông tin cá nhân
- Đổi mật khẩu
- Quản lý thư mục
- Quản lý file
- Upload file
- Chunk Upload
- Resume Upload
- Download file
- Preview file
- Copy file
- Move file
- Rename file
- Thùng rác
- Khôi phục file/thư mục
- Xóa vĩnh viễn
- Share Link
- Permission
- Activity Log
- Audit Log
- Quản trị hệ thống

## 2. Kiến trúc

Hệ thống gồm hai thành phần chính:

```text
Frontend
    React + Vite
        |
        | HTTP/REST API
        ↓
Backend
    Node.js + Express
        |
        ↓
MongoDB
```
