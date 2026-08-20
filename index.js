const { Telegraf, Markup } = require("telegraf");
const http = require("http");

// =====================================================
// CONFIG
// =====================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN پیدا نشد!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// =====================================================
// RENDER SERVER
// =====================================================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is ONLINE ✅");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// =====================================================
// GROUP DATA
// =====================================================

const groups = new Map();

function getGroup(chatId) {
  if (!groups.has(chatId)) {
    groups.set(chatId, {
      warns: new Map()
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
// ADMIN
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

function isAdmin(role) {
  return (
    role === "administrator" ||
    role === "creator"
  );
}

async function checkAdmin(ctx) {

  if (!isGroup(ctx)) {
    return {
      ok: false,
      text: "❌ این بخش فقط داخل گروه قابل استفاده است."
    };
  }

  if (!ctx.from) {
    return {
      ok: false,
      text: "❌ کاربر شناسایی نشد."
    };
  }

  const role =
    await getRole(ctx, ctx.from.id);

  if (!isAdmin(role)) {
    return {
      ok: false,
      text:
        "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
        "❌ فقط مدیران و مالک گروه دسترسی دارند."
    };
  }

  return {
    ok: true,
    role
  };
}

// =====================================================
// PANEL OWNER CHECK
// =====================================================

function panelButton(action, userId) {
  return Markup.button.callback(
    action.text,
    `${action.id}:${userId}`
  );
}

function getPanelOwner(ctx) {

  const data =
    ctx.callbackQuery?.data || "";

  const parts = data.split(":");

  if (parts.length < 2) {
    return null;
  }

  const id =
    Number(parts[parts.length - 1]);

  return Number.isFinite(id) ? id : null;
}

function isPanelOwner(ctx) {

  const owner =
    getPanelOwner(ctx);

  return (
    owner !== null &&
    ctx.from &&
    Number(ctx.from.id) === Number(owner)
  );
}

// =====================================================
// MAIN PANEL
// =====================================================

function mainPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        {
          text: "『𓆩 مدیریت کاربران 𓆪",
          id: "users"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 قفل‌های گروه 𓆪",
          id: "locks"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 مدیریت پیام‌ها 𓆪",
          id: "messages"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 سیستم اخطار 𓆪",
          id: "warns"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 ورود و خروج 𓆪",
          id: "welcome"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 قوانین گروه 𓆪",
          id: "rules"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 آمار گروه 𓆪",
          id: "stats"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 تنظیمات 𓆪",
          id: "settings"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 بستن پنل ✖️ 𓆪",
          id: "close"
        },
        ownerId
      )
    ]

  ]);
}

function panelText() {

  return (
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "مدیر عزیز، بخش موردنظر را انتخاب کن 👇"
  );
}

// =====================================================
// OPEN PANEL
// =====================================================

async function sendPanel(ctx) {

  const access =
    await checkAdmin(ctx);

  if (!access.ok) {

    return ctx.reply(
      access.text
    );
  }

  try {

    await ctx.reply(
      panelText(),
      mainPanel(ctx.from.id)
    );

    console.log(
      `✅ PANEL OPENED BY ${ctx.from.id}`
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

bot.hears(
  /^پنل$/u,
  async (ctx) => {
    await sendPanel(ctx);
  }
);

// =====================================================
// HELP COMMAND
// =====================================================

bot.hears(
  /^راهنما$/u,
  async (ctx) => {

    const access =
      await checkAdmin(ctx);

    if (!access.ok) {
      return ctx.reply(access.text);
    }

    await ctx.reply(

      "『𓆩 راهنما 𓆪』\n\n" +

      "ربات مدیریت گروه برای مدیران و مالک است.\n\n" +

      "دستورهای فعلی:\n\n" +

      "• پنل\n" +
      "• راهنما\n\n" +

      "برای مدیریت یک کاربر، روی پیام همان کاربر ریپلای کن و دستور موردنظر را بفرست.\n\n" +

      "مثال:\n" +
      "بن\n" +
      "میوت\n" +
      "اخطار\n" +
      "اطلاعات",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            `『𓆩 بازگشت 𓆪`,
            `back:${ctx.from.id}`
          )
        ],

        [
          Markup.button.callback(
            `『𓆩 بستن ✖️ 𓆪`,
            `close:${ctx.from.id}`
          )
        ]

      ])
    );
  }
);

// =====================================================
// PANEL ACCESS MIDDLEWARE
// =====================================================

async function protectPanel(ctx) {

  if (!isPanelOwner(ctx)) {

    try {
      await ctx.answerCbQuery(
        "❌ این پنل برای مدیر دیگری است."
      );
    } catch {}

    return false;
  }

  const access =
    await checkAdmin(ctx);

  if (!access.ok) {

    try {
      await ctx.answerCbQuery(
        "❌ دسترسی ندارید."
      );
    } catch {}

    return false;
  }

  return true;
}

