const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// ====================
// Render Web Server
// ====================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end("PulseGroupManager is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// ====================
// متن دکمه‌ها
// ====================

const B = {
  panel: "『𓆩 پنل مدیریت 𓆪』",
  help: "『𓆩 راهنما 𓆪』",
  settings: "『𓆩 تنظیمات 𓆪』",

  users: "『𓆩 مدیریت کاربران 𓆪』",
  locks: "『𓆩 قفل‌های گروه 𓆪』",
  messages: "『𓆩 مدیریت پیام‌ها 𓆪』",
  warns: "『𓆩 سیستم اخطار 𓆪』",
  welcome: "『𓆩 ورود و خروج 𓆪』",
  rules: "『𓆩 قوانین گروه 𓆪』",
  stats: "『𓆩 آمار گروه 𓆪』",

  back: "『𓆩 بازگشت 𓆪』"
};

// ====================
// نرمال‌سازی متن فارسی
// ====================

function normalize(text) {
  return String(text || "")
    .replace(/\u200c/g, "")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ====================
// صفحات
// ====================

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
      [Markup.button.callback(B.stats, "panel_stats")],
      [Markup.button.callback(B.settings, "settings")]
    ])
  );
}

async function showHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 راهنمای کاربران 𓆪』", "help_users")],
      [Markup.button.callback("『𓆩 راهنمای قفل‌ها 𓆪』", "help_locks")],
      [Markup.button.callback("『𓆩 راهنمای پیام‌ها 𓆪』", "help_messages")],
      [Markup.button.callback("『𓆩 راهنمای اخطار 𓆪』", "help_warn")],
      [Markup.button.callback("『𓆩 راهنمای ورود و خروج 𓆪』", "help_welcome")],
      [Markup.button.callback("『𓆩 راهنمای تنظیمات 𓆪』", "help_settings")]
    ])
  );
}

async function showSettings(ctx) {
  return ctx.reply(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "بخش تنظیمات موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 تنظیمات کاربران 𓆪』", "settings_users")],
      [Markup.button.callback("『𓆩 تنظیمات پیام‌ها 𓆪』", "settings_messages")],
      [Markup.button.callback("『𓆩 تنظیمات قفل‌ها 𓆪』", "settings_locks")],
      [Markup.button.callback("『𓆩 تنظیمات ورود و خروج 𓆪』", "settings_welcome")],
      [Markup.button.callback("『𓆩 تنظیمات قوانین 𓆪』", "settings_rules")],
      [Markup.button.callback("『𓆩 تنظیمات امنیتی 𓆪』", "settings_security")],
      [Markup.button.callback("『𓆩 دسترسی مدیران 𓆪』", "settings_admins")]
    ])
  );
}

// ====================
// شروع
// ====================

bot.start(async (ctx) => {
  await ctx.reply(
    "سلام 👋\n\n" +
    "به PulseGroupManager خوش آمدید.\n\n" +
    "برای مدیریت گروه یکی از گزینه‌های زیر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.panel, "panel")],
      [
        Markup.button.callback(B.help, "help"),
        Markup.button.callback(B.settings, "settings")
      ]
    ])
  );
});

// ====================
// دستورات فارسی
// ====================

bot.on("text", async (ctx, next) => {
  const text = normalize(ctx.message.text);

  console.log(`Received text: ${ctx.message.text}`);

  if (
    text === "پنل" ||
    text === "/پنل" ||
    text === "panel" ||
    text === "/panel"
  ) {
    return showPanel(ctx);
  }

  if (
    text === "راهنما" ||
    text === "/راهنما" ||
    text === "help" ||
    text === "/help"
  ) {
    return showHelp(ctx);
  }

  if (
    text === "تنظیمات" ||
    text === "/تنظیمات" ||
    text === "settings" ||
    text === "/settings"
  ) {
    return showSettings(ctx);
  }

  return next();
});

// ====================
// پنل کاربران
// ====================

