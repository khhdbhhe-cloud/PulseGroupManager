const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    "سلام 👋\nمن ربات مدیریت گروه هستم.\nبرای استفاده، من را به گروه اضافه کنید و دسترسی‌های لازم را بدهید."
  );
});

bot.help((ctx) => {
  ctx.reply(
    "📚 راهنما\n\n" +
    "/start - شروع ربات\n" +
    "/help - راهنما\n\n" +
    "قابلیت‌های مدیریت گروه به‌زودی اضافه می‌شوند."
  );
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.launch()
  .then(() => console.log("Bot started successfully"))
  .catch((err) => console.error("Failed to start bot:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
