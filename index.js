const { Telegraf } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("PulseGroupManager is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

bot.start((ctx) => {
  ctx.reply(
    "سلام 👋\n" +
    "من ربات مدیریت گروه هستم.\n\n" +
    "برای استفاده، من را به گروه اضافه کنید و دسترسی‌های لازم را بدهید."
  );
});

bot.help((ctx) => {
  ctx.reply(
    "📚 راهنمای ربات\n\n" +
    "/start - شروع ربات\n" +
    "/help - نمایش راهنما\n\n" +
    "قابلیت‌های مدیریت گروه به‌زودی اضافه می‌شوند."
  );
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.launch()
  .then(() => {
    console.log("PulseGroupManager started successfully");
  })
  .catch((err) => {
    console.error("Failed to start bot:", err);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
