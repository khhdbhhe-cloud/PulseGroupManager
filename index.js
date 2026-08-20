const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// =====================================================
// PulseGroupManager
// =====================================================

// اطلاعات موقت گروه‌ها
const groups = new Map();

// پنل‌های باز شده
const panels = new Map();

// =====================================================
// Render Web Server
// =====================================================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// =====================================================
// متن دکمه‌ها
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

  admins: "『𓆩 دسترسی مدیران 𓆪』",

  back: "『𓆩 بازگشت 𓆪』"
};

// =====================================================
// دریافت تنظیمات گروه
// =====================================================

function getGroup(chatId) {
  if (!groups.has(chatId)) {
    groups.set(chatId, {
      owners: new Set(),

      admins: new Map(),

      warns: new Map(),

      locks: {
        links: false,
        files: false,
        media: false,
        gif: false,
        sticker: false
      },

      settings: {
        welcome: false,
        goodbye: false,
        antiSpam: false,
        filterWords: false,
        autoDelete: false
      }
    });
  }

  return groups.get(chatId);
}

// =====================================================
// تشخیص چت گروه
// =====================================================

function isGroup(ctx) {
  return (
    ctx.chat &&
    ["group", "supergroup"].includes(ctx.chat.type)
  );
}

// =====================================================
// اطلاعات عضو
// =====================================================

async function getMember(ctx, userId) {
  try {
    return await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );
  } catch (err) {
    return null;
  }
}

// =====================================================
// مالک واقعی گروه
// =====================================================

async function isRealOwner(ctx, userId) {
  if (!isGroup(ctx)) return false;

  const member = await getMember(ctx, userId);

  return member && member.status === "creator";
}

// =====================================================
// ادمین گروه
// =====================================================

async function isAdmin(ctx, userId) {
  if (!isGroup(ctx)) return false;

  const member = await getMember(ctx, userId);

  return (
    member &&
    ["creator", "administrator"].includes(member.status)
  );
}

// =====================================================
// مالک ربات
// =====================================================

async function isBotOwner(ctx, userId) {
  const group = getGroup(ctx.chat.id);

  if (await isRealOwner(ctx, userId)) {
    return true;
  }

  return group.owners.has(userId);
}

// =====================================================
// دسترسی مدیر
// =====================================================

function getAdminPermissions(ctx, userId) {
  const group = getGroup(ctx.chat.id);

  return (
    group.admins.get(userId) || {
      ban: false,
      mute: false,
      warn: false,
      locks: false,
      clean: false,
      rules: false,
      settings: false,
      panel: false
    }
  );
}

// =====================================================
// آیا مدیر اجازه دارد؟
// =====================================================

async function hasPermission(ctx, userId, permission) {
  if (await isRealOwner(ctx, userId)) {
    return true;
  }

  if (getGroup(ctx.chat.id).owners.has(userId)) {
    return true;
  }

  if (!(await isAdmin(ctx, userId))) {
    return false;
  }

  const permissions = getAdminPermissions(ctx, userId);

  return permissions[permission] === true;
}

// =====================================================
// پیام عدم دسترسی
// =====================================================

async function noAccess(ctx) {
  return ctx.reply(
    "『𓆩 دسترسی غیرمجاز 𓆪』\n\n" +
    "⛔ شما اجازه استفاده از این بخش را ندارید."
  );
}

// =====================================================
// کنترل مالک پنل
// =====================================================

async function checkPanelOwner(ctx, panelId) {
  const ownerId = panels.get(panelId);

  if (!ownerId) {
    return true;
  }

  if (ownerId === ctx.from.id) {
    return true;
  }

  await ctx.answerCbQuery(
    "⛔ این پنل برای مدیر دیگری باز شده است.",
    { show_alert: true }
  );

  return false;
}

// =====================================================
// ساخت پنل اختصاصی
// =====================================================

function createPanelId(chatId, messageId) {
  return `${chatId}:${messageId}`;
}

// =====================================================
// ارسال پنل
// =====================================================

