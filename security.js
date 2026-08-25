// =====================================
// PulseGroupManager
// Warning Settings
// =====================================

const { getRole } = require("./security");


// =====================================
// تنظیمات هر گروه
// =====================================

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
// بررسی مالک گروه
// =====================================

async function checkOwner(ctx) {

  if (
    !ctx.chat ||
    (
      ctx.chat.type !== "group" &&
      ctx.chat.type !== "supergroup"
    )
  ) {

    return {
      ok: false,
      text: "این دستور فقط داخل گروه کار می‌کند."
    };

  }


  const role =
    await getRole(
      ctx,
      ctx.from.id
    );


  if (role !== "creator") {

    return {
      ok: false,
      text: "فقط مالک گروه می‌تواند تنظیمات اخطار را تغییر دهد."
    };

  }


  return {
    ok: true,
    role
  };

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
// تبدیل اعداد فارسی و عربی
// =====================================

function convertPersianNumber(value) {

  const persian =
    "۰۱۲۳۴۵۶۷۸۹";

  const arabic =
    "٠١٢٣٤٥٦٧٨٩";

  return String(value)
    .replace(
      /[۰-۹]/g,
      char =>
        persian.indexOf(char)
    )
    .replace(
      /[٠-٩]/g,
      char =>
        arabic.indexOf(char)
    );

}


// =====================================
// ریپلای به پیام
// =====================================

function replyToMessage(ctx, text) {

  return ctx.reply(
    text,
    {
      reply_parameters: {
        message_id:
          ctx.message.message_id
      }
    }
  );

}


// =====================================
// ثبت تنظیمات اخطار
// =====================================

function registerWarningSettings(bot) {


  // =====================================
  // تعداد اخطار
  // مثال:
  // تعداد اخطار 3
  // =====================================

  bot.hears(
    /^تعداد\s+اخطار\s+([۰-۹٠-٩0-9]+)$/u,
    async ctx => {

      try {

        const access =
          await checkOwner(ctx);

        if (!access.ok) {

          return replyToMessage(
            ctx,
            `『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
          );

        }


        const number =
          Number(
            convertPersianNumber(
              ctx.match[1]
            )
          );


        if (
          !Number.isInteger(number) ||
          number < 1 ||
          number > 20
        ) {

          return replyToMessage(
            ctx,
`『𓆩 ★ تنظیم اخطار ★ 𓆪』

تعداد اخطار باید بین ۱ تا ۲۰ باشد.`
          );

        }


        setMaxWarnings(
          ctx.chat.id,
          number
        );


        return replyToMessage(
          ctx,
`『𓆩 ★ تنظیمات اخطار ★ 𓆪』

تعداد اخطار تنظیم شد:

★ ${number} اخطار

بعد از رسیدن کاربر به این تعداد،
مجازات انتخاب‌شده اجرا می‌شود.`
        );

      }

      catch (error) {

        console.log(
          "WARNING MAX ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // وضعیت اخطار - سکوت
  // =====================================

  bot.hears(
    /^وضعیت\s+اخطار\s+سکوت$/u,
    async ctx => {

      try {

        const access =
          await checkOwner(ctx);

        if (!access.ok) {

          return replyToMessage(
            ctx,
`『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
          );

        }


        setWarningPunishment(
          ctx.chat.id,
          "mute"
        );


        return replyToMessage(
          ctx,
`『𓆩 ★ تنظیمات اخطار ★ 𓆪』

وضعیت اخطار روی:

★ سکوت

تنظیم شد.`
        );

      }

      catch (error) {

        console.log(
          "WARNING MUTE ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // وضعیت اخطار - محدود
  // =====================================

  bot.hears(
    /^وضعیت\s+اخطار\s+محدود$/u,
    async ctx => {

      try {

        const access =
          await checkOwner(ctx);

        if (!access.ok) {

          return replyToMessage(
            ctx,
`『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
          );

        }


        setWarningPunishment(
          ctx.chat.id,
          "restrict"
        );


        return replyToMessage(
          ctx,
`『𓆩 ★ تنظیمات اخطار ★ 𓆪』

وضعیت اخطار روی:

★ محدود

تنظیم شد.`
        );

      }

      catch (error) {

        console.log(
          "WARNING RESTRICT ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // وضعیت اخطار - بن
  // =====================================

  bot.hears(
    /^وضعیت\s+اخطار\s+بن$/u,
    async ctx => {

      try {

        const access =
          await checkOwner(ctx);

        if (!access.ok) {

          return replyToMessage(
            ctx,
`『𓆩 ★ دسترسی ★ 𓆪』

${access.text}`
          );

        }


        setWarningPunishment(
          ctx.chat.id,
          "ban"
        );


        return replyToMessage(
          ctx,
`『𓆩 ★ تنظیمات اخطار ★ 𓆪』

وضعیت اخطار روی:

★ بن

تنظیم شد.`
        );

      }

      catch (error) {

        console.log(
          "WARNING BAN ERROR:",
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
  registerWarningSettings,
  checkOwner

};
