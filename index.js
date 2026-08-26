// =====================================
// PulseGroupManager
// MAIN BOT FILE - FIXED VERSION
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
// BOT
// =====================================

const bot =
  new Telegraf(BOT_TOKEN);


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
      "Server running on port " + PORT
    );

  }
);


// =====================================
// GLOBAL MESSAGE LOGGER
// =====================================
//
// مهم:
// اینجا از bot.use استفاده شده.
// next() باعث می‌شود پیام بعد از لاگ
// به تمام سیستم‌های دیگر هم برسد.
//
// قبلاً bot.on("message") باعث می‌شد
// زنجیره پردازش متوقف شود.
//
// =====================================

bot.use(
  async (ctx, next) => {

    try {

      if (
        ctx.chat &&
        ctx.message
      ) {

        console.log(
          "MESSAGE RECEIVED:",
          {
            chatId:
              ctx.chat.id,

            chatType:
              ctx.chat.type,

            text:
              ctx.message.text ||
              "[non-text message]"
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


    // بسیار مهم
    // اجازه ادامه پردازش پیام

    return next();

  }
);


// =====================================
// WELCOME SYSTEM
// =====================================

registerWelcome(bot);


// =====================================
// COMMAND SYSTEM
// =====================================

registerCommands(bot);


// =====================================
// PANEL
// =====================================

registerPanelActions(bot);


// =====================================
// HELP
// =====================================

registerHelp(bot);


// =====================================
// SETTINGS
// =====================================

registerSettings(bot);


// =====================================
// WARNING ACTIONS
// =====================================

registerWarningActions(bot);


// =====================================
// WARNING SETTINGS
// =====================================

registerWarningSettings(bot);


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
  (err, ctx) => {

    console.log(
      "================================="
    );

    console.log(
      "BOT ERROR:",
      err.message
    );

    console.log(
      "CHAT:",
      ctx && ctx.chat
        ? ctx.chat.id
        : "unknown"
    );

    console.log(
      "MESSAGE:",
      ctx && ctx.message
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
      "BOT IS LISTENING"
    );

    console.log(
      "WELCOME: ACTIVE"
    );

    console.log(
      "COMMANDS: ACTIVE"
    );

    console.log(
      "PANEL: ACTIVE"
    );

    console.log(
      "SETTINGS: ACTIVE"
    );

    console.log(
      "HELP: ACTIVE"
    );

    console.log(
      "WARNINGS: ACTIVE"
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
// STOP
// =====================================

process.once(
  "SIGINT",
  () => {

    bot.stop("SIGINT");

  }
);


process.once(
  "SIGTERM",
  () => {

    bot.stop("SIGTERM");

  }
);
