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
  users: "『𓆩 مدیریت کاربران 𓆪』",
  locks: "『𓆩 قفل‌های گروه 𓆪』",
  messages: "『𓆩 مدیریت پیام‌ها 𓆪』",
  warns: "『𓆩 سیستم اخطار 𓆪』",
  welcome: "『𓆩 ورود و خروج 𓆪』",
  rules: "『𓆩 قوانین گروه 𓆪』",
  stats: "『𓆩 آمار گروه 𓆪』",
  settings: "『𓆩 تنظیمات 𓆪』",
  back: "『𓆩 بازگشت 𓆪』",
  close: "『𓆩 بستن پنل ✖️ 𓆪』"
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
      goodbye: true,
      locks: {
        links: false,
        media: false,
        files: false,
        sticker: false,
        gif: false,
        poll: false
      }
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
    (ctx.chat.type === "group" ||
     ctx.chat.type === "supergroup")
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

function replyOptions(ctx) {
  if (!ctx.message) return {};

  return {
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true
    }
  };
}

function getReplyUser(ctx) {
  return ctx.message?.reply_to_message?.from || null;
}

// =====================================================
// ADMIN
// =====================================================

async function getRole(ctx, userId) {
  if (!isGroup(ctx)) return "unknown";

  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );

    return member.status;
  } catch (error) {
    console.error("❌ getChatMember:", error.message);
    return "unknown";
  }
}

function isAdmin(status) {
  return (
    status === "administrator" ||
    status === "creator"
  );
}

async function checkPanelAccess(ctx) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text: "❌ پنل مدیریت فقط داخل گروه قابل استفاده است."
    };
  }

  const role = await getRole(ctx, ctx.from.id);

  if (!isAdmin(role)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "❌ فقط مدیران و مالک گروه می‌توانند پنل را باز کنند."
    };
  }

  return {
    ok: true,
    role
  };
}

async function checkPermission(ctx, targetId) {
  const executor = await getRole(ctx, ctx.from.id);
  const target = await getRole(ctx, targetId);

  if (!isAdmin(executor)) {
    return {
      ok: false,
      text: "❌ فقط مدیران می‌توانند این کار را انجام دهند."
    };
  }

  if (target === "creator") {
    return {
      ok: false,
      text: "👑 مالک اصلی گروه قابل مدیریت نیست."
    };
  }

  if (
    target === "administrator" &&
    executor !== "creator"
  ) {
    return {
      ok: false,
      text: "⚠️ مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند."
    };
  }

  return {
    ok: true
  };
}

// =====================================================
// PANEL
// =====================================================

function panelText() {
  return (
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "مدیر عزیز، بخش موردنظر را انتخاب کن 👇"
  );
}

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
        "panel_settings"
      )
    ],
    [
      Markup.button.callback(
        B.close,
        "close_panel"
      )
    ]
  ]);
}

async function sendPanel(ctx) {
  console.log(
    "🟢 PANEL REQUEST:",
    ctx.message?.text,
    "| chat:",
    ctx.chat?.id,
    "| type:",
    ctx.chat?.type
  );

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❌ برای مدیریت گروه، دستور «پنل» را داخل خود گروه ارسال کن."
    );
  }

  const access = await checkPanelAccess(ctx);

  if (!access.ok) {
    return ctx.reply(
      access.text,
      replyOptions(ctx)
    );
  }

  try {
    await ctx.reply(
      panelText(),
      {
        ...panelKeyboard()
      }
    );

    console.log("✅ PANEL SENT");
  } catch (error) {
    console.error(
      "❌ PANEL ERROR:",
      error.message
    );
  }
}

// =====================================================
// TEXT COMMANDS
// =====================================================

bot.hears(/^پنل$/i, async (ctx) => {
  console.log("🟢 PANEL TEXT DETECTED");
  await sendPanel(ctx);
});

bot.hears(/^راهنما$/i, async (ctx) => {
  console.log("🟢 HELP TEXT DETECTED");

  await ctx.reply(
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "『𓆩 راهنما 𓆪』\n\n" +
    "🔹 پنل\n" +
    "باز کردن پنل مدیریت گروه\n\n" +
    "🔹 بن\n" +
    "روی پیام کاربر ریپلای کن و بنویس «بن»\n\n" +
    "🔹 میوت\n" +
    "روی پیام کاربر ریپلای کن و بنویس «میوت»\n\n" +
    "🔹 آن‌بن\n" +
    "روی پیام کاربر ریپلای کن و بنویس «آن‌بن»\n\n" +
    "🔹 آن‌میوت\n" +
    "روی پیام کاربر ریپلای کن و بنویس «آن‌میوت»\n\n" +
    "🔹 اخطار\n" +
    "روی پیام کاربر ریپلای کن و بنویس «اخطار»"
  );
});

