const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// ====================
// Render Web Server
// ====================

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("PulseGroupManager is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// ====================
// Start
// ====================

bot.start((ctx) => {
  ctx.reply(
    "سلام 👋\n\n" +
    "به PulseGroupManager خوش آمدید.\n\n" +
    "برای دیدن راهنما یا مدیریت گروه، از دکمه‌های زیر استفاده کنید.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("⚙️ پنل مدیریت", "panel"),
        Markup.button.callback("📚 راهنما", "help")
      ]
    ])
  );
});

// ====================
// Help
// ====================

bot.help((ctx) => {
  showHelp(ctx);
});

function showHelp(ctx) {
  return ctx.reply(
    "📚 راهنمای PulseGroupManager\n\n" +
    "یکی از بخش‌های زیر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("👥 مدیریت کاربران", "help_users")
      ],
      [
        Markup.button.callback("🔒 قفل‌ها", "help_locks")
      ],
      [
        Markup.button.callback("🧹 مدیریت پیام‌ها", "help_messages")
      ],
      [
        Markup.button.callback("⚠️ اخطارها", "help_warn")
      ],
      [
        Markup.button.callback("👋 ورود و خروج", "help_welcome")
      ],
      [
        Markup.button.callback("⚙️ تنظیمات گروه", "help_settings")
      ]
    ])
  );
}

// ====================
// Main Panel
// ====================

async function showPanel(ctx) {
  return ctx.reply(
    "⚙️ پنل مدیریت گروه\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("👥 کاربران", "panel_users"),
        Markup.button.callback("🔒 قفل‌ها", "panel_locks")
      ],
      [
        Markup.button.callback("🧹 پیام‌ها", "panel_messages"),
        Markup.button.callback("⚠️ اخطارها", "panel_warn")
      ],
      [
        Markup.button.callback("👋 خوش‌آمدگویی", "panel_welcome")
      ],
      [
        Markup.button.callback("📜 قوانین", "panel_rules"),
        Markup.button.callback("⚙️ تنظیمات", "panel_settings")
      ],
      [
        Markup.button.callback("📊 آمار گروه", "panel_stats")
      ]
    ])
  );
}

// ====================
// Panel Command
// ====================

bot.command("panel", async (ctx) => {
  await showPanel(ctx);
});

// ====================
// User Management
// ====================

bot.action("panel_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "👥 مدیریت کاربران\n\n" +
    "در این بخش امکاناتی مثل بن، کیک، میوت، آن‌بن و مدیریت اخطارها قرار می‌گیرد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🔨 بن", "user_ban"),
        Markup.button.callback("🔇 میوت", "user_mute")
      ],
      [
        Markup.button.callback("🚫 آن‌بن", "user_unban"),
        Markup.button.callback("🔊 آن‌میوت", "user_unmute")
      ],
      [
        Markup.button.callback("⚠️ اخطار", "user_warn")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Locks
// ====================

bot.action("panel_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🔒 مدیریت قفل‌ها\n\n" +
    "قفل‌های گروه از این بخش کنترل خواهند شد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🔗 لینک", "lock_links"),
        Markup.button.callback("📁 فایل", "lock_files")
      ],
      [
        Markup.button.callback("🖼 رسانه", "lock_media"),
        Markup.button.callback("🎞 گیف", "lock_gif")
      ],
      [
        Markup.button.callback("🎵 موزیک", "lock_music"),
        Markup.button.callback("🎮 بازی", "lock_games")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Message Management
// ====================

bot.action("panel_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🧹 مدیریت پیام‌ها\n\n" +
    "فیلتر کلمات، پاک‌سازی پیام‌ها و تنظیمات ضداسپم در این بخش قرار می‌گیرد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🔤 فیلتر کلمات", "filter_words")
      ],
      [
        Markup.button.callback("🧹 پاک‌سازی", "message_clean")
      ],
      [
        Markup.button.callback("🚫 ضداسپم", "anti_spam")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Warnings
// ====================

bot.action("panel_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "⚠️ سیستم اخطار\n\n" +
    "تعداد اخطار و مجازات پس از رسیدن به حد مشخص، از این بخش تنظیم می‌شود.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("➕ تنظیم حد اخطار", "warn_limit")
      ],
      [
        Markup.button.callback("⚙️ مجازات اخطار", "warn_action")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Welcome
// ====================

bot.action("panel_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "👋 تنظیمات ورود و خروج\n\n" +
    "خوش‌آمدگویی و پیام خداحافظی از این بخش مدیریت می‌شوند.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("👋 خوش‌آمدگویی", "welcome_toggle")
      ],
      [
        Markup.button.callback("🚪 خداحافظی", "goodbye_toggle")
      ],
      [
        Markup.button.callback("✏️ متن خوش‌آمد", "welcome_text")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Rules
// ====================

bot.action("panel_rules", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "📜 قوانین گروه\n\n" +
    "در این بخش می‌توان قوانین گروه را تنظیم و نمایش داد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("📖 نمایش قوانین", "show_rules")
      ],
      [
        Markup.button.callback("✏️ تنظیم قوانین", "set_rules")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Settings
// ====================

bot.action("panel_settings", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "⚙️ تنظیمات گروه\n\n" +
    "تنظیمات اختصاصی هر گروه از این قسمت مدیریت خواهد شد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("👤 تنظیمات کاربران", "user_settings")
      ],
      [
        Markup.button.callback("💬 تنظیمات پیام", "message_settings")
      ],
      [
        Markup.button.callback("🔐 تنظیمات امنیتی", "security_settings")
      ],
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Statistics
// ====================

bot.action("panel_stats", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "📊 آمار گروه\n\n" +
    "بخش آمار در نسخه‌های بعدی اطلاعات کامل گروه را نمایش خواهد داد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("⬅️ بازگشت", "panel")
      ]
    ])
  );
});

