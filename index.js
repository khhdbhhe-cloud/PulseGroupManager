const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");
const http = require("http");

// =====================================================
// CONFIG
// =====================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN پیدا نشد.");
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

  res.end("PulseGroupManager ONLINE");
}).listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

// =====================================================
// DATABASE
// =====================================================

const DB_FILE = path.join(__dirname, "group-data.json");

let db = {
  groups: {}
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");

      if (data.trim()) {
        db = JSON.parse(data);
      }
    }
  } catch (error) {
    console.error("DB LOAD ERROR:", error.message);

    db = {
      groups: {}
    };
  }
}

function saveDB() {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(db, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("DB SAVE ERROR:", error.message);
  }
}

function defaultGroup() {
  return {
    warns: {},
    stats: {},
    panels: {},
    userPermissions: {},

    rules: "",

    welcome: {
      enabled: false,
      text: "خوش اومدی {name}"
    },

    goodbye: {
      enabled: false,
      text: "{name} از گروه خارج شد."
    },

    locks: {
      links: false,
      photos: false,
      videos: false,
      documents: false,
      voice: false,
      gif: false,
      sticker: false,
      forward: false,
      polls: false,
      mentions: false
    },

    settings: {
      antiFlood: false,
      autoWarn: false,
      timezone: "Asia/Tehran"
    }
  };
}

function getGroup(chatId) {
  const id = String(chatId);

  if (!db.groups[id]) {
    db.groups[id] = defaultGroup();
    saveDB();
  }

  return db.groups[id];
}

loadDB();

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

function nameOf(user) {
  if (!user) return "کاربر";

  const name = [
    user.first_name,
    user.last_name
  ]
    .filter(Boolean)
    .join(" ");

  return name || user.username || "کاربر";
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

function star(value) {
  return value ? "★" : "☆";
}

// =====================================================
// ROLE
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
      "getChatMember:",
      error.message
    );

    return "unknown";
  }
}

function isAdminRole(role) {
  return (
    role === "administrator" ||
    role === "creator"
  );
}

async function checkAdmin(ctx) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text: "این بخش فقط داخل گروه قابل استفاده است."
    };
  }

  if (!ctx.from) {
    return {
      ok: false,
      text: "کاربر شناسایی نشد."
    };
  }

  const role =
    await getRole(ctx, ctx.from.id);

  if (!isAdminRole(role)) {
    return {
      ok: false,
      text: "فقط مدیران گروه دسترسی دارند."
    };
  }

  return {
    ok: true,
    role
  };
}

// =====================================================
// TARGET CHECK
// =====================================================

async function checkTarget(ctx, target) {
  if (!target) {
    return {
      ok: false,
      text: "کاربر موردنظر پیدا نشد."
    };
  }

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

  if (!isAdminRole(executorRole)) {
    return {
      ok: false,
      text: "فقط مدیران می‌توانند این کار را انجام دهند."
    };
  }

  if (targetRole === "creator") {
    return {
      ok: false,
      text: "مالک گروه قابل مدیریت نیست."
    };
  }

  if (
    targetRole === "administrator" &&
    executorRole !== "creator"
  ) {
    return {
      ok: false,
      text: "مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند."
    };
  }

  return {
    ok: true,
    executorRole,
    targetRole
  };
}

// =====================================================
// USER STATS
// =====================================================

function getUserStats(chatId, userId) {
  const group = getGroup(chatId);
  const id = String(userId);

  if (!group.stats[id]) {
    group.stats[id] = {
      totalMessages: 0,
      todayMessages: 0,
      lastMessage: 0,
      firstSeen: Date.now()
    };
  }

  return group.stats[id];
}

function updateUserStats(ctx) {
  if (!isGroup(ctx) || !ctx.from) return;

  const stats =
    getUserStats(
      ctx.chat.id,
      ctx.from.id
    );

  const now = new Date();
  const last = new Date(
    stats.lastMessage || 0
  );

  if (
    now.toDateString() !==
    last.toDateString()
  ) {
    stats.todayMessages = 0;
  }

  stats.totalMessages++;
  stats.todayMessages++;
  stats.lastMessage = Date.now();

  saveDB();
}

// =====================================================
// PANEL BUTTON
// =====================================================

function panelButton(
  text,
  action,
  ownerId
) {
  return Markup.button.callback(
    text,
    `${action}:${ownerId}`
  );
}

// =====================================================
// MAIN PANEL
// =====================================================

