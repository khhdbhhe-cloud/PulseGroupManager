// =====================================
// PulseGroupManager
// Welcome System
// =====================================

const { checkAdmin } = require("./security");


// =====================================
// تنظیمات هر گروه
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
// جلوگیری از خراب شدن متن HTML
// =====================================

function escapeHtml(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


// =====================================
// ریپلای به دستور
// =====================================

function replyToCommand(ctx, text) {

  return ctx.reply(
    text,
    {
      reply_parameters: {
        message_id:
          ctx.message.message_id
      },
      parse_mode: "HTML"
    }
  );

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
// =====================================

function registerWelcome(bot) {


  // ===================================
  // عضو جدید
  // ===================================

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


  // ===================================
  // تنظیم GIF
  // ===================================

  bot.hears(
    /^تنظیم\s+گیف$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        const reply =
          ctx.message.reply_to_message;


        if (
          !reply ||
          !reply.animation
        ) {

          return replyToCommand(
            ctx,
`『𓆩 ★ تنظیم گیف ★ 𓆪』

برای تنظیم گیف خوشامد:

روی یک GIF ریپلای کنید و بنویسید:

تنظیم گیف`
          );

        }


        const fileId =
          reply.animation.file_id;


        setWelcomeMedia(
          ctx.chat.id,
          "animation",
          fileId
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

گیف خوشامدگویی با موفقیت تنظیم شد. 🎬

از این به بعد اعضای جدید با همین GIF خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME GIF ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // تنظیم ویدیو
  // ===================================

  bot.hears(
    /^تنظیم\s+ویدیو$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        const reply =
          ctx.message.reply_to_message;


        if (
          !reply ||
          !reply.video
        ) {

          return replyToCommand(
            ctx,
`『𓆩 ★ تنظیم ویدیو ★ 𓆪』

برای تنظیم ویدیوی خوشامد:

روی یک ویدیو ریپلای کنید و بنویسید:

تنظیم ویدیو`
          );

        }


        const fileId =
          reply.video.file_id;


        setWelcomeMedia(
          ctx.chat.id,
          "video",
          fileId
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

ویدیوی خوشامدگویی با موفقیت تنظیم شد. 🎥

از این به بعد اعضای جدید با همین ویدیو خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME VIDEO ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // تنظیم استیکر
  // ===================================

  bot.hears(
    /^تنظیم\s+استیکر$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        const reply =
          ctx.message.reply_to_message;


        if (
          !reply ||
          !reply.sticker
        ) {

          return replyToCommand(
            ctx,
`『𓆩 ★ تنظیم استیکر ★ 𓆪』

برای تنظیم استیکر خوشامد:

روی یک استیکر ریپلای کنید و بنویسید:

تنظیم استیکر`
          );

        }


        const fileId =
          reply.sticker.file_id;


        setWelcomeMedia(
          ctx.chat.id,
          "sticker",
          fileId
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

استیکر خوشامدگویی با موفقیت تنظیم شد. 🧩

از این به بعد اعضای جدید با همین استیکر خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME STICKER ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // تنظیم عکس
  // ===================================

  bot.hears(
    /^تنظیم\s+عکس$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        const reply =
          ctx.message.reply_to_message;


        if (
          !reply ||
          !reply.photo ||
          !reply.photo.length
        ) {

          return replyToCommand(
            ctx,
`『𓆩 ★ تنظیم عکس ★ 𓆪』

برای تنظیم عکس خوشامد:

روی یک عکس ریپلای کنید و بنویسید:

تنظیم عکس`
          );

        }


        const photo =
          reply.photo[
            reply.photo.length - 1
          ];


        setWelcomeMedia(
          ctx.chat.id,
          "photo",
          photo.file_id
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

عکس خوشامدگویی با موفقیت تنظیم شد. 🖼️

از این به بعد اعضای جدید با همین عکس خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME PHOTO ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // خوشامد روشن
  // ===================================

  bot.hears(
    /^خوشامد\s+روشن$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        enableWelcome(
          ctx.chat.id
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

سیستم خوشامدگویی فعال شد. ✅`
        );

      }

      catch (error) {

        console.log(
          "WELCOME ENABLE ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // خوشامد خاموش
  // ===================================

  bot.hears(
    /^خوشامد\s+خاموش$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        disableWelcome(
          ctx.chat.id
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

سیستم خوشامدگویی خاموش شد.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME DISABLE ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // حذف رسانه خوشامد
  // ===================================

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        clearWelcomeMedia(
          ctx.chat.id
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

رسانه خوشامدگویی حذف شد.

از این به بعد فقط متن خوشامدگویی ارسال می‌شود.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME CLEAR ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // وضعیت خوشامد
  // ===================================

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        const settings =
          getWelcomeSettings(
            ctx.chat.id
          );


        let mediaName =
          "فقط متن";


        if (
          settings.type === "animation"
        ) {

          mediaName =
            "GIF";

        }

        else if (
          settings.type === "video"
        ) {

          mediaName =
            "ویدیو";

        }

        else if (
          settings.type === "sticker"
        ) {

          mediaName =
            "استیکر";

        }

        else if (
          settings.type === "photo"
        ) {

          mediaName =
            "عکس";

        }


        return replyToCommand(
          ctx,
`『𓆩 ★ وضعیت خوشامدگویی ★ 𓆪』

★ وضعیت:
${settings.enabled ? "فعال ✅" : "خاموش ❌"}

★ رسانه:
${mediaName}`
        );

      }

      catch (error) {

        console.log(
          "WELCOME STATUS ERROR:",
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
