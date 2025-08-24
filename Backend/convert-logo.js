const fs = require('fs');
const path = require('path');

// Đường dẫn đến logo
const logoPath = path.join(__dirname, '../frontend/public/img/logo.png');

try {
  // Đọc file và convert thành base64
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;
  
  console.log('Logo Base64 Data URL:');
  console.log(logoDataUrl);
  
  // Tạo HTML img tag
  const imgTag = `<img src="${logoDataUrl}" alt="HinWarehouse Logo" style="max-width: 100px;">`;
  console.log('\nHTML img tag:');
  console.log(imgTag);
  
} catch (error) {
  console.error('Error reading logo file:', error.message);
  console.log('Make sure the logo file exists at:', logoPath);
}
