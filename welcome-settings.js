// =====================================
// PulseGroupManager
// Welcome Settings
// =====================================

const { getRole } = require("./security");

const {
  getWelcomeSettings,
  setWelcomeMedia,
  clearWelcomeMedia,
  enableWelcome,
  disableWelcome
} = require("./welcome");


// =====================================
// مدیرانی که مقام خوشامد دارند
// =====================================

const welcomeManagers = new Map();


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
// گرفتن نقش کاربر
// =====================================

async function getUserRole(ctx, userId) {

  try {

    return await getRole(
      ctx,
      userId
    );

  }

  catch (error) {

    console.log(
      "WELCOME ROLE ERROR:",
      error.message
    );

    return null;

  }

}


// =====================================
// بررسی مالک
// =====================================

async function isOwner(ctx) {

  const role =
    await getUserRole(
      ctx,
      ctx.from.id
    );

  return role === "creator";

}


// =====================================
// کلید مقام
// =====================================

function managerKey(
  chatId,
  userId
) {

  return `${chatId}:${userId}`;

}


// =====================================
// دادن مقام خوشامد
// =====================================

function addWelcomeManager(
  chatId,
  userId
) {

  welcomeManagers.set(
    managerKey(
      chatId,
      userId
    ),
    true
  );

}


// =====================================
// حذف مقام خوشامد
// =====================================

function removeWelcomeManager(
  chatId,
  userId
) {

  welcomeManagers.delete(
    managerKey(
      chatId,
      userId
    )
  );

}


// =====================================
// بررسی داشتن مقام خوشامد
// =====================================

function hasWelcomeManager(
  chatId,
  userId
) {

  return welcomeManagers.has(
    managerKey(
      chatId,
      userId
    )
  );

}


// =====================================
// بررسی دسترسی تنظیم خوشامد
// =====================================

async function canManageWelcome(ctx) {

  if (!isGroup(ctx)) {

    return {
      ok: false,
      text: "این دستور فقط داخل گروه کار می‌کند."
    };

  }


  const role =
    await getUserRole(
      ctx,
      ctx.from.id
    );


  // مالک همیشه دسترسی دارد

  if (role === "creator") {

    return {
      ok: true,
      role: "creator"
    };

  }


  // مدیر دارای مقام خوشامد

  if (
    hasWelcomeManager(
      ctx.chat.id,
      ctx.from.id
    )
  ) {

    return {
      ok: true,
      role: "welcome_manager"
    };

  }


  return {
    ok: false,
    text:
      "فقط مالک گروه یا مدیری که مقام خوشامد دارد می‌تواند این دستور را اجرا کند."
  };

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
      }
    }
  );

}


// =====================================
// تنظیم GIF
// =====================================