// =====================================================
// BAN
// =====================================================

bot.hears(/^بن$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nبن",
      replyOptions(ctx)
    );
  }

  const permission = await checkPermission(
    ctx,
    target.id
  );

  if (!permission.ok) {
    return ctx.reply(
      permission.text,
      replyOptions(ctx)
    );
  }

  try {
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );

    await ctx.reply(
      "『𓆩 کاربر بن شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}\n\n` +
      `👮 مدیر: ${userName(ctx.from)}`,
      replyOptions(ctx)
    );
  } catch (error) {
    console.error("❌ BAN:", error.message);

    await ctx.reply(
      "❌ بن کردن انجام نشد.\n\n" +
      "مطمئن شو ربات ادمین گروه است و دسترسی Ban Users دارد.",
      replyOptions(ctx)
    );
  }
});

// =====================================================
// MUTE
// =====================================================

bot.hears(/^میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nمیوت",
      replyOptions(ctx)
    );
  }

  const permission = await checkPermission(
    ctx,
    target.id
  );

  if (!permission.ok) {
    return ctx.reply(
      permission.text,
      replyOptions(ctx)
    );
  }

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        permissions: {
          can_send_messages: false
        }
      }
    );

    await ctx.reply(
      "『𓆩 کاربر میوت شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}`,
      replyOptions(ctx)
    );
  } catch (error) {
    console.error("❌ MUTE:", error.message);

    await ctx.reply(
      "❌ میوت انجام نشد.\n\n" +
      "مطمئن شو ربات دسترسی محدود کردن کاربران را دارد.",
      replyOptions(ctx)
    );
  }
});

// =====================================================
// UNBAN
// =====================================================

bot.hears(/^آن‌بن$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌بن",
      replyOptions(ctx)
    );
  }

  const permission = await checkPermission(
    ctx,
    target.id
  );

  if (!permission.ok) {
    return ctx.reply(
      permission.text,
      replyOptions(ctx)
    );
  }

  try {
    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.id
    );

    await ctx.reply(
      "『𓆩 کاربر آن‌بن شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}`,
      replyOptions(ctx)
    );
  } catch (error) {
    console.error("❌ UNBAN:", error.message);

    await ctx.reply(
      "❌ آن‌بن انجام نشد.",
      replyOptions(ctx)
    );
  }
});

// =====================================================
// UNMUTE
// =====================================================

bot.hears(/^آن‌میوت$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌میوت",
      replyOptions(ctx)
    );
  }

  const permission = await checkPermission(
    ctx,
    target.id
  );

  if (!permission.ok) {
    return ctx.reply(
      permission.text,
      replyOptions(ctx)
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

    await ctx.reply(
      "『𓆩 کاربر آن‌میوت شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}`,
      replyOptions(ctx)
    );
  } catch (error) {
    console.error(
      "❌ UNMUTE:",
      error.message
    );

    await ctx.reply(
      "❌ آن‌میوت انجام نشد.",
      replyOptions(ctx)
    );
  }
});

// =====================================================
// WARN
// =====================================================

bot.hears(/^اخطار$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاخطار",
      replyOptions(ctx)
    );
  }

  const permission = await checkPermission(
    ctx,
    target.id
  );

  if (!permission.ok) {
    return ctx.reply(
      permission.text,
      replyOptions(ctx)
    );
  }

  const group = getGroup(ctx.chat.id);

  const oldWarn =
    group.warns.get(target.id) || 0;

  const newWarn = oldWarn + 1;

  group.warns.set(
    target.id,
    newWarn
  );

  await ctx.reply(
    "『𓆩 اخطار دریافت شد 𓆪』\n\n" +
    `👤 ${userName(target)}\n` +
    `⚠️ تعداد اخطار: ${newWarn}/3`,
    replyOptions(ctx)
  );

  if (newWarn >= 3) {
    try {
      await ctx.telegram.banChatMember(
        ctx.chat.id,
        target.id
      );

      group.warns.set(target.id, 0);

      await ctx.reply(
        `🚫 ${userName(target)} به دلیل دریافت ۳ اخطار بن شد.`
      );
    } catch (error) {
      console.error(
        "❌ AUTO BAN:",
        error.message
      );
    }
  }
});

// =====================================================
// PANEL BUTTONS
// =====================================================

