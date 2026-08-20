const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// ==================================================
// Render Web Server
// ==================================================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// ==================================================
// متن دکمه‌ها
// ==================================================

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

// ==================================================
// اطلاعات موقت گروه‌ها
// ==================================================

const groupData = new Map();

function getGroupData(chatId) {
  if (!groupData.has(chatId)) {
    groupData.set(chatId, {
      panelOwner: null,
      fakeOwners: new Set(),
      warns: new Map()
    });
  }

  return groupData.get(chatId);
}

// ==================================================
// ابزارهای کمکی
// ==================================================

function isGroup(ctx) {
  return (
    ctx.chat &&
    (ctx.chat.type === "group" || ctx.chat.type === "supergroup")
  );
}

function getTargetUser(ctx) {
  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {
    return ctx.message.reply_to_message.from;
  }

  return null;
}

function getUserName(user) {
  if (!user) return "کاربر";

  if (user.username) {
    return `@${user.username}`;
  }

  return (
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") || "کاربر"
  );
}

function normalizeText(text) {
  return String(text || "")
    .trim()
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ");
}

function isAdminRole(role) {
  return role === "creator" || role === "administrator";
}

async function getMemberRole(ctx, userId) {
  if (!isGroup(ctx)) return "unknown";

  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );

    return member.status;
  } catch (err) {
    console.error("getChatMember error:", err.message);
    return "unknown";
  }
}

async function isAdmin(ctx, userId) {
  const role = await getMemberRole(ctx, userId);
  return isAdminRole(role);
}

async function isOwner(ctx, userId) {
  const role = await getMemberRole(ctx, userId);
  return role === "creator";
}

// ==================================================
// بررسی دسترسی برای مدیریت کاربران
// ==================================================

async function canManageTarget(ctx, targetId) {
  if (!isGroup(ctx)) {
    return {
      allowed: false,
      message: "این دستور فقط داخل گروه قابل استفاده است."
    };
  }

  const executorId = ctx.from.id;

  const executorRole = await getMemberRole(ctx, executorId);
  const targetRole = await getMemberRole(ctx, targetId);

  // عضو عادی نمی‌تواند مدیریت کند
  if (!isAdminRole(executorRole)) {
    return {
      allowed: false,
      message:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "شما دسترسی مدیریتی برای انجام این عملیات را ندارید. ⚠️"
    };
  }

  // مدیر عادی نمی‌تواند مالک اصلی را مدیریت کند
  if (targetRole === "creator") {
    return {
      allowed: false,
      message:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "امکان مدیریت مالک اصلی گروه وجود ندارد. 👑"
    };
  }

  // مدیر معمولی نمی‌تواند مدیر دیگر را مدیریت کند
  if (
    targetRole === "administrator" &&
    executorRole !== "creator"
  ) {
    return {
      allowed: false,
      message:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "شما اجازه مدیریت مدیران دیگر را ندارید. ⚠️"
    };
  }

  return {
    allowed: true
  };
}

// ==================================================
// صفحه شروع
// ==================================================

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

// ==================================================
// دستورات فارسی
// ==================================================

// پنل
bot.hears(/^پنل$/i, async (ctx) => {
  await showPanel(ctx);
});

// راهنما
bot.hears(/^راهنما$/i, async (ctx) => {
  await showHelp(ctx);
});

// تنظیمات
bot.hears(/^تنظیمات$/i, async (ctx) => {
  await showSettings(ctx);
});

// ==================================================
// دستورات انگلیسی
// ==================================================

bot.command("panel", async (ctx) => {
  await showPanel(ctx);
});

bot.command("help", async (ctx) => {
  await showHelp(ctx);
});

bot.command("settings", async (ctx) => {
  await showSettings(ctx);
});

// ==================================================
// پنل اصلی
// ==================================================

