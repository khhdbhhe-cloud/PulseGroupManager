// =====================================
// PulseGroupManager
// INDEX
// =====================================

const { Telegraf } = require("telegraf");
const http = require("http");

const {
  registerPanelActions,
  mainPanel,
  panelText
} = require("./panel");


// =====================================
// توکن
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
// تشخیص مالک / مدیر / عضو
// =====================================

async function getGroupRole(
  ctx,
  userId
) {

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (
      member.status === "creator"
    ) {

      return "owner";

    }

    if (
      member.status === "administrator"
    ) {

      return "admin";

    }

    return "member";

  }

  catch (error) {

    console.log(
      "GET ROLE ERROR:",
      error.message
    );

    return "member";

  }

}


// =====================================
// دستور پنل
// =====================================

bot.hears(
  /^پنل$/i,
  async ctx => {

    // فقط گروه و سوپرگروه
    if (
      !ctx.chat ||
      (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      )
    ) {

      return;

    }


    const userId =
      ctx.from.id;


    // ---------------------------------
    // تشخیص سطح کاربر
    // ---------------------------------

    const role =
      await getGroupRole(
        ctx,
        userId
      );


    // ---------------------------------
    // عضو عادی = هیچ پاسخ
    // ---------------------------------

    if (
      role !== "owner" &&
      role !== "admin"
    ) {

      return;

    }


    // ---------------------------------
    // پنل با ریپلای
    // ---------------------------------

    try {

      if (
        ctx.message.reply_to_message
      ) {

        await ctx.reply(
          panelText(),
          {
            ...mainPanel(userId),
            reply_parameters: {
              message_id:
                ctx.message.reply_to_message.message_id
            }
          }
        );

      }

      else {

        // اگر روی پیام کسی ریپلای نشده بود،
        // پنل روی همان پیام دستور باز می‌شود.

        await ctx.reply(
          panelText(),
          {
            ...mainPanel(userId),
            reply_parameters: {
              message_id:
                ctx.message.message_id
            }
          }
        );

      }

    }

    catch (error) {

      console.log(
        "PANEL OPEN ERROR:",
        error.message
      );

    }

  }
);


// =====================================
// ثبت دکمه‌های پنل
// =====================================

registerPanelActions(bot);


// =====================================
// دستور تست خصوصی
// =====================================

bot.start(
  async ctx => {

    try {

      await ctx.reply(
        "『𓆩 ★ PulseGroupManager ★ 𓆪』\n\nربات فعال است."
      );

    }

    catch (error) {

      console.log(
        "START ERROR:",
        error.message
      );

    }

  }
);


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
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