function registerGif(bot) {

  bot.hears(
    /^تنظیم\s+گیف$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

گیف خوشامدگویی با موفقیت تنظیم شد. 🎬

از این به بعد اعضای جدید با همین GIF خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME SETTINGS GIF ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// تنظیم ویدیو
// =====================================

function registerVideo(bot) {

  bot.hears(
    /^تنظیم\s+ویدیو$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

ویدیوی خوشامدگویی با موفقیت تنظیم شد. 🎥

از این به بعد اعضای جدید با همین ویدیو خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME SETTINGS VIDEO ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// تنظیم استیکر
// =====================================

function registerSticker(bot) {

  bot.hears(
    /^تنظیم\s+استیکر$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

استیکر خوشامدگویی با موفقیت تنظیم شد. 🧩

از این به بعد اعضای جدید با همین استیکر خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME SETTINGS STICKER ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// تنظیم عکس
// =====================================

function registerPhoto(bot) {

  bot.hears(
    /^تنظیم\s+عکس$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

عکس خوشامدگویی با موفقیت تنظیم شد. 🖼️

از این به بعد اعضای جدید با همین عکس خوشامدگویی می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME SETTINGS PHOTO ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// روشن کردن خوشامد
// =====================================

function registerEnable(bot) {

  bot.hears(
    /^خوشامد\s+روشن$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

}


// =====================================
// خاموش کردن خوشامد
// =====================================

function registerDisable(bot) {

  bot.hears(
    /^خوشامد\s+خاموش$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

}


// =====================================
// حذف رسانه خوشامد
// =====================================

function registerClear(bot) {

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

}


// =====================================
// وضعیت خوشامد
// =====================================

function registerStatus(bot) {

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

      try {

        const access =
          await canManageWelcome(ctx);

        if (!access.ok) {

          return replyToCommand(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
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

          mediaName = "GIF";

        }

        else if (
          settings.type === "video"
        ) {

          mediaName = "ویدیو";

        }

        else if (
          settings.type === "sticker"
        ) {

          mediaName = "استیکر";

        }

        else if (
          settings.type === "photo"
        ) {

          mediaName = "عکس";

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
// مقام خوشامد - فقط مالک
// =====================================

function registerManagerGrant(bot) {

  bot.hears(
    /^مقام\s+خوشامد\s+تنظیم$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {
          return;
        }


        const owner =
          await isOwner(ctx);


        if (!owner) {

          return replyToCommand(
            ctx,
`『𓆩 ★ دسترسی ★ 𓆪』

فقط مالک گروه می‌تواند مقام خوشامد را تنظیم کند.`
          );

        }


        const reply =
          ctx.message.reply_to_message;


        if (!reply || !reply.from) {

          return replyToCommand(
            ctx,
`『𓆩 ★ مقام خوشامد ★ 𓆪』

روی پیام مدیر موردنظر ریپلای کنید و بنویسید:

مقام خوشامد تنظیم`
          );

        }


        const targetId =
          reply.from.id;


        const targetRole =
          await getUserRole(
            ctx,
            targetId
          );


        if (
          targetRole !== "administrator" &&
          targetRole !== "creator"
        ) {

          return replyToCommand(
            ctx,
`『𓆩 ★ مقام خوشامد ★ 𓆪』

این مقام فقط به مدیر گروه داده می‌شود.`
          );

        }


        if (
          targetRole === "creator"
        ) {

          return replyToCommand(
            ctx,
`『𓆩 ★ مقام خوشامد ★ 𓆪』

مالک گروه از قبل تمام دسترسی‌های خوشامد را دارد.`
          );

        }


        addWelcomeManager(
          ctx.chat.id,
          targetId
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ مقام خوشامد ★ 𓆪』

مقام خوشامد برای این مدیر فعال شد. ✅

از این به بعد می‌تواند تنظیمات خوشامدگویی را مدیریت کند.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME MANAGER GRANT ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// حذف مقام خوشامد - فقط مالک
// =====================================

function registerManagerRemove(bot) {

  bot.hears(
    /^حذف\s+مقام\s+خوشامد$/u,
    async ctx => {

      try {

        if (!isGroup(ctx)) {
          return;
        }


        const owner =
          await isOwner(ctx);


        if (!owner) {

          return replyToCommand(
            ctx,
`『𓆩 ★ دسترسی ★ 𓆪』

فقط مالک گروه می‌تواند مقام خوشامد را حذف کند.`
          );

        }


        const reply =
          ctx.message.reply_to_message;


        if (!reply || !reply.from) {

          return replyToCommand(
            ctx,
`『𓆩 ★ حذف مقام خوشامد ★ 𓆪』

روی پیام مدیر موردنظر ریپلای کنید و بنویسید:

حذف مقام خوشامد`
          );

        }


        const targetId =
          reply.from.id;


        removeWelcomeManager(
          ctx.chat.id,
          targetId
        );


        return replyToCommand(
          ctx,
`『𓆩 ★ مقام خوشامد ★ 𓆪』

مقام خوشامد این مدیر حذف شد. ✅

از این به بعد دسترسی تنظیم خوشامدگویی را ندارد.`
        );

      }

      catch (error) {

        console.log(
          "WELCOME MANAGER REMOVE ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// ثبت همه دستورات
// =====================================

function registerWelcomeSettings(bot) {

  registerGif(bot);

  registerVideo(bot);

  registerSticker(bot);

  registerPhoto(bot);

  registerEnable(bot);

  registerDisable(bot);

  registerClear(bot);

  registerStatus(bot);

  registerManagerGrant(bot);

  registerManagerRemove(bot);

}


// =====================================
// خروجی
// =====================================

module.exports = {

  registerWelcomeSettings,
  canManageWelcome,
  addWelcomeManager,
  removeWelcomeManager,
  hasWelcomeManager

};
