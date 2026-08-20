const { Telegraf, Markup } = require("telegraf");
const http = require("http");

// =====================================================
// CONFIG
// =====================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is not set!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// =====================================================
// RENDER WEB SERVER
// =====================================================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is running!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// =====================================================
// BUTTONS
// =====================================================

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

// =====================================================
// GROUP DATA
// =====================================================

const groupData = new Map();

function getGroupData(chatId) {
  if (!groupData.has(chatId)) {
    groupData.set(chatId, {
      panelOwner: null,
      warns: new Map(),

      rules:
        "هنوز قوانینی برای این گروه ثبت نشده است.",

      welcomeEnabled: true,
      goodbyeEnabled: true
    });
  }

  return groupData.get(chatId);
}

// =====================================================
// HELPERS
// =====================================================

function isGroup(ctx) {
  return (
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
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
  if (!user) {
    return "کاربر";
  }

  if (user.username) {
    return `@${user.username}`;
  }

  return (
    [
      user.first_name,
      user.last_name
    ]
      .filter(Boolean)
      .join(" ") || "کاربر"
  );
}

async function getMemberRole(ctx, userId) {
  if (!isGroup(ctx)) {
    return "unknown";
  }

  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    return member.status;
  } catch (err) {
    console.error(
      "getChatMember error:",
      err.message
    );

    return "unknown";
  }
}

function isAdminRole(role) {
  return (
    role === "creator" ||
    role === "administrator"
  );
}

async function canManageTarget(ctx, targetId) {
  if (!isGroup(ctx)) {
    return {
      allowed: false,
      message:
        "❌ این دستور فقط داخل گروه قابل استفاده است."
    };
  }

  const executorRole =
    await getMemberRole(
      ctx,
      ctx.from.id
    );

  const targetRole =
    await getMemberRole(
      ctx,
      targetId
    );

  if (!isAdminRole(executorRole)) {
    return {
      allowed: false,
      message:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "شما دسترسی مدیریتی ندارید. ⚠️"
    };
  }

  if (targetRole === "creator") {
    return {
      allowed: false,
      message:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "مالک اصلی گروه قابل مدیریت نیست. 👑"
    };
  }

  if (
    targetRole === "administrator" &&
    executorRole !== "creator"
  ) {
    return {
      allowed: false,
      message:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند. ⚠️"
    };
  }

  return {
    allowed: true
  };
}

// =====================================================
// START COMMAND
// =====================================================

bot.start(async (ctx) => {
  await ctx.reply(
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "سلام 👋\n\n" +
    "ربات مدیریت گروه آماده است.\n\n" +
    "یکی از گزینه‌ها را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          B.panel,
          "panel"
        )
      ],
      [
        Markup.button.callback(
          B.help,
          "help"
        ),
        Markup.button.callback(
          B.settings,
          "settings"
        )
      ]
    ])
  );
});

// =====================================================
// COMMANDS
// =====================================================

bot.command("panel", (ctx) => {
  return showPanel(ctx);
});

bot.command("help", (ctx) => {
  return showHelp(ctx);
});

bot.command("settings", (ctx) => {
  return showSettings(ctx);
});

// =====================================================
// PERSIAN COMMANDS
// =====================================================

bot.hears(/^پنل$/i, (ctx) => {
  return showPanel(ctx);
});

bot.hears(/^راهنما$/i, (ctx) => {
  return showHelp(ctx);
});

bot.hears(/^تنظیمات$/i, (ctx) => {
  return showSettings(ctx);
});

// =====================================================
// MAIN PANEL
// =====================================================

async function showPanel(ctx) {
  if (isGroup(ctx)) {
    const data =
      getGroupData(ctx.chat.id);

    if (
      data.panelOwner &&
      data.panelOwner !== ctx.from.id
    ) {
      return ctx.reply(
        "『𓆩 پنل در اختیار مدیر دیگری است 𓆪』\n\n" +
        "این پنل توسط مدیر دیگری باز شده است. ⚠️"
      );
    }

    data.panelOwner = ctx.from.id;
  }

  return ctx.reply(
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          B.users,
          "panel_users"
        )
      ],
      [
        Markup.button.callback(
          B.locks,
          "panel_locks"
        )
      ],
      [
        Markup.button.callback(
          B.messages,
          "panel_messages"
        )
      ],
      [
        Markup.button.callback(
          B.warns,
          "panel_warn"
        )
      ],
      [
        Markup.button.callback(
          B.welcome,
          "panel_welcome"
        )
      ],
      [
        Markup.button.callback(
          B.rules,
          "panel_rules"
        )
      ],
      [
        Markup.button.callback(
          B.stats,
          "panel_stats"
        )
      ],
      [
        Markup.button.callback(
          B.settings,
          "settings"
        )
      ]
    ])
  );
}