// =====================================================
// BACK TO PANEL
// =====================================================

bot.action(
  /^back:(\d+)$/,
  async (ctx) => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    try {

      await ctx.editMessageText(
        panelText(),
        mainPanel(ctx.from.id)
      );

    } catch (error) {

      console.error(
        "❌ BACK ERROR:",
        error.message
      );
    }
  }
);

// =====================================================
// USERS PANEL
// =====================================================

function usersPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        {
          text: "『𓆩 بن 𓆪",
          id: "ban"
        },
        ownerId
      ),
      panelButton(
        {
          text: "『𓆩 آن‌بن 𓆪",
          id: "unban"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 میوت 𓆪",
          id: "mute"
        },
        ownerId
      ),
      panelButton(
        {
          text: "『𓆩 آن‌میوت 𓆪",
          id: "unmute"
        },
        ownerId
      )
    ],

    [
      panelButton(
        {
          text: "『𓆩 اخطار 𓆪",
          id: "warn"
        },
        ownerId
      ),
      panelButton(
        {
          text: "『𓆩 اطلاعات کاربر 𓆪",
          id: "userinfo"
        },
        ownerId
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 بازگشت 𓆪",
        `back:${ownerId}`
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 بستن پنل ✖️ 𓆪",
        `close:${ownerId}`
      )
    ]

  ]);
}

// =====================================================
// USERS BUTTON
// =====================================================

bot.action(
  /^users:(\d+)$/,
  async (ctx) => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(

      "『𓆩 مدیریت کاربران 𓆪』\n\n" +

      "برای اجرای عملیات روی کاربر:\n\n" +

      "روی پیام کاربر ریپلای کن و دستور مربوطه را بفرست.\n\n" +

      "🔨 بن\n" +
      "🔓 آن‌بن\n" +
      "🔇 میوت\n" +
      "🔊 آن‌میوت\n" +
      "⚠️ اخطار\n" +
      "👤 اطلاعات",

      usersPanel(ctx.from.id)
    );
  }
);

// =====================================================
// USER PERMISSION
// =====================================================

async function checkTargetPermission(ctx, target) {

  const executorRole =
    await getRole(
      ctx,
      ctx.from.id
    );

  const targetRole =
    await getRole(
      ctx,
      target.id
    );

  if (!isAdmin(executorRole)) {

    return {
      ok: false,
      text:
        "❌ فقط مدیران و مالک می‌توانند این کار را انجام دهند."
    };
  }

  if (targetRole === "creator") {

    return {
      ok: false,
      text:
        "👑 مالک گروه قابل مدیریت نیست."
    };
  }

  if (
    targetRole === "administrator" &&
    executorRole !== "creator"
  ) {

    return {
      ok: false,
      text:
        "⚠️ مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند."
    };
  }

  return {
    ok: true,
    executorRole,
    targetRole
  };
}

// =====================================================
// BAN
// =====================================================

bot.hears(
  /^بن$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nبن"
      );
    }

    const permission =
      await checkTargetPermission(
        ctx,
        target
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

      await ctx.reply(
        "『𓆩 کاربر بن شد 𓆪』\n\n" +
        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}\n\n` +
        `👮 اجرا توسط: ${userName(ctx.from)}`
      );

    } catch (error) {

      console.error(
        "❌ BAN:",
        error.message
      );

      await ctx.reply(
        "❌ بن انجام نشد.\n\n" +
        "دسترسی Ban Users ربات را بررسی کن."
      );
    }
  }
);

// =====================================================
// UNBAN
// =====================================================

bot.hears(
  /^آن‌بن$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌بن"
      );
    }

    const permission =
      await checkTargetPermission(
        ctx,
        target
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
          only_if_banned: true
        }
      );

      await ctx.reply(
        "『𓆩 کاربر آن‌بن شد 𓆪』\n\n" +
        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}`
      );

    } catch (error) {

      console.error(
        "❌ UNBAN:",
        error.message
      );

      await ctx.reply(
        "❌ آن‌بن انجام نشد."
      );
    }
  }
);

// =====================================================
// MUTE
// =====================================================

