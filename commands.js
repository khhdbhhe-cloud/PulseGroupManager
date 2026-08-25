const { mainPanel, panelText } = require("./panel");
const { checkAdmin } = require("./security");


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



function registerCommands(bot) {


  // =========================
  // PANEL
  // =========================

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


      const target =
        getReplyUser(ctx);



      let text =
        panelText();


      if(target){

        text +=
`\n\n『𓆩 کاربر انتخاب شده 𓆪』

نام: ${target.first_name || "ندارد"}

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





  // =========================
  // HELP
  // =========================

  bot.hears(
    /^راهنما$/u,
    async ctx => {


      await ctx.reply(
`『𓆩 راهنمای PulseGroupManager 𓆪』

دستورات مدیریت:

پنل
بن
آن‌بن
میوت
اخطار
شناسنامه
آمار

فقط مدیران گروه دسترسی دارند.`

      );

    }
  );





  // =========================
  // TEST
  // =========================

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


module.exports = {
  registerCommands
};
