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
// مالکین داخلی ربات
// ====================

// مالکین هر گروه به صورت جداگانه نگهداری می‌شوند.
// نکته: این اطلاعات فعلاً تا زمان ری‌استارت سرویس در حافظه هستند.
const groupOwners = new Map();

function getGroupOwners(chatId) {
  if (!groupOwners.has(chatId)) {
    groupOwners.set(chatId, new Set());
  }

  return groupOwners.get(chatId);
}

// بررسی Creator واقعی گروه
async function isGroupCreator(ctx, userId) {
  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );

    return member.status === "creator";
  } catch (error) {
    console.error("خطا در بررسی مالک گروه:", error);
    return false;
  }
}

// ====================
// مالک+
// ====================

bot.hears(/^مالک\+$/u, async (ctx) => {
  try {
    if (!ctx.chat || !["group", "supergroup"].includes(ctx.chat.type)) {
      return ctx.reply(
        "⚠️ این دستور فقط داخل گروه قابل استفاده است."
      );
    }

    if (!ctx.from) {
      return;
    }

    // فقط Creator واقعی گروه
    const isCreator = await isGroupCreator(ctx, ctx.from.id);

    if (!isCreator) {
      return ctx.reply(
        "⛔ فقط مالک اصلی گروه می‌تواند از این دستور استفاده کند."
      );
    }

    // باید روی کاربر ریپلای شده باشد
    if (!ctx.message.reply_to_message) {
      return ctx.reply(
        "⚠️ لطفاً روی پیام کاربر موردنظر ریپلای کنید و سپس بنویسید:\n\n" +
        "مالک+"
      );
    }

    const target = ctx.message.reply_to_message.from;

    if (!target) {
      return ctx.reply(
        "❌ اطلاعات کاربر پیدا نشد."
      );
    }

    // خود مالک اصلی را لازم نیست دوباره اضافه کنیم
    if (target.id === ctx.from.id) {
      return ctx.reply(
        "ℹ️ شما مالک اصلی گروه هستید."
      );
    }

    const owners = getGroupOwners(ctx.chat.id);

    if (owners.has(target.id)) {
      return ctx.reply(
        "ℹ️ این کاربر قبلاً در فهرست مالکین ربات قرار دارد."
      );
    }

    owners.add(target.id);

    const name =
      target.first_name ||
      target.username ||
      "کاربر";

    await ctx.reply(
      "『𓆩 مالکیت گروه 𓆪』\n\n" +
      `👤 ${name}\n\n` +
      "به فهرست مالکین ربات اضافه شد. 👑"
    );

  } catch (error) {
    console.error("خطا در مالک+:", error);

    await ctx.reply(
      "❌ هنگام انجام عملیات خطایی رخ داد."
    );
  }
});

// ====================
// مالک-
// ====================

