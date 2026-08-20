const { Telegraf } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);

// یک پورت ساده برای Render
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("PulseGroupManager is running!");
}).listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// دستور شروع
bot.start((ctx) => {
  ctx.reply(
    "سلام 👋\n" +
    "من ربات مدیریت گروه هستم.\n\n" +
    "برای استفاده، من را به گروه اضافه کنید و دسترسی‌های لازم را بدهید."
  );
});

// راهنما
bot.help((ctx) => {
  ctx.reply(
    "📚 راهنمای ربات\n\n" +
    "/start - شروع ربات\n" +
    "/help - نمایش راهنما\n\n" +
    "قابلیت‌های مدیریت گروه به‌زودی اضافه می‌شوند."
  );
});

// مدیریت خطا
bot.catch((err) => {
  console.error("Bot error:", err);
});

// اجرای ربات
bot.launch()
  .then(() => console.log("PulseGroupManager started successfully"))
  .catch((err) => console.error("Failed to start bot:", err));

// توقف صحیح ربات
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
