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

    // Clean and validate email format
    const cleanEmail = email.toString().trim().toLowerCase();
    console.log(`🔍 Searching for email: "${cleanEmail}" (original: "${email}")`);

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ ok: false, message: 'Email format không hợp lệ.' });
    }

    // find user by email across roles (case-insensitive)
    const user = await User.findOne({
      $or: [
        { 'admin.email': { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        { 'manager.email': { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        { 'staff.email': { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
        { 'accounter.email': { $regex: new RegExp(`^${cleanEmail}$`, 'i') } }
      ]
    });

    console.log(`📋 User search result: ${user ? 'Found' : 'Not found'}`);

    if (!user) {
      console.log(`❌ Email not found in database: "${cleanEmail}"`);

      // Debug: Show available emails (only in development)
      if (process.env.NODE_ENV === 'development') {
        const allUsers = await User.find({}).limit(5);
        console.log('📧 Available emails in database:');
        allUsers.forEach(u => {
          if (u.admin?.email) console.log(`  Admin: ${u.admin.email}`);
          if (u.manager?.email) console.log(`  Manager: ${u.manager.email}`);
          if (u.staff?.email) console.log(`  Staff: ${u.staff.email}`);
          if (u.accounter?.email) console.log(`  Accounter: ${u.accounter.email}`);
        });
      }

      // For security you may return 200 here so attackers can't enumerate emails.
      return res.status(404).json({ ok: false, message: 'Email không tồn tại trong hệ thống.' });
    }

    console.log(`✅ User found: ID ${user._id}, Role: ${user.role}`);

    // determine roleKey and sub doc (case-insensitive)
    const roleKey = user.admin?.email?.toLowerCase() === cleanEmail ? 'admin'
                   : user.manager?.email?.toLowerCase() === cleanEmail ? 'manager'
                   : user.staff?.email?.toLowerCase() === cleanEmail ? 'staff'
                   : user.accounter?.email?.toLowerCase() === cleanEmail ? 'accounter'
                   : null;

    console.log(`🎯 Determined roleKey: ${roleKey}`);
    if (!roleKey) return res.status(400).json({ ok: false, message: 'Không xác định được vai trò user.' });

    // generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    console.log(`🔐 GENERATED OTP for ${cleanEmail}: "${otp}"`);
    console.log(`📊 OTP Generation Details:`);
    console.log(`   OTP value: "${otp}"`);
    console.log(`   OTP type: ${typeof otp}`);
    console.log(`   OTP length: ${otp.length}`);
    console.log(`   OTP chars: ${otp.split('').join(', ')}`);

    const otpHash = await bcrypt.hash(otp, 10);
    console.log(`🔒 OTP hashed: ${otpHash}`);

    // Test hash immediately after creation
    const immediateTest = await bcrypt.compare(otp, otpHash);
    console.log(`🧪 Immediate hash test: ${immediateTest} (should be true)`);

    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    console.log(`⏰ OTP expires at: ${otpExpires}`);

    // save request (use field names matching PasswordResetRequest model)
    const resetReq = await PasswordResetRequest.create({
      userId: user._id,
      roleKey: roleKey,
      email: cleanEmail, // Use cleaned email for consistency
      otpHash,
      expiresAt: otpExpires
    });

    console.log(`💾 Reset request saved: ID ${resetReq._id}`);
    console.log(`🔐 SAVED HASH: ${otpHash}`);
    console.log(`📧 SAVED EMAIL: ${cleanEmail}`);
    console.log(`⏰ SAVED EXPIRES: ${otpExpires}`);

    // CRITICAL: Test the hash immediately after saving
    console.log(`\n🧪 IMMEDIATE VERIFICATION TEST AFTER SAVE:`);
    const saveTest = await bcrypt.compare(otp, otpHash);
    console.log(`   Original OTP "${otp}" vs Saved Hash: ${saveTest}`);

    // Test wrong OTP immediately
    const wrongTest = await bcrypt.compare('000000', otpHash);
    console.log(`   Wrong OTP "000000" vs Saved Hash: ${wrongTest}`);

    if (!saveTest) {
      console.log(`🚨 CRITICAL ERROR: Save test failed!`);
    }
    if (wrongTest) {
      console.log(`🚨 CRITICAL ERROR: Wrong OTP test passed!`);
    }

    // Check if email is configured
    const isEmailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS &&
                              process.env.SMTP_USER &&
                              process.env.SMTP_PASS;

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

    // Enhanced validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ ok: false, message: 'email, otp và newPassword là bắt buộc.' });
    }

    // Clean and validate inputs - CRITICAL: ensure OTP is string for bcrypt
    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanOtp = String(otp).trim(); // Force convert to string to avoid bcrypt error
    console.log(`🔧 OTP conversion: ${otp} (${typeof otp}) → "${cleanOtp}" (${typeof cleanOtp})`);

    if (!/^\d{6}$/.test(cleanOtp)) {
      console.log(`❌ Invalid OTP format: "${cleanOtp}" (length: ${cleanOtp.length})`);
      return res.status(400).json({ ok: false, message: 'OTP phải là 6 chữ số.' });
    }

    console.log(`🔍 Verifying OTP for email: ${cleanEmail}`);
    console.log(`📝 Received OTP: "${cleanOtp}" (type: ${typeof cleanOtp})`);

    // CRITICAL DEBUG: Check all reset requests first
    console.log(`\n🔍 CHECKING ALL RESET REQUESTS FOR EMAIL: ${cleanEmail}`);
    const allResetReqs = await PasswordResetRequest.find({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${allResetReqs.length} total reset requests:`);
    allResetReqs.forEach((req, index) => {
      console.log(`   ${index + 1}. ID: ${req._id}`);
      console.log(`      Created: ${req.createdAt}`);
      console.log(`      Expires: ${req.expiresAt}`);
      console.log(`      Used: ${req.used}`);
      console.log(`      Hash: ${req.otpHash.substring(0, 20)}...`);
      console.log(`      Valid: ${req.expiresAt > new Date() && !req.used}`);
    });

    // find latest matching reset request (not used, not expired) - case insensitive
    const resetReq = await PasswordResetRequest.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
      expiresAt: { $gt: new Date() },
      used: false
    }).sort({ createdAt: -1 });

    console.log(`\n🎯 SELECTED RESET REQUEST: ${resetReq ? resetReq._id : 'NONE'}`);
    if (resetReq) {
      console.log(`   This is request #${allResetReqs.findIndex(r => r._id.equals(resetReq._id)) + 1} from the list above`);
    }

    if (!resetReq) {
      console.log(`❌ No valid reset request found for email: ${email}`);
      return res.status(400).json({ ok: false, message: 'Không tìm thấy yêu cầu đặt lại mật khẩu hợp lệ hoặc đã hết hạn.' });
    }

    console.log(`📋 Found reset request: ID ${resetReq._id}, created: ${resetReq.createdAt}`);
    console.log(`⏰ Expires at: ${resetReq.expiresAt}, Current time: ${new Date()}`);

    // CRITICAL DEBUG: Compare OTP with extreme detail
    console.log(`\n� CRITICAL OTP VERIFICATION SECTION 🚨`);
    console.log(`� Email: ${cleanEmail}`);
    console.log(`📝 User Input OTP: "${cleanOtp}"`);
    console.log(`🔐 Stored Hash: ${resetReq.otpHash}`);
    console.log(`📋 Reset Request ID: ${resetReq._id}`);
    console.log(`⏰ Created: ${resetReq.createdAt}`);
    console.log(`⏰ Expires: ${resetReq.expiresAt}`);
    console.log(`🔄 Used: ${resetReq.used}`);

    console.log(`\n🧪 PERFORMING BCRYPT COMPARISON...`);
    console.log(`bcrypt.compare("${cleanOtp}", "${resetReq.otpHash}")`);

    const match = await bcrypt.compare(cleanOtp, resetReq.otpHash);

    console.log(`\n🎯 BCRYPT RESULT: ${match}`);
    console.log(`🎯 BCRYPT RESULT TYPE: ${typeof match}`);
    console.log(`🎯 BCRYPT RESULT === true: ${match === true}`);
    console.log(`🎯 BCRYPT RESULT == true: ${match == true}`);

    // FORCE CHECK: Manually verify the logic
    if (match === true) {
      console.log(`✅ MATCH IS TRUE - OTP IS CORRECT`);
    } else if (match === false) {
      console.log(`❌ MATCH IS FALSE - OTP IS INCORRECT`);
    } else {
      console.log(`⚠️ UNEXPECTED MATCH VALUE: ${match} (${typeof match})`);
    }

    // Test the condition explicitly
    console.log(`\n🔍 TESTING CONDITION: !match`);
    console.log(`!match = ${!match}`);
    console.log(`!match === true: ${!match === true}`);

    if (!match) {
      console.log(`\n❌ ENTERING FAILURE BLOCK - OTP VERIFICATION FAILED!`);
      console.log(`📝 User input: "${cleanOtp}"`);
      console.log(`🔐 Expected hash: ${resetReq.otpHash}`);

      // Test with some common variations to debug
      console.log(`\n🧪 Testing variations:`);
      const variations = [
        cleanOtp,
        cleanOtp.toString(),
        String(cleanOtp),
        cleanOtp.padStart(6, '0'),
        cleanOtp.replace(/\s/g, '')
      ];

      for (const variation of variations) {
        const testMatch = await bcrypt.compare(variation, resetReq.otpHash);
        console.log(`   "${variation}" → ${testMatch}`);
      }

      console.log(`\n🚫 RETURNING ERROR RESPONSE`);
      return res.status(400).json({ ok: false, message: 'OTP không đúng.' });
    } else {
      console.log(`\n✅ BYPASSING FAILURE BLOCK - CONTINUING TO SUCCESS`);
    }

    console.log(`✅ OTP verified successfully for email: ${email}`);

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

// VERIFY OTP ONLY (separate endpoint for testing OTP before password reset)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ ok: false, message: 'Email và OTP là bắt buộc.' });
    }

    // Clean and validate inputs - CRITICAL: ensure OTP is string for bcrypt
    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanOtp = String(otp).trim(); // Force convert to string to avoid bcrypt error
    console.log(`🔧 OTP conversion: ${otp} (${typeof otp}) → "${cleanOtp}" (${typeof cleanOtp})`);

    if (!/^\d{6}$/.test(cleanOtp)) {
      console.log(`❌ Invalid OTP format: "${cleanOtp}" (length: ${cleanOtp.length})`);
      return res.status(400).json({ ok: false, message: 'OTP phải là 6 chữ số.' });
    }

    console.log(`🔍 Verifying OTP only for email: ${cleanEmail}`);
    console.log(`📝 Received OTP: "${cleanOtp}"`);

    // Find latest matching reset request (not used, not expired) - case insensitive
    const resetReq = await PasswordResetRequest.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
      expiresAt: { $gt: new Date() },
      used: false
    }).sort({ createdAt: -1 });

    if (!resetReq) {
      console.log(`❌ No valid reset request found for email: ${email}`);
      return res.status(400).json({ ok: false, message: 'Không tìm thấy yêu cầu đặt lại mật khẩu hợp lệ hoặc đã hết hạn.' });
    }

    console.log(`📋 Found reset request: ID ${resetReq._id}`);

    // Compare OTP
    const match = await bcrypt.compare(cleanOtp, resetReq.otpHash);
    console.log(`✅ OTP verification result: ${match}`);

    if (!match) {
      console.log(`❌ OTP verification failed for email: ${email}`);
      return res.status(400).json({ ok: false, message: 'OTP không đúng.' });
    }

    console.log(`✅ OTP verified successfully for email: ${email}`);

    // Return success but don't mark as used yet
    return res.json({
      ok: true,
      message: 'OTP hợp lệ. Bạn có thể tiếp tục đặt lại mật khẩu.',
      requestId: resetReq._id
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
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
