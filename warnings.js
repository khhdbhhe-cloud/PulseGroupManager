// =====================================
// PulseGroupManager - Warning System
// =====================================

const warnings = new Map();


// =====================================
// ساخت کلید کاربر
// =====================================

function getKey(chatId, userId) {

  return `${chatId}:${userId}`;

}


// =====================================
// دریافت اخطارهای یک کاربر
// =====================================

function getWarnings(chatId, userId) {

  const key = getKey(chatId, userId);

  return warnings.get(key) || 0;

}


// =====================================
// اضافه کردن اخطار
// =====================================

function addWarning(chatId, userId) {

  const key = getKey(chatId, userId);

  const current = getWarnings(
    chatId,
    userId
  );

  const next = current + 1;

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

  const key = getKey(chatId, userId);

  const current = getWarnings(
    chatId,
    userId
  );

  if (current <= 0) {

    return 0;

  }

  const next = current - 1;

  if (next === 0) {

    warnings.delete(key);

  } else {

    warnings.set(
      key,
      next
    );

  }

  return next;

}


// =====================================
// پاک کردن تمام اخطارها
// =====================================

function clearWarnings(chatId, userId) {

  const key = getKey(
    chatId,
    userId
  );

  warnings.delete(key);

  return 0;

}


// =====================================
// تنظیم مستقیم تعداد اخطار
// =====================================

function setWarnings(chatId, userId, amount) {

  const key = getKey(
    chatId,
    userId
  );

  const count = Math.max(
    0,
    Number(amount) || 0
  );

  if (count === 0) {

    warnings.delete(key);

  } else {

    warnings.set(
      key,
      count
    );

  }

  return count;

}


// =====================================
// دریافت تمام اخطارهای یک گروه
// =====================================

function getGroupWarnings(chatId) {

  const result = {};

  const prefix = `${chatId}:`;

  for (const [key, count] of warnings.entries()) {

    if (key.startsWith(prefix)) {

      const userId =
        key.slice(prefix.length);

      result[userId] = count;

    }

  }

  return result;

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings,
  setWarnings,
  getGroupWarnings

};
