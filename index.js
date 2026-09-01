// =====================================
// PulseGroupManager
// INDEX
// =====================================

const { Telegraf } = require("telegraf");
const http = require("http");

// =====================================
// اتصال پنل
// =====================================

const {
  registerPanelActions,
  mainPanel,
  panelText
} = require("./panel");


// =====================================
// دریافت توکن ربات
// =====================================

const BOT_TOKEN =
  process.env.BOT_TOKEN;

if (!BOT_TOKEN) {

  console.error(
    "ERROR: BOT_TOKEN is not set."
  );

  process.exit(1);
}


// =====================================
// ساخت ربات
// =====================================

const bot =
  new Telegraf(BOT_TOKEN);


// =====================================
// دستور شروع
// =====================================

bot.start(async (ctx) => {

  await ctx.reply(
    "『𓆩 ★ PulseGroupManager ★ 𓆪』\n\nربات فعال است."
  );

});


// =====================================
// دستور پنل
// =====================================
//
// فقط در گروه قابل استفاده است.
// بررسی مالک/مدیر بودن در زمان کار با پنل
// توسط panel.js انجام می‌شود.
//

bot.command("panel", async (ctx) => {

  // فقط گروه و سوپرگروه
  if (
    ctx.chat.type !== "group" &&
    ctx.chat.type !== "supergroup"
  ) {

    return;

  }


  try {

    // ---------------------------------
    // تشخیص نقش کاربر
    // ---------------------------------

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );


    // ---------------------------------
    // فقط مالک یا مدیر
    // ---------------------------------

    if (
      member.status !== "creator" &&
      member.status !== "administrator"
    ) {

      return;

    }


    // ---------------------------------
    // ارسال پنل شخصی
    // ---------------------------------

    await ctx.reply(
      panelText(),
      mainPanel(
        ctx.from.id
      )
    );

  }

  catch (error) {

    console.log(
      "PANEL COMMAND ERROR:",
      error.message
    );

  }

});


// =====================================
// ثبت دکمه‌های پنل
// =====================================

registerPanelActions(bot);


// =====================================
// سرور برای Render
// =====================================

const PORT =
  process.env.PORT || 10000;

const server =
  http.createServer(
    (req, res) => {

      res.writeHead(
        200,
        {
          "Content-Type":
            "text/plain; charset=utf-8"
        }
      );

      res.end(
        "PulseGroupManager is running."
      );

    }
  );


// =====================================
// اجرای سرور
// =====================================

server.listen(
  PORT,
  () => {

    console.log(
      `SERVER: listening on port ${PORT}`
    );

  }
);


// =====================================
// اجرای ربات
// =====================================

bot.launch()
  .then(() => {

    console.log(
      "BOT: PulseGroupManager started successfully."
    );

  })
  .catch((error) => {

    console.error(
      "BOT START ERROR:",
      error.message
    );

  });


// =====================================
// خاموش شدن صحیح
// =====================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
