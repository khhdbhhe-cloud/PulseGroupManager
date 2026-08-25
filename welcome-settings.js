// =====================================
// PulseGroupManager
// Welcome System
// =====================================

const welcomeSettings = new Map();


// =====================================
// تنظیمات پیش‌فرض
// =====================================

function getDefaultSettings() {

  return {
    enabled: true,
    type: "text",
    fileId: null
  };

}


// =====================================
// دریافت تنظیمات گروه
// =====================================

function getWelcomeSettings(chatId) {

  if (!welcomeSettings.has(chatId)) {

    welcomeSettings.set(
      chatId,
      getDefaultSettings()
    );

  }

  return welcomeSettings.get(chatId);

}


// =====================================
// متن پیش‌فرض خوشامدگویی
// =====================================

function getWelcomeText(user) {

  const firstName =
    user.first_name || "دوست عزیز";

  const userId =
    user.id;

  const mention =
    `<a href="tg://user?id=${userId}">${escapeHtml(firstName)}</a>`;

  return `『𓆩 ★ خوش اومدی ★ 𓆪』

سلام ${mention} عزیز 🌹

به جمع ما خوش اومدی ❤️

امیدواریم کنارمون لحظات خوبی داشته باشی ✨

『𓆩 از حضورت خوشحالیم 𓆪』`;

}


// =====================================
// جلوگیری از خراب شدن HTML
// =====================================

function escapeHtml(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


// =====================================
// بررسی گروه
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
// تنظیم رسانه خوشامد
// این تابع توسط welcome-settings.js استفاده می‌شود
// =====================================

function setWelcomeMedia(
  chatId,
  type,
  fileId
) {

  const settings =
    getWelcomeSettings(chatId);

  settings.type =
    type;

  settings.fileId =
    fileId;

  settings.enabled =
    true;

  return settings;

}


// =====================================
// حذف رسانه خوشامد
// =====================================

function clearWelcomeMedia(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.type =
    "text";

  settings.fileId =
    null;

  return settings;

}


// =====================================
// فعال کردن خوشامد
// =====================================

function enableWelcome(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.enabled =
    true;

  return settings;

}


// =====================================
// غیرفعال کردن خوشامد
// =====================================

function disableWelcome(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.enabled =
    false;

  return settings;

}


// =====================================
// ارسال خوشامدگویی
// =====================================

async function sendWelcome(
  ctx,
  user
) {

  if (!isGroup(ctx)) {

    return;

  }


  const settings =
    getWelcomeSettings(
      ctx.chat.id
    );


  if (!settings.enabled) {

    return;

  }


  const text =
    getWelcomeText(user);


  // ===================================
  // فقط متن
  // ===================================

  if (
    settings.type === "text" ||
    !settings.fileId
  ) {

    return ctx.reply(
      text,
      {
        parse_mode: "HTML"
      }
    );

  }


  // ===================================
  // GIF
  // ===================================

  if (
    settings.type === "animation"
  ) {

    return ctx.replyWithAnimation(
      settings.fileId,
      {
        caption: text,
        parse_mode: "HTML"
      }
    );

  }


  // ===================================
  // ویدیو
  // ===================================

  if (
    settings.type === "video"
  ) {

    return ctx.replyWithVideo(
      settings.fileId,
      {
        caption: text,
        parse_mode: "HTML"
      }
    );

  }


  // ===================================
  // استیکر
  // ===================================

  if (
    settings.type === "sticker"
  ) {

    await ctx.replyWithSticker(
      settings.fileId
    );

    return ctx.reply(
      text,
      {
        parse_mode: "HTML"
      }
    );

  }


  // ===================================
  // عکس
  // ===================================

  if (
    settings.type === "photo"
  ) {

    return ctx.replyWithPhoto(
      settings.fileId,
      {
        caption: text,
        parse_mode: "HTML"
      }
    );

  }


  // ===================================
  // حالت پیش‌فرض
  // ===================================

  return ctx.reply(
    text,
    {
      parse_mode: "HTML"
    }
  );

}


// =====================================
// ثبت سیستم خوشامد
// فقط ورود اعضای جدید
//
// توجه:
// هیچ دستور تنظیمی اینجا وجود ندارد.
// تمام دستورهای تنظیم خوشامد در
// welcome-settings.js قرار دارند.
// =====================================

function registerWelcome(bot) {

  bot.on(
    "new_chat_members",
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const settings =
          getWelcomeSettings(
            ctx.chat.id
          );


        if (!settings.enabled) {

          return;

        }


        const members =
          ctx.message.new_chat_members || [];


        for (
          const user of members
        ) {

          await sendWelcome(
            ctx,
            user
          );

        }

      }

      catch (error) {

        console.log(
          "WELCOME MEMBER ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  registerWelcome,

  getWelcomeSettings,

  getWelcomeText,

  sendWelcome,

  setWelcomeMedia,

  clearWelcomeMedia,

  enableWelcome,

  disableWelcome

};