// ====================
// Help Sections
// ====================

bot.action("help_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "👥 مدیریت کاربران\n\n" +
    "🔨 بن: کاربر موردنظر را ریپلای کنید و دستور بن را اجرا کنید.\n\n" +
    "🔇 میوت: کاربر را از ارسال پیام محدود می‌کند.\n\n" +
    "🚫 آن‌بن: محدودیت بن کاربر را برمی‌دارد.\n\n" +
    "⚠️ اخطار: برای کاربر اخطار ثبت می‌کند.",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ راهنمای اصلی", "help")]
    ])
  );
});

bot.action("help_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🔒 قفل‌ها\n\n" +
    "برای کنترل نوع محتوایی که کاربران می‌توانند در گروه ارسال کنند استفاده می‌شوند.\n\n" +
    "مثلاً قفل لینک، فایل، رسانه و گیف.",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ راهنمای اصلی", "help")]
    ])
  );
});

bot.action("help_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🧹 مدیریت پیام‌ها\n\n" +
    "برای فیلتر کلمات، پاک‌سازی پیام‌ها و کنترل پیام‌های ناخواسته استفاده می‌شود.",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ راهنمای اصلی", "help")]
    ])
  );
});

bot.action("help_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "⚠️ اخطارها\n\n" +
    "برای مدیریت تخلفات کاربران استفاده می‌شود.\n\n" +
    "بعداً می‌توانیم تعیین کنیم مثلاً بعد از ۳ اخطار، کاربر میوت یا بن شود.",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ راهنمای اصلی", "help")]
    ])
  );
});

bot.action("help_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "👋 ورود و خروج\n\n" +
    "ربات می‌تواند هنگام ورود عضو جدید پیام خوش‌آمد ارسال کند و هنگام خروج پیام خداحافظی نمایش دهد.",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ راهنمای اصلی", "help")]
    ])
  );
});

bot.action("help_settings", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "⚙️ تنظیمات گروه\n\n" +
    "هر گروه تنظیمات مخصوص خودش را خواهد داشت تا تغییرات یک گروه روی گروه‌های دیگر اثر نگذارد.",
    Markup.inlineKeyboard([
      [Markup.button.callback("⬅️ راهنمای اصلی", "help")]
    ])
  );
});

// ====================
// Generic panel callback
// ====================

bot.action("panel", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage().catch(() => {});
  await showPanel(ctx);
});

// ====================
// Error Handler
// ====================

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ====================
// Start Bot
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
