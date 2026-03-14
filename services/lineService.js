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

// Handle incoming events from the Webhook
exports.handleEvent = async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // Ignore non-text messages for now
        return Promise.resolve(null);
    }

    const userText = event.message.text.trim();
    
    try {
        // We need to require Product model here to avoid circular dependency issues
        // if this file is required very early.
        const Product = require('../models/Product');
        
        // Check if the input is a 13-digit barcode or product code format
        // For simplicity, we just query the database to see if a product matches this code EXACTLY
        const product = await Product.findOne({ code: userText });

        let replyText = '';

        if (product) {
            replyText = `📦 ข้อมูลสินค้า:\nชื่อ: ${product.name}\nรหัส: ${product.code}\nหมวดหมู่: ${product.category}\nราคา: ฿${product.price.toLocaleString('th-TH')}\nคงเหลือ: ${product.stock} ชิ้น`;
        } else {
            // Provide a generic response if they just type normal chat
            // (You can comment this out if you don't want the bot to reply to non-barcode messages)
            replyText = `สวัสดีครับ 🙏\nผมคือบอทผู้ช่วยของ MND Store\n\nหากต้องการเช็คสต็อกสินค้า ให้พิมพ์ "รหัสบาร์โค้ด" ส่งมาได้เลยครับ 📦`;
        }

        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: replyText
        });

    } catch (err) {
        console.error('Error handling LINE event:', err);
        return Promise.resolve(null);
    }
};
