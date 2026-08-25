// =====================================
// PulseGroupManager
// WELCOME SYSTEM - FULL VERSION
// =====================================

const { checkAdmin } = require("./security");

const {
  getDefaultWelcomeText,
  formatWelcomeText
} = require("./welcome-text");


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
    fileId: null,
    text: null
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
// متن خوشامد
// =====================================

function getWelcomeText(user, chat) {

  const settings =
    getWelcomeSettings(chat.id);

  const template =
    settings.text ||
    getDefaultWelcomeText(
      user,
      chat
    );

  return formatWelcomeText(
    template,
    user,
    chat
  );

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

  return !!(
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );

}


// =====================================
// تنظیم رسانه
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
// حذف رسانه
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
// روشن
// =====================================

function enableWelcome(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.enabled =
    true;

  return settings;

}


// =====================================
// خاموش
// =====================================

function disableWelcome(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.enabled =
    false;

  return settings;

}


// =====================================
// ارسال خوشامد
// =====================================

async function sendWelcome(ctx, user) {

  try {

    const chat =
      ctx.chat;

    const settings =
      getWelcomeSettings(
        chat.id
      );

    console.log(
      "WELCOME: preparing message",
      {
        group: chat.title,
        chatId: chat.id,
        user: user.first_name,
        userId: user.id,
        enabled: settings.enabled,
        type: settings.type,
        hasFile: !!settings.fileId
      }
    );


    if (!settings.enabled) {

      console.log(
        "WELCOME: disabled for this group"
      );

      return;

    }


    const text =
      getWelcomeText(
        user,
        chat
      );


    // ===================================
    // فقط متن
    // ===================================

    if (
      settings.type === "text" ||
      !settings.fileId
    ) {

      const result =
        await ctx.reply(
          text,
          {
            parse_mode: "HTML"
          }
        );

      console.log(
        "WELCOME: TEXT SENT SUCCESSFULLY"
      );

      return result;

    }


    // ===================================
    // GIF
    // ===================================

    if (
      settings.type === "animation"
    ) {

      const result =
        await ctx.replyWithAnimation(
          settings.fileId,
          {
            caption: text,
            parse_mode: "HTML"
          }
        );

      console.log(
        "WELCOME: GIF SENT SUCCESSFULLY"
      );

      return result;

    }


    // ===================================
    // VIDEO
    // ===================================

    if (
      settings.type === "video"
    ) {

      const result =
        await ctx.replyWithVideo(
          settings.fileId,
          {
            caption: text,
            parse_mode: "HTML"
          }
        );

      console.log(
        "WELCOME: VIDEO SENT SUCCESSFULLY"
      );

      return result;

    }


    // ===================================
    // STICKER
    // ===================================

    if (
      settings.type === "sticker"
    ) {

      await ctx.replyWithSticker(
        settings.fileId
      );

      const result =
        await ctx.reply(
          text,
          {
            parse_mode: "HTML"
          }
        );

      console.log(
        "WELCOME: STICKER + TEXT SENT SUCCESSFULLY"
      );

      return result;

    }


    // ===================================
    // PHOTO
    // ===================================

    if (
      settings.type === "photo"
    ) {

      const result =
        await ctx.replyWithPhoto(
          settings.fileId,
          {
            caption: text,
            parse_mode: "HTML"
          }
        );

      console.log(
        "WELCOME: PHOTO SENT SUCCESSFULLY"
      );

      return result;

    }


    // ===================================
    // حالت ناشناخته
    // ===================================

    console.log(
      "WELCOME: unknown media type, sending text"
    );

    return ctx.reply(
      text,
      {
        parse_mode: "HTML"
      }
    );

  }

  catch (error) {

    console.log(
      "WELCOME SEND ERROR:",
      error.message
    );

    console.log(
      "WELCOME SEND ERROR DETAILS:",
      error
    );

  }

}


// =====================================
// ثبت سیستم
// =====================================

