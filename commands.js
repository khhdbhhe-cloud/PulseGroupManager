const { Markup } = require("telegraf");
const { mainPanel, panelText } = require("./panel");
const { checkAdmin } = require("./security");


function registerCommands(bot) {


  // پنل مدیریت فقط برای مدیرها

  bot.hears(
    /^پنل$/u,
    async ctx => {

      const access =
        await checkAdmin(ctx);

      if(!access.ok){

        return ctx.reply(
          access.text
        );

      }


      await ctx.reply(
        panelText(),
        mainPanel(
          ctx.from.id
        )
      );

    }
  );



  // راهنما جدا از پنل

  bot.hears(
    /^راهنما$/u,
    async ctx => {

      await ctx.reply(
`『𓆩 راهنمای ربات 𓆪』

دستورات مدیریت:

• پنل
• بن
• آن‌بن
• میوت
• اخطار
• اطلاعات کاربر
• آمار کاربر

دستورات فقط برای مدیران فعال هستند.

برای مدیریت بهتر گروه از پنل استفاده کنید.`
      );

    }
  );



  // تست ربات

  bot.hears(
    /^ربات$/u,
    async ctx => {

      await ctx.reply(
        "『𓆩 PulseGroupManager 𓆪』\n\nربات فعاله ✅"
      );

    }
  );


}


module.exports = {
  registerCommands
};