async function sendPanel(ctx) {
  if (!isGroup(ctx)) {
    return ctx.reply(
      "『𓆩 پنل مدیریت 𓆪』\n\n" +
      "پنل مدیریت را می‌توانید داخل گروه استفاده کنید."
    );
  }

  if (!(await hasPermission(ctx, ctx.from.id, "panel"))) {
    return noAccess(ctx);
  }

  const message = await ctx.reply(
    "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
    "✯ این پنل مخصوص شماست.\n" +
    "از بخش موردنظر استفاده کنید.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(B.users, "panel_users")
      ],
      [
        Markup.button.callback(B.locks, "panel_locks")
      ],
      [
        Markup.button.callback(B.messages, "panel_messages")
      ],
      [
        Markup.button.callback(B.warns, "panel_warn")
      ],
      [
        Markup.button.callback(B.welcome, "panel_welcome")
      ],
      [
        Markup.button.callback(B.rules, "panel_rules")
      ],
      [
        Markup.button.callback(B.stats, "panel_stats")
      ],
      [
        Markup.button.callback(B.settings, "settings")
      ]
    ])
  );

  const panelId = createPanelId(
    ctx.chat.id,
    message.message_id
  );

  panels.set(panelId, ctx.from.id);
}

// =====================================================
// پنل فارسی
// =====================================================

bot.hears(/^پنل$/i, async (ctx) => {
  await sendPanel(ctx);
});

bot.command("panel", async (ctx) => {
  await sendPanel(ctx);
});

// =====================================================
// راهنما
// =====================================================

async function sendHelp(ctx) {
  const message = await ctx.reply(
    "『𓆩 راهنمای PulseGroupManager 𓆪』\n\n" +
    "بخش موردنظر را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 راهنمای مدیریت کاربران 𓆪』",
          "help_users"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای قفل‌ها 𓆩』",
          "help_locks"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای پیام‌ها 𓆪』",
          "help_messages"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای اخطار 𓆪』",
          "help_warn"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای ورود و خروج 𓆪』",
          "help_welcome"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 راهنمای تنظیمات 𓆪』",
          "help_settings"
        )
      ]
    ])
  );

  const panelId = createPanelId(
    ctx.chat.id,
    message.message_id
  );

  panels.set(panelId, ctx.from.id);
}

bot.hears(/^راهنما$/i, async (ctx) => {
  await sendHelp(ctx);
});

bot.command("help", async (ctx) => {
  await sendHelp(ctx);
});

// =====================================================
// تنظیمات
// =====================================================

async function sendSettings(ctx) {
  if (isGroup(ctx)) {
    if (!(await hasPermission(ctx, ctx.from.id, "settings"))) {
      return noAccess(ctx);
    }
  }

  const message = await ctx.reply(
    "『𓆩 تنظیمات گروه 𓆪』\n\n" +
    "بخش تنظیمات را انتخاب کنید:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "『𓆩 تنظیمات کاربران 𓆪』",
          "settings_users"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات پیام‌ها 𓆪』",
          "settings_messages"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات قفل‌ها 𓆪』",
          "settings_locks"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات ورود و خروج 𓆪』",
          "settings_welcome"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات قوانین 𓆪』",
          "settings_rules"
        )
      ],
      [
        Markup.button.callback(
          "『𓆩 تنظیمات امنیتی 𓆪』",
          "settings_security"
        )
      ],
      [
        Markup.button.callback(
          B.admins,
          "settings_admins"
        )
      ]
    ])
  );

  const panelId = createPanelId(
    ctx.chat.id,
    message.message_id
  );

  panels.set(panelId, ctx.from.id);
}

bot.hears(/^تنظیمات$/i, async (ctx) => {
  await sendSettings(ctx);
});

bot.command("settings", async (ctx) => {
  await sendSettings(ctx);
});

// =====================================================
// گرفتن کاربر هدف
// =====================================================

function getTargetId(ctx) {
  if (ctx.message && ctx.message.reply_to_message) {
    return ctx.message.reply_to_message.from.id;
  }

  const text = ctx.message?.text || "";

  const parts = text.trim().split(/\s+/);

  if (parts.length >= 2) {
    const id = Number(parts[1]);

    if (Number.isInteger(id)) {
      return id;
    }
  }

  return null;
}

// =====================================================
// نام کاربر
// =====================================================

function getUserName(user) {
  if (!user) return "کاربر";

  return (
    user.first_name ||
    user.username ||
    `کاربر ${user.id}`
  );
}

// =====================================================
// بررسی دسترسی ربات
// =====================================================

async function botHasPermission(ctx, permission) {
  try {
    const me = await ctx.telegram.getMe();

    const member = await getMember(ctx, me.id);

    if (!member || member.status !== "administrator") {
      return false;
    }

    const required = {
      ban: member.can_restrict_members,
      delete: member.can_delete_messages
    };

    return required[permission] === true;
  } catch (err) {
    return false;
  }
}

// =====================================================
// بن
// =====================================================