bot.action("panel_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "عملیات موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 بن 𓆪", "user_ban")],
      [Markup.button.callback("『𓆩 میوت 𓆪", "user_mute")],
      [Markup.button.callback("『𓆩 آن‌بن 𓆪", "user_unban")],
      [Markup.button.callback("『𓆩 آن‌میوت 𓆪", "user_unmute")],
      [Markup.button.callback("『𓆩 اخطار 𓆪", "user_warn")],
      [Markup.button.callback("『𓆩 اطلاعات کاربر 𓆪", "user_info")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// قفل‌ها
// ====================

bot.action("panel_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 قفل‌های گروه 𓆪』\n\n" +
    "نوع محتوای موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 لینک 𓆪", "lock_links")],
      [Markup.button.callback("『𓆩 فایل 𓆪", "lock_files")],
      [Markup.button.callback("『𓆩 رسانه 𓆪", "lock_media")],
      [Markup.button.callback("『𓆩 گیف 𓆪", "lock_gif")],
      [Markup.button.callback("『𓆩 استیکر 𓆪", "lock_sticker")],
      [Markup.button.callback("『𓆩 نظرسنجی 𓆪", "lock_poll")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// پیام‌ها
// ====================

bot.action("panel_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
    "ابزار موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 فیلتر کلمات 𓆪", "filter_words")],
      [Markup.button.callback("『𓆩 پاک‌سازی پیام‌ها 𓆪", "message_clean")],
      [Markup.button.callback("『𓆩 ضداسپم 𓆪", "anti_spam")],
      [Markup.button.callback("『𓆩 حذف خودکار 𓆪", "auto_delete")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// اخطار
// ====================

bot.action("panel_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 سیستم اخطار 𓆪』\n\n" +
    "تنظیمات سیستم اخطار:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 حد اخطار 𓆪", "warn_limit")],
      [Markup.button.callback("『𓆩 مجازات اخطار 𓆪", "warn_action")],
      [Markup.button.callback("『𓆩 لیست اخطارها 𓆪", "warn_list")],
      [Markup.button.callback("『𓆩 پاک کردن اخطار 𓆪", "warn_clear")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// ورود و خروج
// ====================

bot.action("panel_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 ورود و خروج 𓆪』\n\n" +
    "تنظیمات پیام‌های ورود و خروج:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 خوش‌آمدگویی 𓆪", "welcome_toggle")],
      [Markup.button.callback("『𓆩 خداحافظی 𓆪", "goodbye_toggle")],
      [Markup.button.callback("『𓆩 متن خوش‌آمدگویی 𓆪", "welcome_text")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// قوانین
// ====================

bot.action("panel_rules", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 قوانین گروه 𓆪』\n\n" +
    "مدیریت قوانین گروه:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 نمایش قوانین 𓆪", "show_rules")],
      [Markup.button.callback("『𓆩 تنظیم قوانین 𓆪", "set_rules")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// آمار
// ====================

bot.action("panel_stats", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 آمار گروه 𓆪』\n\n" +
    "بخش آمار گروه:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 تعداد اعضا 𓆪", "stats_members")],
      [Markup.button.callback("『𓆩 آمار پیام‌ها 𓆪", "stats_messages")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ====================
// تنظیمات کاربران
// ====================

bot.action("settings_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات کاربران 𓆪』\n\n" +
    "تنظیمات مربوط به مدیریت کاربران:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 تنظیمات اخطار 𓆪", "settings_user_warn")],
      [Markup.button.callback("『𓆩 تنظیمات مجازات 𓆪", "settings_user_penalty")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// تنظیمات پیام
// ====================

bot.action("settings_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات پیام‌ها 𓆪』\n\n" +
    "تنظیمات مربوط به پیام‌های گروه:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 ضداسپم 𓆪", "settings_antispam")],
      [Markup.button.callback("『𓆩 فیلتر کلمات 𓆪", "settings_filter")],
      [Markup.button.callback("『𓆩 حذف خودکار 𓆪", "settings_autodelete")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// تنظیمات قفل‌ها
// ====================

bot.action("settings_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات قفل‌ها 𓆪』\n\n" +
    "تنظیمات مربوط به قفل‌های گروه:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 حالت قفل‌ها 𓆪", "settings_lock_mode")],
      [Markup.button.callback("『𓆩 پیام هشدار قفل 𓆪", "settings_lock_warning")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// تنظیمات ورود و خروج
// ====================

bot.action("settings_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات ورود و خروج 𓆪』",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 خوش‌آمدگویی 𓆪", "settings_welcome_on")],
      [Markup.button.callback("『𓆩 خداحافظی 𓆪", "settings_goodbye_on")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// تنظیمات قوانین
// ====================

bot.action("settings_rules", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات قوانین 𓆪』",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 ویرایش قوانین 𓆪", "edit_rules")],
      [Markup.button.callback("『𓆩 نمایش خودکار قوانین 𓆪", "auto_rules")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// امنیت
// ====================

bot.action("settings_security", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات امنیتی 𓆪』",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 ضدربات 𓆪", "security_bots")],
      [Markup.button.callback("『𓆩 ضداسپم 𓆪", "security_spam")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// دسترسی مدیران
// ====================

bot.action("settings_admins", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 دسترسی مدیران 𓆪』\n\n" +
    "برای هر مدیر می‌توان سطح دسترسی جداگانه تعریف کرد.\n\n" +
    "✯ دسترسی فعال\n" +
    "☆ دسترسی غیرفعال",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 مدیران مجاز 𓆪", "allowed_admins")],
      [Markup.button.callback("『𓆩 سطح دسترسی 𓆪", "admin_permissions")],
      [Markup.button.callback(B.back, "settings")]
    ])
  );
});