function registerWelcome(bot) {

  console.log(
    "================================="
  );

  console.log(
    "WELCOME SYSTEM REGISTERED"
  );

  console.log(
    "Listening for new members..."
  );

  console.log(
    "================================="
  );


  // ===================================
  // رویداد ورود عضو
  // ===================================

  bot.on(
    "message",
    async ctx => {

      try {

        const message =
          ctx.message;

        // فقط پیام‌هایی که عضو جدید دارند
        if (
          !message ||
          !Array.isArray(
            message.new_chat_members
          )
        ) {

          return;

        }


        console.log(
          "================================="
        );

        console.log(
          "NEW MEMBER EVENT DETECTED"
        );

        console.log(
          "GROUP:",
          ctx.chat?.title
        );

        console.log(
          "CHAT ID:",
          ctx.chat?.id
        );

        console.log(
          "NEW MEMBERS:",
          message.new_chat_members.length
        );

        console.log(
          "================================="
        );


        if (!isGroup(ctx)) {

          console.log(
            "WELCOME: not a group"
          );

          return;

        }


        const members =
          message.new_chat_members;


        for (
          const user of members
        ) {

          console.log(
            "WELCOME: new user detected:",
            user.first_name,
            "|",
            user.id
          );


          await sendWelcome(
            ctx,
            user
          );

        }

      }

      catch (error) {

        console.log(
          "NEW MEMBER HANDLER ERROR:",
          error.message
        );

        console.log(
          error
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

        if (!isGroup(ctx)) return;

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

روی یک GIF ریپلای کنید و بنویسید:

تنظیم گیف`
          );

        }

        setWelcomeMedia(
          ctx.chat.id,
          "animation",
          reply.animation.file_id
        );

        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

گیف خوشامدگویی با موفقیت تنظیم شد. 🎬`
        );

      }

      catch (error) {

        console.log(
          "SET GIF ERROR:",
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

        if (!isGroup(ctx)) return;

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

روی یک ویدیو ریپلای کنید و بنویسید:

تنظیم ویدیو`
          );

        }

        setWelcomeMedia(
          ctx.chat.id,
          "video",
          reply.video.file_id
        );

        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

ویدیوی خوشامدگویی با موفقیت تنظیم شد. 🎥`
        );

      }

      catch (error) {

        console.log(
          "SET VIDEO ERROR:",
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

        if (!isGroup(ctx)) return;

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

روی یک استیکر ریپلای کنید و بنویسید:

تنظیم استیکر`
          );

        }

        setWelcomeMedia(
          ctx.chat.id,
          "sticker",
          reply.sticker.file_id
        );

        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

استیکر خوشامدگویی با موفقیت تنظیم شد. 🧩`
        );

      }

      catch (error) {

        console.log(
          "SET STICKER ERROR:",
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

        if (!isGroup(ctx)) return;

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

عکس خوشامدگویی با موفقیت تنظیم شد. 🖼️`
        );

      }

      catch (error) {

        console.log(
          "SET PHOTO ERROR:",
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

        if (!isGroup(ctx)) return;

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

        if (!isGroup(ctx)) return;

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

سیستم خوشامدگویی خاموش شد. ❌`
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
  // حذف رسانه
  // ===================================

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) return;

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

رسانه خوشامدگویی حذف شد. ✅

از این به بعد فقط متن ارسال می‌شود.`
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
  // وضعیت
  // ===================================

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) return;

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


        let media =
          "فقط متن";


        if (
          settings.type === "animation"
        ) {

          media = "GIF";

        }

        else if (
          settings.type === "video"
        ) {

          media = "ویدیو";

        }

        else if (
          settings.type === "sticker"
        ) {

          media = "استیکر";

        }

        else if (
          settings.type === "photo"
        ) {

          media = "عکس";

        }


        return replyToCommand(
          ctx,
`『𓆩 ★ وضعیت خوشامدگویی ★ 𓆪』

★ وضعیت:
${settings.enabled ? "فعال ✅" : "خاموش ❌"}

★ رسانه:
${media}`
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