bot.hears(
  /^میوت$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nمیوت"
      );
    }

    const permission =
      await checkTargetPermission(
        ctx,
        target
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

      await ctx.reply(
        "『𓆩 کاربر میوت شد 𓆪』\n\n" +
        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}`
      );

    } catch (error) {

      console.error(
        "❌ MUTE:",
        error.message
      );

      await ctx.reply(
        "❌ میوت انجام نشد.\n\n" +
        "دسترسی Restrict Members ربات را بررسی کن."
      );
    }
  }
);

// =====================================================
// UNMUTE
// =====================================================

bot.hears(
  /^آن‌میوت$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nآن‌میوت"
      );
    }

    const permission =
      await checkTargetPermission(
        ctx,
        target
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

      await ctx.reply(
        "『𓆩 کاربر آن‌میوت شد 𓆪』\n\n" +
        `👤 ${userName(target)}\n` +
        `🆔 ${target.id}`
      );

    } catch (error) {

      console.error(
        "❌ UNMUTE:",
        error.message
      );

      await ctx.reply(
        "❌ آن‌میوت انجام نشد."
      );
    }
  }
);

// =====================================================
// WARN
// =====================================================

bot.hears(
  /^اخطار$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاخطار"
      );
    }

    const permission =
      await checkTargetPermission(
        ctx,
        target
      );

    if (!permission.ok) {

      return ctx.reply(
        permission.text
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

    await ctx.reply(

      "『𓆩 اخطار ثبت شد ⚠️ 𓆪』\n\n" +

      `👤 ${userName(target)}\n` +
      `🆔 ${target.id}\n` +
      `⚠️ تعداد اخطار: ${newWarn}`

    );
  }
);

// =====================================================
// USER INFO
// =====================================================

bot.hears(
  /^اطلاعات$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {

      return ctx.reply(
        "❌ روی پیام کاربر ریپلای کن و بنویس:\n\nاطلاعات"
      );
    }

    const role =
      await getRole(
        ctx,
        target.id
      );

    let roleText = "کاربر";

    if (role === "creator") {
      roleText = "👑 مالک گروه";
    } else if (role === "administrator") {
      roleText = "🛡 مدیر گروه";
    }

    const group =
      getGroup(ctx.chat.id);

    const warns =
      group.warns.get(target.id) || 0;

    await ctx.reply(

      "『𓆩 اطلاعات کاربر 𓆪』\n\n" +

      `👤 نام: ${userName(target)}\n` +
      `🆔 آیدی: ${target.id}\n` +
      `🏷 وضعیت: ${roleText}\n` +
      `⚠️ اخطارها: ${warns}`

    );
  }
);

// =====================================================
// OTHER PANEL BUTTONS
// =====================================================

async function simplePanel(ctx, title, text) {

  if (!(await protectPanel(ctx))) {
    return;
  }

  try {
    await ctx.answerCbQuery();
  } catch {}

  await ctx.editMessageText(

    `『𓆩 ${title} 𓆪』\n\n${text}`,

    Markup.inlineKeyboard([

      [
        Markup.button.callback(
          "『𓆩 بازگشت 𓆪",
          `back:${ctx.from.id}`
        )
      ],

      [
        Markup.button.callback(
          "『𓆩 بستن پنل ✖️ 𓆪",
          `close:${ctx.from.id}`
        )
      ]

    ])
  );
}

bot.action(
  /^locks:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "قفل‌های گروه",
      "بخش قفل‌های گروه در مرحله بعد تکمیل می‌شود."
    );
  }
);

bot.action(
  /^messages:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "مدیریت پیام‌ها",
      "بخش مدیریت پیام‌ها در مرحله بعد تکمیل می‌شود."
    );
  }
);

bot.action(
  /^warns:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "سیستم اخطار",
      "سیستم اخطار فعال است.\n\nبرای اخطار روی پیام کاربر ریپلای کن و بنویس:\nاخطار"
    );
  }
);

bot.action(
  /^welcome:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "ورود و خروج",
      "تنظیمات ورود و خروج در مرحله بعد تکمیل می‌شود."
    );
  }
);

bot.action(
  /^rules:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "قوانین گروه",
      "بخش قوانین گروه در مرحله بعد تکمیل می‌شود."
    );
  }
);

bot.action(
  /^stats:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "آمار گروه",
      "آمار پیشرفته گروه را برای ربات ۲ می‌سازیم."
    );
  }
);

bot.action(
  /^settings:(\d+)$/,
  async (ctx) => {

    await simplePanel(
      ctx,
      "تنظیمات",
      "تنظیمات پیشرفته ربات در مرحله بعد تکمیل می‌شود."
    );
  }
);

// =====================================================
// BAN / MUTE BUTTON HELP
// =====================================================

async function operationHelp(ctx, title, command) {

  if (!(await protectPanel(ctx))) {
    return;
  }

  try {
    await ctx.answerCbQuery();
  } catch {}

  await ctx.editMessageText(

    `『𓆩 ${title} 𓆪』\n\n` +

    "برای انجام این کار:\n\n" +
    "روی پیام کاربر ریپلای کن و بنویس:\n\n" +
    command,

    Markup.inlineKeyboard([

      [
        Markup.button.callback(
          "『𓆩 مدیریت کاربران 𓆪",
          `users:${ctx.from.id}`
        )
      ],

      [
        Marku
