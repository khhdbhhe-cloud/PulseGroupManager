// =====================================
// PulseGroupManager
// COMMANDS SYSTEM - FULL VERSION
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
    "Listening for commands..."
  );

  console.log(
    "================================="
  );


  // ===================================
  // پنل مدیریت
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
  // دستور «ربات»
  // ===================================
  //
  // عمداً با bot.on("text") نوشته شده
  // تا پیام فارسی «ربات» حتماً بررسی شود.
  //
  // ===================================

  bot.on(
    "text",
    async ctx => {

      try {

        if (!isGroup(ctx))
          return;


        const text =
          String(
            ctx.message.text || ""
          ).trim();


        console.log(
          "COMMAND TEXT CHECK:",
          JSON.stringify(text)
        );


        if (text !== "ربات")
          return;


        console.log(
          "BOT COMMAND MATCHED"
        );


        return await ctx.reply(
`『𓆩 ★ PulseGroupManager ★ 𓆪』

🤖 ربات فعاله و آماده‌ست ✅

📌 گروه:
${ctx.chat.title || "بدون نام"}

👤 درخواست توسط:
${ctx.from.first_name || "کاربر"}

🆔 آیدی:
${ctx.from.id}`,
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

      catch (error) {

        console.log(
          "BOT TEXT HANDLER ERROR:",
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
  // تست ربات
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
          "TEST COMMAND ERROR:",
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
