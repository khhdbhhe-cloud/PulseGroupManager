// =====================================
// PulseGroupManager
// COMMANDS SYSTEM
// =====================================

const {
  mainPanel,
  panelText
} = require("./panel");

const {
  checkAdmin
} = require("./security");


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
    "COMMANDS: ربات / تست / وضعیت ربات / پنل"
  );

  console.log(
    "================================="
  );


  // ===================================
  // ربات
  // ===================================

  bot.hears(
    "ربات",
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        console.log(
          "COMMAND MATCHED: ربات"
        );


        return await replyToCommand(
          ctx,

`『𓆩 ★ PulseGroupManager ★ 𓆪』

🤖 ربات فعاله و آماده‌ست ✅

📌 گروه:
${ctx.chat.title || "بدون نام"}

👤 درخواست توسط:
${ctx.from.first_name || "کاربر"}

🆔 آیدی:
${ctx.from.id}`
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
  // تست
  // ===================================

  bot.hears(
    "تست",
    async ctx => {

      try {

        if (!isGroup(ctx))
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
    "وضعیت ربات",
    async ctx => {

      try {

        if (!isGroup(ctx))
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
    "پنل",
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        console.log(
          "COMMAND MATCHED: پنل"
        );


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        return await replyToCommand(
          ctx,
          panelText(),
          mainPanel(
            ctx.from.id
          )
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
  // دستور تست انگلیسی
  // ===================================

  bot.hears(
    "bot",
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        return await replyToCommand(
          ctx,

`『𓆩 ★ PulseGroupManager ★ 𓆪』

🤖 ربات فعاله ✅`
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
  // تست فارسی جایگزین
  // ===================================

  bot.hears(
    "آنلاین",
    async ctx => {

      try {

        if (!isGroup(ctx))
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
  registerCommands
};