bot.hears(/^مالک-$/u, async (ctx) => {
  try {
    if (!ctx.chat || !["group", "supergroup"].includes(ctx.chat.type)) {
      return ctx.reply(
        "⚠️ این دستور فقط داخل گروه قابل استفاده است."
      );
    }

    if (!ctx.from) {
      return;
    }

    // فقط Creator واقعی گروه
    const isCreator = await isGroupCreator(ctx, ctx.from.id);

    if (!isCreator) {
      return ctx.reply(
        "⛔ فقط مالک اصلی گروه می‌تواند از این دستور استفاده کند."
      );
    }

    // باید روی کاربر ریپلای شده باشد
    if (!ctx.message.reply_to_message) {
      return ctx.reply(
        "⚠️ لطفاً روی پیام کاربر موردنظر ریپلای کنید و سپس بنویسید:\n\n" +
        "مالک-"
      );
    }

    const target = ctx.message.reply_to_message.from;

    if (!target) {
      return ctx.reply(
        "❌ اطلاعات کاربر پیدا نشد."
      );
    }

    const owners = getGroupOwners(ctx.chat.id);

    if (!owners.has(target.id)) {
      return ctx.reply(
        "ℹ️ این کاربر در فهرست مالکین ربات نیست."
      );
    }

    owners.delete(target.id);

    const name =
      target.first_name ||
      target.username ||
      "کاربر";

    await ctx.reply(
      "『𓆩 مالکیت گروه 𓆪』\n\n" +
      `👤 ${name}\n\n` +
      "از فهرست مالکین ربات حذف شد."
    );

  } catch (error) {
    console.error("خطا در مالک-:", error);

    await ctx.reply(
      "❌ هنگام انجام عملیات خطایی رخ داد."
    );
  }
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
// صفحه شروع
// ====================

bot.start(async (ctx) => {
  await ctx.reply(
    "سلام 👋\n\n" +
    "به PulseGroupManager خوش آمدید.\n\n" +
    "برای مدیریت گروه، راهنما یا تنظیمات یکی را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.panel, "panel")
      ],
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

bot.hears(/^پنل$/u, async (ctx) => {
  await showPanel(ctx);
});

bot.hears(/^راهنما$/u, async (ctx) => {
  await showHelp(ctx);
});

bot.hears(/^تنظیمات$/u, async (ctx) => {
  await showSettings(ctx);
});

// ====================
// دستورات انگلیسی
// ====================

bot.command("panel", async (ctx) => {
  await showPanel(ctx);
});

bot.command("help", async (ctx) => {
  await showHelp(ctx);
});

bot.command("settings", async (ctx) => {
  await showSettings(ctx);
});

// ====================
// پنل اصلی
// ====================

async function showPanel(ctx) {
  return ctx.reply(
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "از این بخش می‌توان قابلیت‌های مدیریتی گروه را کنترل کرد:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.users, "panel_users")
      ],
      [
        Markup.button.callback(B.locks, "panel_locks")
      ],
      [
        Markup.button.callback(B.messages, "panel_messages")
      ],
      [
        Markup.button.callback(B.warns, "panel_warn")
      ],
      [
        Markup.button.callback(B.welcome, "panel_welcome")
      ],
      [
        Markup.button.callback(B.rules, "panel_rules")
      ],
      [
        Markup.button.callback(B.stats, "panel_stats")
      ],
      [
        Markup.button.callback(B.settings, "settings")
      ]
    ])
  );
}

// ====================
// راهنمای اصلی
// ====================

async function showHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "راهنما برای توضیح قابلیت‌های ربات است.\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 راهنمای کاربران 𓆪』",
          "help_users"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای قفل‌ها 𓆪』",
          "help_locks"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای پیام‌ها 𓆪』",
          "help_messages"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای اخطار 𓆪』",
          "help_warn"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای ورود و خروج 𓆪』",
          "help_welcome"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای تنظیمات 𓆪』",
          "help_settings"
        )
      ]
    ])
  );
}

// ====================
// تنظیمات اصلی
// ====================

async function showSettings(ctx) {
  return ctx.reply(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "تنظیمات برای شخصی‌سازی رفتار ربات در این گروه است.\n\n" +
    "یک بخش را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 تنظیمات کاربران 𓆪』",
          "settings_users"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات پیام‌ها 𓆪』",
          "settings_messages"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات قفل‌ها 𓆪』",
          "settings_locks"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات ورود و خروج 𓆪』",
          "settings_welcome"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات قوانین 𓆪』",
          "settings_rules"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات امنیتی 𓆪』",
          "settings_security"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 دسترسی مدیران 𓆪』",
          "settings_admins"
        )
      ]
    ])
  );
}

// ====================
// مدیریت کاربران
// ====================

bot.action("panel_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "قابلیت‌های مدیریت کاربران:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("『𓆩 بن 𓆪』", "user_ban")
      ],
      [
        Markup.button.callback("『𓆩 میوت 𓆪』", "user_mute")
      ],
      [
        Markup.button.callback("『𓆩 آن‌بن 𓆪』", "user_unban")
      ],
      [
        Markup.button.callback("『𓆩 آن‌میوت 𓆪』", "user_unmute")
      ],
      [
        Markup.button.callback("『𓆩 اخطار 𓆪』", "user_warn")
      ],
      [
        Markup.button.callback(
          "『𓆩 اطلاعات کاربر 𓆪』",
          "user_info"
        )
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
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
    "از این قسمت نوع محتوای مجاز در گروه مدیریت می‌شود:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("『𓆩 لینک 𓆪』", "lock_links")
      ],
      [
        Markup.button.callback("『𓆩 فایل 𓆪』", "lock_files")
      ],
      [
        Markup.button.callback("『𓆩 رسانه 𓆪』", "lock_media")
      ],
      [
        Markup.button.callback("『𓆩 گیف 𓆪』", "lock_gif")
      ],
      [
        Markup.button.callback(
          "『𓆩 استیکر 𓆪』",
          "lock_sticker"
        )
      ],
      [
        Markup.button.callback("『𓆩 نظرسنجی 𓆪』", "lock_poll")
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
    ])
  );
});

// ====================
// مدیریت پیام‌ها
// ====================

bot.action("panel_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
    "مدیریت پیام‌ها و کنترل محتوای نامناسب:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 فیلتر کلمات 𓆪』",
          "filter_words"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 پاک‌سازی پیام‌ها 𓆪』",
          "message_clean"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 ضداسپم 𓆪』",
          "anti_spam"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 حذف خودکار 𓆪』",
          "auto_delete"
        )
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
    ])
  );
});

// ====================
// سیستم اخطار
// ====================

