// controllers/authController.js
const User = require('../models/User');
const PasswordResetRequest = require('../models/resetpassword/PasswordResetRequest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN;

function parseDurationToMs(str) {
  if (!str || typeof str !== 'string') return null;
  const re = /^(\d+)\s*(d|h|m|s)?$/i;
  const m = str.match(re);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  const unit = (m[2] || 's').toLowerCase();
  switch (unit) {
    case 'd': return val * 24 * 60 * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'm': return val * 60 * 1000;
    case 's': return val * 1000;
    default: return val * 1000;
  }
}

function createAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function createRefreshToken(sub) {
  const tokenId = crypto.randomBytes(16).toString('hex');
  const payload = { sub: String(sub), tokenId };
  return { token: jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN }), tokenId };
}

function setRefreshCookie(res, refreshToken) {
  const maxAge = parseDurationToMs(REFRESH_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
  });
}

// Helper: find user by username OR email
async function findUserByIdentifier(identifier) {
  const q = {
    $or: [
      { 'admin.username': identifier },
      { 'manager.username': identifier },
      { 'staff.username': identifier },
      { 'accounter.username': identifier },
      { 'admin.email': identifier },
      { 'manager.email': identifier },
      { 'staff.email': identifier },
      { 'accounter.email': identifier }
    ]
  };
  return User.findOne(q).lean();
}

// Helper: determine role subdoc from a found user doc (lean)
function findRoleByIdentifier(userDoc, identifier) {
  if (!userDoc) return null;
  if (userDoc.admin && (userDoc.admin.username === identifier || userDoc.admin.email === identifier)) return { roleKey: 'admin', sub: userDoc.admin };
  if (userDoc.manager && (userDoc.manager.username === identifier || userDoc.manager.email === identifier)) return { roleKey: 'manager', sub: userDoc.manager };
  if (userDoc.staff && (userDoc.staff.username === identifier || userDoc.staff.email === identifier)) return { roleKey: 'staff', sub: userDoc.staff };
  if (userDoc.accounter && (userDoc.accounter.username === identifier || userDoc.accounter.email === identifier)) return { roleKey: 'accounter', sub: userDoc.accounter };
  return null;
}

// LOGIN (identifier = username OR email)
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email
    if (!identifier || !password) {
      return res.status(400).json({ ok: false, message: 'Identifier và password là bắt buộc.' });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(401).json({ ok: false, message: 'Sai username/email hoặc password.' });

    const found = findRoleByIdentifier(user, identifier);
    if (!found) return res.status(401).json({ ok: false, message: 'Sai username/email hoặc password.' });

    const { roleKey, sub } = found;

    if (sub.status !== 'active' || sub.isActive === false) {
      return res.status(403).json({ ok: false, message: 'Tài khoản không hoạt động.' });
    }

    const storedPassword = sub.password;
    let passwordMatch = false;
    if (typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, storedPassword);
    } else {
      passwordMatch = password === storedPassword;
    }
    if (!passwordMatch) return res.status(401).json({ ok: false, message: 'Sai username/email hoặc password.' });

    const isSuperAdmin = (roleKey === 'admin' && !!sub.isSuperAdmin);
    const payload = {
      sub: user._id,
      role: user.role || roleKey,
      roleKey,
      isSuperAdmin
    };

    const token = createAccessToken(payload);
    const { token: refreshToken } = createRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    const safeUser = { ...user };
    if (safeUser[roleKey]) {
      delete safeUser[roleKey].password;
      delete safeUser[roleKey].resetToken;
      delete safeUser[roleKey].resetTokenExpires;
    }

    return res.json({
      ok: true,
      message: 'Đăng nhập thành công.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Auth login error:', err);
    return res.status(500).json({ ok: false, message: 'Lỗi server.' });
  }
};

