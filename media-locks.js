// =====================================
// PulseGroupManager
// MEDIA LOCKS
// قفل عکس | فیلم | گیف | استیکر
// ویس | متن بلند | نظرسنجی
// =====================================

const {
  getGroup,
  getPermissions,
  saveDB
} = require("./database");


// =====================================
// تشخیص گروه
// =====================================

function isGroup(ctx) {

  return (
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );

}


// =====================================
// تشخیص مالک / مدیر / عضو
// =====================================

async function getRole(ctx, userId) {

  try {

    if (!ctx.chat) {
      return "member";
    }

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (!member) {
      return "member";
    }

    if (member.status === "creator") {
      return "owner";
    }

    if (member.status === "administrator") {
      return "admin";
    }

    return "member";

  }

  catch (error) {

    console.log(
      "MEDIA LOCK ROLE ERROR:",
      error.message
    );

    return "member";

  }

}


// =====================================
// دسترسی مدیریت قفل‌ها
// =====================================

async function canManageLocks(
  ctx,
  userId
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      userId
    );


  // مالک = دسترسی کامل

  if (role === "owner") {
    return true;
  }


  // مدیر = نیازمند دسترسی locks

  if (role === "admin") {

    const permissions =
      getPermissions(
        ctx.chat.id,
        userId
      );

    return Boolean(
      permissions &&
      permissions.locks === true
    );

  }


  return false;

}


// =====================================
// نام فارسی قفل‌ها
// =====================================

const LOCK_NAMES = {

  sticker: "استیکر",

  gif: "گیف",

  photo: "عکس",

  video: "فیلم",

  voice: "ویس",

  longText: "متن بلند",

  poll: "نظرسنجی"

};


// =====================================
// گزینه‌های حد متن بلند
// =====================================

const LONG_TEXT_LIMITS = [

  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  1000,
  2000

];


// =====================================
// حد پیش‌فرض متن بلند
// =====================================

const DEFAULT_LONG_TEXT_LIMIT = 500;


// =====================================
// ساختار قفل‌های گروه
// =====================================

function ensureLocks(group) {

  if (
    !group.locks ||
    typeof group.locks !== "object" ||
    Array.isArray(group.locks)
  ) {

    group.locks = {};

  }


  const defaults = {

    sticker: false,

    gif: false,

    photo: false,

    video: false,

    voice: false,

    longText: false,

    poll: false

  };


  let changed = false;


  for (
    const key of Object.keys(defaults)
  ) {

    if (
      typeof group.locks[key] !== "boolean"
    ) {

      group.locks[key] =
        defaults[key];

      changed = true;

    }

  }


  // -------------------------------
  // حد متن بلند
  // -------------------------------

  if (
    !Number.isInteger(
      group.locks.longTextLimit
    ) ||
    !LONG_TEXT_LIMITS.includes(
      group.locks.longTextLimit
    )
  ) {

    group.locks.longTextLimit =
      DEFAULT_LONG_TEXT_LIMIT;

    changed = true;

  }


  if (changed) {
    saveDB();
  }

}


// =====================================
// تغییر وضعیت قفل
// =====================================

function setLock(
  chatId,
  lockType,
  value
) {

  if (
    !Object.prototype.hasOwnProperty.call(
      LOCK_NAMES,
      lockType
    )
  ) {

    return false;

  }


  const group =
    getGroup(chatId);


  ensureLocks(group);


  group.locks[lockType] =
    Boolean(value);


  saveDB();


  return group.locks[lockType];

}


// =====================================
// دریافت وضعیت قفل
// =====================================

function getLock(
  chatId,
  lockType
) {

  if (
    !Object.prototype.hasOwnProperty.call(
      LOCK_NAMES,
      lockType
    )
  ) {

    return false;

  }


  const group =
    getGroup(chatId);


  ensureLocks(group);


  return Boolean(
    group.locks[lockType]
  );

}


// =====================================
// دریافت حد متن بلند
// =====================================

function getLongTextLimit(
  chatId
) {

  const group =
    getGroup(chatId);


  ensureLocks(group);


  return (
    group.locks.longTextLimit ||
    DEFAULT_LONG_TEXT_LIMIT
  );

}


// =====================================
// تنظیم حد متن بلند
// =====================================

function setLongTextLimit(
  chatId,
  limit
) {

  const numericLimit =
    Number(limit);


  if (
    !LONG_TEXT_LIMITS.includes(
      numericLimit
    )
  ) {

    return false;

  }


  const group =
    getGroup(chatId);


  ensureLocks(group);


  group.locks.longTextLimit =
    numericLimit;


  saveDB();


  return numericLimit;

}


// =====================================
// دریافت گزینه‌های حد متن بلند
// =====================================

function getLongTextLimits() {

  return [
    ...LONG_TEXT_LIMITS
  ];

}


// =====================================
// تشخیص نوع پیام
// =====================================

