// =====================================
// PulseGroupManager
// MAIN FILE
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


if (!BOT_TOKEN) {

  console.log(
    "BOT_TOKEN پیدا نشد."
  );

  process.exit(1);

}


// =====================================
// CREATE BOT
// =====================================

const bot =
  new Telegraf(
    BOT_TOKEN
  );


// =====================================
// RENDER SERVER
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
      "Server running on port " +
      PORT
    );

  }
);


// =====================================
// MESSAGE LOGGER
// =====================================
//
// مهم:
// حتماً next() اجرا می‌شود.
// اگر next نباشد، پیام در همین
// middleware متوقف می‌شود.
//

bot.on(
  "message",
  async (ctx, next) => {

    try {

      if (ctx.chat) {

        console.log(
          "MESSAGE RECEIVED:",
          {
            chatId:
              ctx.chat.id,

            chatType:
              ctx.chat.type,

            text:
              ctx.message &&
              ctx.message.text
                ? ctx.message.text
                : "[non-text message]"
          }
        );

      }

    }

    catch (error) {

      console.log(
        "MESSAGE LOGGER ERROR:",
        error.message
      );

    }


    // =================================
    // بسیار مهم
    // اجازه بده سایر Handlerها
    // پیام را دریافت کنند.
    // =================================

    return next();

  }
);


// =====================================
// WELCOME
// =====================================

registerWelcome(
  bot
);


// =====================================
// COMMANDS
// =====================================

registerCommands(
  bot
);


// =====================================
// PANEL ACTIONS
// =====================================

registerPanelActions(
  bot
);


// =====================================
// HELP
// =====================================

registerHelp(
  bot
);


// =====================================
// SETTINGS
// =====================================

registerSettings(
  bot
);


// =====================================
// WARNING ACTIONS
// =====================================

registerWarningActions(
  bot
);


// =====================================
// WARNING SETTINGS
// =====================================

registerWarningSettings(
  bot
);


// =====================================
// START COMMAND
// =====================================

bot.start(
  async ctx => {

    try {

      await ctx.reply(
`『𓆩 PulseGroupManager 𓆪』

🤖 ربات مدیریت گروه فعال شد. ✅

برای باز کردن پنل:
پنل

برای تنظیمات:
تنظیمات

برای راهنما:
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
// GLOBAL ERROR HANDLER
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

    if (ctx && ctx.chat) {

      console.log(
        "ERROR CHAT:",
        ctx.chat.id
      );

    }

    console.log(
      "================================="
    );

  }
);


// =====================================
// LAUNCH
// =====================================

bot.launch()
.then(
  () => {

    console.log(
      "================================="
    );

    console.log(
      "PulseGroupManager STARTED"
    );

    console.log(
      "Bot is listening for updates..."
    );

    console.log(
      "================================="
    );

  }
)
.catch(
  error => {

    console.log(
      "START ERROR:",
      error.message
    );

  }
);


// =====================================
// STOP HANDLERS
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
