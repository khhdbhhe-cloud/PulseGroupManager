// =====================================
// PulseGroupManager
// COMMANDS SYSTEM - FINAL
// =====================================

const {
  mainPanel,
  panelText
} = require("./panel");

const {
  checkAdmin
} = require("./security");

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// بررسی گروه
// =====================================

function isGroup(ctx) {

  return !!(
    ctx &&
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );

}


// =====================================
// ریپلای به پیام کاربر
// =====================================

async function replyToCommand(
  ctx,
  text,
  extra = {}
) {

  return ctx.reply(
    text,
    {
      parse_mode: "HTML",

      reply_parameters: {
        message_id:
          ctx.message.message_id
      },

      ...extra
    }
  );

}


// =====================================
// بررسی دسترسی مدیر / مالک
// =====================================

async function requireAdmin(ctx) {

  const access =
    await checkAdmin(ctx);


  if (!access.ok) {

    await replyToCommand(
      ctx,
      access.text ||
      "⛔ فقط مدیران و مالک گروه دسترسی دارند."
    );

    return false;

  }


  return true;

}


// =====================================
// ایجاد بخش لقب‌ها
// =====================================

function getNicknames(chatId) {

  const group =
    getGroup(chatId);


  if (!group.botNicknames) {

    group.botNicknames = {};

    saveDB();

  }


  return group.botNicknames;

}


// =====================================
// دریافت لقب کاربر
// =====================================

function getUserNickname(
  chatId,
  userId
) {

  const nicknames =
    getNicknames(chatId);


  return (
    nicknames[String(userId)] ||
    null
  );

}


// =====================================
// تنظیم لقب کاربر
// =====================================

function setUserNickname(
  chatId,
  userId,
  nickname
) {

  const nicknames =
    getNicknames(chatId);


  nicknames[String(userId)] =
    nickname.trim();


  saveDB();


  return true;

}


// =====================================
// حذف لقب کاربر
// =====================================

function removeUserNickname(
  chatId,
  userId
) {

  const nicknames =
    getNicknames(chatId);


  const id =
    String(userId);


  if (nicknames[id]) {

    delete nicknames[id];

    saveDB();

    return true;

  }


  return false;

}


// =====================================
// پاسخ‌های ربات
// =====================================

const botReplies = [

  "جانم {nickname}؟ 🌹",

  "هستم {nickname} 😌",

  "جانم، صدایم کردی {nickname}؟ ❤️",

  "همیشه فعالم {nickname} 😎",

  "بله {nickname}، اینجام 👀",

  "جانم زیبای گپ؟ 🌹",

  "هستم، مگه میشه نباشم؟ 😏",

  "بله بله، ربات حاضر است 😎",

  "جانم؟ چیزی کارم داشتی {nickname}؟",

  "هستم {nickname}، بگو ببینم چی شده؟",

  "صدایم کردی؟ اینجام 😌",

  "من همیشه فعالم ❤️",

  "جانم خوشگل گپ؟ 😄",

  "بله، گوشم با توئه {nickname} 👀",

  "هستم هَستم 😎",

  "جانم؟ بگو {nickname} 🌹",

  "ربات حاضر و آماده‌ست ✅",

  "بله عزیز گپ، اینجام 😌",

  "من که همیشه اینجام 😏",

  "جانم؟ صدای ربات رو شنیدی؟ 😂"

];


// =====================================
// انتخاب پاسخ تصادفی
// =====================================

function randomBotReply(
  nickname
) {

  const randomIndex =
    Math.floor(
      Math.random() *
      botReplies.length
    );


  let reply =
    botReplies[randomIndex];


  const name =
    nickname ||
    "زیبای گپ";


  reply =
    reply.replace(
      /\{nickname\}/g,
      name
    );


  return reply;

}


// =====================================
// ثبت دستورات
// =====================================

