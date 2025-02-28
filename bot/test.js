const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const token = '7754780530:AAGQj-wbtpbZhDJtcTmIq1ddsy-1ETBQ1s8';
const bot = new TelegramBot(token, { polling: true });

const apiUrl = 'https://9f8f52325fe5c194.mokky.dev/items';
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
function sendMessage(chatId, message) {
  bot.sendMessage(chatId, message);
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
        newData.forEach(element => {
          const message = `Новый элемент: ${JSON.stringify(element)}`;
          sendMessage(chatId, message);
        });

        // Обновляем lastData
        lastData = data;
        saveLastData(lastData); // Сохраняем lastData в файл
      }
      // Если новых данных нет, ничего не делаем
    } else {
      console.log('Данные с сервера отсутствуют или пустые.');
    }
  } catch (error) {
    console.error('Ошибка при проверке новых данных:', error);
    sendMessage(chatId, 'Произошла ошибка при проверке данных.');
  }
}

// Команда для запуска проверки данных
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Бот запущен, проверяем данные...');
  setInterval(() => {
    checkForNewData(chatId);
  }, 10000); // Проверка каждые 10 секунд
});

// Обработка ошибок polling
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});