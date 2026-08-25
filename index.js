const { Telegraf } = require("telegraf");
const http = require("http");

const { registerCommands } = require("./commands");
const { registerPanelActions } = require("./panel-actions");
const { registerHelp } = require("./help");


// ===============================
// CONFIG
// ===============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;


if (!BOT_TOKEN) {

  console.log(
    "BOT_TOKEN پیدا نشد."
  );

  process.exit(1);

}


const bot = new Telegraf(BOT_TOKEN);


// ===============================
// RENDER SERVER
// ===============================

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

).listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "Server running on port " + PORT
    );

  }
);


// ===============================
// REGISTER SYSTEMS
// ===============================

registerCommands(bot);

registerPanelActions(bot);

registerHelp(bot);


// ===============================
// START MESSAGE
// ===============================

bot.start(
  async ctx => {

    await ctx.reply(
`『𓆩 PulseGroupManager 𓆪』

ربات مدیریت گروه فعال شد ✅

برای دیدن پنل:
پنل

برای راهنما:
راهنما`
    );

  }
);


// ===============================
// ERROR HANDLER
// ===============================

bot.catch(
  (err, ctx) => {

    console.log(
      "BOT ERROR:",
      err.message
    );

  }
);


// ===============================
// LAUNCH
// ===============================

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


// ===============================
// STOP HANDLER
// ===============================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