function detectMediaType(message) {

  if (!message) {
    return null;
  }


  // استیکر

  if (message.sticker) {
    return "sticker";
  }


  // گیف

  if (message.animation) {
    return "gif";
  }


  // عکس

  if (message.photo) {
    return "photo";
  }


  // فیلم

  if (message.video) {
    return "video";
  }


  // ویس

  if (message.voice) {
    return "voice";
  }


  // نظرسنجی

  if (message.poll) {
    return "poll";
  }


  // متن بلند
  // حد در checkMediaLock بررسی می‌شود

  if (
    typeof message.text === "string"
  ) {

    return "text";

  }


  return null;

}


// =====================================
// تشخیص اینکه متن بلند است یا نه
// =====================================

function isLongText(
  chatId,
  message
) {

  if (
    !message ||
    typeof message.text !== "string"
  ) {

    return false;

  }


  const limit =
    getLongTextLimit(
      chatId
    );


  return (
    message.text.length >
    limit
  );

}// =====================================
// Reply پاسخ مدیریتی
// پاسخ روی خود پیام دستور
// =====================================

async function replyToCommand(
  ctx,
  text
) {

  try {

    if (
      !ctx.message ||
      !ctx.message.message_id
    ) {

      return;

    }


    await ctx.reply(
      text,
      {
        reply_parameters: {
          message_id:
            ctx.message.message_id
        }
      }
    );

  }

  catch (error) {

    console.log(
      "MEDIA LOCK REPLY ERROR:",
      error.message
    );

  }

}


// =====================================
// اجرای دستور قفل
// =====================================

async function handleLockCommand(
  ctx,
  lockType,
  enabled
) {

  if (!isGroup(ctx)) {
    return;
  }


  const allowed =
    await canManageLocks(
      ctx,
      ctx.from.id
    );


  // عضو عادی یا مدیر بدون دسترسی
  // کاملاً ساکت

  if (!allowed) {
    return;
  }


  const value =
    setLock(
      ctx.chat.id,
      lockType,
      enabled
    );


  const name =
    LOCK_NAMES[lockType];


  if (value === true) {

    await replyToCommand(
      ctx,
      `『🔒』 𒌍قفل ${name} فعال شد`
    );

  }

  else {

    await replyToCommand(
      ctx,
      `『🔓』 𒌍قفل ${name} باز شد`
    );

  }

}


// =====================================
// تشخیص دستور قفل
// =====================================

function parseLockCommand(text) {

  if (
    typeof text !== "string"
  ) {

    return null;

  }


  const value =
    text
      .trim()
      .replace(/\s+/g, " ");


  // ===================================
  // قفل
  // ===================================

  const lockMatch =
    value.match(
      /^قفل\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i
    );


  if (lockMatch) {

    const name =
      lockMatch[1]
        .replace(/\s+/g, " ")
        .toLowerCase();


    switch (name) {

      case "استیکر":
        return {
          type: "sticker",
          enabled: true
        };

      case "گیف":
        return {
          type: "gif",
          enabled: true
        };

      case "عکس":
        return {
          type: "photo",
          enabled: true
        };

      case "فیلم":
        return {
          type: "video",
          enabled: true
        };

      case "ویس":
        return {
          type: "voice",
          enabled: true
        };

      case "متن بلند":
        return {
          type: "longText",
          enabled: true
        };

      case "نظرسنجی":
        return {
          type: "poll",
          enabled: true
        };

    }

  }


  // ===================================
  // باز کردن
  // ===================================

  const unlockMatch =
    value.match(
      /^(بازکردن|باز کردن|باز)\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i
    );


  if (unlockMatch) {

    const name =
      unlockMatch[2]
        .replace(/\s+/g, " ")
        .toLowerCase();


    switch (name) {

      case "استیکر":
        return {
          type: "sticker",
          enabled: false
        };

      case "گیف":
        return {
          type: "gif",
          enabled: false
        };

      case "عکس":
        return {
          type: "photo",
          enabled: false
        };

      case "فیلم":
        return {
          type: "video",
          enabled: false
        };

      case "ویس":
        return {
          type: "voice",
          enabled: false
        };

      case "متن بلند":
        return {
          type: "longText",
          enabled: false
        };

      case "نظرسنجی":
        return {
          type: "poll",
          enabled: false
        };

    }

  }


  return null;

}


// =====================================
// حذف پیام قفل‌شده
// =====================================

async function deleteLockedMessage(
  ctx
) {

  try {

    await ctx.deleteMessage();

  }

  catch (error) {

    console.log(
      "MEDIA LOCK DELETE ERROR:",
      error.message
    );

  }

}


// =====================================
// بررسی پیام‌های اعضا
// =====================================

