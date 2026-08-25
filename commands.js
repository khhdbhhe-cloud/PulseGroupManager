const { mainPanel, panelText } = require("./panel");
const { checkAdmin } = require("./security");


// =====================================
// گرفتن کاربر ریپلای‌شده
// =====================================

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


// =====================================
// ثبت دستورات
// =====================================

function registerCommands(bot) {


  // ===================================
  // پنل مدیریت
  // ===================================

  bot.hears(
    /^پنل$/u,
    async ctx => {

      const access =
        await checkAdmin(ctx);

      if (!access.ok) {

        return ctx.reply(
          access.text
        );

      }


      const target =
        getReplyUser(ctx);


      let text =
        panelText();


      // اگر روی پیام کاربر ریپلای شده باشد
      if (target) {

        text +=
`\n\n『𓆩 کاربر انتخاب شده 𓆪』

نام:
${target.first_name || "ندارد"}

آیدی:
${target.id}`;

      }


      await ctx.reply(
        text,
        mainPanel(
          ctx.from.id
        )
      );

    }
  );


  // ===================================
  // دستور تست ربات
  // ===================================

  bot.hears(
    /^ربات$/u,
    async ctx => {

      await ctx.reply(
`『𓆩 PulseGroupManager 𓆪』

ربات فعال است ✅`
      );

    }
  );

}


// =====================================
// EXPORT
// =====================================

module.exports = {
  registerCommands
};