bot.action("panel_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 سیستم اخطار 𓆪』\n\n" +
    "سیستم اخطار برای کنترل تخلفات کاربران استفاده می‌شود.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 حد اخطار 𓆪』",
          "warn_limit"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 مجازات اخطار 𓆪』",
          "warn_action"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 لیست اخطارها 𓆪』",
          "warn_list"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 پاک کردن اخطار 𓆪』",
          "warn_clear"
        )
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
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
    "پیام‌های مربوط به ورود و خروج اعضا:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 خوش‌آمدگویی 𓆪』",
          "welcome_toggle"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 خداحافظی 𓆪』",
          "goodbye_toggle"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 متن خوش‌آمدگویی 𓆪』",
          "welcome_text"
        )
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
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
    "مدیریت قوانین اختصاصی گروه:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 نمایش قوانین 𓆪』",
          "show_rules"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیم قوانین 𓆪』",
          "set_rules"
        )
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
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
    "در این بخش بعداً آمار کامل گروه نمایش داده می‌شود.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 تعداد اعضا 𓆪』",
          "stats_members"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 آمار پیام‌ها 𓆪』",
          "stats_messages"
        )
      ],
      [
        Markup.button.callback(B.back, "panel")
      ]
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
    "تنظیم رفتار ربات هنگام مدیریت کاربران.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 تنظیمات اخطار 𓆪』",
          "settings_user_warn"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات مجازات 𓆪』",
          "settings_user_penalty"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
    ])
  );
});

// ====================
// تنظیمات پیام‌ها
// ====================

bot.action("settings_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات پیام‌ها 𓆪』\n\n" +
    "تنظیمات مربوط به پیام‌های گروه.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 ضداسپم 𓆪』",
          "settings_antispam"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 فیلتر کلمات 𓆪』",
          "settings_filter"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 حذف خودکار 𓆪』",
          "settings_autodelete"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
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
    "تنظیم رفتار قفل‌های گروه.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 حالت قفل‌ها 𓆪』",
          "settings_lock_mode"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 پیام هشدار قفل 𓆪』",
          "settings_lock_warning"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
    ])
  );
});

// ====================
// تنظیمات پیام هشدار قفل
// ====================

bot.action("settings_lock_warning", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 پیام هشدار قفل 𓆪』\n\n" +
    "در این بخش می‌توان پیام هشدار مربوط به قفل‌ها را تنظیم کرد.\n\n" +
    "⚠️ این قابلیت در مرحله بعد به قفل‌های واقعی متصل می‌شود.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 فعال / غیرفعال 𓆪』",
          "lock_warning_toggle"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 متن هشدار 𓆪』",
          "lock_warning_text"
        )
      ],
      [
        Markup.button.callback(B.back, "settings_locks")
      ]
    ])
  );
});

// ====================
// تنظیمات ورود و خروج
// ====================

bot.action("settings_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات ورود و خروج 𓆪』\n\n" +
    "مدیریت پیام‌های ورود و خروج.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 خوش‌آمدگویی 𓆩』",
          "settings_welcome_on"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 خداحافظی 𓆪』",
          "settings_goodbye_on"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
    ])
  );
});

// ====================
// تنظیمات قوانین
// ====================

bot.action("settings_rules", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات قوانین 𓆪』\n\n" +
    "قوانین هر گروه می‌تواند جداگانه تنظیم شود.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 ویرایش قوانین 𓆪』",
          "edit_rules"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 نمایش خودکار قوانین 𓆪』",
          "auto_rules"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
    ])
  );
});

// ====================
// تنظیمات امنیتی
// ====================

bot.action("settings_security", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات امنیتی 𓆪』\n\n" +
    "تنظیمات مربوط به امنیت و ضداسپم گروه.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 ضدربات 𓆪』",
          "security_bots"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 ضداسپم 𓆪』",
          "security_spam"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
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
    "مدیریت مدیران مجاز و سطح دسترسی آنها.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 مدیران مجاز 𓆪』",
          "allowed_admins"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 سطح دسترسی 𓆪』",
          "admin_permissions"
        )
      ],
      [
        Markup.button.callback(B.back, "settings")
      ]
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
    "🔨 بن: برای خارج کردن کاربر از گروه.\n\n" +
    "🔇 میوت: جلوگیری از ارسال پیام توسط کاربر.\n\n" +
    "🚫 آن‌بن: برداشتن محدودیت بن.\n\n" +
    "⚠️ اخطار: ثبت تخلف برای کاربر.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.back, "help")
      ]
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
    "قفل‌ها برای محدود کردن انواع محتوا در گروه هستند.\n\n" +
    "مثلاً می‌توان لینک، فایل، رسانه، گیف یا استیکر را کنترل کرد.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.back, "help")
      ]
    ])
  );
});

// ===============
