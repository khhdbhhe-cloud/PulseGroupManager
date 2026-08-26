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
      "Server running on port " + PORT
    );

    console.log(
      "================================="
    );

  }
);


// =====================================
// DEBUG LOGGER
// =====================================

bot.use(
  async (ctx, next) => {

    try {

      if (
        ctx.message &&
        ctx.message.text
      ) {

        console.log(
          "MESSAGE RECEIVED:",
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

      console.log(
        "MIDDLEWARE ERROR:",
        error.message
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

    if (
      ctx &&
      ctx.chat
    ) {

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

async function startBot() {

  try {

    // حذف Webhook قبلی
    await bot.telegram.deleteWebhook({
      drop_pending_updates: false
    });


    console.log(
      "WEBHOOK CLEARED"
    );


    // شروع Polling
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

    console.log(
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
