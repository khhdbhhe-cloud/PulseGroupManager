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
// DATA
// =====================================================

const panels = new Map();

function getPanel(chatId) {
  return panels.get(String(chatId));
}

function setPanel(chatId, userId) {
  panels.set(String(chatId), {
    ownerId: Number(userId),
    createdAt: Date.now()
  });
}

function deletePanel(chatId) {
  panels.delete(String(chatId));
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

function isPrivate(ctx) {
  return ctx.chat && ctx.chat.type === "private";
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
  return (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) || null;
}

// =====================================================
// ROLE
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

// =====================================================
// PANEL ACCESS
// =====================================================

async function checkAdmin(ctx) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text:
        "❌ این بخش فقط داخل گروه قابل استفاده است."
    };
  }

  if (!ctx.from) {
    return {
      ok: false,
      text: "❌ کاربر شناسایی نشد."
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
        "❌ فقط مدیران و مالک گروه اجازه استفاده از پنل را دارند."
    };
  }

  return {
    ok: true,
    role
  };
}

// =====================================================
// CHECK PANEL OWNER
// =====================================================

function isPanelOwner(ctx) {
  if (!isGroup(ctx) || !ctx.from) {
    return false;
  }

  const panel = getPanel(ctx.chat.id);

  if (!panel) {
    return false;
  }

  return (
    Number(panel.ownerId) ===
    Number(ctx.from.id)
  );
}

// =====================================================
// PANEL TEXT
// =====================================================

function panelText() {
  return (
    "『𓆩 PulseGroupManager 𓆪』\n\n" +
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "مدیر عزیز، بخش موردنظر را انتخاب کن 👇"
  );
}

// =====================================================
// MAIN PANEL
// =====================================================

function mainPanelKeyboard() {
  return Markup.inlineKeyboard([

    [
      Markup.button.callback(
        "『𓆩 مدیریت کاربران 𓆪』",
        "users"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 قفل‌های گروه 𓆪』",
        "locks"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 مدیریت پیام‌ها 𓆪』",
        "messages"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 سیستم اخطار 𓆪'",
        "warns"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 ورود و خروج 𓆪』",
        "welcome"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 قوانین گروه 𓆪』",
        "rules"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار گروه 𓆪』",
        "stats"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 تنظیمات 𓆪』",
        "settings"
      ),

      Markup.button.callback(
        "『𓆩 راهنما 𓆪』",
        "help"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 بستن پنل ✖️ 𓆪』",
        "close"
      )
    ]

  ]);
}

// =====================================================
// SEND PANEL
// =====================================================

async function sendPanel(ctx) {

  const access = await checkAdmin(ctx);

  if (!access.ok) {
    return ctx.reply(
      access.text,
      replyOptions(ctx)
    );
  }

  setPanel(
    ctx.chat.id,
    ctx.from.id
  );

  try {

    await ctx.reply(
      panelText(),
      {
        ...mainPanelKeyboard()
      }
    );

    console.log(
      `✅ Panel opened by ${ctx.from.id}`
    );

  } catch (error) {

    console.error(
      "❌ PANEL:",
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

    const access = await checkAdmin(ctx);

    if (!access.ok) {
      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }

    await ctx.reply(
      "『𓆩 راهنمای ربات 𓆪』\n\n" +
      "『𓆩 پنل مدیریت 𓆪』\n" +
      "باز کردن پنل اصلی\n\n" +

      "『𓆩 بن 𓆪』\n" +
      "روی پیام کاربر ریپلای کن و بنویس بن\n\n" +

      "『𓆩 میوت 𓆪』\n" +
      "روی پیام کاربر ریپلای کن و بنویس میوت\n\n" +

      "『𓆩 آمار گروه 𓆪』\n" +
      "نمایش آمار گروه\n\n" +

      "⚠️ کاربران عادی هیچ دسترسی مدیریتی ندارند.",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 بازگشت به پنل 𓆪』",
            "back"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 بستن 𓆪』",
            "close"
          )
        ]
      ])
    );
  }
);

// =====================================================
// PANEL ACCESS FOR BUTTONS
// =====================================================

async function checkButtonAccess(ctx) {

  const access = await checkAdmin(ctx);

  if (!access.ok) {

    try {
      await ctx.answerCbQuery(
        "❌ فقط مدیران و مالک دسترسی دارند."
      );
    } catch {}

    return false;
  }

  if (!isPanelOwner(ctx)) {

    try {
      await ctx.answerCbQuery(
        "❌ این پنل توسط مدیر دیگری باز شده است."
      );
    } catch {}

    return false;
  }

  return true;
}

// =====================================================
// BACK
// =====================================================

