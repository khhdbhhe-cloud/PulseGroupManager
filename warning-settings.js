// =====================================
// PulseGroupManager
// Warning Settings
// =====================================

// تنظیمات پیش‌فرض
const settings = new Map();


// =====================================
// تنظیمات پیش‌فرض هر گروه
// =====================================

function getDefaultSettings() {

  return {
    maxWarnings: 3,
    punishment: "mute",
    duration: 60
  };

}


// =====================================
// دریافت تنظیمات گروه
// =====================================

function getWarningSettings(chatId) {

  if (!settings.has(chatId)) {

    settings.set(
      chatId,
      getDefaultSettings()
    );

  }

  return settings.get(chatId);

}


// =====================================
// تعداد اخطار
// =====================================

function setMaxWarnings(
  chatId,
  number
) {

  const config =
    getWarningSettings(chatId);

  config.maxWarnings =
    Number(number);

  return config;

}


// =====================================
// نوع مجازات
// =====================================

function setWarningPunishment(
  chatId,
  punishment
) {

  const config =
    getWarningSettings(chatId);

  config.punishment =
    punishment;

  return config;

}


// =====================================
// مدت مجازات
// دقیقه
// =====================================

function setWarningDuration(
  chatId,
  minutes
) {

  const config =
    getWarningSettings(chatId);

  config.duration =
    Number(minutes);

  return config;

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getWarningSettings,
  setMaxWarnings,
  setWarningPunishment,
  setWarningDuration

};
