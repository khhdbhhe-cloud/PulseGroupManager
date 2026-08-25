const { Markup } = require("telegraf");
const { checkAdmin } = require("./security");


// =====================================
// دکمه اصلی راهنما
// =====================================

function helpButton(text, action, ownerId) {

  return Markup.button.callback(
    `『𓆩 ${text} 𓆪』`,
    `${action}:${ownerId}`
  );

}


// =====================================
// پنل اصلی راهنما
// =====================================

function helpPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      helpButton("بن", "help_ban", ownerId),
      helpButton("سکوت", "help_mute", ownerId)
    ],

    [
      helpButton("اخطار", "help_warn", ownerId),
      helpButton("شناسنامه", "help_info", ownerId)
    ],

    [
      helpButton("قفل‌ها", "help_locks", ownerId),
      helpButton("مدیریت کاربران", "help_users", ownerId)
    ],

    [
      helpButton("دستورات", "help_commands", ownerId),
      helpButton("تنظیمات اخطار", "help_warn_settings", ownerId)
    ],

    [
      helpButton("بستن", "help_close", ownerId)
    ]

  ]);

}


// =====================================
// متن اصلی راهنما
// =====================================

function helpText() {

  return `『𓆩 راهنمای PulseGroupManager 𓆪』

بخش موردنظر را انتخاب کنید.

در این قسمت روش استفاده از امکانات مدیریتی ربات توضیح داده می‌شود.`;

}


// =====================================
// توضیح بن
// =====================================

function banHelpText() {

  return `『𓆩 راهنمای بن 𓆪』

برای بن کردن کاربر:

1️⃣ روی پیام کاربر ریپلای کنید.
2️⃣ دستور «بن» را ارسال کنید.

مثال:

بن

⚠️ ربات باید دسترسی Ban Users داشته باشد.

مالک گروه قابل بن شدن نیست.
مدیر عادی نیز نمی‌تواند مدیر دیگر را بن کند.`;

}


// =====================================
// توضیح سکوت
// =====================================

function muteHelpText() {

  return `『𓆩 راهنمای سکوت 𓆪』

برای سکوت کردن کاربر:

1️⃣ روی پیام کاربر ریپلای کنید.
2️⃣ گزینه سکوت را انتخاب کنید.
3️⃣ مدت زمان سکوت را انتخاب کنید.

مدت‌های قابل تنظیم:

• ۱ ساعت
• ۲ ساعت
• ۳ ساعت
• ۴ ساعت
• ۶ ساعت
• ۱۲ ساعت
• ۲۴ ساعت

ربات باید دسترسی Restrict Users داشته باشد.`;

}


// =====================================
// توضیح اخطار
// =====================================

function warnHelpText() {

  return `『𓆩 راهنمای اخطار 𓆪』

برای دادن اخطار:

1️⃣ روی پیام کاربر ریپلای کنید.
2️⃣ دستور «اخطار» را ارسال کنید.

هر اخطار برای همان کاربر ذخیره می‌شود.

مثال:

اخطار

تعداد اخطارها در پنل قابل مشاهده است.

می‌توان تنظیم کرد بعد از رسیدن کاربر به تعداد مشخصی اخطار:

→ سکوت شود
→ محدود شود
→ یا اقدام مدیریتی دیگری انجام شود.`;

}


// =====================================
// تنظیمات اخطار
// =====================================

function warnSettingsText() {

  return `『𓆩 تنظیمات اخطار 𓆪』

تعداد اخطار مجاز:

۳ اخطار

پس از رسیدن به حد مشخص، ربات می‌تواند:

★ کاربر را سکوت کند
★ کاربر را محدود کند
★ اخطارها را پاک کند
★ اقدام مدیریتی انجام دهد

این قسمت در پنل تنظیمات قابل تغییر خواهد بود.`;

}


// =====================================
// شناسنامه
// =====================================