// ====================
// راهنمای کاربران
// ====================

bot.action("help_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای مدیریت کاربران 𓆪』\n\n" +
    "🔨 بن کردن\n" +
    "برای جلوگیری از حضور کاربر در گروه.\n\n" +
    "🔇 میوت کردن\n" +
    "برای جلوگیری از ارسال پیام توسط کاربر.\n\n" +
    "⚠️ اخطار\n" +
    "برای ثبت تخلف کاربر.\n\n" +
    "عملیات مدیریتی واقعی در مرحله بعد به گروه متصل می‌شوند.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// ====================
// راهنمای قفل‌ها
// ====================

bot.action("help_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای قفل‌ها 𓆪』\n\n" +
    "قفل لینک، فایل، رسانه، گیف، استیکر و نظرسنجی برای کنترل محتوای گروه استفاده می‌شود.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// ====================
// راهنمای پیام‌ها
// ====================

bot.action("help_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای مدیریت پیام‌ها 𓆪』\n\n" +
    "فیلتر کلمات، ضداسپم، پاک‌سازی و حذف خودکار پیام‌ها در این بخش قرار دارند.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// ====================
// راهنمای اخطار
// ====================

bot.action("help_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای سیستم اخطار 𓆪』\n\n" +
    "برای هر تخلف می‌توان اخطار ثبت کرد و برای رسیدن به تعداد مشخصی از اخطارها، مجازات تعیین کرد.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// ====================
// راهنمای ورود و خروج
// ====================

bot.action("help_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای ورود و خروج 𓆪』\n\n" +
    "ربات می‌تواند پیام خوش‌آمدگویی هنگام ورود و پیام خداحافظی هنگام خروج اعضا ارسال کند.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// ====================
// راهنمای تنظیمات
// ====================

bot.action("help_settings", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای تنظیمات 𓆪』\n\n" +
    "در تنظیمات می‌توان رفتار کاربران، پیام‌ها، قفل‌ها، ورود و خروج، قوانین، امنیت و دسترسی مدیران را کنترل کرد.",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "help")]
    ])
  );
});

// ====================
// بازگشت‌ها
// ====================

bot.action("panel", async (ctx) => {
  await ctx.answerCbQuery();
  await showPanelEdit(ctx);
});

async function showPanelEdit(ctx) {
  return ctx.editMessageText(
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback(B.users, "panel_users")],
      [Markup.button.callback(B.locks, "panel_locks")],
      [Markup.button.callback(B.messages, "panel_messages")],
      [Markup.button.callback(B.warns, "panel_warn")],
      [Markup.button.callback(B.welcome, "panel_welcome")],
      [Markup.button.callback(B.rules, "panel_rules")],
      [Markup.button.callback(B.stats, "panel_stats")],
      [Markup.button.callback(B.settings, "settings")]
    ])
  );
}

bot.action("help", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 راهنمای کاربران 𓆪", "help_users")],
      [Markup.button.callback("『𓆩 راهنمای قفل‌ها 𓆪", "help_locks")],
      [Markup.button.callback("『𓆩 راهنمای پیام‌ها 𓆪", "help_messages")],
      [Markup.button.callback("『𓆩 راهنمای اخطار 𓆪", "help_warn")],
      [Markup.button.callback("『𓆩 راهنمای ورود و خروج 𓆪", "help_welcome")],
      [Markup.button.callback("『𓆩 راهنمای تنظیمات 𓆪", "help_settings")]
    ])
  );
});

bot.action("settings", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "بخش تنظیمات موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 تنظیمات کاربران 𓆪", "settings_users")],
      [Markup.button.callback("『𓆩 تنظیمات پیام‌ها 𓆪", "settings_messages")],
      [Markup.button.callback("『𓆩 تنظیمات قفل‌ها 𓆪", "settings_locks")],
      [Markup.button.callback("『𓆩 تنظیمات ورود و خروج 𓆪", "settings_welcome")],
      [Markup.button.callback("『𓆩 تنظیمات قوانین 𓆪", "settings_rules")],
      [Markup.button.callback("『𓆩 تنظیمات امنیتی 𓆪", "settings_security")],
      [Markup.button.callback("『𓆩 دسترسی مدیران 𓆪", "settings_admins")]
    ])
  );
});

// ====================
// خطا
// ====================

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ====================
// اجرای ربات
// ====================

bot.launch()
  .then(() => {
    console.log("PulseGroupManager started successfully");
  })
  .catch((err) => {
    console.error("Failed to start bot:", err);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
