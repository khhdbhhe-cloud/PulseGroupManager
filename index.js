// =====================================
// PulseGroupManager
// MAIN INDEX - ORDERED VERSION
// =====================================

const { Telegraf } =
  require("telegraf");

const http =
  require("http");


// =====================================
// SYSTEMS
// =====================================

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

const PUBLIC_URL =
  "https://pulsegroupmanager.onrender.com";

const WEBHOOK_PATH =
  "/telegram-webhook";


if (!BOT_TOKEN) {

  console.log(
    "BOT_TOKEN پیدا نشد."
  );

  process.exit(1);

}


// =====================================
// BOT
// =====================================

const bot =
  new Telegraf(BOT_TOKEN);


// =====================================
// DIRECT TEXT COMMANDS
// =====================================
//
// این قسمت عمداً قبل از بقیه سیستم‌هاست.
// مثل نگهبان ورودی است:
// اول پیام را می‌بیند، بعد اجازه می‌دهد
// سیستم‌های دیگر آن را پردازش کنند.
//
// =====================================

bot.on(
  "text",
  async (ctx, next) => {

    try {

      if (!ctx.chat) {

        return next();

      }


      const text =
        String(
          ctx.message.text || ""
        ).trim();


      console.log(
        "TEXT RECEIVED:",
        JSON.stringify(text)
      );


      const isGroup =
        ctx.chat.type === "group" ||
        ctx.chat.type === "supergroup";


      if (!isGroup) {

        return next();

      }


      // =================================
      // ربات
      // =================================

      if (text === "ربات") {

        console.log(
          "DIRECT COMMAND: ربات"
        );


        await ctx.reply(
`『𓆩 ★ PulseGroupManager ★ 𓆪』

🤖 ربات فعاله و آماده‌ست ✅

📌 گروه:
${ctx.chat.title || "بدون نام"}

👤 کاربر:
${ctx.from.first_name || "کاربر"}`,
          {

            reply_parameters: {

              message_id:
                ctx.message.message_id

            }

          }
        );


        return;

      }


      // =================================
      // تست
      // =================================

      if (text === "تست") {

        console.log(
          "DIRECT COMMAND: تست"
        );


        await ctx.reply(
          "『𓆩 ★ تست ربات ★ 𓆪』\n\nپاسخ با موفقیت دریافت شد. ✅",
          {

            reply_parameters: {

              message_id:
                ctx.message.message_id

            }

          }
        );


        return;

      }


      // =================================
      // وضعیت ربات
      // =================================

      if (text === "وضعیت ربات") {

        console.log(
          "DIRECT COMMAND: وضعیت ربات"
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


      // =================================
      // ادامه به سیستم‌های دیگر
      // =================================

      return next();

    }

    catch (error) {

      console.log(
        "DIRECT TEXT ERROR:",
        error.message
      );


      return next();

    }

  }
);


// =====================================
// HTTP SERVER
// =====================================

const server =
  http.createServer(
    async (req, res) => {

      try {

        // -------------------------------
        // صفحه اصلی Render
        // -------------------------------

        if (
          req.method === "GET" &&
          req.url === "/"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "text/plain; charset=utf-8"
            }
          );

          return res.end(
            "PulseGroupManager ONLINE"
          );

        }


        // -------------------------------
        // Telegram Webhook
        // -------------------------------

        if (
          req.method === "POST" &&
          req.url === WEBHOOK_PATH
        ) {

          let body = "";


          req.on(
            "data",
            chunk => {

              body +=
                chunk.toString();

            }
          );


          req.on(
            "end",
            async () => {

              try {

                const update =
                  JSON.parse(body);


                console.log(
                  "TELEGRAM UPDATE RECEIVED"
                );


                await bot.handleUpdate(
                  update
                );


                res.writeHead(
                  200,
                  {
                    "Content-Type":
                      "text/plain"
                  }
                );

                res.end(
                  "OK"
                );

              }

              catch (error) {

                console.log(
                  "WEBHOOK ERROR:",
                  error.message
                );


                res.writeHead(
                  500
                );

                res.end(
                  "ERROR"
                );

              }

            }
          );


          return;

        }


        res.writeHead(
          404
        );

        res.end(
          "Not Found"
        );

      }

      catch (error) {

        console.log(
          "SERVER ERROR:",
          error.message
        );


        res.writeHead(
          500
        );

        res.end(
          "Server Error"
        );

      }

    }
  );


