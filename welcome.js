// =====================================
// PulseGroupManager
// Welcome System
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

  return (
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
// خاموش کردن خوشامد
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

async function sendWelcome(
  ctx,
  user
) {

  try {

    const settings =
      getWelcomeSettings(
        ctx.chat.id
      );

    console.log(
      "WELCOME SEND:",
      {
        chat: ctx.chat.id,
        group: ctx.chat.title,
        user: user.first_name,
        userId: user.id,
        enabled: settings.enabled,
        type: settings.type
      }
    );


    if (!settings.enabled) {

      console.log(
        "WELCOME DISABLED"
      );

      return;

    }


    const text =
      getWelcomeText(
        user,
        ctx.chat
      );


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
    // پیش‌فرض
    // ===================================

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

  }

}


// =====================================
// ثبت سیستم خوشامد
// =====================================

function registerWelcome(bot) {

  console.log(
    "Welcome system registered successfully"
  );


  // ===================================
  // عضو جدید
  // ===================================

  bot.on(
    "new_chat_members",
    async ctx => {

      console.log(
        "================================="
      );

      console.log(
        "NEW MEMBER EVENT RECEIVED"
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
        ctx.message?.new_chat_members?.length || 0
      );

      console.log(
        "================================="
      );


      try {

        if (!isGroup(ctx)) {

          console.log(
            "WELCOME: NOT A GROUP"
          );

          return;

        }


        const settings =
          getWelcomeSettings(
            ctx.chat.id
          );


        console.log(
          "WELCOME SETTINGS:",
          settings
        );


        if (!settings.enabled) {

          console.log(
            "WELCOME IS DISABLED"
          );

          return;

        }


        const members =
          ctx.message.new_chat_members || [];


        if (!members.length) {

          console.log(
            "NO NEW MEMBERS FOUND"
          );

          return;

        }


        for (
          const user of members
        ) {

          console.log(
            "SENDING WELCOME TO:",
            user.first_name,
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
  );


  // ===================================
  // تنظیم ویدیو
  // ===================================

  bot.hears(
    /^تنظیم\s+ویدیو$/u,
    async ctx => {

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
  );


  // ===================================
  // تنظیم استیکر
  // ===================================

  bot.hears(
    /^تنظیم\s+استیکر$/u,
    async ctx => {

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
  );


  // ===================================
  // تنظیم عکس
  // ===================================

  bot.hears(
    /^تنظیم\s+عکس$/u,
    async ctx => {

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
  );


  // ===================================
  // روشن
  // ===================================

  bot.hears(
    /^خوشامد\s+روشن$/u,
    async ctx => {

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
  );


  // ===================================
  // خاموش
  // ===================================

  bot.hears(
    /^خوشامد\s+خاموش$/u,
    async ctx => {

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
  );


  // ===================================
  // حذف رسانه
  // ===================================

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

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
  );


  // ===================================
  // وضعیت
  // ===================================

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

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
