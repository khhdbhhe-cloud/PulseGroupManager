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
// تنظیمات موقت خوشامد
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
// دریافت تنظیمات خوشامد
// =====================================

function getWelcomeSettings(chatId) {

  const id =
    String(chatId);


  if (!welcomeSettings.has(id)) {

    const group =
      getGroup(id);


    const saved =
      group.welcome || {};


    welcomeSettings.set(
      id,
      {

        enabled:
          saved.enabled !== undefined
            ? saved.enabled
            : true,

        type:
          saved.type || "text",

        fileId:
          saved.fileId || null,

        text:
          saved.text || null

      }
    );

  }


  return welcomeSettings.get(id);

}


// =====================================
// ذخیره تنظیمات خوشامد
// =====================================

function saveWelcomeSettings(
  chatId
) {

  const id =
    String(chatId);

  const settings =
    getWelcomeSettings(id);

  const group =
    getGroup(id);


  group.welcome = {

    enabled:
      settings.enabled,

    type:
      settings.type,

    fileId:
      settings.fileId,

    text:
      settings.text

  };


  saveDB();

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
// ساخت متن خوشامد
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

      reply_parameters: {

        message_id:
          ctx.message.message_id

      },

      parse_mode:
        "HTML"

    }
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
    getWelcomeSettings(
      chatId
    );


  settings.type =
    type;


  settings.fileId =
    fileId;


  settings.enabled =
    true;


  saveWelcomeSettings(
    chatId
  );


  return settings;

}


// =====================================
// حذف رسانه
// =====================================

function clearWelcomeMedia(
  chatId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.type =
    "text";


  settings.fileId =
    null;


  saveWelcomeSettings(
    chatId
  );


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


  saveWelcomeSettings(
    chatId
  );


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


  saveWelcomeSettings(
    chatId
  );


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


    const settings =
      getWelcomeSettings(
        ctx.chat.id
      );


    if (!settings.enabled) {

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

      return ctx.reply(
        text,
        {
          parse_mode:
            "HTML"
        }
      );

    }


    // -------------------------------
    // GIF
    // -------------------------------

    if (
      settings.type === "animation"
    ) {

      return ctx.replyWithAnimation(
        settings.fileId,
        {

          caption:
            text,

          parse_mode:
            "HTML"

        }
      );

    }


    // -------------------------------
    // ویدیو
    // -------------------------------

    if (
      settings.type === "video"
    ) {

      return ctx.replyWithVideo(
        settings.fileId,
        {

          caption:
            text,

          parse_mode:
            "HTML"

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


      return ctx.reply(
        text,
        {
          parse_mode:
            "HTML"
        }
      );

    }


    // -------------------------------
    // عکس
    // -------------------------------

    if (
      settings.type === "photo"
    ) {

      return ctx.replyWithPhoto(
        settings.fileId,
        {

          caption:
            text,

          parse_mode:
            "HTML"

        }
      );

    }


    return ctx.reply(
      text,
      {
        parse_mode:
          "HTML"
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
// ثبت ورود اعضا
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
            .new_chat_members;


        if (
          !Array.isArray(members) ||
          members.length === 0
        ) {

          return;

        }


        const group =
          getGroup(
            ctx.chat.id
          );


        // -------------------------------
        // ثبت آمار ورود
        // -------------------------------

        group.stats.joins +=
          members.length;


        saveDB();


        // -------------------------------
        // خوشامد تک‌تک اعضا
        // -------------------------------

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

گیف خوشامد با موفقیت تنظیم شد. ✅`
      );

    }
  );


  // ===================================
  // تنظیم ویدیو
  // ===================================

  bot.hears(
    /^تنظیم\s+ویدیو$/u,
    async ctx => {

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
  );


  // ===================================
  // تنظیم عکس
  // ===================================

  bot.hears(
    /^تنظیم\s+عکس$/u,
    async ctx => {

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
  );


  // ===================================
  // تنظیم استیکر
  // ===================================

  bot.hears(
    /^تنظیم\s+استیکر$/u,
    async ctx => {

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
  );


  // ===================================
  // خوشامد روشن
  // ===================================

  bot.hears(
    /^خوشامد\s+روشن$/u,
    async ctx => {

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
  );


  // ===================================
  // خوشامد خاموش
  // ===================================

  bot.hears(
    /^خوشامد\s+خاموش$/u,
    async ctx => {

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
  );


  // ===================================
  // حذف رسانه
  // ===================================

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

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

از این به بعد خوشامد به صورت متنی ارسال می‌شود.`
      );

    }
  );


  // ===================================
  // وضعیت خوشامد
  // ===================================

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

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
        "متن";


      if (
        settings.type === "animation"
      )
        media = "GIF";


      if (
        settings.type === "video"
      )
        media = "ویدیو";


      if (
        settings.type === "photo"
      )
        media = "عکس";


      if (
        settings.type === "sticker"
      )
        media = "استیکر";


      return replyToCommand(
        ctx,
`『𓆩 ★ وضعیت خوشامد ★ 𓆪』

وضعیت:
${settings.enabled ? "فعال ✅" : "خاموش ❌"}

رسانه:
${media}`
      );

    }
  );

}


// =====================================
// EXPORT
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
