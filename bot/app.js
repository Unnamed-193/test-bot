const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config()

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const apiUrl = process.env.API_URL;
const dataFilePath = path.join(__dirname, 'lastData.json'); // Путь к файлу lastData.json

// Загружаем последние данные из файла (если файл существует)
let lastData = [];
try {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    if (data.trim()) { // Проверяем, что файл не пустой
      lastData = JSON.parse(data);
    } else {
      console.log('Файл lastData.json пустой. Инициализируем пустым массивом.');
      lastData = [];
    }
  } else {
    console.log('Файл lastData.json не существует. Инициализируем пустым массивом.');
    lastData = [];
  }
} catch (error) {
  console.error('Ошибка при чтении файла lastData.json:', error);
  lastData = []; // В случае ошибки инициализируем пустым массивом
}

// Функция для сохранения lastData в файл
function saveLastData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка при сохранении lastData.json:', error);
  }
}

// Функция для получения данных с API
async function fetchData() {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    return null;
  }
}

// Функция для отправки сообщения в Telegram
async function sendMessage(chatId, message) {
  await bot.sendMessage(chatId, message);
}

// Функция для проверки новых данных
async function checkForNewData(chatId) {
  try {
    const data = await fetchData();
    if (data && data.length > 0) {
      // Фильтруем новые данные
      const newData = data.filter(item => {
        return !lastData.some(lastItem => lastItem.id === item.id);
      });

      if (newData.length > 0) {
        // Отправляем новые данные
        newData.forEach(elem => {
          const message = `Пришел новый заказ ${elem.id}:\nЗаголовок: ${elem.title}\nКонтент: ${elem.content}`;
          sendMessage(chatId, message);
        });

        // Обновляем lastData
        lastData = data;
        saveLastData(lastData); // Сохраняем lastData в файл
      }
    } else {
      console.log('Данные с сервера отсутствуют или пустые.');
    }
  } catch (error) {
    console.error('Ошибка при проверке новых данных:', error);
    sendMessage(chatId, 'Произошла ошибка при проверке данных.');
  }
}

bot.setMyCommands([
  { command: '/start', description: 'Запустить бота' },
  { command: '/orders', description: 'Запросить все заказы' },
])

setInterval(() => {
    checkForNewData(7128885933);
  }, 5000); // Проверка каждые 10 секунд

// Команда для запуска проверки данных
bot.on("message", async (msg) => {
  const text = msg.text
  const chatId = msg.chat.id;
  
  if (text === '/start') {
    bot.sendMessage(chatId, 'Бот запущен, проверяем данные...');
    setInterval(() => {
      checkForNewData(chatId);
    }, 10000); // Проверка каждые 10 секунд
  } else if (text === '/orders') {
    const data = await fetchData();

    const sortedData = data
      .filter(elem => elem.id != null) // Исключаем элементы с null или undefined
      .sort((a, b) => a.id - b.id); // Сортируем по id

    console.log('Данные после сортировки:', sortedData);

    // Выводим элементы
    sortedData.forEach((elem, index) => {
      setTimeout(() => {
        const message = `Заказ ${elem.id}:\nЗаголовок: ${elem.title}\nКонтент: ${elem.content}`;
        sendMessage(chatId, message);
      }, index * 100); // Задержка 2 секунды между сообщениями
    });
  } else {
    bot.sendMessage(chatId, `Неизвестная команда`)
  }


});


// Обработка ошибок polling
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});