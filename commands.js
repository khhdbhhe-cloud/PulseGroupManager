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
// گرفتن کاربر ریپلای‌شده
// =====================================

function getReplyUser(ctx) {

  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {

    return ctx.message.reply_to_message.from;

  }

  return null;

}


// =====================================
// ریپلای به پیام
// =====================================

async function replyToCommand(
  ctx,
  text
) {

  try {

    return await ctx.reply(
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

  catch (error) {

    console.log(
      "REPLY ERROR:",
      error.message
    );

  }

}


// =====================================
// ثبت دستورات
// =====================================

function registerCommands(bot) {

  console.log(
    "COMMAND SYSTEM REGISTERED"
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


        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return replyToCommand(
            ctx,
            access.text
          );

        }


        const target =
          getReplyUser(ctx);


        let text =
          panelText();


        if (target) {

          text +=
`\n\n『𓆩 کاربر انتخاب شده 𓆪』

نام:
${target.first_name || "ندارد"}

آیدی:
${target.id}`;

        }


        return await ctx.reply(
          text,
          {

            ...mainPanel(
              ctx.from.id
            ),

            reply_parameters: {
              message_id:
                ctx.message.message_id
            },

            parse_mode:
              "HTML"

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
  // ربات
  // ===================================

  bot.hears(
    /^ربات$/u,
    async ctx => {

      console.log(
        "BOT COMMAND DETECTED"
      );


      try {

        if (!isGroup(ctx)) {

          console.log(
            "BOT COMMAND: NOT GROUP"
          );

          return;

        }


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
          "BOT COMMAND ERROR:",
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
          "BOT STATUS ERROR:",
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


        return await replyToCommand(
          ctx,
`『𓆩 ★ تست ربات ★ 𓆪』

پاسخ با موفقیت دریافت شد. ✅`
        );

      }

      catch (error) {

        console.log(
          "TEST ERROR:",
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
