// =====================================
// PulseGroupManager
// MAIN BOT - WEBHOOK VERSION
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

const WEBHOOK_PATH =
  "/telegram-webhook";

const PUBLIC_URL =
  "https://pulsegroupmanager.onrender.com";


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
// RENDER HTTP SERVER
// =====================================

const server =
  http.createServer(
    async (req, res) => {

      try {

        // -----------------------------
        // Health check
        // -----------------------------

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


        // -----------------------------
        // Telegram Webhook
        // -----------------------------

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

                res.end("OK");

              }

              catch (error) {

                console.log(
                  "WEBHOOK UPDATE ERROR:",
                  error.message
                );


                res.writeHead(
                  500,
                  {
                    "Content-Type":
                      "text/plain"
                  }
                );

                res.end("ERROR");

              }

            }
          );


          return;

        }


        // -----------------------------
        // Not found
        // -----------------------------

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain"
          }
        );

        res.end("Not Found");

      }

      catch (error) {

        console.log(
          "SERVER ERROR:",
          error.message
        );


        res.writeHead(
          500,
          {
            "Content-Type":
              "text/plain"
          }
        );

        res.end("Server Error");

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


// خوشامد

registerWelcome(bot);


// دستورات

registerCommands(bot);


// پنل

registerPanelActions(bot);


// راهنما

registerHelp(bot);


// تنظیمات

registerSettings(bot);


// اخطارها

registerWarningActions(bot);


// تنظیمات اخطار

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
        "START COMMAND ERROR:",
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

      // -----------------------------
      // حذف Webhook قبلی
      // -----------------------------

      await bot.telegram.deleteWebhook(
        {
          drop_pending_updates: false
        }
      );


      console.log(
        "OLD WEBHOOK CLEARED"
      );


      // -----------------------------
      // تنظیم Webhook جدید
      // -----------------------------

      const webhookUrl =
        PUBLIC_URL +
        WEBHOOK_PATH;


      await bot.telegram.setWebhook(
        webhookUrl
      );


      console.log(
        "================================="
      );

      console.log(
        "WEBHOOK SET SUCCESSFULLY"
      );

      console.log(
        webhookUrl
      );

      console.log(
        "================================="
      );


      // -----------------------------
      // اطلاعات Webhook
      // -----------------------------

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
        "NO GETUPDATES CONFLICT"
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
// STOP HANDLERS
// =====================================

process.once(
  "SIGINT",
  async () => {

    try {

      await bot.telegram.deleteWebhook();

    }

    catch (error) {

      console.log(
        "SIGINT WEBHOOK ERROR:",
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
        "SIGTERM WEBHOOK ERROR:",
        error.message
      );

    }

    process.exit(0);

  }
);
