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

  if (!isAdmin(executor)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "❌ فقط مدیران و مالک گروه می‌توانند این دستور را اجرا کنند."
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
});// =====================================================
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
);// =====================================================
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
        `👮 مدیر: ${userName(ctx.from)}`,

        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ MUTE:",
        error.message
      );

      return ctx.reply(

        "❌ میوت کردن انجام نشد.\n\n" +
        "مطمئن شو ربات مدیر گروه است و دسترسی محدود کردن کاربران را دارد.",

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
          only_if_banned: true
        }
      );

      return ctx.reply(

        "『𓆩 کاربر آن‌بن شد 𓆪』\n\n" +

        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}\n\n` +
        `👮 مدیر: ${userName(ctx.from)}`,

        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ UNBAN:",
        error.message
      );

      return ctx.reply(

        "❌ آن‌بن کردن انجام نشد.",

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

        "『𓆩 کاربر آن‌میوت شد 𓆪』\n\n" +

        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}\n\n` +
        `👮 مدیر: ${userName(ctx.from)}`,

        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ UNMUTE:",
        error.message
      );

      return ctx.reply(

        "❌ آن‌میوت کردن انجام نشد.",

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

    const oldWarn =
      group.warns.get(target.id) || 0;

    const newWarn =
      oldWarn + 1;

    group.warns.set(
      target.id,
      newWarn
    );

    return ctx.reply(

      "『𓆩 اخطار ثبت شد ⚠️ 𓆪』\n\n" +

      `👤 ${userName(target)}\n` +
      `⚠️ تعداد اخطار: ${newWarn}\n\n` +
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

    const role =
      await getRole(
        ctx,
        target.id
      );

    const group =
      getGroup(ctx.chat.id);

    const warns =
      group.warns.get(target.id) || 0;

    return ctx.reply(

      "『𓆩 اطلاعات کاربر 𓆪』\n\n" +

      `👤 نام: ${userName(target)}\n` +
      `🆔 آیدی: ${target.id}\n` +
      `👮 وضعیت: ${role}\n` +
      `⚠️ اخطارها: ${warns}`,

      replyOptions(ctx)
    );
  }
);// =====================================================
// LOCKS PANEL
// =====================================================

