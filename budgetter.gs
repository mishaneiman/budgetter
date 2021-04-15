var token = <token>;
var telegramAppUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = <web_app_url>;

function setWebhook() {
  var url = telegramAppUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
}

function sendMessage(id, text) {
  var url = telegramAppUrl + "/sendMessage?chat_id=" + id + "&text=" + text;
  var response = UrlFetchApp.fetch(url);
}

function sendText(chatId, text, keyBoard) {
  var data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyBoard)
    }
  };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}

function isNumeric(num) {
  return !isNaN(num)
}

function isFormat(string) {
  var items = string.split("-");
  if (items.length == 2 && isNumeric(items[1])) {
    return true
  } else {
    return false
  } 
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hi")
}

function doPost(e) {
  // spreadsheet settings.
  var ssId = <ssid>;
  var expenseSheet = SpreadsheetApp.openById(ssId).getSheetByName("Расходы");
  // keyboard settings.
    var keyBoard = {
        "inline_keyboard": [
          [{
            "text": "Подвести итог на этот месяц.",
            'callback_data': 'get_total'
          }]
          ]
  };
  var contents = JSON.parse(e.postData.contents);
  if (contents.message) {
    chatId = contents.message.chat.id;
    var text = contents.message.text;
    var firstName = contents.message.from.first_name;
    if (isFormat(text)) {
      var currentDate = new Date();
      items = text.split("-");
      expenseSheet.appendRow([currentDate, firstName, items[0], items[1]]);
      sendText(chatId, "Ок, что еще? (формат: [повод] - [сумма])", keyBoard);
    } else {
      sendText(chatId, "Офигел? пиши по формату... (формат: [повод] - [сумма]) ", keyBoard);
    }
  } else if (contents.callback_query) {
    var data = contents.callback_query.data;
    if (data == 'get_total') {
      var currentDate = new Date();
      var currentMonth = currentDate.getMonth() + 1;
      var currentYear = currentDate.getFullYear();
      totalsString = getFilteredSums(expenseSheet, currentMonth, currentYear);
      sendText(<group_chat_id>, "Вот что вышло:\n" + totalsString + "\n" + "Что еще? (формат: [повод] - [сумма]) ", keyBoard); // TODO: couldn't figure out how to get chat ID from callback query. Might fix later. 
    }
  } else {
    var text = contents.message.text;
    sendText(chatId, "Чё надо? (формат: [повод] - [сумма])", keyBoard);
  }
}

function getFilteredSums(sheet, month, year) {
  var totals = {}; 
  var range = sheet.getDataRange().getValues().length
  for (row=2; row < range; row++) {
    var rowYear = sheet.getRange(row, 1).getValue().getFullYear();
    var rowMonth = sheet.getRange(row, 1).getValue().getMonth() + 1;
    var rowFirstName = sheet.getRange(row, 2).getValue();
    var amount = sheet.getRange(row, 4).getValue();
    if (rowYear == year && rowMonth == month) {
      if (rowFirstName in totals) {
        totals[rowFirstName] += amount;
      } else {
        totals[rowFirstName] = amount;
      }
    }
  }
  var totalsString = "";
  for (var name in totals) {
    totalsString += name + " - " + totals[name] + "\n";
  }
  return totalsString
}

  
