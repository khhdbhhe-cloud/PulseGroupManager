// =====================================
// PulseGroupManager
// INDEX
// =====================================

const { Telegraf } = require("telegraf");
const http = require("http");


// =====================================
// دریافت توکن ربات
// =====================================

const BOT_TOKEN =
  process.env.BOT_TOKEN;

if (!BOT_TOKEN) {

  console.error(
    "ERROR: BOT_TOKEN is not set."
  );

  process.exit(1);
}


// =====================================
// ساخت ربات
// =====================================

const bot =
  new Telegraf(BOT_TOKEN);


// =====================================
// پاسخ تست
// =====================================

bot.start(async (ctx) => {

  await ctx.reply(
    "『𓆩 ★ PulseGroupManager ★ 𓆪』\n\nربات فعال است."
  );

});


// =====================================
// سرور برای Render
// =====================================

const PORT =
  process.env.PORT || 10000;

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
        "PulseGroupManager is running."
      );

    }
  );


// =====================================
// اجرای سرور
// =====================================

server.listen(
  PORT,
  () => {

    console.log(
      `SERVER: listening on port ${PORT}`
    );

  }
);


// =====================================
// اجرای ربات
// =====================================

bot.launch()
  .then(() => {

    console.log(
      "BOT: PulseGroupManager started successfully."
    );

  })
  .catch((error) => {

    console.error(
      "BOT START ERROR:",
      error.message
    );

  });


// =====================================
// خاموش شدن صحیح
// =====================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
