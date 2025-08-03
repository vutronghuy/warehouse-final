// supplier.controller.js

const Supplier = require('../models/Supplier'); // điều chỉnh lại đường dẫn nếu cần

exports.createSupplier = async (req, res, next) => {
  try {
    // 1. Lấy dữ liệu từ body
    const {
      name,
      phone,
      email,
      address,
      contactPerson,
      status,      // nếu client không gửi, sẽ tự dùng default "active"
    } = req.body;
    // const {createby} = req.params; // tạo ra function check xem user đó là admin tạo không.

    // 2. Kiểm tra bắt buộc
    if (!name) {
      return res.status(400).json({ message: 'Tên supplier (name) là bắt buộc.' });
    }
    // if (!req.user || !req.user._id) {
    //   // Giả sử bạn đã có middleware xác thực gán req.user
    //   return res.status(401).json({ message: 'Không có thông tin người dùng tạo.' });
    // }

    // 3. Chuẩn bị payload
    const payload = {
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      email: email ? email.toLowerCase().trim() : undefined,
      address: address ? address.trim() : undefined,
      contactPerson: contactPerson ? contactPerson.trim() : undefined,
      status, // enum ["active", "inactive"]
      // createdBy: req.user._id,
    };

    // 4. Tạo supplier trong DB
    const newSupplier = await Supplier.create(payload);

    // 5. Trả về kết quả
    return res.status(201).json({
      message: 'Tạo supplier thành công.',
      data: newSupplier,
    });
  } catch (err) {
    // 6. Bắt lỗi duplicate key (unique fields: name, email)
    if (err.code === 11000) {
      // Lấy ra field bị trùng từ err.keyValue
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        message: `Giá trị ${field} đã tồn tại, vui lòng sử dụng ${field} khác.`,
      });
    }
    // 7. Các lỗi khác
    console.error('Create supplier error:', err);
    return res.status(500).json({
      message: 'Đã có lỗi xảy ra khi tạo supplier.',
      error: err.message,
    });
  }
};