bot.action("panel_users", async (ctx) => {
  await ctx.answerCbQuery();

  const access = await checkPanelAccess(ctx);

  if (!access.ok) {
    return ctx.answerCbQuery(
      "❌ فقط مدیران دسترسی دارند."
    );
  }

  await ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "برای مدیریت کاربر، روی پیام او ریپلای کن و دستور موردنظر را بفرست.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("『𓆩 بن 𓆪", "help_ban"),
        Markup.button.callback("『𓆩 میوت 𓆪", "help_mute")
      ],
      [
        Markup.button.callback("『𓆩 اخطار 𓆪", "help_warn")
      ],
      [
        Markup.button.callback(B.back, "back_panel")
      ],
      [
        Markup.button.callback(B.close, "close_panel")
      ]
    ])
  );
});

bot.action("help_ban", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 بن 𓆪』\n\n" +
    "روی پیام کاربر ریپلای کن و بنویس:\n\n" +
    "بن",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.back, "panel_users")
      ]
    ])
  );
});

bot.action("help_mute", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 میوت 𓆪』\n\n" +
    "روی پیام کاربر ریپلای کن و بنویس:\n\n" +
    "میوت",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.back, "panel_users")
      ]
    ])
  );
});

bot.action("help_warn", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "『𓆩 اخطار 𓆪』\n\n" +
    "روی پیام کاربر ریپلای کن و بنویس:\n\n" +
    "اخطار",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.back, "panel_users")
      ]
    ])
  );
});

// =====================================================
// SIMPLE PANEL SECTIONS
// =====================================================

const sections = {
  panel_locks: "『𓆩 قفل‌های گروه 𓆪』\n\nتنظیمات قفل‌های گروه در این بخش قرار می‌گیرد.",
  panel_messages: "『𓆩 مدیریت پیام‌ها 𓆪』\n\nمدیریت پیام‌های گروه در این بخش قرار می‌گیرد.",
  panel_warns: "『𓆩 سیستم اخطار 𓆪』\n\nسیستم اخطار فعال است.\nحداکثر اخطار: ۳",
  panel_welcome: "『𓆩 ورود و خروج 𓆪』\n\nخوش‌آمدگویی: فعال\nخروج: فعال",
  panel_rules: "『𓆩 قوانین گروه 𓆪』\n\nقوانین فعلی گروه را می‌توان از این بخش تنظیم کرد.",
  panel_stats: "『𓆩 آمار گروه 𓆪』\n\nآمار گروه در این بخش نمایش داده می‌شود.",
  panel_settings: "『𓆩 تنظیمات 𓆪』\n\nتنظیمات ربات در این بخش قرار می‌گیرد."
};

for (const [action, text] of Object.entries(sections)) {
  bot.action(action, async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    const access = await checkPanelAccess(ctx);

    if (!access.ok) {
      return;
    }

    await ctx.editMessageText(
      text,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            B.back,
            "back_panel"
          )
        ],
        [
          Markup.button.callback(
            B.close,
            "close_panel"
          )
        ]
      ])
    );
  });
}

// =====================================================
// BACK PANEL
// =====================================================

bot.action("back_panel", async (ctx) => {
  try {
    await ctx.answerCbQuery();
  } catch {}

  const access = await checkPanelAccess(ctx);

  if (!access.ok) {
    return;
  }

  await ctx.editMessageText(
    panelText(),
    panelKeyboard()
  );
});

// =====================================================
// CLOSE PANEL
// =====================================================

bot.action("close_panel", async (ctx) => {
  try {
    await ctx.answerCbQuery(
      "پنل بسته شد ✅"
    );
  } catch {}

  try {
    await ctx.deleteMessage();
  } catch {
    try {
      await ctx.editMessageText(
        "『𓆩 پنل بسته شد ✖️ 𓆪』"
      );
    } catch {}
  }
});

// =====================================================
// DEBUG
// =====================================================

bot.on("message", async (ctx, next) => {
  console.log(
    "📩 UPDATE:",
    ctx.updateType,
    "| chat:",
    ctx.chat?.id,
    "| type:",
    ctx.chat?.type,
    "| user:",
    ctx.from?.id,
    "| text:",
    JSON.stringify(ctx.message?.text || "")
  );

  return next();
});

// =====================================================
// ERRORS
// =====================================================

bot.catch((error, ctx) => {
  console.error(
    "❌ BOT ERROR:",
    error.message
  );
});

// =====================================================
// START
// =====================================================

(async () => {
  try {
    await bot.launch();

    const me = await bot.telegram.getMe();

    console.log(
      "🤖 BOT:",
      "@" + me.username
    );

    console.log(
      "✅ PulseGroupManager started successfully"
    );
  } catch (error) {
    console.error(
      "❌ BOT START ERROR:",
      error.message
    );
  }
})();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  server.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  server.close();
});
