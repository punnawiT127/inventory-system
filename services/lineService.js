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
        
        // Check if the input is an "add stock" command: +[amount] [barcode]
        // Example: +10 1234567890123. Use (.+) for the barcode to allow spaces in between numbers.
        const addStockMatch = userText.match(/^\+(\d+)\s+(.+)$/);
        
        let replyText = '';

        if (addStockMatch) {
            const amountToAdd = parseInt(addStockMatch[1], 10);
            const barcode = addStockMatch[2].replace(/\s+/g, ''); // Strip any spaces from the scanned barcode

            const product = await Product.findOne({ code: barcode });

            if (product) {
                product.stock += amountToAdd;
                await product.save();
                replyText = `✅ เพิ่มสต็อกสำเร็จ!\nสินค้า: ${product.name}\nเพิ่ม: ${amountToAdd} ชิ้น\nคงเหลือทั้งหมด: ${product.stock} ชิ้น`;
            } else {
                replyText = `❌ ไม่พบสินค้าที่มีบาร์โค้ด: ${barcode}\n\nอยากเพิ่มสินค้าใหม่เข้าระบบใช่ไหม?\n👉 กดที่ลิงก์นี้เพื่อเพิ่มสินค้าเลย:\nhttps://inventory-system-xx0m.onrender.com/products?addBarcode=${barcode}`;
            }
        } else {
            // Check if it's just a barcode to query info (Strip spaces first!)
            const cleanBarcode = userText.replace(/\s+/g, '');
            
            // Only perform search if it looks like a barcode (just numbers)
            if (/^\d+$/.test(cleanBarcode)) {
                const product = await Product.findOne({ code: cleanBarcode });

                if (product) {
                    replyText = `📦 ข้อมูลสินค้า:\nชื่อ: ${product.name}\nรหัส: ${product.code}\nหมวดหมู่: ${product.category}\nราคา: ฿${product.price.toLocaleString('th-TH')}\nคงเหลือ: ${product.stock} ชิ้น\n\n💡 ต้องการเพิ่มสต็อก?\nพิมพ์: +จำนวน บาร์โค้ด\n(เช่น +10 ${product.code})`;
                } else {
                    replyText = `❌ ไม่พบสินค้าบาร์โค้ด: ${cleanBarcode}\n\nอยากลงทะเบียนสินค้าใหม่เข้าระบบใช่ไหม?\n👉 กดลิงก์ด้านล่างเพื่อเพิ่มสินค้าเลย:\nhttps://inventory-system-xx0m.onrender.com/products?addBarcode=${cleanBarcode}`;
                }
            } else {
                // Provide a generic response if they just type normal chat
                replyText = `สวัสดีครับ 🙏\nผมคือบอทผู้ช่วยของ MND Store\n\n- เช็คสต็อก: พิมพ์ "รหัสบาร์โค้ด"\n- เพิ่มสต็อก: พิมพ์ "+จำนวน รหัสบาร์โค้ด"\n(เช่น +10 1234567890123)`;
            }
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