async function checkMediaLock(
  ctx
) {

  if (!isGroup(ctx)) {
    return;
  }


  if (!ctx.message) {
    return;
  }


  // -----------------------------------
  // پیام‌های مدیریتی قفل را بررسی نکن
  // -----------------------------------

  if (
    typeof ctx.message.text === "string"
  ) {

    const command =
      parseLockCommand(
        ctx.message.text
      );


    if (command) {
      return;
    }

  }


  // -----------------------------------
  // مدیر و مالک حذف نمی‌شوند
  // -----------------------------------

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );


  if (
    role === "owner" ||
    role === "admin"
  ) {

    return;

  }


  // ===================================
  // متن بلند
  // ===================================

  if (
    typeof ctx.message.text === "string"
  ) {

    const longTextLocked =
      getLock(
        ctx.chat.id,
        "longText"
      );


    if (
      longTextLocked &&
      isLongText(
        ctx.chat.id,
        ctx.message
      )
    ) {

      await deleteLockedMessage(
        ctx
      );

      return;

    }

  }


  // ===================================
  // رسانه / نظرسنجی
  // ===================================

  const mediaType =
    detectMediaType(
      ctx.message
    );


  if (
    !mediaType ||
    mediaType === "text"
  ) {

    return;

  }


  const locked =
    getLock(
      ctx.chat.id,
      mediaType
    );


  if (!locked) {
    return;
  }


  // عضو عادی = حذف

  await deleteLockedMessage(
    ctx
  );

}


// =====================================
// ثبت سیستم قفل‌ها
// =====================================

function registerMediaLocks(bot) {

  // ===================================
  // قفل کردن
  // ===================================

  bot.hears(
    /^قفل\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i,

    async ctx => {

      const command =
        parseLockCommand(
          ctx.message.text
        );


      if (!command) {
        return;
      }


      await handleLockCommand(
        ctx,
        command.type,
        true
      );

    }

  );


  // ===================================
  // باز کردن
  // ===================================

  bot.hears(
    /^(بازکردن|باز کردن|باز)\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i,

    async ctx => {

      const command =
        parseLockCommand(
          ctx.message.text
        );


      if (!command) {
        return;
      }


      await handleLockCommand(
        ctx,
        command.type,
        false
      );

    }

  );


  // ===================================
  // بررسی پیام‌های گروه
  // ===================================

  bot.on(
    "message",

    async ctx => {

      try {

        await checkMediaLock(
          ctx
        );

      }

      catch (error) {

        console.log(
          "MEDIA LOCK CHECK ERROR:",
          error.message
        );

      }

    }

  );


  console.log(
    "MEDIA LOCKS: registered."
  );

}// =====================================
// دریافت تمام وضعیت قفل‌ها
// مخصوص پنل
// =====================================

function getAllLocks(
  chatId
) {

  const group =
    getGroup(chatId);


  ensureLocks(group);


  return {

    sticker:
      Boolean(
        group.locks.sticker
      ),

    gif:
      Boolean(
        group.locks.gif
      ),

    photo:
      Boolean(
        group.locks.photo
      ),

    video:
      Boolean(
        group.locks.video
      ),

    voice:
      Boolean(
        group.locks.voice
      ),

    longText:
      Boolean(
        group.locks.longText
      ),

    poll:
      Boolean(
        group.locks.poll
      ),

    longTextLimit:
      group.locks.longTextLimit

  };

}


// =====================================
// تغییر قفل از پنل
// =====================================

async function setLockFromPanel(
  ctx,
  lockType,
  enabled
) {

  if (!isGroup(ctx)) {
    return false;
  }


  if (
    !Object.prototype.hasOwnProperty.call(
      LOCK_NAMES,
      lockType
    )
  ) {

    return false;

  }


  const allowed =
    await canManageLocks(
      ctx,
      ctx.from.id
    );


  if (!allowed) {
    return false;
  }


  return setLock(
    ctx.chat.id,
    lockType,
    enabled
  );

}


// =====================================
// تنظیم حد متن بلند از پنل
// =====================================

async function setLongTextLimitFromPanel(
  ctx,
  limit
) {

  if (!isGroup(ctx)) {
    return false;
  }


  const allowed =
    await canManageLocks(
      ctx,
      ctx.from.id
    );


  if (!allowed) {
    return false;
  }


  return setLongTextLimit(
    ctx.chat.id,
    limit
  );

}


// =====================================
// وضعیت متن بلند
// =====================================

function getLongTextSettings(
  chatId
) {

  return {

    enabled:
      getLock(
        chatId,
        "longText"
      ),

    limit:
      getLongTextLimit(
        chatId
      ),

    options:
      getLongTextLimits()

  };

}


// =====================================
// نام قفل
// =====================================

function getLockName(
  lockType
) {

  return (
    LOCK_NAMES[lockType] ||
    lockType
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  registerMediaLocks,

  getLock,

  setLock,

  getAllLocks,

  setLockFromPanel,

  getLockName,

  detectMediaType,

  canManageLocks,

  getRole,

  getLongTextLimit,

  setLongTextLimit,

  getLongTextLimits,

  setLongTextLimitFromPanel,

  getLongTextSettings,

  isLongText

};
