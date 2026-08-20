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

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is running ✅");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// =====================================================
// PANEL STORAGE
// =====================================================

// هر پنل:
// messageId -> ownerId
const activePanels = new Map();

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

function isAdminStatus(status) {
  return (
    status === "administrator" ||
    status === "creator"
  );
}

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
// GET ROLE
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
// PANEL ACCESS
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

  if (!isAdminStatus(role)) {

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
// PANEL KEYBOARD
// =====================================================

function panelKeyboard() {

  return Markup.inlineKeyboard([

    [
      Markup.button.callback(
        "👥 مدیریت کاربران",
        "panel_users"
      )
    ],

    [
      Markup.button.callback(
        "🔒 قفل‌های گروه",
        "panel_locks"
      )
    ],

    [
      Markup.button.callback(
        "⚠️ سیستم اخطار",
        "panel_warns"
      )
    ],

    [
      Markup.button.callback(
        "👋 ورود و خروج",
        "panel_welcome"
      )
    ],

    [
      Markup.button.callback(
        "📜 قوانین",
        "panel_rules"
      )
    ],

    [
      Markup.button.callback(
        "📊 آمار",
        "panel_stats"
      )
    ],

    [
      Markup.button.callback(
        "⚙️ تنظیمات",
        "panel_settings"
      )
    ],

    [
      Markup.button.callback(
        "❓ راهنما",
        "panel_help"
      )
    ],

    [
      Markup.button.callback(
        "✖️ بستن پنل",
        "close_panel"
      )
    ]

  ]);
}

// =====================================================
// HELP TEXT
// =====================================================

function helpText() {

  return (
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +

    "👥 مدیریت کاربران\n" +
    "🔒 قفل‌های گروه\n" +
    "⚠️ سیستم اخطار\n" +
    "👋 ورود و خروج\n" +
    "📜 قوانین\n" +
    "📊 آمار\n" +
    "⚙️ تنظیمات\n\n" +

    "🔐 فقط مدیران و مالک گروه اجازه استفاده از پنل را دارند."
  );
}

// =====================================================
// SAVE PANEL OWNER
// =====================================================

function savePanelOwner(chatId, messageId, userId) {

  activePanels.set(
    `${chatId}:${messageId}`,
    userId
  );

  console.log(
    `🔐 PANEL OWNER SAVED | chat=${chatId} | message=${messageId} | owner=${userId}`
  );
}

// =====================================================
// GET PANEL OWNER
// =====================================================

function getPanelOwner(ctx) {

  const chatId =
    ctx.callbackQuery?.message?.chat?.id;

  const messageId =
    ctx.callbackQuery?.message?.message_id;

  if (!chatId || !messageId) {
    return null;
  }

  return activePanels.get(
    `${chatId}:${messageId}`
  );
}

// =====================================================
// CHECK PANEL OWNER
// =====================================================

async function checkPanelOwner(ctx) {

  const ownerId =
    getPanelOwner(ctx);

  if (!ownerId) {

    try {

      await ctx.answerCbQuery(
        "❌ این پنل دیگر فعال نیست.",
        {
          show_alert: true
        }
      );

    } catch {}

    return false;
  }

  if (ctx.from.id !== ownerId) {

    try {

      await ctx.answerCbQuery(
        "❌ این پنل متعلق به شخص دیگری است.",
        {
          show_alert: true
        }
      );

    } catch {}

    console.log(
      `🚫 PANEL ACCESS DENIED | user=${ctx.from.id} | owner=${ownerId}`
    );

    return false;
  }

  return true;
}

// =====================================================
// OPEN PANEL
// =====================================================

bot.hears(
  /^پنل$/i,
  async (ctx) => {

    console.log(
      `🟢 PANEL REQUEST | user=${ctx.from?.id} | chat=${ctx.chat?.id}`
    );

    const access =
      await checkPanelAccess(ctx);

    if (!access.ok) {

      return ctx.reply(
        access.text,
        replyOptions(ctx)
      );
    }

    try {

      const sent =
        await ctx.reply(
          panelText(),
          {
            ...panelKeyboard(),
            ...replyOptions(ctx)
          }
        );

      // ثبت صاحب همین پنل
      savePanelOwner(
        ctx.chat.id,
        sent.message_id,
        ctx.from.id
      );

      console.log(
        `✅ PANEL CREATED | message=${sent.message_id} | owner=${ctx.from.id}`
      );

    } catch (error) {

      console.error(
        "❌ PANEL ERROR:",
        error.message
      );

    }
  }
);

// =====================================================
// HELP
// =====================================================

bot.hears(
  /^راهنما$/i,
  async (ctx) => {

    console.log(
      `🟢 HELP REQUEST | user=${ctx.from?.id} | chat=${ctx.chat?.id}`
    );

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
        helpText(),
        replyOptions(ctx)
      );

    } catch (error) {

      console.error(
        "❌ HELP ERROR:",
        error.message
      );

    }
  }
);

