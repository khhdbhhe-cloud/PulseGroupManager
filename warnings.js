// =====================================
// PulseGroupManager - Warning System
// =====================================

const warnings = new Map();


// =====================================
// دریافت اخطارهای یک کاربر
// =====================================

function getWarnings(chatId, userId) {

  const key =
    `${chatId}:${userId}`;

  return warnings.get(key) || 0;

}


// =====================================
// اضافه کردن اخطار
// =====================================

function addWarning(chatId, userId) {

  const key =
    `${chatId}:${userId}`;

  const current =
    getWarnings(chatId, userId);

  const next =
    current + 1;

  warnings.set(
    key,
    next
  );

  return next;

}


// =====================================
// حذف یک اخطار
// =====================================

function removeWarning(chatId, userId) {

  const key =
    `${chatId}:${userId}`;

  const current =
    getWarnings(chatId, userId);

  if (current <= 0) {

    return 0;

  }

  const next =
    current - 1;

  warnings.set(
    key,
    next
  );

  return next;

}


// =====================================
// پاک کردن تمام اخطارها
// =====================================

function clearWarnings(chatId, userId) {

  const key =
    `${chatId}:${userId}`;

  warnings.delete(key);

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings

};
