// =====================================
// PulseGroupManager
// WELCOME SYSTEM
// =====================================

const { checkAdmin } =
  require("./security");

const {
  getGroup,
  saveDB
} = require("./database");

const {
  getDefaultWelcomeText,
  formatWelcomeText
} = require("./welcome-text");


// =====================================
// تنظیمات موقت رسانه
// =====================================

const welcomeSettings =
  new Map();


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
// گرفتن تنظیمات خوشامد
// =====================================

function getWelcomeSettings(chatId) {

  const group =
    getGroup(chatId);


  // تنظیمات اصلی از دیتابیس
  // استفاده می‌شود

  if (!group.welcome) {

    group.welcome = {

      enabled: true,

      text: null,

      type: "text",

      fileId: null,

      managers: {}

    };

    saveDB();

  }


  if (!group.welcome.managers) {

    group.welcome.managers = {};

    saveDB();

  }


  return group.welcome;

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
// HTML امن
// =====================================

function escapeHtml(text) {

  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


// =====================================
// منشن قابل کلیک
// حتی بدون Username
// =====================================

function getUserMention(user) {

  if (
    !user ||
    !user.id
  ) {

    return "دوست عزیز";

  }


  const name =
    escapeHtml(
      user.first_name ||
      user.last_name ||
      "دوست عزیز"
    );


  return (
    `<a href="tg://user?id=${user.id}">${name}</a>`
  );

}


// =====================================
// متن خوشامد
// =====================================

function getWelcomeText(
  user,
  chat
) {

  const settings =
    getWelcomeSettings(
      chat.id
    );


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

function replyToCommand(
  ctx,
  text
) {

  return ctx.reply(
    text,
    {

      parse_mode: "HTML",

      reply_parameters: {

        message_id:
          ctx.message.message_id

      }

    }
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

  const group =
    getGroup(chatId);


  if (!group.welcome) {

    group.welcome = {

      enabled: true,

      text: null,

      type: "text",

      fileId: null,

      managers: {}

    };

  }


  group.welcome.type =
    type;


  group.welcome.fileId =
    fileId;


  group.welcome.enabled =
    true;


  saveDB();


  return group.welcome;

}


// =====================================
// حذف رسانه
// =====================================

function clearWelcomeMedia(
  chatId
) {

  const group =
    getGroup(chatId);


  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.type =
    "text";


  settings.fileId =
    null;


  saveDB();


  return settings;

}


// =====================================
// روشن کردن خوشامد
// =====================================

function enableWelcome(
  chatId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.enabled =
    true;


  saveDB();


  return settings;

}


// =====================================
// خاموش کردن خوشامد
// =====================================

function disableWelcome(
  chatId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.enabled =
    false;


  saveDB();


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

    if (!isGroup(ctx)) {

      return;

    }


    if (
      !user ||
      !user.id
    ) {

      return;

    }


    const settings =
      getWelcomeSettings(
        ctx.chat.id
      );


    if (!settings.enabled) {

      console.log(
        "WELCOME: disabled"
      );

      return;

    }


    const text =
      getWelcomeText(
        user,
        ctx.chat
      );


    // -------------------------------
    // متن
    // -------------------------------

    if (
      settings.type === "text" ||
      !settings.fileId
    ) {

      return await ctx.reply(
        text,
        {
          parse_mode: "HTML"
        }
      );

    }


    // -------------------------------
    // GIF
    // -------------------------------

    if (
      settings.type === "animation"
    ) {

      return await ctx.replyWithAnimation(
        settings.fileId,
        {

          caption: text,

          parse_mode: "HTML"

        }
      );

    }


    // -------------------------------
    // ویدیو
    // -------------------------------

    if (
      settings.type === "video"
    ) {

      return await ctx.replyWithVideo(
        settings.fileId,
        {

          caption: text,

          parse_mode: "HTML"

        }
      );

    }


    // -------------------------------
    // عکس
    // -------------------------------

    if (
      settings.type === "photo"
    ) {

      return await ctx.replyWithPhoto(
        settings.fileId,
        {

          caption: text,

          parse_mode: "HTML"

        }
      );

    }


    // -------------------------------
    // استیکر
    // -------------------------------

    if (
      settings.type === "sticker"
    ) {

      await ctx.replyWithSticker(
        settings.fileId
      );


      return await ctx.reply(
        text,
        {
          parse_mode: "HTML"
        }
      );

    }


    // -------------------------------
    // حالت ناشناخته
    // -------------------------------

    return await ctx.reply(
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
    "WELCOME SYSTEM REGISTERED"
  );


  // ===================================
  // ورود عضو
  // ===================================

  bot.on(
    "new_chat_members",
    async ctx => {

      try {

        if (!isGroup(ctx)) {

          return;

        }


        const members =
          ctx.message
            .new_chat_members || [];


        if (
          !Array.isArray(members) ||
          members.length === 0
        ) {

          return;

        }


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
          "NEW MEMBER ERROR:",
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

        if (!isGroup(ctx))
          return;


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

روی GIF ریپلای کنید و بنویسید:

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

GIF خوشامد با موفقیت تنظیم شد. ✅`
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

        if (!isGroup(ctx))
          return;


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

روی ویدیو ریپلای کنید و بنویسید:

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

ویدیوی خوشامد با موفقیت تنظیم شد. ✅`
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
  // تنظیم عکس
  // ===================================

  bot.hears(
    /^تنظیم\s+عکس$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


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

روی عکس ریپلای کنید و بنویسید:

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

عکس خوشامد با موفقیت تنظیم شد. ✅`
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
  // تنظیم استیکر
  // ===================================

  bot.hears(
    /^تنظیم\s+استیکر$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


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

روی استیکر ریپلای کنید و بنویسید:

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

استیکر خوشامد با موفقیت تنظیم شد. ✅`
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
  // روشن
  // ===================================

  bot.hears(
    /^خوشامد\s+روشن$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const access =
          await checkAdmin(ctx);


        if (!access.ok)
          return;


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
  // خاموش
  // ===================================

  bot.hears(
    /^خوشامد\s+خاموش$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const access =
          await checkAdmin(ctx);


        if (!access.ok)
          return;


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
  // حذف خوشامد
  // ===================================

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const access =
          await checkAdmin(ctx);


        if (!access.ok)
          return;


        clearWelcomeMedia(
          ctx.chat.id
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

رسانه خوشامد حذف شد. ✅

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
  // وضعیت خوشامد
  // ===================================

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const access =
          await checkAdmin(ctx);


        if (!access.ok)
          return;


        const settings =
          getWelcomeSettings(
            ctx.chat.id
          );


        let media =
          "فقط متن";


        if (
          settings.type === "animation"
        )
          media = "GIF";


        else if (
          settings.type === "video"
        )
          media = "ویدیو";


        else if (
          settings.type === "photo"
        )
          media = "عکس";


        else if (
          settings.type === "sticker"
        )
          media = "استیکر";


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