// FORGOT PASSWORD - generate OTP and send to email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Email is required.' });

    // find user by email across roles
    const user = await User.findOne({
      $or: [
        { 'admin.email': email },
        { 'manager.email': email },
        { 'staff.email': email },
        { 'accounter.email': email }
      ]
    });
    if (!user) {
      // For security you may return 200 here so attackers can't enumerate emails.
      return res.status(404).json({ ok: false, message: 'Email không tồn tại trong hệ thống.' });
    }

    // determine roleKey and sub doc
    const roleKey = user.admin?.email === email ? 'admin'
                   : user.manager?.email === email ? 'manager'
                   : user.staff?.email === email ? 'staff'
                   : user.accounter?.email === email ? 'accounter'
                   : null;
    if (!roleKey) return res.status(400).json({ ok: false, message: 'Không xác định được vai trò user.' });

    // generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // save request (use field names matching PasswordResetRequest model)
    const resetReq = await PasswordResetRequest.create({
      userId: user._id,
      roleKey: roleKey,
      email: email,
      otpHash,
      expiresAt: otpExpires
    });

    // Check if email is configured
    const isEmailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS &&
                              process.env.SMTP_USER !== 'your-email@gmail.com' &&
                              process.env.SMTP_PASS !== 'your-16-character-app-password-here';

    if (isEmailConfigured) {
      // send email with OTP via nodemailer (using SMTP env)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });

      const mailOptions = {
        from: `"HinWarehouse System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Mã OTP đặt lại mật khẩu - HinWarehouse',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4b3636; margin: 0; font-size: 24px;">HinWarehouse</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Hệ thống quản lý kho</p>
              </div>

              <h2 style="color: #333; margin-bottom: 20px;">Đặt lại mật khẩu</h2>

              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã OTP bên dưới để tiếp tục:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; border: 2px dashed #4b3636; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #4b3636; letter-spacing: 5px;">${otp}</span>
                </div>
              </div>

              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Lưu ý:</strong> Mã OTP này có hiệu lực trong <strong>15 phút</strong> kể từ khi gửi.
                </p>
              </div>

              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Email này được gửi tự động từ hệ thống HinWarehouse.<br>
                Vui lòng không trả lời email này.
              </p>
            </div>
          </div>
        `,
        text: `
HinWarehouse - Đặt lại mật khẩu

Mã OTP của bạn là: ${otp}

Mã này có hiệu lực trong 15 phút kể từ khi gửi.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

---
HinWarehouse System
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to email: ${email}`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue without failing - for development purposes
        console.log(`Development mode: OTP for ${email} is: ${otp}`);
      }
    } else {
      // Development mode - log OTP to console
      console.log('=== DEVELOPMENT MODE - EMAIL NOT CONFIGURED ===');
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`This OTP expires in 15 minutes`);
      console.log('=== Configure SMTP settings in .env for production ===');
    }

    // Email sent successfully - no need to update as it's already saved
    const message = isEmailConfigured
      ? 'OTP đã được gửi tới email (nếu email tồn tại).'
      : 'OTP đã được tạo (development mode - kiểm tra console server).';

    return res.json({ ok: true, message, requestId: resetReq._id, isDevelopmentMode: !isEmailConfigured });
  } catch (err) {
    console.error('forgotPassword error', err);
    return res.status(500).json({ ok: false, message: 'Lỗi server khi gửi OTP.' });
  }
};

// VERIFY OTP and RESET password in one step (email + otp + newPassword)
exports.verifyOtpAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ ok: false, message: 'email, otp và newPassword là bắt buộc.' });
    }

    // find latest matching reset request (not used, not expired)
    const resetReq = await PasswordResetRequest.findOne({
      email: email,
      expiresAt: { $gt: new Date() },
      used: false
    }).sort({ createdAt: -1 });

    if (!resetReq) return res.status(400).json({ ok: false, message: 'Không tìm thấy yêu cầu đặt lại mật khẩu hợp lệ hoặc đã hết hạn.' });

    // compare otp
    const match = await bcrypt.compare(otp, resetReq.otpHash);
    if (!match) {
      return res.status(400).json({ ok: false, message: 'OTP không đúng.' });
    }

    // find user and update password for correct subdoc
    const user = await User.findById(resetReq.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found.' });

    const roleKey = resetReq.roleKey || user.role;
    if (!user[roleKey]) return res.status(400).json({ ok: false, message: 'Role sub-document not found.' });

    // hash newPassword and save
    const hashed = await bcrypt.hash(newPassword, 10);
    user[roleKey].password = hashed;
    user[roleKey].lastPasswordChangeAt = new Date();

    // optionally clear resetToken related fields
    user[roleKey].resetToken = undefined;
    user[roleKey].resetTokenExpires = undefined;

    await user.save();

    // mark request used
    resetReq.used = true;
    await resetReq.save();

    return res.json({ ok: true, message: 'Mật khẩu đã được cập nhật.' });
  } catch (err) {
    console.error('verifyOtpAndReset error:', err);
    return res.status(500).json({ ok: false, message: 'Lỗi server.' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ ok: false, message: 'No refresh token.' });

    // verify refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      console.error('refresh verify error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ ok: false, message: 'refresh_token_expired' });
      }
      return res.status(401).json({ ok: false, message: 'Invalid refresh token.' });
    }

    const userId = payload.sub;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid refresh token (no user).' });

    // Build access payload from current user data (ensure up-to-date)
    const roleKey = user.admin ? 'admin' : user.manager ? 'manager' : user.staff ? 'staff' : user.accounter ? 'accounter' : null;
    const isSuperAdmin = roleKey === 'admin' && !!user.admin?.isSuperAdmin;
    const newPayload = { sub: user._id, role: user.role || roleKey, roleKey, isSuperAdmin };

    const newAccessToken = createAccessToken(newPayload);

    // Optional: rotate refresh token (create a new one and set cookie)
    const { token: newRefreshToken } = createRefreshToken(user._id);
    setRefreshCookie(res, newRefreshToken);

    return res.json({ ok: true, token: newAccessToken });
  } catch (err) {
    console.error('refresh error:', err);
    return res.status(500).json({ ok: false, message: 'Server error while refreshing token.' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.json({ ok: true, message: 'Logged out' });
  } catch (err) {
    console.error('logout error:', err);
    return res.status(500).json({ ok: false, message: 'Server error.' });
  }
};
