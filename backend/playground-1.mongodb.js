/* global use, db */
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// --- SMART HOME PROJECT PLAYGROUND ---

// 1. Chọn database của bạn để làm việc
// Tên database của bạn là 'Smart_home'
use('Smart_home');

// 2. Lấy tất cả tài liệu (document) từ collection 'data_user'
// Bôi đen dòng dưới và nhấn Ctrl+Alt+R (hoặc nút Play) để chạy
db.data_user.find();
const bcrypt = require('bcrypt');
bcrypt.hashSync('123456', 10); // Thay 'matkhaucuaban' bằng mk bạn muốn

// 3. Lấy MỘT tài liệu từ collection 'data_user'
// db.data_user.findOne();

// 4. Đếm tổng số user trong collection 'data_user'
// db.data_user.countDocuments();

// 5. Tìm user theo một điều kiện cụ thể (ví dụ: tìm theo email)
// Thay 'example@email.com' bằng email bạn muốn tìm
// db.data_user.find({ email: 'example@email.com' });

