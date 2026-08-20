const { Telegraf, Markup } = require("telegraf");
const http = require("http");

// =====================================================
// CONFIG
// =====================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN پیدا نشد!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// =====================================================
// RENDER SERVER
// =====================================================

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is running!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// =====================================================
// BUTTONS
// =====================================================

const B = {
  panel: "『𓆩 پنل مدیریت 𓆪』",
  users: "『𓆩 مدیریت کاربران 𓆪』",
  locks: "『𓆩 قفل‌های گروه 𓆪』",
  messages: "『𓆩 مدیریت پیام‌ها 𓆪』",
  warns: "『𓆩 سیستم اخطار 𓆪』",
  welcome: "『𓆩 ورود و خروج 𓆪』",
  rules: "『𓆩 قوانین گروه 𓆪』",
  stats: "『𓆩 آمار گروه 𓆪』",
  settings: "『𓆩 تنظیمات 𓆪』",
  back: "『𓆩 بازگشت 𓆪』"
};

// =====================================================
// GROUP DATA
// =====================================================

const groups = new Map();

function getGroup(chatId) {
  if (!groups.has(chatId)) {
    groups.set(chatId, {
      warns: new Map(),
      rules: "هنوز قوانینی برای این گروه ثبت نشده است.",
      welcome: true,
      goodbye: true
    });
  }

  return groups.get(chatId);
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

function userName(user) {
  if (!user) return "کاربر";

  if (user.username) {
    return "@" + user.username;
  }

  return (
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") || "کاربر"
  );
}

function getReplyUser(ctx) {
  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {
    return ctx.message.reply_to_message.from;
  }

  return null;
}

async function role(ctx, userId) {
  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    return member.status;
  } catch (error) {
    console.log(
      "❌ getChatMember:",
      error.message
    );

    return "unknown";
  }
}

function isAdmin(status) {
  return (
    status === "administrator" ||
    status === "creator"
  );
}

async function checkPermission(ctx, targetId) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text:
        "❌ این دستور فقط داخل گروه قابل استفاده است."
    };
  }

  const executor =
    await role(ctx, ctx.from.id);

  const target =
    await role(ctx, targetId);

  if (!isAdmin(executor)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "فقط مدیران گروه می‌توانند این کار را انجام دهند. ⚠️"
    };
  }

  if (target === "creator") {
    return {
      ok: false,
      text:
        "👑 مالک اصلی گروه قابل مدیریت نیست."
    };
  }

  if (
    target === "administrator" &&
    executor !== "creator"
  ) {
    return {
      ok: false,
      text:
        "⚠️ مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند."
    };
  }

  return { ok: true };
}

// =====================================================
// PANEL KEYBOARD
// =====================================================

function panelKeyboard() {
  return Markup.inlineKeyboard([
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
        "panel_warns"
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
  ]);
}

// =====================================================
// PANEL TEXT
// =====================================================

function panelText() {
  return (
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:"
  );
}

// =====================================================
// PANEL
// =====================================================

async function sendPanel(ctx) {
  console.log(
    "🔵 PANEL REQUEST:",
    ctx.message?.text
  );

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❌ پنل مدیریت فقط داخل گروه قابل استفاده است."
    );
  }

  try {
    await ctx.reply(
      panelText(),
      {
        ...panelKeyboard(),
        reply_parameters: {
          message_id: ctx.message.message_id
        }
      }
    );

    console.log(
      "✅ Panel sent successfully"
    );
  } catch (error) {
    console.error(
      "❌ Panel error:",
      error.message
    );

    await ctx.reply(
      "❌ خطا در نمایش پنل:\n\n" +
      error.message
    );
  }
}

// =====================================================
// DEBUG - RECEIVE ALL TEXT
// =====================================================

bot.on("text", async (ctx, next) => {
  console.log(
    "📩 RECEIVED TEXT:",
    JSON.stringify(ctx.message.text),
    "| chat:",
    ctx.chat?.id,
    "| type:",
    ctx.chat?.type,
    "| user:",
    ctx.from?.id
  );

  return next();
});

// =====================================================
// START
// =====================================================

