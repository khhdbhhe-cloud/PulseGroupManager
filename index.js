const { Telegraf } = require("telegraf");
const http = require("http");

// ===============================
// CONFIG
// ===============================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN پیدا نشد!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ===============================
// RENDER SERVER
// ===============================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager Bot is running ✅");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ===============================
// START COMMAND
// ===============================

bot.start(async (ctx) => {
  await ctx.reply(
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "🤖 ربات مدیریت گروه فعال است.\n\n" +
    "برای استفاده، ربات را به گروه اضافه و مدیر کنید."
  );
});

// ===============================
// PING TEST
// ===============================

bot.command("ping", async (ctx) => {
  await ctx.reply("🏓 Pong!\n\nربات سالم و فعال است ✅");
});

// ===============================
// TEXT TEST
// ===============================

bot.hears("تست", async (ctx) => {
  await ctx.reply("✅ ربات پیام شما را دریافت کرد.");
});

// ===============================
// ERROR HANDLER
// ===============================

bot.catch((err, ctx) => {
  console.error(
    "❌ BOT ERROR:",
    err
  );
});

// ===============================
// START BOT
// ===============================

(async () => {
  try {

    console.log("🚀 Starting bot...");

    await bot.launch();

    console.log("✅ Telegram bot started successfully");

  } catch (error) {

    console.error(
      "❌ Failed to start bot:",
      error
    );

    process.exit(1);
  }
})();

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