async function showPanel(ctx) {
  if (isGroup(ctx)) {
    const data = getGroupData(ctx.chat.id);

    // اگر پنل قبلاً توسط مدیر دیگری باز شده
    if (
      data.panelOwner &&
      data.panelOwner !== ctx.from.id
    ) {
      return ctx.reply(
        "『𓆩 پنل در اختیار مدیر دیگری است 𓆪』\n\n" +
        "این پنل توسط مدیر دیگری باز شده و شما اجازه استفاده از آن را ندارید. ⚠️"
      );
    }

    data.panelOwner = ctx.from.id;
  }

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

// ==================================================
// راهنمای اصلی
// ==================================================

async function showHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
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

// ==================================================
// تنظیمات اصلی
// ==================================================

async function showSettings(ctx) {
  return ctx.reply(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
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

// ==================================================
// مدیریت کاربران
// ==================================================

bot.action("panel_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "عملیات موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("『𓆩 بن 𓆪』", "user_ban")
      ],
      [
        Markup.button.callback("『𓆩 میوت 𓆪", "user_mute")
      ],
      [
        Markup.button.callback("『𓆩 آن‌بن 𓆪』", "user_unban")
      ],
      [
        Markup.button.callback(
          "『𓆩 آن‌میوت 𓆪』",
          "user_unmute"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 اخطار 𓆪",
          "user_warn"
        )
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

// ==================================================
// عملیات واقعی مدیریت کاربر با ریپلای
// ==================================================

// بن
bot.hears(/^بن$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "『𓆩 نحوه استفاده 𓆪』\n\n" +
      "برای بن کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "بن"
    );
  }

  const permission = await canManageTarget(
    ctx,
    target.id
  );

  if (!permission.allowed) {
    return ctx.reply(permission.message);
  }

  try {
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );

    return ctx.reply(
      "『𓆩 کاربر بن شد 𓆪』\n\n" +
      `👤 ${getUserName(target)}\n` +
      `🆔 ${target.id}\n\n` +
      `👮 توسط: ${getUserName(ctx.from)}`
    );
  } catch (err) {
    console.error("Ban error:", err.message);

    return ctx.reply(
      "『𓆩 خطا 𓆪\n\n" +
      "ربات نتوانست این کاربر را بن کند.\n" +
      "دسترسی‌های مدیریتی ربات را بررسی کنید."
    );
  }
});

// میوت
bot.hears(/^میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای میوت کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "میوت"
    );
  }

  const permission = await canManageTarget(
    ctx,
    target.id
  );

  if (!permission.allowed) {
    return ctx.reply(permission.message);
  }

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        permissions: {
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        }
      }
    );

    return ctx.reply(
      "『𓆩 کاربر میوت شد 𓆪』\n\n" +
      `👤 ${getUserName(target)}\n` +
      `🆔 ${target.id}\n\n` +
      `👮 توسط: ${getUserName(ctx.from)}`
    );
  } catch (err) {
    console.error("Mute error:", err.message);

    return ctx.reply(
      "『𓆩 خطا 𓆪』\n\n" +
      "ربات نتوانست کاربر را میوت کند."
    );
  }
});

// آن‌بن
bot.hears(/^آن‌بن$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای آن‌بن کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "آن‌بن"
    );
  }

  const permission = await canManageTarget(
    ctx,
    target.id
  );

  if (!permission.allowed) {
    return ctx.reply(permission.message);
  }

  try {
    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.id,
      {
        only_if_banned: false
      }
    );

    return ctx.reply(
      "『𓆩 بن کاربر برداشته شد 𓆪』\n\n" +
      `👤 ${getUserName(target)}\n` +
      `🆔 ${target.id}`
    );
  } catch (err) {
    console.error("Unban error:", err.message);

    return ctx.reply(
      "『𓆩 خطا 𓆪』\n\n" +
      "ربات نتوانست بن کاربر را بردارد."
    );
  }
});

// آن‌میوت
bot.hears(/^آن‌میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای آن‌میوت کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "آن‌میوت"
    );
  }

  const permission = await canManageTarget(
    ctx,
    target.id
  );

  if (!permission.allowed) {
    return ctx.reply(permission.message);
  }

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        permissions: {
          can_send_messages: true,
          can_send_audios: true,
          can_send_documents: true,
          can_send_photos: true,
          can_send_videos: true,
          can_send_video_notes: true,
          can_send_voice_notes: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_invite_users: true
        }
      }
    );

    return ctx.reply(
      "『𓆩 میوت کاربر برداشته شد 𓆪』\n\n" +
      `👤 ${getUserName(target)}\n` +
      `🆔 ${target.id}`
    );
  } catch (err) {
    console.error("Unmute error:", err.message);

    return ctx.reply(
      "『𓆩 خطا 𓆪』\n\n" +
      "ربات نتوانست میوت کاربر را بردارد."
    );
  }
});

// ==================================================
// اخطار با ریپلای
// ==================================================

