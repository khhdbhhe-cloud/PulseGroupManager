// =====================================
// PulseGroupManager
// MAIN INDEX - FINAL
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
// GLOBAL TELEGRAM LOGGER
// =====================================

bot.use(
  async (ctx, next) => {

    try {

      if (
        ctx.message &&
        ctx.message.text
      ) {

        console.log(
          "TELEGRAM MESSAGE:",
          {
            chatId:
              ctx.chat
                ? ctx.chat.id
                : null,

            chatType:
              ctx.chat
                ? ctx.chat.type
                : null,

            text:
              ctx.message.text
          }
        );

      }

      await next();

    }

    catch (error) {

      console.error(
        "GLOBAL MIDDLEWARE ERROR:",
        error.message
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
  "Starting PulseGroupManager"
);

console.log(
  "================================="
);


// -------------------------------------
// Welcome
// -------------------------------------

registerWelcome(
  bot
);


// -------------------------------------
// Commands
// -------------------------------------

registerCommands(
  bot
);


// -------------------------------------
// Panel
// -------------------------------------

registerPanelActions(
  bot
);


// -------------------------------------
// Help
// -------------------------------------

registerHelp(
  bot
);


// -------------------------------------
// Settings
// -------------------------------------

registerSettings(
  bot
);


// -------------------------------------
// Warning Actions
// -------------------------------------

registerWarningActions(
  bot
);


// -------------------------------------
// Warning Settings
// -------------------------------------

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

ربات مدیریت گروه فعال شد ✅

برای استفاده از پنل و امکانات مدیریتی،
باید مدیر یا مالک گروه باشید.`
      );

    }

    catch (error) {

      console.error(
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

    console.error(
      "================================="
    );

    console.error(
      "BOT ERROR:",
      error.message
    );

    if (ctx && ctx.chat) {

      console.error(
        "CHAT:",
        ctx.chat.id
      );

    }

    console.error(
      "================================="
    );

  }
);


// =====================================
// LAUNCH
// =====================================

async function startBot() {

  try {

    console.log(
      "Preparing Telegram connection..."
    );


    // ---------------------------------
    // حذف Webhook قبلی
    // ---------------------------------

    await bot.telegram.deleteWebhook({
      drop_pending_updates: false
    });


    console.log(
      "WEBHOOK CLEARED"
    );


    // ---------------------------------
    // شروع Polling
    // ---------------------------------

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
      "BOT IS LISTENING FOR TELEGRAM"
    );

    console.log(
      "================================="
    );

  }

  catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "BOT LAUNCH ERROR:",
      error.message
    );

    console.error(
      "================================="
    );


    // 409 یعنی یک نمونه دیگر
    // با همین توکن در حال Polling است.
    if (
      error &&
      (
        String(
          error.message || ""
        ).includes("409") ||
        String(
          error.message || ""
        ).includes("Conflict")
      )
    ) {

      console.error(
        "ERROR 409: ANOTHER BOT INSTANCE IS RUNNING."
      );

    }


    process.exit(1);

  }

}


startBot();


// =====================================
// STOP HANDLER
// =====================================

process.once(
  "SIGINT",
  () => {

    console.log(
      "Stopping bot..."
    );

    bot.stop(
      "SIGINT"
    );

  }
);


process.once(
  "SIGTERM",
  () => {

    console.log(
      "Stopping bot..."
    );

    bot.stop(
      "SIGTERM"
    );

  }
);
