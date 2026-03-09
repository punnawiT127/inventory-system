const line = require('@line/bot-sdk');
require('dotenv').config();

const client = new line.Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'DUMMY_TOKEN',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'DUMMY_SECRET'
});

// Broadcast a message to all users (Or you can use pushMessage if logging specific userId)
const sendLineNotification = async (messageText) => {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN === 'DUMMY_TOKEN') {
        console.log('[LINE SILENT MODE] Simulation broadcast:', messageText);
        return;
    }

    try {
        await client.broadcast({
            type: 'text',
            text: messageText
        });
        console.log('✅ LINE Notification sent.');
    } catch (error) {
        console.error('❌ LINE Notification failed:', error.originalError?.response?.data || error.message);
    }
};

exports.notifyLowStock = async (product) => {
    const message = `⚠️ แจ้งเตือนสินค้าใกล้หมด\nสินค้า: ${product.name} (รหัส: ${product.code})\nคงเหลือ: ${product.stock} ชิ้น`;
    await sendLineNotification(message);
};

exports.notifyNewSale = async (amount, itemCount, sellerName) => {
    const message = `💰 มียอดขายใหม่!\nยอดรวม: ฿${amount.toLocaleString('th-TH')}\nจำนวน: ${itemCount} รายการ\nโดย: ${sellerName}`;
    await sendLineNotification(message);
};

exports.notifyDailySummary = async (totalSales, totalAmount) => {
    const message = `📊 สรุปยอดขายประจำวัน\nจำนวนบิล: ${totalSales}\nยอดรวมทั้งสิ้น: ฿${totalAmount.toLocaleString('th-TH')}`;
    await sendLineNotification(message);
};
