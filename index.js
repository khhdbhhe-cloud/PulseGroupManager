const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// Render
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("PulseGroupManager is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// متن دکمه‌ها
const B = {
  users: "『𓆩 مدیریت کاربران 𓆪』",
  locks: "『𓆩 قفل‌های گروه 𓆪』",
  messages: "『𓆩 مدیریت پیام‌ها 𓆪』",
  warns: "『𓆩 سیستم اخطار 𓆪』",
  welcome: "『𓆩 ورود و خروج 𓆪』",
  rules: "『𓆩 قوانین گروه 𓆪』",
  settings: "『𓆩 تنظیمات گروه 𓆪』",
  stats: "『𓆩 آمار گروه 𓆪』",
  help: "『𓆩 راهنما 𓆪』",
  back: "『𓆩 بازگشت 𓆪』"
};

// شروع
bot.start((ctx) => {
  ctx.reply(
    "سلام 👋\n\n" +
    "به PulseGroupManager خوش آمدید.\n\n" +
    "برای مدیریت گروه یا مشاهده راهنما یکی را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("『𓆩 پنل مدیریت 𓆪』", "panel"),
        Markup.button.callback(B.help, "help")
      ]
    ])
  );
});

// راهنما
bot.help((ctx) => showHelp(ctx));

function showHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.users, "help_users")],
      [Markup.button.callback(B.locks, "help_locks")],
      [Markup.button.callback(B.messages, "help_messages")],
      [Markup.button.callback(B.warns, "help_warn")],
      [Markup.button.callback(B.welcome, "help_welcome")],
      [Markup.button.callback(B.settings, "help_settings")]
    ])
  );
}

// پنل اصلی
async function showPanel(ctx) {
  return ctx.reply(
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.users, "panel_users")],
      [Markup.button.callback(B.locks, "panel_locks")],
      [Markup.button.callback(B.messages, "panel_messages")],
      [Markup.button.callback(B.warns, "panel_warn")],
      [Markup.button.callback(B.welcome, "panel_welcome")],
      [Markup.button.callback(B.rules, "panel_rules")],
      [Markup.button.callback(B.settings, "panel_settings")],
      [Markup.button.callback(B.stats, "panel_stats")]
    ])
  );
}

// دستور پنل
bot.command("panel", async (ctx) => {
  await showPanel(ctx);
});

// کاربران
bot.action("panel_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "مدیریت بن، میوت، آن‌بن، آن‌میوت و اخطار کاربران.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 بن کاربر 𓆪』", "user_ban")],
      [Markup.button.callback("『𓆩 میوت کاربر 𓆪』", "user_mute")],
      [Markup.button.callback("『𓆩 آن‌بن 𓆪』", "user_unban")],
      [Markup.button.callback("『𓆩 آن‌میوت 𓆪』", "user_unmute")],
      [Markup.button.callback("『𓆩 اخطار 𓆪』", "user_warn")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// قفل‌ها
bot.action("panel_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 قفل‌های گروه 𓆪』\n\n" +
    "کنترل نوع محتوای قابل ارسال در گروه.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 قفل لینک 𓆪』", "lock_links")],
      [Markup.button.callback("『𓆩 قفل فایل 𓆪』", "lock_files")],
      [Markup.button.callback("『𓆩 قفل رسانه 𓆪』", "lock_media")],
      [Markup.button.callback("『𓆩 قفل گیف 𓆪』", "lock_gif")],
      [Markup.button.callback("『𓆩 قفل موزیک 𓆪』", "lock_music")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// پیام‌ها
bot.action("panel_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
    "فیلتر کلمات، پاک‌سازی و ضداسپم.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 فیلتر کلمات 𓆪』", "filter_words")],
      [Markup.button.callback("『𓆩 پاک‌سازی پیام 𓆪』", "message_clean")],
      [Markup.button.callback("『𓆩 ضداسپم 𓆪』", "anti_spam")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// اخطار
bot.action("panel_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 سیستم اخطار 𓆪』\n\n" +
    "تعداد اخطار و مجازات بعد از رسیدن به حد مشخص.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 حد اخطار 𓆪』", "warn_limit")],
      [Markup.button.callback("『𓆩 مجازات اخطار 𓆪』", "warn_action")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ورود و خروج
bot.action("panel_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 ورود و خروج 𓆪』\n\n" +
    "مدیریت پیام خوش‌آمدگویی و خداحافظی.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 خوش‌آمدگویی 𓆪』", "welcome_toggle")],
      [Markup.button.callback("『𓆩 خداحافظی 𓆪』", "goodbye_toggle")],
      [Markup.button.callback("『𓆩 متن خوش‌آمد 𓆪』", "welcome_text")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// قوانین
bot.action("panel_rules", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 قوانین گروه 𓆪』\n\n" +
    "تنظیم و نمایش قوانین اختصاصی گروه.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 نمایش قوانین 𓆪』", "show_rules")],
      [Markup.button.callback("『𓆩 تنظیم قوانین 𓆪』", "set_rules")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// تنظیمات
bot.action("panel_settings", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "تنظیمات اختصاصی هر گروه در این بخش قرار می‌گیرد.",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 تنظیمات کاربران 𓆪』", "user_settings")],
      [Markup.button.callback("『𓆩 تنظیمات پیام 𓆪』", "message_settings")],
      [Markup.button.callback("『𓆩 تنظیمات امنیتی 𓆪』", "security_settings")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// آمار
bot.action("panel_stats", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 آمار گروه 𓆪』\n\n" +
    "بخش آمار در مراحل بعدی کامل می‌شود.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// راهنمای کاربران
bot.action("help_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "🔨 بن: روی پیام کاربر ریپلای کنید و دستور بن را اجرا کنید.\n\n" +
    "🔇 میوت: ارسال پیام کاربر را محدود می‌کند.\n\n" +
    "🚫 آن‌بن: محدودیت بن را برمی‌دارد.\n\n" +
    "⚠️ اخطار: برای کاربر اخطار ثبت می‌کند.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// راهنمای قفل‌ها
bot.action("help_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 قفل‌های گروه 𓆪』\n\n" +
    "برای کنترل محتوای قابل ارسال در گروه استفاده می‌شوند.\n\n" +
    "مثل لینک، فایل، رسانه و گیف.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// راهنمای پیام‌ها
bot.action("help_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
    "برای فیلتر کلمات، پاک‌سازی پیام‌ها و کنترل پیام‌های ناخواسته استفاده می‌شود.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// راهنمای اخطار
bot.action("help_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 سیستم اخطار 𓆪』\n\n" +
    "می‌توان تعیین کرد بعد از رسیدن کاربر به تعداد مشخصی اخطار، مثلاً میوت یا بن شود.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// راهنمای ورود و خروج
bot.action("help_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 ورود و خروج 𓆪』\n\n" +
    "ربات می‌تواند برای اعضای جدید پیام خوش‌آمد ارسال کند و هنگام خروج پیام خداحافظی نمایش دهد.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// راهنمای تنظیمات
bot.action("help_settings", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "تنظیمات هر گروه جداگانه ذخیره می‌شود تا تغییرات یک گروه روی گروه‌های دیگر اثر نگذارد.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// بازگشت به پنل
bot.action("panel", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage().catch(() => {});
  await showPanel(ctx);
});

// خطا
bot.catch((err) => {
  console.error("Bot error:", err);
});

// اجرای ربات
bot.launch()
  .then(() => {
    console.log("PulseGroupManager started successfully");
  })
  .catch((err) => {
    console.error("Failed to start bot:", err);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