function mainPanel(ownerId) {
  return Markup.inlineKeyboard([

    [
      panelButton(
        "مدیریت کاربران",
        "users",
        ownerId
      )
    ],

    [
      panelButton(
        "دسترسی‌های کاربر",
        "permissions",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل‌های گروه",
        "locks",
        ownerId
      )
    ],

    [
      panelButton(
        "مدیریت پیام‌ها",
        "messages",
        ownerId
      )
    ],

    [
      panelButton(
        "سیستم اخطار",
        "warns",
        ownerId
      )
    ],

    [
      panelButton(
        "ورود و خروج",
        "welcome",
        ownerId
      )
    ],

    [
      panelButton(
        "قوانین",
        "rules",
        ownerId
      )
    ],

    [
      panelButton(
        "آمار گروه",
        "stats",
        ownerId
      )
    ],

    [
      panelButton(
        "تنظیمات",
        "settings",
        ownerId
      )
    ],

    [
      panelButton(
        "راهنما",
        "help",
        ownerId
      )
    ],

    [
      panelButton(
        "بستن پنل",
        "close",
        ownerId
      )
    ]

  ]);
}

function panelText(target) {
  let text =
    "PulseGroupManager\n\n" +
    "پنل مدیریت گروه\n\n" +
    "بخش موردنظر را انتخاب کنید.";

  if (target) {
    text +=
      "\n\nکاربر انتخاب‌شده: " +
      nameOf(target) +
      "\nآیدی: " +
      target.id;
  }

  return text;
}

// =====================================================
// PANEL DATABASE
// =====================================================

function savePanel(
  chatId,
  messageId,
  ownerId,
  targetId = null
) {
  const group =
    getGroup(chatId);

  group.panels[String(messageId)] = {
    ownerId: Number(ownerId),
    targetId: targetId
      ? Number(targetId)
      : null,
    createdAt: Date.now()
  };

  saveDB();
}

function getPanel(
  chatId,
  messageId
) {
  const group =
    getGroup(chatId);

  return (
    group.panels[String(messageId)] ||
    null
  );
}

function deletePanel(
  chatId,
  messageId
) {
  const group =
    getGroup(chatId);

  delete group.panels[
    String(messageId)
  ];

  saveDB();
}

// =====================================================
// PANEL PROTECTION
// =====================================================

async function protectPanel(ctx) {
  if (
    !ctx.callbackQuery ||
    !ctx.callbackQuery.message
  ) {
    return false;
  }

  const messageId =
    ctx.callbackQuery.message.message_id;

  const panel =
    getPanel(
      ctx.chat.id,
      messageId
    );

  if (
    !panel ||
    !ctx.from ||
    Number(panel.ownerId) !==
      Number(ctx.from.id)
  ) {
    try {
      await ctx.answerCbQuery(
        "این پنل برای شما نیست.",
        {
          show_alert: true
        }
      );
    } catch {}

    return false;
  }

  const access =
    await checkAdmin(ctx);

  if (!access.ok) {
    try {
      await ctx.answerCbQuery(
        "دسترسی مدیریت ندارید.",
        {
          show_alert: true
        }
      );
    } catch {}

    return false;
  }

  return true;
}

// =====================================================
// OPEN PANEL
// =====================================================

async function openPanel(ctx) {
  const access =
    await checkAdmin(ctx);

  if (!access.ok) {
    return ctx.reply(access.text);
  }

  const target =
    getReplyUser(ctx);

  const message =
    await ctx.reply(
      panelText(target),
      mainPanel(ctx.from.id)
    );

  savePanel(
    ctx.chat.id,
    message.message_id,
    ctx.from.id,
    target
      ? target.id
      : null
  );

  // اگر پنل با ریپلای باز شده،
  // پیام پنل هم روی همان پیام کاربر ریپلای می‌شود.
  try {
    await ctx.telegram.editMessageReplyMarkup(
      ctx.chat.id,
      message.message_id,
      undefined,
      mainPanel(ctx.from.id).reply_markup
    );
  } catch {}

  console.log(
    "PANEL OPENED:",
    ctx.from.id
  );
}

// =====================================================
// PANEL COMMAND
// =====================================================

bot.hears(
  /^پنل$/u,
  async ctx => {
    await openPanel(ctx);
  }
);

// =====================================================
// UPDATE USER STATS
// =====================================================

bot.on(
  "message",
  async ctx => {
    if (!ctx.message) return;

    // دستورات مدیریتی را برای آمار هم حساب می‌کنیم.
    updateUserStats(ctx);
  }
);
