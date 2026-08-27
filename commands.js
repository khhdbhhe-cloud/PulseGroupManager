// =====================================
// PulseGroupManager
// COMMANDS SYSTEM - FINAL
// =====================================

const {
  mainPanel,
  panelText
} = require("./panel");

const {
  checkAdmin,
  checkOwner
} = require("./security");

const {
  getUserNickname,
  setUserNickname,
  removeUserNickname,
  isNicknameLocked
} = require("./settings");


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
// ریپلای به پیام فعلی
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
// نام کاربر
// =====================================

function getDisplayName(user) {

  if (!user)
    return "کاربر";


  if (user.username) {

    return `@${user.username}`;

  }


  const name = [

    user.first_name,
    user.last_name

  ]
    .filter(Boolean)
    .join(" ")
    .trim();


  return name || "کاربر";

}


// =====================================
// بررسی مالک بودن کاربر هدف
// =====================================

async function isTargetOwner(
  ctx,
  userId
) {

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );


    return (
      member &&
      member.status === "creator"
    );

  }

  catch (error) {

    console.log(
      "TARGET OWNER CHECK ERROR:",
      error.message
    );

    return false;

  }

}


// =====================================
// بررسی اجازه تغییر لقب کاربر هدف
// =====================================
//
// مدیر و مالک می‌توانند لقب ممبرها را تنظیم کنند.
// اما لقب مالک فقط توسط خود مالک قابل تغییر است.
// =====================================

async function canChangeTargetNickname(
  ctx,
  targetUserId
) {

  const owner =
    await isTargetOwner(
      ctx,
      targetUserId
    );


  if (!owner) {

    return true;

  }


  const access =
    await checkOwner(ctx);


  if (!access.ok) {

    await replyToCommand(
      ctx,
      "⛔ لقب مالک فقط توسط خود مالک قابل تنظیم یا حذف است."
    );

    return false;

  }


  return true;

}


// =====================================
// پاسخ مشخصات لقب
// =====================================

async function replyNicknameInfo(
  ctx,
  targetUser,
  nickname
) {

  const displayName =
    getDisplayName(targetUser);


  const text =
    nickname

      ? `『𓆩 ★ لقب کاربر ★ 𓆪』

👤 ${displayName}

🏷 ${nickname}`

      : `『𓆩 ☆ لقب کاربر ☆ 𓆪』

👤 ${displayName}

☆ برای این کاربر لقبی ثبت نشده است.`;


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
// پاسخ لقب روی پیام هدف
// =====================================

async function replyToTargetMessage(
  ctx,
  targetMessage,
  text
) {

  return ctx.reply(
    text,
    {
      parse_mode: "HTML",

      reply_parameters: {
        message_id:
          targetMessage.message_id
      }

    }
  );

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
  "من همیشه اینجام ❤️",
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
// انتخاب پاسخ ربات
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
    "ADMIN: پنل و تنظیم لقب فقط مدیر + مالک"
  );

  console.log(
    "NICKNAME VIEW: همه اعضا"
  );

  console.log(
    "BOT REPLY: فقط مدیر + مالک"
  );

  console.log(
    "================================="
  );


  // ===================================
  // ربات
  // ===================================

  bot.hears(
    /^ربات$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        // فقط مدیر و مالک
        if (!await requireAdmin(ctx))
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
  // bot
  // ===================================

  bot.hears(
    /^bot$/i,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        // فقط مدیر و مالک
        if (!await requireAdmin(ctx))
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
  // لقب من
  // ===================================

  bot.hears(
    /^لقب\s+من$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (isNicknameLocked(ctx.chat.id)) {

          return await replyToCommand(
            ctx,
            "☆ سیستم لقب در این گروه قفل است."
          );

        }


        const nickname =
          getUserNickname(
            ctx.chat.id,
            ctx.from.id
          );


        return await replyToCommand(
          ctx,

          nickname

            ? `『𓆩 ★ لقب من ★ 𓆪』

👤 ${getDisplayName(ctx.from)}

🏷 ${nickname}`

            : `『𓆩 ☆ لقب من ☆ 𓆪』

👤 ${getDisplayName(ctx.from)}

☆ برای شما لقبی ثبت نشده است.`
        );

      }

      catch (error) {

        console.log(
          "COMMAND لقب من ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // لقب روی ریپلای
  // ===================================

  bot.hears(
    /^لقب$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (isNicknameLocked(ctx.chat.id)) {

          return await replyToCommand(
            ctx,
            "☆ سیستم لقب در این گروه قفل است."
          );

        }


        const replyMessage =
          ctx.message.reply_to_message;


        if (
          !replyMessage ||
          !replyMessage.from
        ) {

          return await replyToCommand(
            ctx,
            "⛔ برای دیدن لقب، روی پیام کاربر ریپلای کنید و «لقب» بنویسید."
          );

        }


        const targetUser =
          replyMessage.from;


        const nickname =
          getUserNickname(
            ctx.chat.id,
            targetUser.id
          );


        return await replyToTargetMessage(
          ctx,
          replyMessage,

          nickname

            ? `『𓆩 ★ لقب کاربر ★ 𓆪』

👤 ${getDisplayName(targetUser)}

🏷 ${nickname}`

            : `『𓆩 ☆ لقب کاربر ☆ 𓆪』

👤 ${getDisplayName(targetUser)}

☆ برای این کاربر لقبی ثبت نشده است.`
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
  // تنظیم لقب
  // ===================================
  //
  // روی پیام کاربر ریپلای:
  //
  // تنظیم لقب زیبای گپ
  // ===================================

  bot.hears(
    /^تنظیم\s+لقب\s+(.+)$/u,
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        if (!await requireAdmin(ctx))
          return;


        const replyMessage =
          ctx.message.reply_to_message;


        if (
          !replyMessage ||
          !replyMessage.from
        ) {

          return await replyToCommand(
            ctx,
            "⛔ برای تنظیم لقب، باید روی پیام همان کاربر ریپلای کنید."
          );

        }


        const targetUser =
          replyMessage.from;


        // مالک فقط توسط خودش
        if (
          !await canChangeTargetNickname(
            ctx,
            targetUser.id
          )
        ) {

          return;

        }


        const nickname =
          ctx.match[1].trim();


        if (!nickname) {

          return await replyToCommand(
            ctx,
            "⛔ لقب وارد نشده است."
          );

        }


        setUserNickname(
          ctx.chat.id,
          targetUser.id,
          nickname
        );


        return await replyToCommand(
          ctx,

`『𓆩 ★ لقب تنظیم شد ★ 𓆪』

👤 ${getDisplayName(targetUser)}

🏷 ${nickname}`
        );

      }

      catch (error) {

        console.log(
          "COMMAND تنظیم لقب ERROR:",
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


        const replyMessage =
          ctx.message.reply_to_message;


        if (
          !replyMessage ||
          !replyMessage.from
        ) {

          return await replyToCommand(
            ctx,
            "⛔ برای حذف لقب، روی پیام همان کاربر ریپلای کنید."
          );

        }


        const targetUser =
          replyMessage.from;


        // مالک فقط توسط خودش
        if (
          !await canChangeTargetNickname(
            ctx,
            targetUser.id
          )
        ) {

          return;

        }


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

👤 ${getDisplayName(targetUser)}

☆ لقب این کاربر حذف شد.`
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
