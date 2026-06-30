const bot = require("../config/telegram");
const prisma = require('./prisma');

// نتحقق أولاً إن البوت شغال وجاهز للاستماع
if (bot) {
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "أهلاً بك في بوت إشعارات المتجر! \nيرجى الضغط على الزر بالأسفل لتفعيل الإشعارات تلقائياً.", {
            reply_markup: {
                keyboard: [[{
                    text: "📱 مشاركة رقم الهاتف لتفعيل الإشعارات",
                    request_contact: true 
                }]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
    });

    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        let rawPhone = msg.contact.phone_number; 
        let formattedPhone = rawPhone.replace('+', ''); 
        if (formattedPhone.startsWith('20')) {
            formattedPhone = formattedPhone.substring(2); 
        }
        if (!formattedPhone.startsWith('0')) {
            formattedPhone = '0' + formattedPhone; 
        }

        try {
            const store = await prisma.store.updateMany({
                where: { whatsapp_number: formattedPhone },
                data: { telegram_chat_id: chatId.toString() }
            });

            if (store.count > 0) {
                bot.sendMessage(chatId, "✅ تم ربط حسابك وتفعيل إشعارات الأوردرات بنجاح!");
            } else {
                bot.sendMessage(chatId, "❌ هذا الرقم غير مسجل كصاحب متجر في النظام.");
            }
        } catch (error) {
            console.error("Telegram Auth Error:", error);
            bot.sendMessage(chatId, "❌ حدث خطأ أثناء تفعيل الإشعارات.");
        }
    });
}

async function sendOrderNotification(chatId, orderDetails) {
    // التأكد من وجود البوت والـ chatId قبل الإرسال
    if (!bot || !chatId) return;

    const messageText = `🛒 *أوردر جديد في متجرك!* \n\n` +
                        `📦 *رقم الطلب:* \`${orderDetails.id}\` \n` +
                        `👤 *العميل:* ${orderDetails.customer_name} \n` +
                        `📱 *رقم العميل:* ${orderDetails.customer_phone} \n` +
                        `💰 *الإجمالي:* ${orderDetails.totalPrice} ج.م \n` +
                        `📍 *العنوان:* ${orderDetails.customer_address}\n` +
                        `📝 *ملاحظات:* ${orderDetails.notes || 'لا يوجد'}`;

    try {
        await bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Failed to send telegram message:", error.message);
    }
};

module.exports = { sendOrderNotification };