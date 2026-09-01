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
// تابع تشخیص مالک / مدیر
// =====================================

async function isAdminOrOwner(ctx) {

  try {

    if (
      !ctx.chat ||
      !ctx.from
    ) {

      return false;

    }


    // فقط گروه
    if (
      ctx.chat.type !== "group" &&
      ctx.chat.type !== "supergroup"
    ) {

      return false;

    }


    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );


    if (!member) {

      return false;

    }


    // مالک اصلی
    if (
      member.status === "creator"
    ) {

      return true;

    }


    // مدیر
    if (
      member.status === "administrator"
    ) {

      return true;

    }


    // عضو عادی
    return false;

  }

  catch (error) {

    console.log(
      "ADMIN CHECK ERROR:",
      error.message
    );

    return false;

  }

}


// =====================================
// باز کردن پنل
// =====================================

async function openPanel(ctx) {

  // فقط گروه
  if (
    !ctx.chat ||
    (
      ctx.chat.type !== "group" &&
      ctx.chat.type !== "supergroup"
    )
  ) {

    return;

  }


  // فقط مالک و مدیر
  const allowed =
    await isAdminOrOwner(ctx);


  if (!allowed) {

    // عضو عادی هیچ پاسخی نمی‌گیرد
    return;

  }


  try {

    await ctx.reply(

      panelText(),

      mainPanel(
        ctx.from.id
      )

    );

  }

  catch (error) {

    console.log(
      "PANEL OPEN ERROR:",
      error.message
    );

  }

}


// =====================================
// دستور /panel
// =====================================

bot.command(
  "panel",
  async ctx => {

    await openPanel(ctx);

  }
);


// =====================================
// دستور فارسی «پنل»
// =====================================

bot.hears(
  /^پنل$/,
  async ctx => {

    await openPanel(ctx);

  }
);


// =====================================
// دستور /start
// =====================================

bot.start(
  async ctx => {

    await ctx.reply(
      "『𓆩 ★ PulseGroupManager ★ 𓆪』\n\nربات فعال است."
    );

  }
);


// =====================================
// ثبت تمام دکمه‌های پنل
// =====================================

registerPanelActions(bot);


// =====================================
// سرور Render
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
  .catch(error => {

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