// =====================================
// REGISTER SYSTEMS
// =====================================

console.log(
  "================================="
);

console.log(
  "REGISTERING SYSTEMS..."
);

console.log(
  "================================="
);


// -------------------------------------
// Welcome
// -------------------------------------

registerWelcome(bot);


// -------------------------------------
// Commands
// -------------------------------------

registerCommands(bot);


// -------------------------------------
// Panel
// -------------------------------------

registerPanelActions(bot);


// -------------------------------------
// Help
// -------------------------------------

registerHelp(bot);


// -------------------------------------
// Settings
// -------------------------------------

registerSettings(bot);


// -------------------------------------
// Warning Actions
// -------------------------------------

registerWarningActions(bot);


// -------------------------------------
// Warning Settings
// -------------------------------------

registerWarningSettings(bot);


console.log(
  "================================="
);

console.log(
  "ALL SYSTEMS REGISTERED"
);

console.log(
  "================================="
);


// =====================================
// START COMMAND
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

      console.log(
        "START ERROR:",
        error.message
      );

    }

  }
);


// =====================================
// ERROR HANDLER
// =====================================

bot.catch(
  (error, ctx) => {

    console.log(
      "================================="
    );

    console.log(
      "BOT ERROR:",
      error.message
    );

    console.log(
      "CHAT:",
      ctx &&
      ctx.chat
        ? ctx.chat.id
        : "unknown"
    );

    console.log(
      "TEXT:",
      ctx &&
      ctx.message
        ? ctx.message.text ||
          "[non-text]"
        : "unknown"
    );

    console.log(
      "================================="
    );

  }
);


// =====================================
// START SERVER
// =====================================

server.listen(
  PORT,
  "0.0.0.0",
  async () => {

    console.log(
      "================================="
    );

    console.log(
      "SERVER RUNNING"
    );

    console.log(
      "PORT:",
      PORT
    );

    console.log(
      "WEBHOOK MODE: ACTIVE"
    );

    console.log(
      "================================="
    );


    try {

      // حذف Webhook قبلی

      await bot.telegram.deleteWebhook(
        {
          drop_pending_updates: false
        }
      );


      console.log(
        "OLD WEBHOOK CLEARED"
      );


      // Webhook جدید

      const webhookUrl =
        PUBLIC_URL +
        WEBHOOK_PATH;


      await bot.telegram.setWebhook(
        webhookUrl
      );


      console.log(
        "WEBHOOK SET SUCCESSFULLY"
      );

      console.log(
        webhookUrl
      );


      const info =
        await bot.telegram.getWebhookInfo();


      console.log(
        "WEBHOOK INFO:",
        {

          url:
            info.url,

          pending:
            info.pending_update_count,

          lastError:
            info.last_error_message ||
            "none"

        }
      );


      console.log(
        "================================="
      );

      console.log(
        "PulseGroupManager ONLINE"
      );

      console.log(
        "NO POLLING"
      );

      console.log(
        "================================="
      );

    }

    catch (error) {

      console.log(
        "WEBHOOK SETUP ERROR:",
        error.message
      );

    }

  }
);


// =====================================
// STOP
// =====================================

process.once(
  "SIGINT",
  async () => {

    try {

      await bot.telegram.deleteWebhook();

    }

    catch (error) {

      console.log(
        "STOP WEBHOOK ERROR:",
        error.message
      );

    }

    process.exit(0);

  }
);


process.once(
  "SIGTERM",
  async () => {

    try {

      await bot.telegram.deleteWebhook();

    }

    catch (error) {

      console.log(
        "STOP WEBHOOK ERROR:",
        error.message
      );

    }

    process.exit(0);

  }
);