async function banUser(ctx) {
  if (!isGroup(ctx)) return;

  if (!(await hasPermission(ctx, ctx.from.id, "ban"))) {
    return noAccess(ctx);
  }

  const targetId = getTargetId(ctx);

  if (!targetId) {
    return ctx.reply(
      "『𓆩 بن کردن 𓆪』\n\n" +
      "برای بن کردن، روی پیام کاربر ریپلای کنید یا بنویسید:\n\n" +
      "بن 123456789"
    );
  }

  if (targetId === ctx.from.id) {
    return ctx.reply("⛔ نمی‌توانید خودتان را بن کنید.");
  }

  if (await isRealOwner(ctx, targetId)) {
    return ctx.reply("⛔ مالک اصلی گروه قابل بن کردن نیست.");
  }

  if (!(await botHasPermission(ctx, "ban"))) {
    return ctx.reply(
      "⛔ ربات مجوز بن کردن کاربران را ندارد."
    );
  }

  try {
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      targetId
    );

    return ctx.reply(
      "『𓆩 بن کاربر 𓆪』\n\n" +
      "✯ کاربر با موفقیت بن شد.\n" +
      `🆔 ID: ${targetId}`
    );
  } catch (err) {
    console.error(err);

    return ctx.reply(
      "⛔ انجام عملیات بن ناموفق بود."
    );
  }
}

// =====================================================
// میوت
// =====================================================

async function muteUser(ctx) {
  if (!isGroup(ctx)) return;

  if (!(await hasPermission(ctx, ctx.from.id, "mute"))) {
    return noAccess(ctx);
  }

  const targetId = getTargetId(ctx);

  if (!targetId) {
    return ctx.reply(
      "『𓆩 میوت کردن 𓆪』\n\n" +
      "روی پیام کاربر ریپلای کنید یا بنویسید:\n\n" +
      "میوت 123456789"
    );
  }

  if (await isRealOwner(ctx, targetId)) {
    return ctx.reply("⛔ مالک اصلی گروه قابل میوت نیست.");
  }

  if (!(await botHasPermission(ctx, "ban"))) {
    return ctx.reply(
      "⛔ ربات مجوز محدود کردن کاربران را ندارد."
    );
  }

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      targetId,
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
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        }
      }
    );

    return ctx.reply(
      "『𓆩 میوت کاربر 𓆪』\n\n" +
      "🔇 کاربر میوت شد."
    );
  } catch (err) {
    console.error(err);

    return ctx.reply(
      "⛔ انجام عملیات میوت ناموفق بود."
    );
  }
}

// =====================================================
// آن‌بن
// =====================================================

async function unbanUser(ctx) {
  if (!isGroup(ctx)) return;

  if (!(await hasPermission(ctx, ctx.from.id, "ban"))) {
    return noAccess(ctx);
  }

  const targetId = getTargetId(ctx);

  if (!targetId) {
    return ctx.reply(
      "روی پیام کاربر ریپلای کنید یا بنویسید:\n\n" +
      "آن‌بن 123456789"
    );
  }

  try {
    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      targetId,
      {
        only_if_banned: false
      }
    );

    return ctx.reply(
      "『𓆩 آن‌بن کاربر 𓆪』\n\n" +
      "✯ محدودیت بن کاربر برداشته شد."
    );
  } catch (err) {
    console.error(err);

    return ctx.reply(
      "⛔ انجام آن‌بن ناموفق بود."
    );
  }
}

// =====================================================
// آن‌میوت
// =====================================================

async function unmuteUser(ctx) {
  if (!isGroup(ctx)) return;

  if (!(await hasPermission(ctx, ctx.from.id, "mute"))) {
    return noAccess(ctx);
  }

  const targetId = getTargetId(ctx);

  if (!targetId) {
    return ctx.reply(
      "روی پیام کاربر ریپلای کنید یا بنویسید:\n\n" +
      "آن‌میوت 123456789"
    );
  }

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      targetId,
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
          can_change_info: false,
          can_invite_users: true,
          can_pin_messages: false
        }
      }
    );

    return ctx.reply(
      "『𓆩 آن‌میوت کاربر 𓆪』\n\n" +
      "✯ محدودیت ارسال پیام برداشته شد."
    );
  } catch (err) {
    console.error(err);

    return ctx.reply(
      "⛔ انجام آن‌میوت ناموفق بود."
    );
  }
}

// =====================================================
// اخطار
// =====================================================