bot.hears(/^اخطار$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای اخطار دادن، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "اخطار"
    );
  }

  const permission = await canManageTarget(
    ctx,
    target.id
  );

  if (!permission.allowed) {
    return ctx.reply(permission.message);
  }

  const data = getGroupData(ctx.chat.id);

  const oldWarn =
    data.warns.get(target.id) || 0;

  const newWarn = oldWarn + 1;

  data.warns.set(target.id, newWarn);

  return ctx.reply(
    "『𓆩 اخطار ثبت شد 𓆪』\n\n" +
    `👤 ${getUserName(target)}\n` +
    `🆔 ${target.id}\n\n` +
    `⚠️ تعداد اخطار: ${newWarn}\n` +
    `👮 توسط: ${getUserName(ctx.from)}`
  );
});

// ==================================================
// اطلاعات کاربر با ریپلای
// ==================================================

bot.hears(/^اطلاعات$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای دیدن اطلاعات، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "اطلاعات"
    );
  }

  const role = await getMemberRole(
    ctx,
    target.id
  );

  const roleText = {
    creator: "👑 مالک اصلی",
    administrator: "🛡 مدیر",
    member: "👤 عضو",
    restricted: "🔇 محدودشده",
    left: "🚪 خارج‌شده",
    kicked: "🚫 اخراج‌شده"
  }[role] || "❓ نامشخص";

  return ctx.reply(
    "『𓆩 اطلاعات کاربر 𓆪』\n\n" +
    `👤 نام: ${getUserName(target)}\n` +
    `🆔 آیدی: ${target.id}\n` +
    `🔰 وضعیت: ${roleText}`
  );
});

// ==================================================
// قفل‌ها
// ==================================================

bot.action("panel_locks", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 قفل‌های گروه 𓆪』\n\n" +
    "نوع محتوای موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 لینک 𓆪』", "lock_links")],
      [Markup.button.callback("『𓆩 فایل 𓆪』", "lock_files")],
      [Markup.button.callback("『𓆩 رسانه 𓆪』", "lock_media")],
      [Markup.button.callback("『𓆩 گیف 𓆪", "lock_gif")],
      [Markup.button.callback("『𓆩 استیکر 𓆪", "lock_sticker")],
      [Markup.button.callback("『𓆩 نظرسنجی 𓆪", "lock_poll")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ==================================================
// مدیریت پیام‌ها
// ==================================================

bot.action("panel_messages", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 فیلتر کلمات 𓆪』", "filter_words")],
      [Markup.button.callback("『𓆩 پاکسازی 𓆪", "message_clean")],
      [Markup.button.callback("『𓆩 ضداسپم 𓆪", "anti_spam")],
      [Markup.button.callback("『𓆩 حذف خودکار 𓆪", "auto_delete")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ==================================================
// اخطار
// ==================================================

bot.action("panel_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 سیستم اخطار 𓆪』\n\n" +
    "سیستم اخطار گروه:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 حد اخطار 𓆪", "warn_limit")],
      [Markup.button.callback("『𓆩 مجازات اخطار 𓆪", "warn_action")],
      [Markup.button.callback("『𓆩 لیست اخطارها 𓆪", "warn_list")],
      [Markup.button.callback("『𓆩 پاک کردن اخطار 𓆪", "warn_clear")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ==================================================
// ورود و خروج
// ==================================================

bot.action("panel_welcome", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 ورود و خروج 𓆪』\n\n" +
    "تنظیمات ورود و خروج اعضا:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 خوش‌آمدگویی 𓆪", "welcome_toggle")],
      [Markup.button.callback("『𓆩 خداحافظی 𓆪", "goodbye_toggle")],
      [Markup.button.callback("『𓆩 متن خوش‌آمدگویی 𓆪", "welcome_text")],
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ==================================================
// قوانین
// ==================================================

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

// ==================================================
// آمار
// ==================================================

bot.action("panel_stats", async (ctx) => {
  await ctx.answerCbQuery();

  let members = "نامشخص";

  try {
    const count =
      await ctx.telegram.getChatMemberCount(
        ctx.chat.id
      );

    members = count;
  } catch (err) {}

  await ctx.editMessageText(
    "『𓆩 آمار گروه 𓆪』\n\n" +
    `👥 تعداد اعضا: ${members}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(B.back, "panel")]
    ])
  );
});

// ==================================================
// تنظیمات کاربران
// ==================================================

bot.action("settings_users", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 تنظیمات کاربران 𓆪』\n\n" +
    "تنظیم رفتار مدیریت کاربران:",
    Markup.inlineKeyboard([
      [Markup.button.callback("『𓆩 تنظیمات اخطار 𓆪", "se
