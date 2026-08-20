const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN پیدا نشد");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ===============================
// RENDER SERVER
// ===============================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager is ONLINE ✅");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ===============================
// BUTTONS
// ===============================

const buttons = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      "『𓆩 پنل مدیریت 𓆪』",
      "panel"
    )
  ],
  [
    Markup.button.callback(
      "『𓆩 راهنما 𓆪』",
      "help"
    )
  ],
  [
    Markup.button.callback(
      "『𓆩 تنظیمات 𓆪』",
      "settings"
    )
  ],
  [
    Markup.button.callback(
      "『𓆩 بستن ✖️ 𓆪",
      "close"
    )
  ]
]);

// ===============================
// CHECK GROUP
// ===============================

function isGroup(ctx) {
  return (
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );
}

// ===============================
// CHECK ADMIN
// ===============================

async function isAdmin(ctx) {

  if (!isGroup(ctx)) {
    return false;
  }

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

    return (
      member.status === "administrator" ||
      member.status === "creator"
    );

  } catch (error) {

    console.error(
      "❌ ADMIN CHECK:",
      error.message
    );

    return false;
  }
}

// ===============================
// پنل
// ===============================

async function sendPanel(ctx) {

  console.log(
    "🟢 PANEL COMMAND:",
    ctx.message?.text
  );

  if (!isGroup(ctx)) {

    return ctx.reply(
      "❌ پنل فقط داخل گروه قابل استفاده است."
    );
  }

  const admin = await isAdmin(ctx);

  if (!admin) {

    return ctx.reply(
      "❌ فقط مدیران و مالک گروه به پنل دسترسی دارند."
    );
  }

  try {

    await ctx.reply(
      "『𓆩 PulseGroupManager 𓆪』\n\n" +
      "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
      "بخش موردنظر را انتخاب کنید 👇",
      buttons
    );

    console.log("✅ PANEL SENT");

  } catch (error) {

    console.error(
      "❌ PANEL SEND ERROR:",
      error.message
    );
  }
}

// ===============================
// دستور پنل
// ===============================

bot.hears(
  /^پنل$/u,
  async (ctx) => {
    await sendPanel(ctx);
  }
);

// ===============================
// دستور راهنما
// ===============================

bot.hears(
  /^راهنما$/u,
  async (ctx) => {

    if (!isGroup(ctx)) {
      return ctx.reply(
        "❌ راهنما فقط داخل گروه قابل استفاده است."
      );
    }

    const admin = await isAdmin(ctx);

    if (!admin) {
      return ctx.reply(
        "❌ فقط مدیران و مالک گروه دسترسی دارند."
      );
    }

    await ctx.reply(
      "『𓆩 راهنما 𓆪』\n\n" +
      "پنل مدیریت گروه برای مدیران و مالک گروه است.\n\n" +
      "دستورها:\n\n" +
      "• پنل\n" +
      "• راهنما",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "『𓆩 بازگشت 𓆪",
            "panel"
          )
        ],
        [
          Markup.button.callback(
            "『𓆩 بستن ✖️ 𓆪",
            "close"
          )
        ]
      ])
    );
  }
);

// ===============================
// BUTTON PANEL
// ===============================

bot.action(
  "panel",
  async (ctx) => {

    const admin = await isAdmin(ctx);

    try {
      await ctx.answerCbQuery();
    } catch {}

    if (!admin) {
      return;
    }

    try {

      await ctx.editMessageText(
        "『𓆩 PulseGroupManager 𓆪』\n\n" +
        "『𓆩 پنل مدیریت گروه 𓆪』\n\n" +
        "بخش موردنظر را انتخاب کنید 👇",
        buttons
      );

    } catch (error) {

      console.error(
        "❌ PANEL BUTTON ERROR:",
        error.message
      );
    }
  }
);

// ===============================
// HELP BUTTON
// ===============================

bot.action(
  "help",
  async (ctx) => {

    const admin = await isAdmin(ctx);

    try {
      await ctx.answerCbQuery();
    } catch {}

    if (!admin) {
      return;
    }

    try {

      await ctx.editMessageText(
        "『𓆩 راهنما 𓆪』\n\n" +
        "ربات مدیریت گروه است.\n\n" +
        "برای باز کردن پنل از دستور زیر استفاده کن:\n\n" +
        "پنل",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "『𓆩 بازگشت 𓆪",
              "panel"
            )
          ],
          [
            Markup.button.callback(
              "『𓆩 بستن ✖️ 𓆪",
              "close"
            )
          ]
        ])
      );

    } catch (error) {

      console.error(
        "❌ HELP ERROR:",
        error.message
      );
    }
  }
);

// ===============================
// SETTINGS BUTTON
// ===============================

bot.action(
  "settings",
  async (ctx) => {

    const admin = await isAdmin(ctx);

    try {
      await ctx.answerCbQuery();
    } catch {}

    if (!admin) {
      return;
    }

    try {

      await ctx.editMessageText(
        "『𓆩 تنظیمات 𓆪』\n\n" +
        "تنظیمات ربات در این بخش قرار می‌گیرد.",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "『𓆩 بازگشت 𓆪",
              "panel"
            )
          ],
          [
            Markup.button.callback(
              "『𓆩 بستن ✖️ 𓆪",
              "close"
            )
          ]
        ])
      );

    } catch (error) {

      console.error(
        "❌ SETTINGS ERROR:",
        error.message
      );
    }
  }
);

// ===============================
// CLOSE
// ===============================

bot.action(
  "close",
  async (ctx) => {

    try {
      await ctx.answerCbQuery(
        "بسته شد ✅"
      );
    } catch {}

    try {
      await ctx.deleteMessage();
    } catch {}
  }
);

// ===============================
// DEBUG
// ===============================

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
    JSON.stringify(ctx.message?.text)
  );

  return next();
});

// ===============================
// ERROR HANDLER
// ===============================

bot.catch((error) => {

  console.error(
    "🔥 BOT ERROR:",
    error
  );

});

// ===============================
// START
// ===============================

bot.launch()
  .then(() => {

    console.log(
      "🤖 BOT:",
      bot.botInfo?.username || "unknown"
    );

    console.log(
      "✅ PulseGroupManager started successfully"
    );

  })
  .catch((error) => {

    console.error(
      "❌ BOT START ERROR:",
      error
    );

  });

// ===============================
// SHUTDOWN
// ===============================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
