// =====================================
// PulseGroupManager
// MAIN INDEX
// =====================================

const { Telegraf } = require("telegraf");
const http = require("http");


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

  console.error(
    "BOT_TOKEN پیدا نشد."
  );

  process.exit(1);

}


// =====================================
// CREATE BOT
// =====================================

const bot =
  new Telegraf(BOT_TOKEN);


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
      "PulseGroupManager HTTP SERVER ONLINE"
    );

    console.log(
      "================================="
    );

  }
);


// =====================================
// DEBUG UPDATE RECEIVER
// =====================================
//
// فقط لاگ می‌گیرد.
// هیچ پاسخی ارسال نمی‌کند.
// =====================================

bot.use(
  async (ctx, next) => {

    try {

      console.log(
        "TELEGRAM UPDATE RECEIVED"
      );


      if (
        ctx.chat &&
        ctx.message &&
        typeof ctx.message.text === "string"
      ) {

        console.log(
          "MESSAGE RECEIVED:",
          {
            chatId:
              ctx.chat.id,

            chatType:
              ctx.chat.type,

            text:
              ctx.message.text
          }
        );

      }


    }

    catch (error) {

      console.log(
        "UPDATE LOGGER ERROR:",
        error.message
      );

    }


    return next();

  }
);


// =====================================
// WELCOME
// =====================================

console.log(
  "Registering welcome system..."
);

registerWelcome(bot);


// =====================================
// COMMANDS
// =====================================

console.log(
  "Registering command system..."
);

registerCommands(bot);


// =====================================
// PANEL
// =====================================

console.log(
  "Registering panel actions..."
);

registerPanelActions(bot);


// =====================================
// HELP
// =====================================

console.log(
  "Registering help system..."
);

registerHelp(bot);


// =====================================
// SETTINGS
// =====================================

console.log(
  "Registering settings system..."
);

registerSettings(bot);


// =====================================
// WARNING ACTIONS
// =====================================

console.log(
  "Registering warning actions..."
);

registerWarningActions(bot);


// =====================================
// WARNING SETTINGS
// =====================================

console.log(
  "Registering warning settings..."
);

registerWarningSettings(bot);


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
// BOT ERROR HANDLER
// =====================================

bot.catch(
  (error, ctx) => {

    console.error(
      "BOT ERROR:",
      error.message
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
// LAUNCH BOT
// =====================================

async function startBot() {

  try {

    console.log(
      "================================="
    );

    console.log(
      "Starting PulseGroupManager..."
    );

    console.log(
      "Telegram polling starting..."
    );

    console.log(
      "================================="
    );


    await bot.launch();


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

  catch (error) {

    console.error(
      "BOT LAUNCH ERROR:",
      error.message
    );


    if (
      error &&
      error.message &&
      error.message.includes("409")
    ) {

      console.error(
        "================================="
      );

      console.error(
        "409 CONFLICT"
      );

      console.error(
        "Another instance is using this bot token."
      );

      console.error(
        "Stop the other instance before starting this one."
      );

      console.error(
        "================================="
      );

    }

  }

}


startBot();


// =====================================
// SAFE STOP
// =====================================

function stopBot(signal) {

  try {

    console.log(
      "Stopping bot:",
      signal
    );


    bot.stop(signal);

  }

  catch (error) {

    console.log(
      "BOT STOP ERROR:",
      error.message
    );

  }

}


process.once(
  "SIGINT",
  () => {

    stopBot("SIGINT");

  }
);


process.once(
  "SIGTERM",
  () => {

    stopBot("SIGTERM");

  }
);
