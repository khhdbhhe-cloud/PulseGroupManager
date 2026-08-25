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
// ریپلای به دستور
// =====================================

async function replyToCommand(ctx, text) {

  try {

    return await ctx.reply(
      text,
      {
        reply_parameters: {
          message_id: ctx.message.message_id
        }
      }
    );

  } catch (error) {

    console.log(
      "WELCOME REPLY ERROR:",
      error.message
    );

  }

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

  settings.type = type;
  settings.fileId = fileId;
  settings.enabled = true;

  return settings;

}


// =====================================
// حذف رسانه
// =====================================

function clearWelcomeMedia(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.type = "text";
  settings.fileId = null;

  return settings;

}


// =====================================
// روشن کردن
// =====================================

function enableWelcome(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.enabled = true;

  return settings;

}


// =====================================
// خاموش کردن
// =====================================

function disableWelcome(chatId) {

  const settings =
    getWelcomeSettings(chatId);

  settings.enabled = false;

  return settings;

}


// =====================================
// دریافت متن خوشامد
// =====================================

function getWelcomeText(user, chat) {

  const settings =
    getWelcomeSettings(chat.id);

  if (settings.text) {

    return formatWelcomeText(
      settings.text,
      user,
      chat
    );

  }

  return getDefaultWelcomeText(
    user,
    chat
  );

}


// =====================================
// ارسال خوشامد
// =====================================

async function sendWelcome(ctx, user) {

  try {

    if (!ctx.chat || !user) {
      return;
    }

    const settings =
      getWelcomeSettings(
        ctx.chat.id
      );

    if (!settings.enabled) {

      console.log(
        "WELCOME DISABLED:",
        ctx.chat.id
      );

      return;

    }

    const text =
      getWelcomeText(
        user,
        ctx.chat
      );


    // =================================
    // متن
    // =================================

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


    // =================================
    // GIF
    // =================================

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


    // =================================
    // ویدیو
    // =================================

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


    // =================================
    // عکس
    // =================================

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


    // =================================
    // استیکر
    // =================================

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


    // =================================
    // حالت پیش‌فرض
    // =================================

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


  // ===================================
  // عضو جدید
  // ===================================

  bot.on(
    "new_chat_members",
    async ctx => {

      try {

        console.log(
          "NEW MEMBER EVENT:",
          ctx.chat?.title,
          ctx.chat?.id
        );

        if (!isGroup(ctx)) {

          return;

        }

        const members =
          ctx.message?.new_chat_members || [];

        console.log(
          "NEW MEMBERS COUNT:",
          members.length
        );

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
  // تنظیم گیف
  // ===================================

  bot.hears(
    /^تنظیم\s+گیف$/u,
    async ctx => {

      if (!isGroup(ctx)) return;

      try {

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
            "روی یک GIF ریپلای کنید و بنویسید:\n\nتنظیم گیف"
          );

        }

        setWelcomeMedia(
          ctx.chat.id,
          "animation",
          reply.animation.file_id
        );

        return replyToCommand(
          ctx,
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nگیف خوشامدگویی با موفقیت تنظیم شد. ✅"
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

      if (!isGroup(ctx)) return;

      try {

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
            "روی یک ویدیو ریپلای کنید و بنویسید:\n\nتنظیم ویدیو"
          );

        }

        setWelcomeMedia(
          ctx.chat.id,
          "video",
          reply.video.file_id
        );

        return replyToCommand(
          ctx,
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nویدیوی خوشامدگویی با موفقیت تنظیم شد. ✅"
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

      if (!isGroup(ctx)) return;

      try {

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
            "روی یک استیکر ریپلای کنید و بنویسید:\n\nتنظیم استیکر"
          );

        }

        setWelcomeMedia(
          ctx.chat.id,
          "sticker",
          reply.sticker.file_id
        );

        return replyToCommand(
          ctx,
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nاستیکر خوشامدگویی با موفقیت تنظیم شد. ✅"
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

      if (!isGroup(ctx)) return;

      try {

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
            "روی یک عکس ریپلای کنید و بنویسید:\n\nتنظیم عکس"
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
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nعکس خوشامدگویی با موفقیت تنظیم شد. ✅"
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
  // تنظیم متن خوشامد
  // ===================================

  bot.hears(
    /^تنظیم\s+متن\s+خوشامد$/u,
    async ctx => {

      if (!isGroup(ctx)) return;

      try {

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
          !reply.text
        ) {

          return replyToCommand(
            ctx,
            "روی متن موردنظر ریپلای کنید و بنویسید:\n\nتنظیم متن خوشامد"
          );

        }

        const settings =
          getWelcomeSettings(
            ctx.chat.id
          );

        settings.text =
          reply.text;

        settings.type =
          "text";

        settings.fileId =
          null;

        settings.enabled =
          true;

        return replyToCommand(
          ctx,
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nمتن خوشامدگویی با موفقیت تنظیم شد. ✅"
        );

      }

      catch (error) {

        console.log(
          "SET WELCOME TEXT ERROR:",
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

      if (!isGroup(ctx)) return;

      try {

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
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nسیستم خوشامدگویی فعال شد. ✅"
        );

      }

      catch (error) {

        console.log(
          "ENABLE WELCOME ERROR:",
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

      if (!isGroup(ctx)) return;

      try {

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
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nسیستم خوشامدگویی خاموش شد. ❌"
        );

      }

      catch (error) {

        console.log(
          "DISABLE WELCOME ERROR:",
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

      if (!isGroup(ctx)) return;

      try {

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

        const settings =
          getWelcomeSettings(
            ctx.chat.id
          );

        settings.text =
          null;

        return replyToCommand(
          ctx,
          "『𓆩 ★ خوشامدگویی ★ 𓆪』\n\nرسانه و متن سفارشی حذف شد.\n\nخوشامد به حالت پیش‌فرض برگشت. ✅"
        );

      }

      catch (error) {

        console.log(
          "CLEAR WELCOME ERROR:",
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

      if (!isGroup(ctx)) return;

      try {

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
`『𓆩 ★ وضعیت خوشامد ★ 𓆪』

وضعیت:
${settings.enabled ? "فعال ✅" : "خاموش ❌"}

رسانه:
${media}

متن سفارشی:
${settings.text ? "دارد ✅" : "ندارد"}`
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
