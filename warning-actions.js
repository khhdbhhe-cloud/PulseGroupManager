const {
  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings
} = require("./warnings");

const { checkAdmin } = require("./security");


// =====================================
// پیدا کردن کاربر ریپلای‌شده
// =====================================

function getTargetUser(ctx) {

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
// ثبت دستورات اخطار
// =====================================

function registerWarningActions(bot) {


  // ===================================
  // اخطار
  // ===================================

  bot.hears(
    /^اخطار$/u,
    async ctx => {

      try {

        // فقط مدیران
        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }


        // کاربر هدف
        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

برای دادن اخطار، روی پیام کاربر ریپلای کنید و بنویسید:

اخطار`
          );

        }


        // اضافه کردن اخطار
        const count =
          addWarning(
            ctx.chat.id,
            target.id
          );


        await ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

کاربر:
${target.first_name || "بدون نام"}

آیدی:
${target.id}

تعداد اخطار:
★ ${count}

اخطار با موفقیت ثبت شد.`
        );

      }

      catch (error) {

        console.log(
          "WARNING ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // حذف یک اخطار
  // ===================================

  bot.hears(
    /^حذف اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

برای حذف اخطار، روی پیام کاربر ریپلای کنید و بنویسید:

حذف اخطار`
          );

        }


        const count =
          removeWarning(
            ctx.chat.id,
            target.id
          );


        await ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

کاربر:
${target.first_name || "بدون نام"}

تعداد اخطار باقی‌مانده:

★ ${count}`
        );

      }

      catch (error) {

        console.log(
          "REMOVE WARNING ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // پاک کردن تمام اخطارها
  // ===================================

  bot.hears(
    /^پاک کردن اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

برای پاک کردن تمام اخطارهای یک کاربر:

روی پیام کاربر ریپلای کنید و بنویسید:

پاک کردن اخطار`
          );

        }


        clearWarnings(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
`『𓆩 سیستم اخطار 𓆩』

تمام اخطارهای کاربر:

${target.first_name || "بدون نام"}

پاک شد.`
        );

      }

      catch (error) {

        console.log(
          "CLEAR WARNING ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// EXPORT
// =====================================

module.exports = {
  registerWarningActions
};