bot.action(
  "back",
  async (ctx) => {

    if (!(await checkButtonAccess(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      panelText(),
      mainPanelKeyboard()
    );
  }
);

// =====================================================
// CLOSE
// =====================================================

bot.action(
  "close",
  async (ctx) => {

    if (!(await checkButtonAccess(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery(
        "پنل بسته شد ✅"
      );
    } catch {}

    deletePanel(ctx.chat.id);

    try {
      await ctx.deleteMessage();
    } catch {

      try {
        await ctx.editMessageText(
          "『𓆩 پنل بسته شد ✖️ 𓆪』"
        );
      } catch {}
    }
  }
);

// =====================================================
// USERS
// =====================================================

bot.action(
  "users",
  async (ctx) => {

    if (!(await checkButtonAccess(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "『𓆩 مدیریت کاربران 𓆪』\n\n" +
      "روی پیام کاربر ریپلای کن و یکی از دستورات مدیریتی را بفرست.",
      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "『𓆩 بن 𓆪",
            "info_ban"
          ),
          Markup.button.callback(
            "『𓆩 میوت 𓆪",
            "info_mute"
          )
        ],

        [
          Markup.button.callback(
            "『𓆩 اخطار 𓆪",
            "info_warn"
          ),
          Markup.button.callback(
            "『𓆩 اطلاعات 𓆪",
            "info_user"
          )
        ],

        [
          Markup.button.callback(
            "『𓆩 بازگشت 𓆪",
            "back"
          )
        ]

      ])
    );
  }
);

// =====================================================
// OTHER PANELS
// =====================================================

const simplePanels = {
  locks: "『𓆩 قفل‌های گروه 𓆪』",
  messages: "『𓆩 مدیریت پیام‌ها 𓆪』",
  warns: "『𓆩 سیستم اخطار 𓆪』",
  welcome: "『𓆩 ورود و خروج 𓆪』",
  rules: "『𓆩 قوانین گروه 𓆪』",
  stats: "『𓆩 آمار گروه 𓆪』",
  settings: "『𓆩 تنظیمات 𓆪』",
  help: "『𓆩 راهنما 𓆪』"
};

for (const [action, title] of Object.entries(simplePanels)) {

  bot.action(
    action,
    async (ctx) => {

      if (!(await checkButtonAccess(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      await ctx.editMessageText(
        title +
        "\n\n" +
        "『𓆩 این بخش در مرحله بعد فعال می‌شود 𓆪』\n\n" +
        "ساختار اصلی آماده است.",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "『𓆩 بازگشت 𓆪",
              "back"
            )
          ],
          [
            Markup.button.callback(
              "『𓆩 بستن پنل ✖️ 𓆪",
              "close"
            )
          ]
        ])
      );
    }
  );
}

// =====================================================
// USER INFO BUTTONS
// =====================================================

bot.action(
  [
    "info_ban",
    "info_mute",
    "info_warn",
    "info_user"
  ],
  async (ctx) => {

    if (!(await checkButtonAccess(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const names = {
      info_ban: "بن",
      info_mute: "میوت",
      info_warn: "اخطار",
      info_user: "اطلاعات کاربر"
    };

    const name =
      names[ctx.callbackQuery.data];

    await ctx.editMessageText(
      `『𓆩 ${name} 𓆪』\n\n` +
      "روی پیام کاربر ریپلای کن و دستور مربوطه را ارسال کن.",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 بازگشت 𓆪",
            "users"
          )
        ]
      ])
    );
  }
);

// =====================================================
// BAN
// =====================================================

bot.hears(
  /^بن$/u,
  async (ctx) => {

    if (!isGroup(ctx)) return;

    const access = await checkAdmin(ctx);

    if (!access.ok) {
      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }

    const target = getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "❌ باید روی پیام کاربر ریپلای کنی و بنویسی:\n\nبن",
        replyOptions(ctx)
      );
    }

    const targetRole =
      await getRole(
        ctx,
        target.id
      );

    if (targetRole === "creator") {
      return ctx.reply(
        "👑 مالک گروه قابل بن کردن نیست.",
        replyOptions(ctx)
      );
    }

    if (
      targetRole === "administrator" &&
      access.role !== "creator"
    ) {
      return ctx.reply(
        "⚠️ مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند.",
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
        `🆔 ${target.id}`,
        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ BAN:",
        error.message
      );

      await ctx.reply(
        "❌ بن انجام نشد.\n\n" +
        "دسترسی Ban Users ربات را بررسی کن.",
        replyOptions(ctx)
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

    const access = await checkAdmin(ctx);

    if (!access.ok) {
      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }

    const target = getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "❌ باید روی پیام کاربر ریپلای کنی و بنویسی:\n\nمیوت",
        replyOptions(ctx)
      );
    }

    const targetRole =
      await getRole(
        ctx,
        target.id
      );

    if (targetRole === "creator") {
      return ctx.reply(
        "👑 مالک گروه قابل میوت نیست.",
        replyOptions(ctx)
      );
    }

    if (
      targetRole === "administrator" &&
      access.role !== "creator"
    ) {
      return ctx.reply(
        "⚠️ مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند.",
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

      await ctx.reply(
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

      await ctx.reply(
        "❌ میوت انجام نشد.\n\n" +
        "دسترسی Restrict Members ربات را بررسی کن.",
        replyOptions(ctx)
      );
    }
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

});

// =====================================================
// START
// =====================================================

bot.launch()
  .then(() => {

    console.log(
      "🤖 BOT:",
      process.env.BOT_USERNAME || "PulseGroupManagerBot"
    );

    console.log(
      "✅ PulseGroupManager started successfully"
    );

  })
  .catch((error) => {

    console.error(
      "❌ BOT START ERROR:",
      error.message
    );

    process.exit(1);
  });

// =====================================================
// GRACEFUL STOP
// =====================================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