bot.start(async (ctx) => {
  console.log("🚀 /start received");

  await ctx.reply(
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "ربات مدیریت گروه آماده است. 🤖\n\n" +
    "برای باز کردن پنل داخل گروه بنویس:\n\n" +
    "پنل",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          B.panel,
          "panel"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنما 𓆪",
          "help"
        )
      ]
    ])
  );
});

// =====================================================
// PANEL COMMAND
// =====================================================

bot.command("panel", async (ctx) => {
  console.log("🟢 /panel received");
  return sendPanel(ctx);
});

// =====================================================
// PANEL PERSIAN
// =====================================================

bot.hears(/^پنل$/i, async (ctx) => {
  console.log("🟢 Persian panel received");
  return sendPanel(ctx);
});

// =====================================================
// HELP
// =====================================================

async function sendHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای ربات 𓆪』\n\n" +
    "برای مدیریت کاربر، روی پیام او ریپلای کن و یکی از این‌ها را بنویس:\n\n" +
    "• بن\n" +
    "• میوت\n" +
    "• آن‌بن\n" +
    "• آن‌میوت\n" +
    "• اخطار\n" +
    "• اطلاعات\n\n" +
    "دستورات:\n" +
    "• پنل\n" +
    "• /panel\n" +
    "• راهنما",
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

bot.command("help", (ctx) => {
  return sendHelp(ctx);
});

bot.hears(/^راهنما$/i, (ctx) => {
  return sendHelp(ctx);
});

// =====================================================
// SETTINGS
// =====================================================

async function sendSettings(ctx) {
  return ctx.reply(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 کاربران 𓆪",
          "settings_users"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 پیام‌ها 𓆪",
          "settings_messages"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 قفل‌ها 𓆪",
          "settings_locks"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 ورود و خروج 𓆪",
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

bot.command("settings", (ctx) => {
  return sendSettings(ctx);
});

bot.hears(/^تنظیمات$/i, (ctx) => {
  return sendSettings(ctx);
});

// =====================================================
// USERS PANEL
// =====================================================

bot.action(
  "panel_users",
  async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      "『𓆩 مدیریت کاربران 𓆪』\n\n" +
      "برای مدیریت کاربر، روی پیام او ریپلای کن:",
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
            "『𓆩 اطلاعات 𓆪",
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
// BAN
// =====================================================

bot.hears(/^بن$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nبن"
    );
  }

  const permission =
    await checkPermission(
      ctx,
      target.id
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text
    );
  }

  try {
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );

    return ctx.reply(
      "『𓆩 کاربر بن شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}\n\n` +
      `👮 مدیر: ${userName(ctx.from)}`
    );
  } catch (error) {
    console.error(
      "❌ BAN:",
      error.message
    );

    return ctx.reply(
      "❌ بن کردن انجام نشد.\n\n" +
      "دسترسی Ban Users ربات را بررسی کن."
    );
  }
});

// =====================================================
// MUTE
// =====================================================

