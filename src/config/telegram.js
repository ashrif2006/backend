const TelegramBot = require('node-telegram-bot-api').default;

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot;
if(!token){
    console.error("Telegram Bot Token is missing ");
}else{
    bot = new TelegramBot(token , {polling : true});
    console.log("Telegram Bot initialized successfully.");
}
module.exports=bot;

    