function registerCommands(bot) {

  console.log(
    "================================="
  );

  console.log(
    "COMMAND SYSTEM REGISTERED"
  );

  console.log(
    "COMMANDS: ربات / تست / وضعیت ربات / پنل / لقب"
  );

  console.log(
    "ADMIN: پنل و تنظیمات فقط مدیر + مالک"
  );

  console.log(
    "BOT REPLY: همه اعضای گروه"
  );

  console.log(
    "================================="
  );


  // ===================================
  // ربات
  // ===================================
  //
  // این دستور مدیریتی نیست.
  // همه اعضای گروه می‌توانند ربات را صدا بزنند.
  //
  // اگر برای کاربر لقب ثبت شده باشد،
  // همان لقب در پاسخ استفاده می‌شود.
  // ===================================

  bot.hears(
    /^ربات$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const nickname =
          getUserNickname(
            ctx.chat.id,
            ctx.from.id
          );


        console.log(
          "COMMAND MATCHED: ربات"
        );


        return await replyToCommand(
          ctx,
          randomBotReply(nickname)
        );

      }

      catch (error) {

        console.log(
          "COMMAND ربات ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // لقب
  // ===================================
  //
  // استفاده:
  //
  // روی پیام کاربر ریپلای کن و بنویس:
  //
  // لقب زیبای گپ
  //
  // فقط مدیر و مالک
  // ===================================

  bot.hears(
    /^لقب\s+(.+)$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (!await requireAdmin(ctx))
          return;


        if (
          !ctx.message.reply_to_message ||
          !ctx.message.reply_to_message.from
        ) {

          return await replyToCommand(
            ctx,
            "⛔ برای تعیین لقب، باید روی پیام همان کاربر ریپلای کنید."
          );

        }


        const nickname =
          ctx.match[1].trim();


        if (!nickname) {

          return await replyToCommand(
            ctx,
            "⛔ لقب وارد نشده است."
          );

        }


        const targetUser =
          ctx.message.reply_to_message.from;


        setUserNickname(
          ctx.chat.id,
          targetUser.id,
          nickname
        );


        return await replyToCommand(
          ctx,

`『𓆩 ★ لقب تنظیم شد ★ 𓆪』

👤 کاربر:
${targetUser.first_name || "کاربر"}

🏷 لقب:
${nickname}

از این به بعد وقتی این کاربر بنویسد «ربات»،
ربات با همین لقب پاسخ می‌دهد.`
        );

      }

      catch (error) {

        console.log(
          "COMMAND لقب ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // حذف لقب
  // ===================================

  bot.hears(
    /^حذف\s+لقب$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (!await requireAdmin(ctx))
          return;


        if (
          !ctx.message.reply_to_message ||
          !ctx.message.reply_to_message.from
        ) {

          return await replyToCommand(
            ctx,
            "⛔ روی پیام کاربری که می‌خواهید لقبش حذف شود ریپلای کنید."
          );

        }


        const targetUser =
          ctx.message.reply_to_message.from;


        const removed =
          removeUserNickname(
            ctx.chat.id,
            targetUser.id
          );


        if (!removed) {

          return await replyToCommand(
            ctx,
            "☆ این کاربر لقبی ثبت‌شده ندارد."
          );

        }


        return await replyToCommand(
          ctx,

`『𓆩 ★ لقب حذف شد ★ 𓆪』

لقب کاربر حذف شد.

از این به بعد پاسخ «ربات»
با لقب پیش‌فرض انجام می‌شود.`
        );

      }

      catch (error) {

        console.log(
          "COMMAND حذف لقب ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // تست
  // ===================================

  bot.hears(
    /^تست$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (!await requireAdmin(ctx))
          return;


        console.log(
          "COMMAND MATCHED: تست"
        );


        return await replyToCommand(
          ctx,

`『𓆩 ★ تست ربات ★ 𓆪』

پاسخ با موفقیت دریافت شد. ✅

🤖 PulseGroupManager فعال است.`
        );

      }

      catch (error) {

        console.log(
          "COMMAND تست ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // وضعیت ربات
  // ===================================

  bot.hears(
    /^وضعیت\s+ربات$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (!await requireAdmin(ctx))
          return;


        console.log(
          "COMMAND MATCHED: وضعیت ربات"
        );


        return await replyToCommand(
          ctx,

`『𓆩 ★ وضعیت ربات ★ 𓆪』

🤖 وضعیت:
فعال ✅

📡 سیستم:
آنلاین ✅

👥 گروه:
${ctx.chat.title || "بدون نام"}`
        );

      }

      catch (error) {

        console.log(
          "COMMAND وضعیت ربات ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // پنل
  // ===================================

  bot.hears(
    /^پنل$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        console.log(
          "COMMAND MATCHED: پنل"
        );


        if (!await requireAdmin(ctx))
          return;


        return await ctx.reply(
          panelText(),
          {

            ...mainPanel(
              ctx.from.id
            ),

            reply_parameters: {

              message_id:
                ctx.message.message_id

            },

            parse_mode: "HTML"

          }
        );

      }

      catch (error) {

        console.log(
          "PANEL COMMAND ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // دستور انگلیسی BOT
  // ===================================

  bot.hears(
    /^bot$/i,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const nickname =
          getUserNickname(
            ctx.chat.id,
            ctx.from.id
          );


        return await replyToCommand(
          ctx,
          randomBotReply(nickname)
        );

      }

      catch (error) {

        console.log(
          "COMMAND bot ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // آنلاین
  // ===================================

  bot.hears(
    /^آنلاین$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (!await requireAdmin(ctx))
          return;


        return await replyToCommand(
          ctx,

`『𓆩 ★ PulseGroupManager ★ 𓆪』

ربات آنلاین است. ✅`
        );

      }

      catch (error) {

        console.log(
          "COMMAND آنلاین ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// EXPORT
// =====================================

module.exports = {

  registerCommands,

  getUserNickname,

  setUserNickname,

  removeUserNickname,

  randomBotReply

};
