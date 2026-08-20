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
  help: "『𓆩 راهنما 𓆪』",

  users: "『𓆩 مدیریت کاربران 𓆪』",
  locks: "『𓆩 قفل‌های گروه 𓆪』",
  messages: "『𓆩 مدیریت پیام‌ها 𓆪』",
  warns: "『𓆩 سیستم اخطار 𓆪』",
  welcome: "『𓆩 ورود و خروج 𓆪』",
  rules: "『𓆩 قوانین گروه 𓆪』",
  stats: "『𓆩 آمار گروه 𓆪』",
  settings: "『𓆩 تنظیمات 𓆪』",

  back: "『𓆩 بازگشت 𓆪』",
  closePanel: "『𓆩 بستن پنل ✖️ 𓆪』",
  closeHelp: "『𓆩 بستن راهنما ✖️ 𓆪』"
};

// =====================================================
// GROUP DATA
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
// BASIC HELPERS
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
  if (!user) {
    return "کاربر";
  }

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

// =====================================================
// REPLY OPTIONS
// =====================================================

function replyOptions(ctx) {
  if (!ctx.message) {
    return {};
  }

  return {
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true
    }
  };
}

// =====================================================
// GET USER ROLE
// =====================================================

async function getRole(ctx, userId) {
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

  } catch (error) {

    console.error(
      "❌ getChatMember:",
      error.message
    );

    return "unknown";
  }
}

// =====================================================
// ADMIN CHECK
// =====================================================

function isAdmin(status) {
  return (
    status === "administrator" ||
    status === "creator"
  );
}

// =====================================================
// CHECK PANEL ACCESS
// فقط مدیر و مالک
// =====================================================

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

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  if (!isAdmin(role)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "❌ پنل مدیریت فقط برای مدیران و مالک گروه است."
    };
  }

  return {
    ok: true,
    role
  };
}

// =====================================================
// CHECK USER MANAGEMENT PERMISSION
// مدیر و مالک فقط اعضای عادی را مدیریت کنند
// مالک دسترسی بالاتر دارد
// =====================================================

async function checkPermission(ctx, targetId) {

  if (!isGroup(ctx)) {
    return {
      ok: false,
      text:
        "❌ این دستور فقط داخل گروه قابل استفاده است."
    };
  }

  if (!ctx.from) {
    return {
      ok: false,
      text:
        "❌ کاربر شناسایی نشد."
    };
  }

  const executor =
    await getRole(
      ctx,
      ctx.from.id
    );

  const target =
    await getRole(
      ctx,
      targetId
    );

  // فقط مدیر و مالک
  if (!isAdmin(executor)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "❌ فقط مدیران و مالک گروه می‌توانند این دستور را اجرا کنند."
    };
  }

  // مالک گروه قابل مدیریت نیست
  if (target === "creator") {
    return {
      ok: false,
      text:
        "👑 مالک اصلی گروه قابل مدیریت نیست."
    };
  }

  // مدیر عادی نمی‌تواند مدیر دیگر را مدیریت کند
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
    ],

    [
      Markup.button.callback(
        B.closePanel,
        "close_panel"
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
    "مدیر عزیز، بخش موردنظر را انتخاب کنید: 👇"
  );
}

// =====================================================
// SEND PANEL
// پنل فقط برای مدیر و مالک
// و به پیام کاربر ریپلای می‌شود
// =====================================================

