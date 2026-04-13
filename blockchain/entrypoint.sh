#!/bin/sh

# 1. Khởi chạy Hardhat Node ở background
npx hardhat node &
NODE_PID=$!

# 2. Đợi node sẵn sàng bằng Node.js snippet (Để tránh lỗi cài đặt netcat/apk)
echo "⏳ Waiting for Hardhat node to start (using Node.js check)..."
node -e "
const net = require('net');
const check = () => {
  const client = net.createConnection({ port: 8545, host: 'localhost' }, () => {
    client.end();
    console.log('Detected Hardhat node is listening!');
    process.exit(0);
  });
  client.on('error', () => {
    setTimeout(check, 500);
  });
};
check();
"

echo "✅ Hardhat node is up!"

# 3. Chạy script deploy để tạo contract và cập nhật .env (Dùng node thuần để tránh HHE905 hoàn toàn)
echo "🚀 Deploying contracts (PURE OFFLINE MODE)..."
node scripts/deploy_offline.cjs

# 4. Giữ container chạy bằng cách chờ tiến trình node
wait $NODE_PID