bot.hears(/^میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nمیوت"
    );
  }

  const permission =
    await checkPermission(
      ctx,
      target.id
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text
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
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}\n\n` +
      `👮 مدیر: ${userName(ctx.from)}`
    );
  } catch (error) {
    console.error(
      "❌ MUTE:",
      error.message
    );

    return ctx.reply(
      "❌ میوت انجام نشد.\n\n" +
      "دسترسی Restrict Users ربات را بررسی کن."
    );
  }
});

// =====================================================
// UNBAN
// =====================================================

bot.hears(/^آن‌بن$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌بن"
    );
  }

  const permission =
    await checkPermission(
      ctx,
      target.id
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text
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
      "『𓆩 آن‌بن انجام شد 𓆪』\n\n" +
      `👤 ${userName(target)}`
    );
  } catch (error) {
    console.error(
      "❌ UNBAN:",
      error.message
    );

    return ctx.reply(
      "❌ آن‌بن انجام نشد."
    );
  }
});

// =====================================================
// UNMUTE
// =====================================================

bot.hears(/^آن‌میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌میوت"
    );
  }

  const permission =
    await checkPermission(
      ctx,
      target.id
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text
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
          can_add_web_page_previews: true
        }
      }
    );

    return ctx.reply(
      "『𓆩 آن‌میوت انجام شد 𓆪』\n\n" +
      `👤 ${userName(target)}`
    );
  } catch (error) {
    console.error(
      "❌ UNMUTE:",
      error.message
    );

    return ctx.reply(
      "❌ آن‌میوت انجام نشد."
    );
  }
});

// =====================================================
// WARN
// =====================================================

bot.hears(/^اخطار$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاخطار"
    );
  }

  const permission =
    await checkPermission(
      ctx,
      target.id
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text
    );
  }

  const group =
    getGroup(ctx.chat.id);

  const current =
    group.warns.get(target.id) || 0;

  const count =
    current + 1;

  group.warns.set(
    target.id,
    count
  );

  return ctx.reply(
    "『𓆩 اخطار ثبت شد 𓆪』\n\n" +
    `👤 ${userName(target)}\n` +
    `🆔 ${target.id}\n\n` +
    `⚠️ تعداد اخطار: ${count}\n` +
    `👮 مدیر: ${userName(ctx.from)}`
  );
});

// =====================================================
// USER INFO
// =====================================================

bot.hears(/^اطلاعات$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاطلاعات"
    );
  }

  const status =
    await role(
      ctx,
      target.id
    );

  const statusText = {
    creator: "👑 مالک",
    administrator: "🛡 مدیر",
    member: "👤 عضو",
    restricted: "🔇 محدود",
    left: "🚪 خارج شده",
    kicked: "🚫 اخراج شده"
  }[status] || "❓ نامشخص";

  return ctx.reply(
    "『𓆩 اطلاعات کاربر 𓆪』\n\n" +
    `👤 نام: ${userName(target)}\n` +
    `🆔 آیدی: ${target.id}\n` +
    `🔰 وضعیت: ${statusText}`
  );
});

// =====================================================
// LOCKS
// =====================================================

bot.action(
  "panel_locks",
  async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      "『𓆩 قفل‌های گروه 𓆪』\n\n" +
      "نوع قفل را انتخاب کن:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔗 لینک",
            "lock_links"
          )
        ],
        [
          Markup.button.callback(
            "🖼 رسانه",
            "lock_media"
          )
        ],
        [
          Markup.button.callback(
            "📁 فایل",
            "lock_files"
          )
        ],
        [
          Markup.button.callback(
            "🎭 استیکر",
            "lock_sticker"
          )
        ],
        [
          Markup.button.callback(
            "🎬 گیف",
            "lock_gif"
          )
        ],
        [
          Markup.button.callback(
            "📊 نظرسنجی",
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
// LOCK PLACEHOLDERS
// =====================================================

bot.action(
  [
    "lock_links",
    "lock_media",
    "lock_files",
    "lock_sticker",
    "lock_gif",
    "lock_poll"
  ],
  async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      "『𓆩 قفل 𓆪』\n\n" +
      "این بخش در نسخه بعدی فعال می‌شود. ⚙️",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            B.back,
            "panel_locks"
          )
        ]
      ])
    );
  }
);

// =====================================================
// MESSAGES
// =====================================================

bot.action(
  "panel_messages",
  async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
      "بخش موردنظر را انتخاب کن:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🧹 پاکسازی",
            "clean_messages"
          )
        ],
        [
          Markup.button.callback(
            "🚫 ضداسپم",
            "anti_spam"
          )
        ],
        [
          Markup.button.callback(
            "🔤 فیلتر کلمات",
            "word_filter"
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

bot.action(
  [
    "clean_messages",
    "anti_spam",
    "word_filter"
  ],
  async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
      "این بخش در نسخه بعدی فعال می‌شود. ⚙️",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            B.back,
            "panel_messages"
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
  "panel_warns",
  async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      "『𓆩 سیستم اخطار 𓆪』\n\n" +
      "مدیریت اخطارها:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "📋 لیست اخطارها",
            "warn_list"
          )
        ],
        [
          Markup.button.callback(
            "🗑 پاک کردن همه اخطارها",
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

// =====================================================
// WARN LIST
// ============================================