async function sendPanel(ctx) {

  console.log(
    "🟢 PANEL REQUEST:",
    ctx.message?.text
  );

  if (!isGroup(ctx)) {

    return ctx.reply(
      "❌ پنل مدیریت فقط داخل گروه قابل استفاده است."
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

    await ctx.telegram.sendMessage(
      ctx.chat.id,
      panelText(),
      {
        ...panelKeyboard(),
        ...replyOptions(ctx)
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

    try {

      await ctx.reply(
        "❌ خطا در نمایش پنل.",
        replyOptions(ctx)
      );

    } catch {}
  }
}

// =====================================================
// DEBUG
// =====================================================

bot.on("text", async (ctx, next) => {

  console.log(
    "📩 Received text:",
    JSON.stringify(
      ctx.message.text
    ),
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

  await ctx.reply(

    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "سلام 👋\n\n" +
    "ربات مدیریت گروه آماده است. 🤖\n\n" +
    "برای استفاده از پنل، ربات را داخل گروه مدیر کن.\n\n" +
    "سپس داخل گروه بنویس:\n\n" +
    "پنل",

    Markup.inlineKeyboard([

      [
        Markup.button.callback(
          B.panel,
          "private_panel"
        )
      ],

      [
        Markup.button.callback(
          B.help,
          "private_help"
        )
      ]

    ])
  );
});

// =====================================================
// PANEL COMMAND
// =====================================================

bot.command(
  "panel",
  async (ctx) => {
    return sendPanel(ctx);
  }
);

bot.hears(
  /^پنل$/i,
  async (ctx) => {
    return sendPanel(ctx);
  }
);

// =====================================================
// HELP
// =====================================================

async function sendHelp(ctx) {

  return ctx.reply(

    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +

    "👤 مدیریت کاربران:\n" +
    "روی پیام کاربر ریپلای کن و بنویس:\n\n" +

    "• بن\n" +
    "• میوت\n" +
    "• آن‌بن\n" +
    "• آن‌میوت\n" +
    "• اخطار\n" +
    "• اطلاعات\n\n" +

    "📌 دستورات:\n" +
    "• پنل\n" +
    "• /panel\n" +
    "• راهنما\n" +
    "• /help\n\n" +

    "⚙️ پنل و دستورات مدیریتی فقط برای مدیران و مالک گروه فعال هستند.",

    Markup.inlineKeyboard([

      [
        Markup.button.callback(
          B.back,
          "panel"
        )
      ],

      [
        Markup.button.callback(
          B.closeHelp,
          "close_help"
        )
      ]

    ])
  );
}

bot.command(
  "help",
  async (ctx) => {
    return sendHelp(ctx);
  }
);

bot.hears(
  /^راهنما$/i,
  async (ctx) => {
    return sendHelp(ctx);
  }
);

// =====================================================
// SETTINGS COMMAND
// =====================================================

async function sendSettings(ctx) {

  if (isGroup(ctx)) {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }
  }

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
      ],

      [
        Markup.button.callback(
          B.closePanel,
          "close_panel"
        )
      ]

    ])
  );
}

bot.command(
  "settings",
  async (ctx) => {
    return sendSettings(ctx);
  }
);

bot.hears(
  /^تنظیمات$/i,
  async (ctx) => {
    return sendSettings(ctx);
  }
);

// =====================================================
// CLOSE PANEL
// =====================================================

bot.action(
  "close_panel",
  async (ctx) => {

    try {
      await ctx.answerCbQuery(
        "پنل بسته شد ✅"
      );
    } catch {}

    try {

      await ctx.deleteMessage();

    } catch (error) {

      console.log(
        "⚠️ Delete panel:",
        error.message
      );

      try {

        await ctx.editMessageText(
          "『𓆩 پنل بسته شد ✖️ 𓆪』"
        );

      } catch {}
    }
  }
);

// =====================================================
// CLOSE HELP
// =====================================================

bot.action(
  "close_help",
  async (ctx) => {

    try {
      await ctx.answerCbQuery(
        "راهنما بسته شد ✅"
      );
    } catch {}

    try {

      await ctx.deleteMessage();

    } catch {

      try {

        await ctx.editMessageText(
          "『𓆩 راهنما بسته شد ✖️ 𓆪』"
        );

      } catch {}
    }
  }
);

// =====================================================
// PRIVATE PANEL
// =====================================================

bot.action(
  "private_panel",
  async (ctx) => {

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 پنل مدیریت 𓆪』\n\n" +
      "پنل مدیریت فقط داخل گروه و فقط برای مدیران و مالک گروه قابل استفاده است.\n\n" +
      "ربات را داخل گروه مدیر کن و سپس بنویس:\n\n" +
      "پنل",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.help,
            "private_help"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// PRIVATE HELP
// =====================================================

bot.action(
  "private_help",
  async (ctx) => {

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 راهنما 𓆪』\n\n" +
      "ربات را داخل گروه به عنوان مدیر اضافه کن.\n\n" +
      "بعد داخل گروه بنویس:\n\n" +
      "پنل\n\n" +
      "⚠️ کاربران عادی اجازه باز کردن پنل را ندارند.",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.closeHelp,
            "close_help"
          )
        ]

      ])
    );
  }
);

// =====================================================
// BACK TO PANEL
// =====================================================

bot.action(
  "panel",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}

      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    try {

      await ctx.editMessageText(
        panelText(),
        panelKeyboard()
      );

    } catch (error) {

      console.error(
        "❌ Back panel:",
        error.message
      );
    }
  }
);