// =====================================================
// HELP
// =====================================================

async function showHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "برای استفاده از مدیریت کاربران، روی پیام کاربر ریپلای کنید و دستور مربوطه را ارسال کنید.\n\n" +
    "━━━━━━━━━━━━━━\n" +
    "👤 مدیریت کاربران\n" +
    "• بن\n" +
    "• میوت\n" +
    "• آن‌بن\n" +
    "• آن‌میوت\n" +
    "• اخطار\n" +
    "• اطلاعات\n\n" +
    "━━━━━━━━━━━━━━\n" +
    "📌 دستورات\n" +
    "• پنل\n" +
    "• راهنما\n" +
    "• تنظیمات",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          B.back,
          "panel"
        )
      ]
    ])
  );
}

// =====================================================
// SETTINGS
// =====================================================

async function showSettings(ctx) {
  return ctx.reply(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 کاربران 𓆪』",
          "settings_users"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 پیام‌ها 𓆪』",
          "settings_messages"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 قفل‌ها 𓆪』",
          "settings_locks"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 ورود و خروج 𓆪』",
          "settings_welcome"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 قوانین 𓆪",
          "settings_rules"
        )
      ],
      [
        Markup.button.callback(
          B.back,
          "panel"
        )
      ]
    ])
  );
}

// =====================================================
// USERS PANEL
// =====================================================

bot.action(
  "panel_users",
  async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "『𓆩 مدیریت کاربران 𓆪』\n\n" +
      "برای اجرای عملیات، روی پیام کاربر ریپلای کنید:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 بن 𓆪",
            "user_ban"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 میوت 𓆪",
            "user_mute"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 آن‌بن 𓆪",
            "user_unban"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 آن‌میوت 𓆪",
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
            "『𓆩 اطلاعات کاربر 𓆪",
            "user_info"
          )
        ],
        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ]
      ])
    );
  }
);

// =====================================================
// USER BUTTON INFO
// =====================================================

bot.action(
  "user_info",
  async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "『𓆩 اطلاعات کاربر 𓆪』\n\n" +
      "برای دریافت اطلاعات یک کاربر، روی پیام او ریپلای کنید و بنویسید:\n\n" +
      "اطلاعات",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            B.back,
            "panel_users"
          )
        ]
      ])
    );
  }
);

// =====================================================
// BAN
// =====================================================

bot.hears(/^بن$/i, async (ctx) => {
  if (!isGroup(ctx)) {
    return;
  }

  const target =
    getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای بن کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\nبن"
    );
  }

  const permission =
    await canManageTarget(
      ctx,
      target.id
    );

  if (!permission.allowed) {
    return ctx.reply(
      permission.message
    );
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
    console.error(
      "Ban error:",
      err.message
    );

    return ctx.reply(
      "『𓆩 خطا 𓆪』\n\n" +
      "ربات نتوانست کاربر را بن کند.\n\n" +
      "مطمئن شوید ربات مدیر گروه است و اجازه Ban Users دارد."
    );
  }
});

// =====================================================
// MUTE
// =====================================================

bot.hears(/^میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) {
    return;
  }

  const target =
    getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای میوت کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\nمیوت"
    );
  }

  const permission =
    await canManageTarget(
      ctx,
      target.id
    );

  if (!permission.allowed) {
    return ctx.reply(
      permission.message
    );
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
          can_add_web_page_previews: false
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
    console.error(
      "Mute error:",
      err.message
    );

    return ctx.reply(
      "『𓆩 خطا 𓆪\n\n" +
      "ربات نتوانست کاربر را میوت کند.\n\n" +
      "اجازه Restrict Users را بررسی کنید."
    );
  }
});

// =====================================================
// UNBAN
// =====================================================

