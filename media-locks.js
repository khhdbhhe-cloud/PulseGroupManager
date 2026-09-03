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
// تشخیص مالک / مدیر
// =====================================

async function getRole(ctx, userId) {

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );


    if (
      member.status === "creator"
    ) {

      return "owner";

    }


    if (
      member.status === "administrator"
    ) {

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
// آیا کاربر اجازه مدیریت قفل‌ها دارد؟
// =====================================

async function canManageLocks(
  ctx,
  userId
) {

  const role =
    await getRole(
      ctx,
      userId
    );


  // مالک همیشه اجازه دارد

  if (
    role === "owner"
  ) {

    return true;

  }


  // مدیر باید دسترسی locks داشته باشد

  if (
    role === "admin"
  ) {

    const permissions =
      getPermissions(
        ctx.chat.id,
        userId
      );


    return (
      permissions &&
      permissions.locks === true
    );

  }


  return false;

}


// =====================================
// نام فارسی قفل
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
// ساختار پیش‌فرض قفل‌ها
// =====================================

function ensureLocks(group) {

  if (
    !group.locks ||
    typeof group.locks !== "object"
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


  for (
    const key of Object.keys(defaults)
  ) {

    if (
      typeof group.locks[key] !== "boolean"
    ) {

      group.locks[key] =
        defaults[key];

    }

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

  const group =
    getGroup(chatId);


  ensureLocks(group);


  return Boolean(
    group.locks[lockType]
  );

}


// =====================================
// تشخیص نوع پیام
// =====================================

function detectMediaType(message) {

  if (!message) {

    return null;

  }


  // -------------------------------
  // استیکر
  // -------------------------------

  if (
    message.sticker
  ) {

    return "sticker";

  }


  // -------------------------------
  // گیف
  // -------------------------------

  if (
    message.animation
  ) {

    return "gif";

  }


  // -------------------------------
  // عکس
  // -------------------------------

  if (
    message.photo
  ) {

    return "photo";

  }


  // -------------------------------
  // فیلم
  // -------------------------------

  if (
    message.video
  ) {

    return "video";

  }


  // -------------------------------
  // ویس
  // -------------------------------

  if (
    message.voice
  ) {

    return "voice";

  }


  // -------------------------------
  // متن بلند
  // -------------------------------

  if (
    typeof message.text === "string" &&
    message.text.length > 500
  ) {

    return "longText";

  }


  // -------------------------------
  // نظرسنجی
  // -------------------------------

  if (
    message.poll
  ) {

    return "poll";

  }


  return null;

}


// =====================================
// Reply کردن پاسخ مدیریتی
// =====================================

async function replyToCommand(
  ctx,
  text
) {

  try {

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
// اجرای قفل
// =====================================

async function handleLockCommand(
  ctx,
  lockType,
  enabled
) {

  if (!isGroup(ctx)) {

    return;

  }


  // -------------------------------
  // قفل‌ها فقط با Reply
  // -------------------------------

  if (
    !ctx.message.reply_to_message
  ) {

    return;

  }


  const allowed =
    await canManageLocks(
      ctx,
      ctx.from.id
    );


  // کاربر بدون دسترسی کاملاً ساکت

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


  if (enabled) {

    await replyToCommand(
      ctx,
      `🔒 قفل ${name} فعال شد.\n\nاعضای عادی اجازه ارسال ${name} را ندارند.`
    );

  }

  else {

    await replyToCommand(
      ctx,
      `🔓 قفل ${name} باز شد.\n\nاعضای عادی دوباره می‌توانند ${name} ارسال کنند.`
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


  // -------------------------------
  // قفل
  // -------------------------------

  const lockMatch =
    value.match(
      /^قفل\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i
    );


  if (
    lockMatch
  ) {

    const name =
      lockMatch[1]
        .replace(/\s+/g, " ")
        .toLowerCase();


    if (
      name === "استیکر"
    ) {

      return {
        type: "sticker",
        enabled: true
      };

    }


    if (
      name === "گیف"
    ) {

      return {
        type: "gif",
        enabled: true
      };

    }


    if (
      name === "عکس"
    ) {

      return {
        type: "photo",
        enabled: true
      };

    }


    if (
      name === "فیلم"
    ) {

      return {
        type: "video",
        enabled: true
      };

    }


    if (
      name === "ویس"
    ) {

      return {
        type: "voice",
        enabled: true
      };

    }


    if (
      name === "متن بلند"
    ) {

      return {
        type: "longText",
        enabled: true
      };

    }


    if (
      name === "نظرسنجی"
    ) {

      return {
        type: "poll",
        enabled: true
      };

    }

  }


  // -------------------------------
  // باز کردن
  // -------------------------------

  const unlockMatch =
    value.match(
      /^(بازکردن|باز کردن|باز)\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i
    );


  if (
    unlockMatch
  ) {

    const name =
      unlockMatch[2]
        .replace(/\s+/g, " ")
        .toLowerCase();


    if (
      name === "استیکر"
    ) {

      return {
        type: "sticker",
        enabled: false
      };

    }


    if (
      name === "گیف"
    ) {

      return {
        type: "gif",
        enabled: false
      };

    }


    if (
      name === "عکس"
    ) {

      return {
        type: "photo",
        enabled: false
      };

    }


    if (
      name === "فیلم"
    ) {

      return {
        type: "video",
        enabled: false
      };

    }


    if (
      name === "ویس"
    ) {

      return {
        type: "voice",
        enabled: false
      };

    }


    if (
      name === "متن بلند"
    ) {

      return {
        type: "longText",
        enabled: false
      };

    }


    if (
      name === "نظرسنجی"
    ) {

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
// بررسی پیام اعضا
// =====================================

async function checkMediaLock(
  ctx
) {

  if (!isGroup(ctx)) {

    return;

  }


  if (
    !ctx.message
  ) {

    return;

  }


  const mediaType =
    detectMediaType(
      ctx.message
    );


  if (!mediaType) {

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


  // ---------------------------------
  // مدیر / مالک حذف نمی‌شود
  // ---------------------------------

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


  // ---------------------------------
  // عضو عادی = حذف پیام
  // ---------------------------------

  await deleteLockedMessage(
    ctx
  );

}


// =====================================
// ثبت سیستم قفل‌ها
// =====================================

function registerMediaLocks(bot) {

  // ---------------------------------
  // دستورات قفل
  // ---------------------------------

  bot.hears(
    /^(قفل)\s+(استیکر|گیف|عکس|فیلم|ویس|متن\s*بلند|نظرسنجی)$/i,
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


  // ---------------------------------
  // دستورات باز کردن
  // ---------------------------------

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


  // ---------------------------------
  // بررسی پیام‌های گروه
  // ---------------------------------

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

}


// =====================================
// خروجی
// =====================================

module.exports = {

  registerMediaLocks,

  getLock,

  setLock,

  detectMediaType

};