// =====================================================
// USERS PANEL
// =====================================================

bot.action(
  "panel_users",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}

      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 مدیریت کاربران 𓆪』\n\n" +
      "برای مدیریت کاربر، روی پیام او ریپلای کن و دستور مربوطه را بفرست.",

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
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// USER ACTION BUTTONS
// =====================================================

bot.action(
  [
    "user_ban",
    "user_mute",
    "user_unban",
    "user_unmute",
    "user_warn",
    "user_info"
  ],
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}

      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const names = {

      user_ban: "بن",

      user_mute: "میوت",

      user_unban: "آن‌بن",

      user_unmute: "آن‌میوت",

      user_warn: "اخطار",

      user_info: "اطلاعات"
    };

    const command =
      names[
        ctx.callbackQuery.data
      ];

    await ctx.editMessageText(

      "『𓆩 " +
      command +
      " 𓆪』\n\n" +

      "روی پیام کاربر ریپلای کن و بنویس:\n\n" +

      command,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.back,
            "panel_users"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// BAN USER
// =====================================================

bot.hears(
  /^بن$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nبن",
        replyOptions(ctx)
      );
    }

    const permission =
      await checkPermission(
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
        `🆔 ${target.id}\n\n` +
        `👮 مدیر: ${userName(ctx.from)}`,

        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ BAN:",
        error.message
      );

      return ctx.reply(

        "❌ بن کردن انجام نشد.\n\n" +
        "مطمئن شو ربات مدیر گروه است و دسترسی Ban Users دارد.",

        replyOptions(ctx)
      );
    }
  }
);

// =====================================================
// MUTE USER
// =====================================================

