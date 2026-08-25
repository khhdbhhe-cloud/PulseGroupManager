// =====================================
// PulseGroupManager
// Warning Settings
// =====================================

const { checkAdmin } = require("./security");

// تنظیمات هر گروه
const settings = new Map();


// =====================================
// تنظیمات پیش‌فرض
// =====================================

function getDefaultSettings() {

  return {
    maxWarnings: 3,
    punishment: "mute",
    duration: 60
  };

}


// =====================================
// دریافت تنظیمات گروه
// =====================================

function getWarningSettings(chatId) {

  if (!settings.has(chatId)) {

    settings.set(
      chatId,
      getDefaultSettings()
    );

  }

  return settings.get(chatId);

}


// =====================================
// تعداد اخطار
// =====================================

function setMaxWarnings(
  chatId,
  number
) {

  const config =
    getWarningSettings(chatId);

  config.maxWarnings =
    Number(number);

  return config;

}


// =====================================
// نوع مجازات
// =====================================

function setWarningPunishment(
  chatId,
  punishment
) {

  const config =
    getWarningSettings(chatId);

  config.punishment =
    punishment;

  return config;

}


// =====================================
// مدت مجازات
// =====================================

function setWarningDuration(
  chatId,
  minutes
) {

  const config =
    getWarningSettings(chatId);

  config.duration =
    Number(minutes);

  return config;

}


// =====================================
// ثبت دستورات مستقیم تنظیم اخطار
// =====================================

function registerWarningSettings(bot) {

  bot.hears(
    /^تعداد اخطار\s+(\d+)$/u,
    async ctx => {

      try {

        // فقط داخل گروه
        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return;
        }


        // فقط مدیر و مالک
        const access =
          await checkAdmin(ctx);

        if (!access.ok) {
          return;
        }


        const number =
          Number(ctx.match[1]);


        // محدوده مجاز
        if (
          number < 1 ||
          number > 20
        ) {

          return ctx.reply(
            `『𓆩 ★ تنظیم اخطار ★ 𓆪』

تعداد اخطار باید بین ۱ تا ۲۰ باشد.`,
            {
              reply_parameters: {
                message_id:
                  ctx.message.message_id
              }
            }
          );

        }


        // ذخیره تنظیم
        setMaxWarnings(
          ctx.chat.id,
          number
        );


        // پاسخ روی همان پیام
        await ctx.reply(
`『𓆩 ★ تنظیمات اخطار ★ 𓆪』

تعداد اخطار تنظیم شد:

★ ${number} اخطار

بعد از رسیدن کاربر به این تعداد،
مجازات انتخاب‌شده اجرا می‌شود.`,
          {
            reply_parameters: {
              message_id:
                ctx.message.message_id
            }
          }
        );

      }

      catch (error) {

        console.log(
          "WARNING SETTINGS ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getWarningSettings,
  setMaxWarnings,
  setWarningPunishment,
  setWarningDuration,
  registerWarningSettings

};
