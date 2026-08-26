const { Telegraf } = require("telegraf");
const http = require("http");

const { registerCommands } =
  require("./commands");

const { registerPanelActions } =
  require("./panel-actions");

const { registerHelp } =
  require("./help");

const { registerSettings } =
  require("./settings");

const { registerWarningActions } =
  require("./warning-actions");

const { registerWarningSettings } =
  require("./warning-settings");

const { registerWelcome } =
  require("./welcome");


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
// WELCOME SYSTEM
// =====================================

// خوشامد را قبل از سایر سیستم‌های پیام ثبت می‌کنیم
registerWelcome(bot);


// =====================================
// REGISTER OTHER SYSTEMS
// =====================================

registerCommands(bot);

registerPanelActions(bot);

registerHelp(bot);

registerSettings(bot);

registerWarningActions(bot);

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
// GLOBAL ERROR HANDLER
// =====================================

bot.catch(
  (err, ctx) => {

    console.log(
      "BOT ERROR:",
      err.message
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
      "Bot started successfully"
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
// STOP HANDLER
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