bot.action(
  "panel_locks",
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

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 قفل‌های گروه 𓆪』\n\n" +
      "وضعیت قفل‌ها را انتخاب کنید:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            `🔗 لینک: ${group.locks.links ? "🔒" : "🔓"}`,
            "lock_links"
          )
        ],

        [
          Markup.button.callback(
            `🖼 رسانه: ${group.locks.media ? "🔒" : "🔓"}`,
            "lock_media"
          )
        ],

        [
          Markup.button.callback(
            `📁 فایل: ${group.locks.files ? "🔒" : "🔓"}`,
            "lock_files"
          )
        ],

        [
          Markup.button.callback(
            `🎭 استیکر: ${group.locks.sticker ? "🔒" : "🔓"}`,
            "lock_sticker"
          )
        ],

        [
          Markup.button.callback(
            `🎞 گیف: ${group.locks.gif ? "🔒" : "🔓"}`,
            "lock_gif"
          )
        ],

        [
          Markup.button.callback(
            `📊 نظرسنجی: ${group.locks.poll ? "🔒" : "🔓"}`,
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

    const keyMap = {
      lock_links: "links",
      lock_media: "media",
      lock_files: "files",
      lock_sticker: "sticker",
      lock_gif: "gif",
      lock_poll: "poll"
    };

    const key =
      keyMap[
        ctx.callbackQuery.data
      ];

    group.locks[key] =
      !group.locks[key];

    try {
      await ctx.answerCbQuery(
        group.locks[key]
          ? "🔒 قفل فعال شد"
          : "🔓 قفل غیرفعال شد"
      );
    } catch {}

    await ctx.editMessageText(

      "『𓆩 قفل‌های گروه 𓆪』\n\n" +
      "وضعیت قفل‌ها را انتخاب کنید:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            `🔗 لینک: ${group.locks.links ? "🔒" : "🔓"}`,
            "lock_links"
          )
        ],

        [
          Markup.button.callback(
            `🖼 رسانه: ${group.locks.media ? "🔒" : "🔓"}`,
            "lock_media"
          )
        ],

        [
          Markup.button.callback(
            `📁 فایل: ${group.locks.files ? "🔒" : "🔓"}`,
            "lock_files"
          )
        ],

        [
          Markup.button.callback(
            `🎭 استیکر: ${group.locks.sticker ? "🔒" : "🔓"}`,
            "lock_sticker"
          )
        ],

        [
          Markup.button.callback(
            `🎞 گیف: ${group.locks.gif ? "🔒" : "🔓"}`,
            "lock_gif"
          )
        ],

        [
          Markup.button.callback(
            `📊 نظرسنجی: ${group.locks.poll ? "🔒" : "🔓"}`,
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

    await ctx.editMessageText(

      "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
      "امکانات مدیریت پیام‌ها:",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🗑 حذف پیام",
            "delete_message_help"
          )
        ],

        [
          Markup.button.callback(
            "🚫 ضد اسپم",
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
// ANTI SPAM
// =====================================================

bot.action(
  "anti_spam",
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

    group.antiSpam =
      !group.antiSpam;

    try {
      await ctx.answerCbQuery(
        group.antiSpam
          ? "🛡 ضد اسپم فعال شد"
          : "🛡 ضد اسپم غیرفعال شد"
      );
    } catch {}

    await ctx.editMessageText(

      "『𓆩 مدیریت پیام‌ها 𓆪』\n\n" +
      `🛡 ضد اسپم: ${group.antiSpam ? "فعال ✅" : "غیرفعال ❌"}`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🛡 تغییر وضعیت ضد اسپم",
            "anti_spam"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel_messages"
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
// WORD FILTER
// =====================================================

bot.action(
  "word_filter",
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

    group.wordFilter =
      !group.wordFilter;

    try {
      await ctx.answerCbQuery(
        group.wordFilter
          ? "🔤 فیلتر کلمات فعال شد"
          : "🔤 فیلتر کلمات غیرفعال شد"
      );
    } catch {}

    await ctx.editMessageText(

      "『𓆩 فیلتر کلمات 𓆪』\n\n" +
      `وضعیت: ${group.wordFilter ? "فعال ✅" : "غیرفعال ❌"}\n\n` +
      "برای افزودن کلمات فیلترشده در نسخه بعدی می‌توانیم بخش مدیریت کلمات را اضافه کنیم.",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🔤 تغییر وضعیت",
            "word_filter"
          )
        ],

        [
          Markup.button.callback(
            B.back,
            "panel_messages"
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
// DELETE MESSAGE HELP
// =====================================================

bot.action(
  "delete_message_help",
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

      "『𓆩 حذف پیام 𓆪』\n\n" +
      "برای حذف یک پیام، روی پیام موردنظر ریپلای کن و بنویس:\n\n" +
      "حذف",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            B.back,
            "panel_messages"
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
// DELETE REPLIED MESSAGE
// =====================================================

bot.hears(
  /^حذف$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }

    const targetMessage =
      ctx.message?.reply_to_message;

    if (!targetMessage) {

      return ctx.reply(
        "❌ روی پیام موردنظر ریپلای کن و بنویس:\n\nحذف",
        replyOptions(ctx)
      );
    }

    try {

      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        targetMessage.message_id
      );

      try {

        await ctx.deleteMessage();

      } catch {}

    } catch (error) {

      console.error(
        "❌ DELETE:",
        error.message
      );

      return ctx.reply(
        "❌ حذف پیام انجام نشد.\n\nمطمئن شو ربات دسترسی حذف پیام‌ها را دارد.",
        replyOptions(ctx)
      );
    }
  }
);// =====================================================
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

    await ctx.editMessageText(

      "『𓆩 سیستم اخطار 𓆪』\n\n" +
      "برای دادن اخطار، روی پیام کاربر ریپلای کن و بنویس:\n\n" +
      "اخطار\n\n" +
      "⚠️ تعداد اخطارهای هر کاربر برای هر گروه جداگانه ثبت می‌شود.",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "⚠️ راهنمای اخطار",
            "warn_help"
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
// WARN HELP
// =====================================================

bot.action(
  "warn_help",
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

      "『𓆩 سیستم اخطار 𓆪』\n\n" +
      "👤 روی پیام کاربر ریپلای کن.\n\n" +
      "سپس بنویس:\n" +
      "اخطار\n\n" +
      "ربات تعداد اخطارهای آن کاربر را ثبت می‌کند.",

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
// WELCOME PANEL
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

    const group =
      getGroup(ctx.chat.id);

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 ورود و خروج 𓆪』\n\n" +
      `👋 خوش‌آمدگویی: ${group.welcome ? "فعال ✅" : "غیرفعال ❌"}\n` +
      `🚪 پیام خروج: ${group.goodbye ? "فعال ✅" : "غیرفعال ❌"}`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            `👋 خوش‌آمدگویی ${group.welcome ? "🔒" : "🔓"}`,
            "toggle_welcome"
          )
        ],

        [
          Markup.button.callback(
            `🚪 پیام خروج ${group.goodbye ? "🔒" : "🔓"}`,
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
// TOGGLE WELCOME
// =====================================================

bot.action(
  "toggle_welcome",
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

    group.welcome =
      !group.welcome;

    try {
      await ctx.answerCbQuery(
        group.welcome
          ? "👋 خوش‌آمدگویی فعال شد"
          : "👋 خوش‌آمدگویی غیرفعال شد"
      );
    } catch {}

    await ctx.editMessageText(

      "『𓆩 ورود و خروج 𓆪』\n\n" +
      `👋 خوش‌آمدگویی: ${group.welcome ? "فعال ✅" : "غیرفعال ❌"}\n` +
      `🚪 پیام خروج: ${group.goodbye ? "فعال ✅" : "غیرفعال ❌"}`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            `👋 خوش‌آمدگویی ${group.welcome ? "🔒" : "🔓"}`,
            "toggle_welcome"
          )
        ],

        [
          Markup.button.callback(
            `🚪 پیام خروج ${group.goodbye ? "🔒" : "🔓"}`,
            "toggle_goodbye"
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
// TOGGLE GOODBYE
// =====================================================

bot.action(
  "toggle_goodbye",
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

    group.goodbye =
      !group.goodbye;

    try {
      await ctx.answerCbQuery(
        group.goodbye
          ? "🚪 پیام خروج فعال شد"
          : "🚪 پیام خروج غیرفعال شد"
      );
    } catch {}

    await ctx.editMessageText(

      "『𓆩 ورود و خروج 𓆪』\n\n" +
      `👋 خوش‌آمدگویی: ${group.welcome ? "فعال ✅" : "غیرفعال ❌"}\n` +
      `🚪 پیام خروج: ${group.goodbye ? "فعال ✅" : "غیرفعال ❌"}`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            `👋 خوش‌آمدگویی ${group.welcome ? "🔒" : "🔓"}`,
            "toggle_welcome"
          )
        ],

        [
          Markup.button.callback(
            `🚪 پیام خروج ${group.goodbye ? "🔒" : "🔓"}`,
            "toggle_goodbye"
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
// NEW MEMBER WELCOME
// =====================================================

bot.on(
  "new_chat_members",
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    if (!group.welcome) {
      return;
    }

    for (
      const member of ctx.message.new_chat_members
    ) {

      try {

        await ctx.reply(

          "『𓆩 خوش آمدید 🌹 𓆪』\n\n" +
          `👤 ${userName(member)}\n\n` +
          "به گروه خوش اومدی ❤️",

          replyOptions(ctx)
        );

      } catch (error) {

        console.error(
          "❌ WELCOME:",
          error.message
        );
      }
    }
  }
);

// =====================================================
// MEMBER LEFT
// =====================================================

bot.on(
  "left_chat_member",
  async (ctx) => {

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

    if (!member) {
      return;
    }

    try {

      await ctx.reply(

        "『𓆩 خروج کاربر 🚪 𓆪』\n\n" +
        `👤 ${userName(member)}\n\n` +
        "از گروه خارج شد.",

        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ GOODBYE:",
        error.message
      );
    }
  }
);// =====================================================
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

    const group =
      getGroup(ctx.chat.id);

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 قوانین گروه 𓆪』\n\n" +
      `${group.rules}\n\n` +
      "برای تغییر قوانین، از دستور زیر استفاده کن:\n\n" +
      "قوانین جدید متن قوانین",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "📜 نمایش قوانین",
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

    if (!isGroup(ctx)) {
      return;
    }

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

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

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
// SET RULES
// =====================================================

bot.hears(
  /^قوانین جدید (.+)$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }

    const rules =
      ctx.match[1].trim();

    if (!rules) {

      return ctx.reply(
        "❌ متن قوانین خالی است.",
        replyOptions(ctx)
      );
    }

    const group =
      getGroup(ctx.chat.id);

    group.rules =
      rules;

    return ctx.reply(

      "『𓆩 قوانین ذخیره شد 📜 𓆪』\n\n" +
      group.rules,

      replyOptions(ctx)
    );
  }
);

// =====================================================
// RULES COMMAND
// =====================================================

bot.command(
  "rules",
  async (ctx) => {

    if (!isGroup(ctx)) {

      return ctx.reply(
        "❌ قوانین فقط داخل گروه قابل نمایش است."
      );
    }

    const group =
      getGroup(ctx.chat.id);

    return ctx.reply(

      "『𓆩 قوانین گروه 𓆪』\n\n" +
      group.rules,

      replyOptions(ctx)
    );
  }
);

bot.hears(
  /^قوانین$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    return ctx.reply(

      "『𓆩 قوانین گروه 𓆪』\n\n" +
      group.rules,

      replyOptions(ctx)
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

    const group =
      getGroup(ctx.chat.id);

    let totalWarns = 0;

    for (
      const count of group.warns.values()
    ) {
      totalWarns += count;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 آمار گروه 𓆪』\n\n" +

      `⚠️ مجموع اخطارها: ${totalWarns}\n` +
      `👤 کاربران دارای اخطار: ${group.warns.size}\n\n` +

      `🔗 قفل لینک: ${group.locks.links ? "فعال 🔒" : "خاموش 🔓"}\n` +
      `🖼 قفل رسانه: ${group.locks.media ? "فعال 🔒" : "خاموش 🔓"}\n` +
      `📁 قفل فایل: ${group.locks.files ? "فعال 🔒" : "خاموش 🔓"}\n` +
      `🎭 قفل استیکر: ${group.locks.sticker ? "فعال 🔒" : "خاموش 🔓"}\n` +
      `🎞 قفل گیف: ${group.locks.gif ? "فعال 🔒" : "خاموش 🔓"}\n` +
      `📊 قفل نظرسنجی: ${group.locks.poll ? "فعال 🔒" : "خاموش 🔓"}\n\n` +

      `🛡 ضد اسپم: ${group.antiSpam ? "فعال ✅" : "خاموش ❌"}\n` +
      `🔤 فیلتر کلمات: ${group.wordFilter ? "فعال ✅" : "خاموش ❌"}\n\n` +

      `👋 خوش‌آمدگویی: ${group.welcome ? "فعال ✅" : "خاموش ❌"}\n` +
      `🚪 پیام خروج: ${group.goodbye ? "فعال ✅" : "خاموش ❌"}`,

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "🔄 بروزرسانی آمار",
            "panel_stats"
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
// SETTINGS USERS
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

    await ctx.editMessageText(

      "『𓆩 تنظیمات کاربران 𓆪』\n\n" +
      "مدیریت کاربران از بخش «مدیریت کاربران» پنل انجام می‌شود.",

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
// SETTINGS MESSAGES
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

    await ctx.editMessageText(

      "『𓆩 تنظیمات پیام‌ها 𓆪』\n\n" +
      "از این بخش می‌توانی مدیریت پیام‌ها و ضداسپم را کنترل کنی.",

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
);// =====================================================
// WELCOME / GOODBYE
// =====================================================

bot.on("new_chat_members", async (ctx) => {

  if (!isGroup(ctx)) {
    return;
  }

  const group = getGroup(ctx.chat.id);

  if (!group.welcome) {
    return;
  }

  for (const user of ctx.message.new_chat_members) {

    try {

      await ctx.reply(
        "『𓆩 خوش آمدید 𓆪』\n\n" +
        `👤 ${userName(user)}\n\n` +
        "به گروه خوش اومدی 🌹\n" +
        "امیدواریم کنارمون خوش بگذره ❤️",
        replyOptions(ctx)
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
// GOODBYE
// =====================================================

bot.on("left_chat_member", async (ctx) => {

  if (!isGroup(ctx)) {
    return;
  }

  const group = getGroup(ctx.chat.id);

  if (!group.goodbye) {
    return;
  }

  const user = ctx.message.left_chat_member;

  if (!user) {
    return;
  }

  try {

    await ctx.reply(
      "『𓆩 خروج از گروه 𓆪』\n\n" +
      `👤 ${userName(user)}\n\n` +
      "از گروه خارج شد. 👋",
      replyOptions(ctx)
    );

  } catch (error) {

    console.error(
      "❌ GOODBYE:",
      error.message
    );

  }
});

// =====================================================
// RULES
// =====================================================

bot.hears(
  /^قوانین$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const group = getGroup(ctx.chat.id);

    return ctx.reply(
      "『𓆩 قوانین گروه 𓆪』\n\n" +
      group.rules,
      replyOptions(ctx)
    );
  }
);

// =====================================================
// STATS
// =====================================================

bot.hears(
  /^آمار$/i,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return;
    }

    const group = getGroup(ctx.chat.id);

    let warnCount = 0;

    for (const count of group.warns.values()) {
      warnCount += count;
    }

    return ctx.reply(
      "『𓆩 آمار گروه 𓆪』\n\n" +
      `⚠️ مجموع اخطارها: ${warnCount}\n` +
      `👋 ورود خوش‌آمدگویی: ${group.welcome ? "فعال ✅" : "خاموش ❌"}\n` +
      `🚪 پیام خروج: ${group.goodbye ? "فعال ✅" : "خاموش ❌"}\n` +
      `🚫 ضداسپم: ${group.antiSpam ? "فعال ✅" : "خاموش ❌"}\n` +
      `🔎 فیلتر کلمات: ${group.wordFilter ? "فعال ✅" : "خاموش ❌"}`,
      replyOptions(ctx)
    );
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

bot.catch((error, ctx) => {

  console.error(
    "❌ BOT ERROR:",
    error.message
  );

});// =====================================================
// START BOT
// =====================================================

bot.launch()
  .then(() => {
    console.log("🤖 PulseGroupManager started successfully!");
  })
  .catch((error) => {
    console.error(
      "❌ BOT LAUNCH ERROR:",
      error.message
    );
  });

// =====================================================
// GRACEFUL STOP
// =====================================================

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});