async function warnUser(ctx) {
  if (!isGroup(ctx)) return;

  if (!(await hasPermission(ctx, ctx.from.id, "warn"))) {
    return noAccess(ctx);
  }

  const targetId = getTargetId(ctx);

  if (!targetId) {
    return ctx.reply(
      "روی پیام کاربر ریپلای کنید یا بنویسید:\n\n" +
      "اخطار 123456789"
    );
  }

  const group = getGroup(ctx.chat.id);

  const count =
    (group.warns.get(targetId) || 0) + 1;

  group.warns.set(targetId, count);

  return ctx.reply(
    "『𓆩 اخطار کاربر 𓆪』\n\n" +
    `⚠️ تعداد اخطار: ${count}\n` +
    `🆔 ID: ${targetId}`
  );
}

// =====================================================
// دستورات مدیریت کاربران
// =====================================================

bot.hears(/^بن(?:\s+\d+)?$/i, banUser);
bot.hears(/^میوت(?:\s+\d+)?$/i, muteUser);
bot.hears(/^(?:آن‌بن|آن-بن|انبن)(?:\s+\d+)?$/i, unbanUser);
bot.hears(/^(?:آن‌میوت|آن-میوت|انمیوت)(?:\s+\d+)?$/i, unmuteUser);
bot.hears(/^اخطار(?:\s+\d+)?$/i, warnUser);

// =====================================================
// مالک+
// =====================================================

bot.hears(/^مالک\+$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  if (!(await isRealOwner(ctx, ctx.from.id))) {
    return noAccess(ctx);
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      "⛔ برای استفاده از مالک+ باید روی پیام کاربر ریپلای کنید."
    );
  }

  const target = ctx.message.reply_to_message.from;

  if (target.is_bot) {
    return ctx.reply("⛔ نمی‌توانید ربات را مالک ربات کنید.");
  }

  const group = getGroup(ctx.chat.id);

  group.owners.add(target.id);

  return ctx.reply(
    "『𓆩 مالکیت گروه 𓆪』\n\n" +
    "👤 کاربر به فهرست مالکین ربات اضافه شد. 👑\n\n" +
    `🆔 ID: ${target.id}`
  );
});

// =====================================================
// مالک-
// =====================================================

bot.hears(/^مالک-$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  if (!(await isRealOwner(ctx, ctx.from.id))) {
    return noAccess(ctx);
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      "⛔ برای استفاده از مالک- باید روی پیام کاربر ریپلای کنید."
    );
  }

  const target = ctx.message.reply_to_message.from;

  const group = getGroup(ctx.chat.id);

  group.owners.delete(target.id);

  return ctx.reply(
    "『𓆩 مالکیت گروه 𓆪』\n\n" +
    "👤 کاربر از فهرست مالکین ربات حذف شد.\n\n" +
    `🆔 ID: ${target.id}`
  );
});

// =====================================================
// مدیریت مدیران
// =====================================================

bot.hears(/^مدیر\+$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  if (!(await isBotOwner(ctx, ctx.from.id))) {
    return noAccess(ctx);
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      "⛔ روی پیام مدیر ریپلای کنید."
    );
  }

  const target = ctx.message.reply_to_message.from;

  if (!(await isAdmin(ctx, target.id))) {
    return ctx.reply(
      "⛔ این کاربر مدیر گروه نیست."
    );
  }

  const group = getGroup(ctx.chat.id);

  group.admins.set(target.id, {
    ban: false,
    mute: false,
    warn: false,
    locks: false,
    clean: false,
    rules: false,
    settings: false,
    panel: true
  });

  return ctx.reply(
    "『𓆩 مدیر ربات 𓆪』\n\n" +
    "✯ مدیر به سیستم مدیریت ربات اضافه شد.\n\n" +
    `🆔 ID: ${target.id}`
  );
});

// =====================================================
// حذف مدیر از سیستم ربات
// =====================================================

bot.hears(/^مدیر-$/i, async (ctx) => {
  if (!isGroup(ctx)) return;

  if (!(await isBotOwner(ctx, ctx.from.id))) {
    return noAccess(ctx);
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      "⛔ روی پیام مدیر ریپلای کنید."
    );
  }

  const target = ctx.message.reply_to_message.from;

  const group = getGroup(ctx.chat.id);

  group.admins.delete(target.id);

  return ctx.reply(
    "『𓆩 مدیر ربات 𓆪』\n\n" +
    "✯ دسترسی مدیریتی ربات از کاربر حذف شد."
  );
});

// =====================================================
// نمایش دسترسی مدیر
// =====================================================

bot.hears(/^دسترسی 