bot.hears(/^آن‌بن$/i, async (ctx) => {
  if (!isGroup(ctx)) {
    return;
  }

  const target =
    getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "برای آن‌بن کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\nآن‌بن"
    );
  }

  const permission =
    await canManageTarget(
      ctx,
      target.id
    );

  if (!permission.allowed) {
    return ctx.reply(
      permission.message
    );
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
    console.error(
      "Unban error:",
      err.message
    );

    return ctx.reply(
      "『𓆩 خطا 𓆪』\n\n" +
      "ربات نتوانست بن کاربر را بردارد."
    );
  }
});

// =====================================================
// UNMUTE
// =====================================================

bot.hears(
  /^آن‌میوت$/i,
  async (ctx) => {
    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getTargetUser(ctx);

    if (!target) {
      return ctx.reply(
        "برای آن‌میوت کردن، روی پیام کاربر ریپلای کنید و بنویسید:\n\nآن‌میوت"
      );
    }

    const permission =
      await canManageTarget(
        ctx,
        target.id
      );

    if (!permission.allowed) {
      return ctx.reply(
        permission.message
      );
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
      console.error(
        "Unmute error:",
        err.message
      );

      return ctx.reply(
        "『𓆩 خطا 𓆪』\n\n" +
        "ربات نتوانست میوت کاربر را بردارد."
      );
    }
  }
);

// =====================================================
// WARN
// =====================================================

bot.hears(
  /^اخطار$/i,
  async (ctx) => {
    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getTargetUser(ctx);

    if (!target) {
      return ctx.reply(
        "برای اخطار دادن، روی پیام کاربر ریپلای کنید و بنویسید:\n\nاخطار"
      );
    }

    const permission =
      await canManageTarget(
        ctx,
        target.id
      );

    if (!permission.allowed) {
      return ctx.reply(
        permission.message
      );
    }

    const data =
      getGroupData(ctx.chat.id);

    const oldWarn =
      data.warns.get(target.id) || 0;

    const newWarn =
      oldWarn + 1;

    data.warns.set(
      target.id,
      newWarn
    );

    return ctx.reply(
      "『𓆩 اخطار ثبت شد 𓆪』\n\n" +
      `👤 ${getUserName(target)}\n` +
      `🆔 ${target.id}\n\n` +
      `⚠️ تعداد اخطار: ${newWarn}\n` +
      `👮 توسط: ${getUserName(ctx.from)}`
    );
  }
);

// =====================================================
// USER INFO
// =====================================================

bot.hears(
  /^اطلاعات$/i,
  async (ctx) => {
    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getTargetUser(ctx);

    if (!target) {
      return ctx.reply(
        "برای دیدن اطلاعات، روی پیام کاربر ریپلای کنید و بنویسید:\n\nاطلاعات"
      );
    }

    const role =
      await getMemberRole(
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
  }
);

// =====================================================
// LOCKS PANEL
// =====================================================

bot.action(
  "panel_locks",
  async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "『𓆩 قفل‌های گروه 𓆪』\n\n" +
      "نوع محتوا را انتخاب کنید:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 لینک 𓆪",
            "lock_links"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 رسانه 𓆪",
            "lock_media"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 فایل 𓆪",
            "lock_files"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 استیکر 𓆪",
            "lock_sticker"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 گیف 𓆪",
            "lock_gif"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 نظرسنجی 𓆪",
            "lock_poll"
          )
        ],
        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ]
      ])
    );
  }
);

// =====================================================
// MESSAGE PANEL
// =====================================================

bot.action(
  "panel_messages",
  async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
      "بخش موردنظر را انتخاب کنید:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 فیلتر کلمات 𓆪",
            "filter_words"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 پاکسازی 𓆪",
            "message_clean"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 ضداسپم 𓆪",
            "anti_spam"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 حذف خودکار 𓆪",
            "auto_delete"
          )
        ],
        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ]
      ])
    );
  }
);

// =====================================================
// WARN PANEL
// =====================================================

bot.action(
  "panel_warn",
  async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "『𓆩 سیستم اخطار 𓆪\n\n" +
      "مدیریت سیستم اخطار:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 لیست اخطارها 𓆪",
            "warn_list"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 پاک کردن اخطار 𓆪",
            "warn_clear"
          )
        ],
        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ]
      ])
    );
  }
);

// =================================
