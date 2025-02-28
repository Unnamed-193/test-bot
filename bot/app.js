const TelegramBot = require('node-telegram-bot-api');

const token = '7754780530:AAGQj-wbtpbZhDJtcTmIq1ddsy-1ETBQ1s8';
const bot = new TelegramBot(token, { polling: true });


function start() {

  bot.setMyCommands([
    { command: '/start', description: 'Запустить бота' },
    { command: '/orders', description: 'Запросить все заказы' },
  ])

  bot.on("message", async msg => {

    const text = msg.text
    const chatId = msg.chat.id

    if (text === '/start') {
      return await bot.sendMessage(chatId, `Hello`)
    }

    if (text === '/orders') {
      return bot.sendMessage(chatId, `Список заказов`)
    }
    return bot.sendMessage(chatId, `Неизвестная команда`)
  })
}

start()