function infoHelpText() {

  return `『𓆩 راهنمای شناسنامه 𓆪』

برای مشاهده اطلاعات کاربر:

روی پیام کاربر ریپلای کنید و گزینه شناسنامه را بزنید.

اطلاعات قابل نمایش:

• نام
• نام خانوادگی
• آیدی
• نام کاربری
• وضعیت کاربر
• تعداد پیام‌ها
• تعداد اخطارها
• وضعیت مدیریت

اطلاعات حساس یا اطلاعاتی که تلگرام در اختیار ربات قرار نمی‌دهد نمایش داده نمی‌شود.`;

}


// =====================================
// قفل‌ها
// =====================================

function locksHelpText() {

  return `『𓆩 راهنمای قفل‌ها 𓆪』

از قسمت قفل‌ها می‌توان ارسال موارد مختلف را کنترل کرد:

• لینک
• عکس
• ویدیو
• فایل
• گیف
• استیکر
• فوروارد
• نظرسنجی
• ویس
• منشن

★ یعنی قفل فعال است.
☆ یعنی قفل غیرفعال است.

برای تغییر قفل، ربات باید دسترسی حذف پیام داشته باشد.`;

}


// =====================================
// مدیریت کاربران
// =====================================

function usersHelpText() {

  return `『𓆩 راهنمای مدیریت کاربران 𓆪』

مدیران می‌توانند از این بخش برای مدیریت اعضا استفاده کنند:

• بن
• آن‌بن
• سکوت
• برداشتن سکوت
• اخطار
• اطلاعات کاربر
• آمار کاربر

تمام عملیات روی کاربر باید با ریپلای انجام شود.`;

}


// =====================================
// دستورات
// =====================================

function commandsHelpText() {

  return `『𓆩 دستورات ربات 𓆪』

پنل
راهنما
بن
آن‌بن
میوت
اخطار

برای استفاده از دستورات مدیریتی باید مدیر گروه باشید.

کاربران عادی اجازه اجرای دستورات مدیریتی را ندارند.`;

}


// =====================================
// ثبت راهنما
// =====================================

function registerHelp(bot) {


  // ===================================
  // دستور راهنما
  // ===================================

  bot.hears(
    /^راهنما$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }

        await ctx.reply(
          helpText(),
          {
            ...helpPanel(ctx.from.id),

            reply_parameters: {
              message_id:
                ctx.message.message_id
            }

          }
        );

      }

      catch (error) {

        console.log(
          "HELP ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // بن
  // ===================================

  bot.action(
    /^help_ban:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        banHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // سکوت
  // ===================================

  bot.action(
    /^help_mute:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        muteHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // اخطار
  // ===================================

  bot.action(
    /^help_warn:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        warnHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "تنظیمات اخطار",
              "help_warn_settings",
              ctx.from.id
            )
          ],

          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // تنظیمات اخطار
  // ===================================

  bot.action(
    /^help_warn_settings:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        warnSettingsText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // شناسنامه
  // ===================================

  bot.action(
    /^help_info:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        infoHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // قفل‌ها
  // ===================================

  bot.action(
    /^help_locks:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        locksHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // مدیریت کاربران
  // ===================================

  bot.action(
    /^help_users:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        usersHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // دستورات
  // ===================================

  bot.action(
    /^help_commands:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        commandsHelpText(),
        Markup.inlineKeyboard([
          [
            helpButton(
              "بازگشت به راهنما",
              "help_back",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // بازگشت به صفحه اصلی راهنما
  // ===================================

  bot.action(
    /^help_back:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        helpText(),
        helpPanel(ctx.from.id)
      );

    }
  );


  // ===================================
  // بستن راهنما
  // ===================================

  bot.action(
    /^help_close:(\d+)$/,
    async ctx => {

      if (
        String(ctx.from.id) !==
        ctx.match[1]
      ) {

        return ctx.answerCbQuery(
          "این راهنما برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();


      // همان پیام راهنما را تغییر می‌دهیم
      // تا ریپلای اصلی آن حفظ شود.

      await ctx.editMessageText(
        `『𓆩 ★ راهنما بسته شد ★ 𓆪』`
      );

    }
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  registerHelp,
  helpPanel,
  helpText

};
