const { Markup } = require("telegraf");
const { checkAdmin } = require("./security");


function registerPanelActions(bot) {


  bot.action(
    /^users:(\d+)$/,
    async ctx => {

      const access =
        await checkAdmin(ctx);

      if(!access.ok){
        return ctx.answerCbQuery(
          access.text,
          { show_alert:true }
        );
      }


      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 مدیریت کاربران 𓆪』

بخش مدیریت کاربران فعال شد.

به زودی:
• بن
• میوت
• اخطار
• شناسنامه
• آمار`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "『𓆩 بازگشت 𓆪』",
              `back:${ctx.from.id}`
            )
          ]
        ])
      );

    }
  );



  bot.action(
    /^settings:(\d+)$/,
    async ctx => {

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات 𓆪』

تنظیمات گروه اینجا قرار می‌گیرد.`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "『𓆩 بازگشت 𓆪』",
              `back:${ctx.from.id}`
            )
          ]
        ])
      );

    }
  );


}


module.exports = {
  registerPanelActions
};
