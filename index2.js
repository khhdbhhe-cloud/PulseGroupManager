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
// GROUP DATABASE
// =====================================================

const groups = new Map();

function getGroup(chatId) {
  if (!groups.has(chatId)) {
    groups.set(chatId, {
      warns: new Map(),

      rules:
        "هنوز قوانینی برای این گروه ثبت نشده است.",

      welcome: true,
      goodbye: true,

      locks: {
        links: false,
        media: false,
        files: false,
        sticker: false,
        gif: false,
        poll: false
      },

      antiSpam: false,
      wordFilter: false
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
    [
      user.first_name,
      user.last_name
    ]
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
  return (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) || null;
}

// =====================================================
// ROLE SYSTEM
// =====================================================

async function getRole(ctx, userId) {
  if (!isGroup(ctx)) {
    return "unknown";
  }

  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );

    return member.status;
  } catch (error) {
    console.error(
      "❌ getChatMember:",
      error.message
    );

    return "unknown";
  }
}

function isAdmin(role) {
  return (
    role === "administrator" ||
    role === "creator"
  );
}

async function checkPanelAccess(ctx) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text:
        "❌ پنل مدیریت فقط داخل گروه قابل استفاده است."
    };
  }

  if (!ctx.from) {
    return {
      ok: false,
      text:
        "❌ کاربر شناسایی نشد."
    };
  }

  const role = await getRole(
    ctx,
    ctx.from.id
  );

  if (!isAdmin(role)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "❌ فقط مدیران و مالک گروه به پنل دسترسی دارند."
    };
  }

  return {
    ok: true,
    role
  };
}

// =====================================================
// TARGET PERMISSION
// =====================================================

async function checkTargetPermission(ctx, targetId) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text:
        "❌ این دستور فقط داخل گروه قابل استفاده است."
    };
  }

  const executor = await getRole(
    ctx,
    ctx.from.id
  );

  const target = await getRole(
    ctx,
    targetId
  );

  if (!isAdmin(executor)) {
    return {
      ok: false,
      text:
        "❌ فقط مدیر و مالک می‌توانند این دستور را اجرا کنند."
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

  return {
    ok: true,
    executor,
    target
  };
}

// =====================================================
// BUTTONS
// =====================================================

const B = {
  users: "👤 مدیریت کاربران",
  locks: "🔒 قفل‌های گروه",
  messages: "💬 مدیریت پیام‌ها",
  warns: "⚠️ سیستم اخطار",
  welcome: "👋 ورود و خروج",
  rules: "📋 قوانین گروه",
  stats: "📊 آمار گروه",
  settings: "⚙️ تنظیمات",

  back: "↩️ بازگشت",
  close: "✖️ بستن پنل"
};

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

function panelText() {
  return (
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "👑 مدیر یا مالک عزیز،\n" +
    "بخش موردنظر را انتخاب کن:"
  );
}

// =====================================================
// SEND PANEL - REAL REPLY
// =====================================================

async function sendPanel(ctx) {
  console.log(
    "🟢 PANEL REQUEST:",
    ctx.message?.text,
    "USER:",
    ctx.from?.id
  );

  if (!isGroup(ctx)) {
    return ctx.reply(
      "❌ پنل فقط داخل گروه قابل استفاده است."
    );
  }

  const access =
    await checkPanelAccess(ctx);

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
        ...panelKeyboard(),
        reply_parameters: {
          message_id:
            ctx.message.message_id,
          allow_sending_without_reply:
            true
        }
      }
    );

    console.log(
      "✅ PANEL SENT AS REPLY"
    );

  } catch (error) {
    console.error(
      "❌ PANEL ERROR:",
      error.message
    );
  }
}

// =====================================================
// PANEL COMMAND
// =====================================================

bot.command("panel", async (ctx) => {
  return sendPanel(ctx);
});

bot.hears(/^پنل$/i, async (ctx) => {
  return sendPanel(ctx);
});

// =====================================================
// HELP
// =====================================================

bot.command("help", async (ctx) => {
  return sendHelp(ctx);
});

bot.hears(/^راهنما$/i, async (ctx) => {
  return sendHelp(ctx);
});

async function sendHelp(ctx) {
  return ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "📌 برای باز کردن پنل داخل گروه بنویس:\n\n" +
    "پنل\n\n" +
    "👤 مدیریت کاربر:\n" +
    "روی پیام کاربر ریپلای کن و یکی از این‌ها را بنویس:\n\n" +
    "• بن\n" +
    "• میوت\n" +
    "• آن‌بن\n" +
    "• آن‌میوت\n" +
    "• اخطار\n" +
    "• اطلاعات\n\n" +
    "🔐 پنل فقط برای مدیر و مالک است.",
    replyOptions(ctx)
  );
}