bot.hears(
  /^میوت$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nمیوت",
        replyOptions(ctx)
      );
    }

    const permission =
      await checkPermission(
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
            c            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
          }
        }
      );

      return ctx.reply(
        "『𓆩 کاربر میوت شد 𓆪』\n\n" +
        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}\n\n` +
        `👮 مدیر: ${userName(ctx.from)}`,
        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ MUTE:",
        error.message
      );

      return ctx.reply(
        "❌ میوت انجام نشد.\n\n" +
        "مطمئن شو ربات مدیر گروه است و دسترسی Restrict Users دارد.",
        replyOptions(ctx)
      );
    }
  }
);

// =====================================================
// UNBAN USER
// =====================================================

bot.hears(
  /^آن‌بن$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌بن",
        replyOptions(ctx)
      );
    }

    const permission =
      await checkPermission(
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
        target.id,
        {
          only_if_banned: false
        }
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
);

// =====================================================
// UNMUTE USER
// =====================================================

bot.hears(
  /^آن‌میوت$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌میوت",
        replyOptions(ctx)
      );
    }

    const permission =
      await checkPermission(
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
);

// =====================================================
// WARN USER
// =====================================================

bot.hears(
  /^اخطار$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاخطار",
        replyOptions(ctx)
      );
    }

    const permission =
      await checkPermission(
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
      `👮 مدیر: ${userName(ctx.from)}`,
      replyOptions(ctx)
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
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاطلاعات",
        replyOptions(ctx)
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

    let role =
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
);// =====================================================
// LOCKS PANEL
// =====================================================

bot.action("panel_locks", async (ctx) => {

  const access = await checkPanelAccess(ctx);

  if (!access.ok) {
    try {
      await ctx.answerCbQuery("❌ فقط مدیر و مالک دسترسی دارند.");
    } catch {}
    return;
  }

  try {
    await ctx.answerCbQuery();
  } catch {}

  const group = getGroup(ctx.chat.id);

  const icon = (value) =>
    value ? "🔴 روشن" : "🟢 خاموش";

  return ctx.editMessageText(
    "『𓆩 قفل‌های گروه 𓆪』\n\n" +
    "وضعیت قفل‌ها:\n\n" +
    `🔗 لینک: ${icon(group.locks.links)}\n` +
    `🖼 رسانه: ${icon(group.locks.media)}\n` +
    `📁 فایل: ${icon(group.locks.files)}\n` +
    `🎭 استیکر: ${icon(group.locks.sticker)}\n` +
    `🎬 گیف: ${icon(group.locks.gif)}\n` +
    `📊 نظرسنجی: ${icon(group.locks.poll)}`,

    Markup.inlineKeyboard([

      [
        Markup.button.callback(
          "🔗 قفل لینک",
          "lock_links"
        )
      ],

      [
        Markup.button.callback(
          "🖼 قفل رسانه",
          "lock_media"
        )
      ],

      [
        Markup.button.callback(
          "📁 قفل فایل",
          "lock_files"
        )
      ],

      [
        Markup.button.callback(
          "🎭 قفل استیکر",
          "lock_sticker"
        )
      ],

      [
        Markup.button.callback(
          "🎬 قفل گیف",
          "lock_gif"
        )
      ],

      [
        Markup.button.callback(
          "📊 قفل نظرسنجی",
          "lock_poll"
        )
      ],

      [
        Markup.button.callback(
          B.back,
          "panel"
        )
      ],

      [
        Markup.button.callback(
          B.closePanel,
          "close_panel"
        )
      ]

    ])
  );
});

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
  async (ctx) => {

    const access = await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    const group = getGroup(ctx.chat.id);

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

    try {
      await ctx.answerCbQuery(
        group.locks[key]
          ? "🔴 قفل فعال شد"
          : "🟢 قفل غیرفعال شد"
      );
    } catch {}

    const icon = (value) =>
      value ? "🔴 روشن" : "🟢 خاموش";

    return ctx.editMessageText(

      "『𓆩 قفل‌های گروه 𓆪』\n\n" +
      "وضعیت قفل‌ها:\n\n" +

      `🔗 لینک: ${icon(group.locks.links)}\n` +
      `🖼 رسانه: ${icon(group.locks.media)}\n` +
      `📁 فایل: ${icon(group.locks.files)}\n` +
      `🎭 استیکر: ${icon(group.locks.sticker)}\n` +
      `🎬 گیف: ${icon(group.locks.gif)}\n` +
      `📊 نظرسنجی: ${icon(group.locks.poll)}`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🔗 قفل لینک",
            "lock_links"
          )
        ],

        [
          Markup.button.callback(
            "🖼 قفل رسانه",
            "lock_media"
          )
        ],

        [
          Markup.button.callback(
            "📁 قفل فایل",
            "lock_files"
          )
        ],

        [
          Markup.button.callback(
            "🎭 قفل استیکر",
            "lock_sticker"
          )
        ],

        [
          Markup.button.callback(
            "🎬 قفل گیف",
            "lock_gif"
          )
        ],

        [
          Markup.button.callback(
            "📊 قفل نظرسنجی",
            "lock_poll"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// MESSAGES PANEL
// =====================================================

bot.action(
  "panel_messages",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

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

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🚫 ضداسپم",
            "toggle_antispam"
          )
        ],

        [
          Markup.button.callback(
            "🔤 فیلتر کلمات",
            "toggle_wordfilter"
          )
        ],

        [
          Markup.button.callback(
            "🧹 پاکسازی",
            "clean_messages"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// MESSAGE SETTINGS
// =====================================================

bot.action(
  [
    "toggle_antispam",
    "toggle_wordfilter"
  ],
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    if (
      ctx.callbackQuery.data ===
      "toggle_antispam"
    ) {
      group.antiSpam =
        !group.antiSpam;
    }

    if (
      ctx.callbackQuery.data ===
      "toggle_wordfilter"
    ) {
      group.wordFilter =
        !group.wordFilter;
    }

    try {
      await ctx.answerCbQuery(
        "تغییرات ذخیره شد ✅"
      );
    } catch {}

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

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🚫 ضداسپم",
            "toggle_antispam"
          )
        ],

        [
          Markup.button.callback(
            "🔤 فیلتر کلمات",
            "toggle_wordfilter"
          )
        ],

        [
          Markup.button.callback(
            "🧹 پاکسازی",
            "clean_messages"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// CLEAN MESSAGES
// =====================================================

bot.action(
  "clean_messages",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery(
        "🧹 پاکسازی دستی فعلاً از طریق ریپلای انجام می‌شود."
      );
    } catch {}
  }
);

// =====================================================
// WARN PANEL
// =====================================================

bot.action(
  "panel_warns",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

      "『𓆩 سیستم اخطار 𓆪』\n\n" +
      "مدیریت سیستم اخطار:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "📋 لیست اخطارها",
            "warn_list"
          )
        ],

        [
          Markup.button.callback(
            "🗑 پاک کردن اخطارها",
            "warn_clear"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// WARN LIST
// =====================================================

bot.action(
  "warn_list",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    if (group.warns.size === 0) {

      return ctx.editMessageText(

        "『𓆩 لیست اخطارها 𓆪』\n\n" +
        "✅ هیچ اخطاری ثبت نشده است.",

        Markup.inlineKeyboard([

          [
            Markup.button.callback(
              B.back,
              "panel_warns"
            )
          ],

          [
            Markup.button.callback(
              B.closePanel,
              "close_panel"
            )
          ]

        ])
      );
    }

    let text =
      "『𓆩 لیست اخطارها 𓆪』\n\n";

    for (
      const [userId, count]
      of group.warns
    ) {

      text +=
        `👤 ${userId}\n` +
        `⚠️ اخطار: ${count}\n\n`;
    }

    return ctx.editMessageText(

      text,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.back,
            "panel_warns"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// CLEAR WARNS
// =====================================================

bot.action(
  "warn_clear",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    group.warns.clear();

    try {
      await ctx.answerCbQuery(
        "اخطارها پاک شدند ✅"
      );
    } catch {}

    return ctx.editMessageText(

      "『𓆩 سیستم اخطار 𓆪』\n\n" +
      "✅ تمام اخطارهای این گروه پاک شدند.",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);// =====================================================
// WELCOME / GOODBYE PANEL
// =====================================================

bot.action(
  "panel_welcome",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    return ctx.editMessageText(

      "『𓆩 ورود و خروج 𓆪』\n\n" +

      `👋 پیام ورود: ${
        group.welcome
          ? "🔴 روشن"
          : "🟢 خاموش"
      }\n` +

      `🚪 پیام خروج: ${
        group.goodbye
          ? "🔴 روشن"
          : "🟢 خاموش"
      }`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "👋 ورود",
            "toggle_welcome"
          )
        ],

        [
          Markup.button.callback(
            "🚪 خروج",
            "toggle_goodbye"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// TOGGLE WELCOME / GOODBYE
// =====================================================

bot.action(
  [
    "toggle_welcome",
    "toggle_goodbye"
  ],
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    if (
      ctx.callbackQuery.data ===
      "toggle_welcome"
    ) {
      group.welcome =
        !group.welcome;
    }

    if (
      ctx.callbackQuery.data ===
      "toggle_goodbye"
    ) {
      group.goodbye =
        !group.goodbye;
    }

    try {
      await ctx.answerCbQuery(
        "تغییرات ذخیره شد ✅"
      );
    } catch {}

    return ctx.editMessageText(

      "『𓆩 ورود و خروج 𓆪』\n\n" +

      `👋 پیام ورود: ${
        group.welcome
          ? "🔴 روشن"
          : "🟢 خاموش"
      }\n` +

      `🚪 پیام خروج: ${
        group.goodbye
          ? "🔴 روشن"
          : "🟢 خاموش"
      }`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "👋 ورود",
            "toggle_welcome"
          )
        ],

        [
          Markup.button.callback(
            "🚪 خروج",
            "toggle_goodbye"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// RULES PANEL
// =====================================================

bot.action(
  "panel_rules",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    return ctx.editMessageText(

      "『𓆩 قوانین گروه 𓆪』\n\n" +
      group.rules,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "📋 نمایش قوانین",
            "show_rules"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SHOW RULES
// =====================================================

bot.action(
  "show_rules",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    return ctx.editMessageText(

      "『𓆩 قوانین گروه 𓆪』\n\n" +
      group.rules,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.back,
            "panel_rules"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// STATS PANEL
// =====================================================

bot.action(
  "panel_stats",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    let memberCount =
      "نامشخص";

    try {

      memberCount =
        await ctx.telegram.getChatMemberCount(
          ctx.chat.id
        );

    } catch (error) {

      console.error(
        "❌ MEMBER COUNT:",
        error.message
      );
    }

    return ctx.editMessageText(

      "『𓆩 آمار گروه 𓆪』\n\n" +

      `👥 اعضای گروه: ${memberCount}\n` +

      `⚠️ کاربران دارای اخطار: ${
        group.warns.size
      }\n` +

      `🔗 قفل لینک: ${
        group.locks.links
          ? "روشن"
          : "خاموش"
      }\n` +

      `🚫 ضداسپم: ${
        group.antiSpam
          ? "روشن"
          : "خاموش"
      }\n\n` +

      "🤖 PulseGroupManager",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.back,
            "panel"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SETTINGS PANEL
// =====================================================

bot.action(
  "settings",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

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
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SETTINGS - USERS
// =====================================================

bot.action(
  "settings_users",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

      "『𓆩 تنظیمات کاربران 𓆪』\n\n" +
      "مدیریت کاربران گروه:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.users,
            "panel_users"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "settings"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SETTINGS - MESSAGES
// =====================================================

bot.action(
  "settings_messages",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

      "『𓆩 تنظیمات پیام‌ها 𓆪』\n\n" +
      "مدیریت ضداسپم و فیلتر پیام‌ها:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.messages,
            "panel_messages"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "settings"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SETTINGS - LOCKS
// =====================================================

bot.action(
  "settings_locks",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

      "『𓆩 تنظیمات قفل‌ها 𓆪』\n\n" +
      "مدیریت قفل‌های گروه:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.locks,
            "panel_locks"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "settings"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SETTINGS - WELCOME
// =====================================================

bot.action(
  "settings_welcome",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

      "『𓆩 تنظیمات ورود و خروج 𓆪』\n\n" +
      "مدیریت پیام‌های ورود و خروج:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.welcome,
            "panel_welcome"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "settings"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);

// =====================================================
// SETTINGS - RULES
// =====================================================

bot.action(
  "settings_rules",
  async (ctx) => {

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      try {
        await ctx.answerCbQuery(
          "❌ فقط مدیر و مالک دسترسی دارند."
        );
      } catch {}
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    return ctx.editMessageText(

      "『𓆩 تنظیمات قوانین 𓆪』\n\n" +
      "نمایش قوانین فعلی گروه:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.rules,
            "panel_rules"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "settings"
          )
        ],

        [
          Markup.button.callback(
            B.closePanel,
            "close_panel"
          )
        ]

      ])
    );
  }
);// =====================================================
// WELCOME NEW MEMBERS
// =====================================================

bot.on("new_chat_members", async (ctx) => {

  if (!isGroup(ctx)) {
    return;
  }

  const group =
    getGroup(ctx.chat.id);

  if (!group.welcome) {
    return;
  }

  for (const member of ctx.message.new_chat_members) {

    try {

      await ctx.reply(
        "『𓆩 خوش آمدید 𓆪』\n\n" +
        `👤 ${userName(member)}\n\n` +
        "به گروه خوش اومدی 🌹\n" +
        "امیدواریم کنارمون لحظات خوبی داشته باشی ❤️"
      );

    } catch (error) {

      console.error(
        "❌ WELCOME:",
        error.message
      );
    }
  }
});

// =====================================================
// GOODBYE MEMBERS
// =====================================================

bot.on("left_chat_member", async (ctx) => {

  if (!isGroup(ctx)) {
    return;
  }

  const group =
    getGroup(ctx.chat.id);

  if (!group.goodbye) {
    return;
  }

  const member =
    ctx.message.left_chat_member;

  try {

    await ctx.reply(
      "『𓆩 خروج از گروه 𓆪』\n\n" +
      `👤 ${userName(member)}\n\n` +
      "از گروه خارج شد. 👋"
    );

  } catch (error) {

    console.error(
      "❌ GOODBYE:",
      error.message
    );
  }
});

// =====================================================
// UNKNOWN TEXT COMMANDS
// =====================================================

bot.hears(
  /^پنل\s+/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {
      return;
    }

    return ctx.reply(
      "❌ دستور پنل صحیح نیست.\n\n" +
      "برای باز کردن پنل فقط بنویس:\n\n" +
      "پنل",
      replyOptions(ctx)
    );
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

bot.catch((error, ctx) => {

  console.error(
    "❌ BOT ERROR:",
    error
  );

  try {

    if (ctx && ctx.chat) {

      ctx.reply(
        "❌ یک خطای موقت در ربات رخ داد."
      ).catch(() => {});

    }

  } catch {}
});

// =====================================================
// LAUNCH BOT
// =====================================================

bot.launch({

  dropPendingUpdates: true

})
.then(() => {

  console.log(
    "🤖 PulseGroupManager is running!"
  );

  console.log(
    "🔐 Panel access: ADMIN + OWNER ONLY"
  );

})
.catch((error) => {

  console.error(
    "❌ BOT LAUNCH ERROR:",
    error
  );

});

// =====================================================
// SAFE SHUTDOWN
// =====================================================

process.once(
  "SIGINT",
  () => {
    bot.stop("SIGINT");
  }
);

process.once(
  "SIGTERM",
  () => {
    bot.stop("SIGTERM");
  }
);

// =====================================================
// END OF FILE
// =====================================================
