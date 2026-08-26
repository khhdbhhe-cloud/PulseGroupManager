// =====================================
// PulseGroupManager
// MAIN INDEX
// =====================================

const { Telegraf } = require("telegraf");
const http = require("http");

const {
  registerCommands
} = require("./commands");

const {
  registerPanelActions
} = require("./panel-actions");

const {
  registerHelp
} = require("./help");

const {
  registerSettings
} = require("./settings");

const {
  registerWarningActions
} = require("./warning-actions");

const {
  registerWarningSettings
} = require("./warning-settings");

const {
  registerWelcome
} = require("./welcome");


// =====================================
// CONFIG
// =====================================

const BOT_TOKEN =
  process.env.BOT_TOKEN;

const PORT =
  process.env.PORT || 10000;


if (!BOT_TOKEN) {

  console.error(
    "BOT_TOKEN پیدا نشد."
  );

  process.exit(1);

}


// =====================================
// BOT
// =====================================

const bot =
  new Telegraf(
    BOT_TOKEN
  );


// =====================================
// RENDER HTTP SERVER
// =====================================

const server =
  http.createServer(
    (req, res) => {

      res.writeHead(
        200,
        {
          "Content-Type":
            "text/plain; charset=utf-8"
        }
      );

      res.end(
        "PulseGroupManager ONLINE"
      );

    }
  );


server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "================================="
    );

    console.log(
      "SERVER RUNNING ON PORT:",
      PORT
    );

    console.log(
      "================================="
    );

  }
);


// =====================================
// DEBUG LOGGER
// فقط لاگ می‌گیرد و هیچ جوابی نمی‌دهد
// =====================================

bot.use(
  async (ctx, next) => {

    try {

      if (
        ctx.message &&
        ctx.message.text
      ) {

        console.log(
          "TELEGRAM TEXT:",
          JSON.stringify(
            ctx.message.text
          )
        );

      }

      await next();

    }

    catch (error) {

      console.error(
        "MIDDLEWARE ERROR:",
        error.message
      );

    }

  }
);


// =====================================
// تست مستقیم پیام
// =====================================
//
// این قسمت قبل از سیستم‌های دیگر است.
// اگر کاربر «ربات» یا «تست» بزند
// همین‌جا جواب می‌گیرد.
//

bot.on(
  "text",
  async ctx => {

    try {

      if (!ctx.chat)
        return;


      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {

        return;

      }


      const text =
        String(
          ctx.message.text || ""
        ).trim();


      console.log(
        "GROUP TEXT:",
        JSON.stringify(text)
      );


      // -------------------------------
      // ربات
      // -------------------------------

      if (text === "ربات") {

        console.log(
          "DIRECT MATCH: ربات"
        );


        await ctx.reply(
`『𓆩 ★ PulseGroupManager ★ 𓆪』

🤖 ربات فعاله و آماده‌ست ✅

📌 گروه:
${ctx.chat.title || "بدون نام"}

👤 درخواست:
${ctx.from.first_name || "کاربر"}

🆔 آیدی:
${ctx.from.id}`,
          {

            reply_parameters: {

              message_id:
                ctx.message.message_id

            }

          }
        );

        return;

      }


      // -------------------------------
      // تست
      // -------------------------------

      if (text === "تست") {

        console.log(
          "DIRECT MATCH: تست"
        );


        await ctx.reply(
          `『𓆩 ★ تست ربات ★ 𓆪』

پاسخ با موفقیت دریافت شد. ✅`,
          {

            reply_parameters: {

              message_id:
                ctx.message.message_id

            }

          }
        );

        return;

      }


      // -------------------------------
      // وضعیت ربات
      // -------------------------------

      if (
        text === "وضعیت ربات"
      ) {

        console.log(
          "DIRECT MATCH: وضعیت ربات"
        );


        await ctx.reply(
`『𓆩 ★ وضعیت ربات ★ 𓆪』

🤖 وضعیت:
فعال ✅

📡 سیستم:
آنلاین ✅

👥 گروه:
${ctx.chat.title || "بدون نام"}`,
          {

            reply_parameters: {

              message_id:
                ctx.message.message_id

            }

          }
        );

        return;

      }

    }

    catch (error) {

      console.error(
        "DIRECT COMMAND ERROR:",
        error
      );

    }

  }
);


// =====================================
// WELCOME
// =====================================

registerWelcome(
  bot
);


// =====================================
// OTHER SYSTEMS
// =====================================

registerCommands(
  bot
);

registerPanelActions(
  bot
);

registerHelp(
  bot
);

registerSettings(
  bot
);

registerWarningActions(
  bot
);

registerWarningSettings(
  bot
);


// =====================================
// START
// =====================================

bot.start(
  async ctx => {

    try {

      await ctx.reply(
`『𓆩 PulseGroupManager 𓆪』

ربات مدیریت گروه فعال شد ✅

پنل:
پنل

تنظیمات:
تنظیمات

راهنما:
راهنما`
      );

    }

    catch (error) {

      console.error(
        "START COMMAND ERROR:",
        error
      );

    }

  }
);


// =====================================
// ERROR HANDLER
// =====================================

bot.catch(
  (error, ctx) => {

    console.error(
      "BOT ERROR:",
      error
    );


    if (ctx && ctx.chat) {

      console.error(
        "ERROR CHAT:",
        ctx.chat.id
      );

    }

  }
);


// =====================================
// LAUNCH
// =====================================

async function startBot() {

  try {

    // اگر قبلاً webhook وجود داشته باشد،
    // polling نمی‌تواند درست کار کند.
    await bot.telegram.deleteWebhook({
      drop_pending_updates: false
    });


    console.log(
      "WEBHOOK CLEARED"
    );


    await bot.launch({
      dropPendingUpdates: false
    });


    console.log(
      "================================="
    );

    console.log(
      "PulseGroupManager STARTED"
    );

    console.log(
      "BOT IS LISTENING"
    );

    console.log(
      "================================="
    );

  }

  catch (error) {

    console.error(
      "BOT LAUNCH ERROR:",
      error.message
    );

    process.exit(1);

  }

}


startBot();


// =====================================
// STOP
// =====================================

process.once(
  "SIGINT",
  () => {

    bot.stop(
      "SIGINT"
    );

  }
);


process.once(
  "SIGTERM",
  () => {

    bot.stop(
      "SIGTERM"
    );

  }
);