// =====================================================
// USER MANAGEMENT PANEL
// =====================================================

bot.action("panel_users", async (ctx) => {
  const access =
    await checkPanelAccess(ctx);

  if (!access.ok) {
    return ctx.answerCbQuery(
      "❌ دسترسی ندارید."
    ).catch(() => {});
  }

  await ctx.answerCbQuery().catch(() => {});

  return ctx.editMessageText(
    "『𓆩 مدیریت کاربران 𓆪』\n\n" +
    "برای مدیریت کاربر، روی پیام او ریپلای کن و دستور مربوطه را بنویس.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "🚫 بن",
          "help_ban"
        )
      ],
      [
        Markup.button.callback(
          "🔇 میوت",
          "help_mute"
        )
      ],
      [
        Markup.button.callback(
          "⚠️ اخطار",
          "help_warn"
        )
      ],
      [
        Markup.button.callback(
          "👤 اطلاعات",
          "help_info"
        )
      ],
      [
        Markup.button.callback(
          B.back,
          "panel_back"
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

// =====================================================
// USER COMMANDS
// =====================================================

bot.hears(/^بن$/i, async (ctx) => {
  return banUser(ctx);
});

bot.hears(/^میوت$/i, async (ctx) => {
  return muteUser(ctx);
});

bot.hears(/^آن‌بن$/i, async (ctx) => {
  return unbanUser(ctx);
});

bot.hears(/^آن‌میوت$/i, async (ctx) => {
  return unmuteUser(ctx);
});

bot.hears(/^اخطار$/i, async (ctx) => {
  return warnUser(ctx);
});

bot.hears(/^اطلاعات$/i, async (ctx) => {
  return userInfo(ctx);
});

// =====================================================
// BAN
// =====================================================

async function banUser(ctx) {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و بن بنویس.",
      replyOptions(ctx)
    );
  }

  const permission =
    await checkTargetPermission(
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

    return ctx.reply(
      "『𓆩 کاربر بن شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}\n` +
      `👮 توسط: ${userName(ctx.from)}`,
      replyOptions(ctx)
    );

  } catch (error) {
    console.error(
      "❌ BAN:",
      error.message
    );

    return ctx.reply(
      "❌ بن انجام نشد.\n\n" +
      "مطمئن شو ربات دسترسی Ban Users دارد.",
      replyOptions(ctx)
    );
  }
}

// =====================================================
// MUTE
// =====================================================

async function muteUser(ctx) {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و میوت بنویس.",
      replyOptions(ctx)
    );
  }

  const permission =
    await checkTargetPermission(
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
      `🆔 ${target.id}`,
      replyOptions(ctx)
    );

  } catch (error) {
    console.error(
      "❌ MUTE:",
      error.message
    );

    return ctx.reply(
      "❌ میوت انجام نشد.\n\n" +
      "مطمئن شو ربات دسترسی Restrict Users دارد.",
      replyOptions(ctx)
    );
  }
}

// =====================================================
// UNBAN
// =====================================================

async function unbanUser(ctx) {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و آن‌بن بنویس.",
      replyOptions(ctx)
    );
  }

  const permission =
    await checkTargetPermission(
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

    return ctx.reply(
      "『𓆩 آن‌بن انجام شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}`,
      replyOptions(ctx)
    );

  } catch (error) {
    console.error(
      "❌ UNBAN:",
      error.message
    );

    return ctx.reply(
      "❌ آن‌بن انجام نشد.",
      replyOptions(ctx)
    );
  }
}

// =====================================================
// UNMUTE
// =====================================================