// =====================================================
// CLOSE PANEL
// =====================================================

bot.action(
  "close_panel",
  async (ctx) => {

    if (
      !(await checkPanelOwner(ctx))
    ) {
      return;
    }

    try {
      await ctx.answerCbQuery(
        "پنل بسته شد ✅"
      );
    } catch {}

    const chatId =
      ctx.callbackQuery.message.chat.id;

    const messageId =
      ctx.callbackQuery.message.message_id;

    activePanels.delete(
      `${chatId}:${messageId}`
    );

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
// PANEL SECTIONS
// =====================================================

bot.action(
  [
    "panel_users",
    "panel_locks",
    "panel_warns",
    "panel_welcome",
    "panel_rules",
    "panel_stats",
    "panel_settings",
    "panel_help"
  ],
  async (ctx) => {

    if (
      !(await checkPanelOwner(ctx))
    ) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const names = {

      panel_users:
        "👥 مدیریت کاربران",

      panel_locks:
        "🔒 قفل‌های گروه",

      panel_warns:
        "⚠️ سیستم اخطار",

      panel_welcome:
        "👋 ورود و خروج",

      panel_rules:
        "📜 قوانین",

      panel_stats:
        "📊 آمار",

      panel_settings:
        "⚙️ تنظیمات",

      panel_help:
        "❓ راهنما"
    };

    const section =
      names[
        ctx.callbackQuery.data
      ];

    await ctx.editMessageText(

      `『𓆩 ${section} 𓆪』\n\n` +
      "این بخش در مرحله بعدی فعال می‌شود.",

      Markup.inlineKeyboard([

        [
          Markup.button.callback(
            "↩️ بازگشت",
            "back_panel"
          )
        ],

        [
          Markup.button.callback(
            "✖️ بستن پنل",
            "close_panel"
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
  "back_panel",
  async (ctx) => {

    if (
      !(await checkPanelOwner(ctx))
    ) {
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
        "❌ BACK PANEL ERROR:",
        error.message
      );

    }
  }
);

// =====================================================
// DEBUG LOG
// =====================================================

bot.on(
  "message",
  async (ctx, next) => {

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
      ctx.message?.text || ""
    );

    return next();
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

bot.catch((error) => {

  console.error(
    "❌ BOT ERROR:",
    error
  );

});

// =====================================================
// START BOT
// =====================================================

(async () => {

  try {

    console.log(
      "🚀 Starting PulseGroupManager..."
    );

    await bot.launch();

    console.log(
      "🤖 BOT:",
      bot.botInfo?.username
    );

    console.log(
      "✅ PulseGroupManager started successfully"
    );

  } catch (error) {

    console.error(
      "❌ FAILED TO START:",
      error
    );

    process.exit(1);
  }

})();

// =====================================================
// SHUTDOWN
// =====================================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