async function unmuteUser(ctx) {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و آن‌میوت بنویس.",
      replyOptions(ctx)
    );
  }

  const permission =
    await checkTargetPermission(
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

    return ctx.reply(
      "『𓆩 آن‌میوت انجام شد 𓆪』\n\n" +
      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}`,
      replyOptions(ctx)
    );

  } catch (error) {
    console.error(
      "❌ UNMUTE:",
      error.message
    );

    return ctx.reply(
      "❌ آن‌میوت انجام نشد.",
      replyOptions(ctx)
    );
  }
}

// =====================================================
// WARN
// =====================================================

async function warnUser(ctx) {
  if (!isGroup(ctx)) return;

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و اخطار بنویس.",
      replyOptions(ctx)
    );
  }

  const permission =
    await checkTargetPermission(
      ctx,
      target.id
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text,
      replyOptions(ctx)
    );
  }

  const group =
    getGroup(ctx.chat.id);

  const count =
    (group.warns.get(target.id) || 0) + 1;

  group.warns.set(
    target.id,
    count
  );

  return ctx.reply(
    "『𓆩 اخطار ثبت شد 𓆪』\n\n" +
    `👤 ${userName(target)}\n` +
    `🆔 ${target.id}\n` +
    `⚠️ تعداد اخطار: ${count}`,
    replyOptions(ctx)
  );
}

// =====================================================
// USER INFO
// =====================================================

async function userInfo(ctx) {
  if (!isGroup(ctx)) return;

  const access =
    await checkPanelAccess(ctx);

  if (!access.ok) {
    return ctx.reply(
      access.text,
      replyOptions(ctx)
    );
  }

  const target = getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ روی پیام کاربر ریپلای کن و اطلاعات بنویس.",
      replyOptions(ctx)
    );
  }

  const role =
    await getRole(
      ctx,
      target.id
    );

  let roleText = "👤 عضو گروه";

  if (role === "creator") {
    roleText = "👑 مالک گروه";
  } else if (role === "administrator") {
    roleText = "🛡 مدیر گروه";
  } else if (role === "restricted") {
    roleText = "🔇 محدود شده";
  } else if (role === "left") {
    roleText = "🚪 خارج شده";
  } else if (role === "kicked") {
    roleText = "🚫 بن شده";
  }

  const group =
    getGroup(ctx.chat.id);

  const warns =
    group.warns.get(target.id) || 0;

  return ctx.reply(
    "『𓆩 اطلاعات کاربر 𓆪』\n\n" +
    `👤 نام: ${userName(target)}\n` +
    `🆔 آیدی: ${target.id}\n` +
    `🎭 وضعیت: ${roleText}\n` +
    `⚠️ اخطار: ${warns}`,
    replyOptions(ctx)
  );
}

// =====================================================
// LOCK PANEL
// =====================================================

bot.action("panel_locks", async (ctx) => {
  const access =
    await checkPanelAccess(ctx);

  if (!access.ok) {
    return ctx.answerCbQuery(
      "❌ دسترسی ندارید."
    ).catch(() => {});
  }

  await ctx.answerCbQuery().catch(() => {});

  const group =
    getGroup(ctx.chat.id);

  return showLocks(ctx, group);
});

function showLocks(ctx, group) {
  const icon = value =>
    value ? "🔴 روشن" : "🟢 خاموش";

  return ctx.editMessageText(
    "『𓆩 قفل‌های گروه 𓆪』\n\n" +
    `🔗 لینک: ${icon(group.locks.links)}\n` +
    `🖼 رسانه: ${icon(group.locks.media)}\n` +
    `📁 فایل: ${icon(group.locks.files)}\n` +
    `🎭 استیکر: ${icon(group.locks.sticker)}\n` +
    `🎬 گیف: ${icon(group.locks.gif)}\n` +
    `📊 نظرسنجی: ${icon(group.locks.poll)}`,
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
          "panel_back"
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
}

// =====================================================
// LOCK TOGGLE
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
  async ctx => {
    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      return ctx.answerCbQuery(
        "❌ دسترسی ندارید."
      ).catch(() => {});
    }

    const group =
      getGroup(ctx.chat.id);

    const map = {
      lock_links: "links",
      lock_media: "media",
      lock_files: "files",
      lock_sticker: "sticker",
      lock_gif: "gif",
      lock_poll: "poll"
    };

    const key =
      map[ctx.callbackQuery.data];

    group.locks[key] =
      !group.locks[key];

    await ctx.answerCbQuery(
      group.locks[key]
        ? "🔴 قفل فعال شد"
        : "🟢 قفل غیرفعال شد"
    ).catch(() => {});

    return showLocks(
      ctx,
      group
    );
  }
);

// =====================================================
// MESSAGE PANEL
// =====================================================

bot.action("panel_messages", async ctx => {
  const access =
    await checkPanelAccess(ctx);

  if (!access.ok) {
    return ctx.answerCbQuery(
      "❌ دسترسی ندارید."
    ).catch(() => {});
  }

  await ctx.answerCbQuery().catch(() => {});

  const group =
    getGroup(ctx.chat.id);

  return showMessages(
    ctx,
    group
  );
});

function showMessages(ctx, group) {
  return ctx.editMessageText(
    "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
    `🚫 ضداسپم: ${
      group.antiSpam
        ? "🔴 روشن"
        : "🟢 خاموش"
    }\n` +
    `🔤 فیلتر کلمات: ${
      group.wordFilter
        ? "🔴 روشن"
        : "🟢 خاموش"
    }`,
    Mark
