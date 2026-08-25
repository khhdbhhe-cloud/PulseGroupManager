const { Markup } = require("telegraf");
const { checkAdmin } = require("./security");


// =====================================
// دکمه تنظیمات
// =====================================

function settingButton(text, action, ownerId) {
  return Markup.button.callback(
    `『𓆩 ${text} 𓆪』`,
    `${action}:${ownerId}`
  );
}


// =====================================
// صفحه اصلی تنظیمات
// =====================================

function settingsPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      settingButton(
        "خوشامدگویی",
        "set_welcome",
        ownerId
      )
    ],

    [
      settingButton(
        "مدیریت",
        "set_management",
        ownerId
      )
    ],

    [
      settingButton(
        "اختیار",
        "set_warn",
        ownerId
      )
    ],

    [
      settingButton(
        "سکوت",
        "set_mute",
        ownerId
      )
    ],

    [
      settingButton(
        "محدودیت",
        "set_restrict",
        ownerId
      )
    ],

    [
      settingButton(
        "بن",
        "set_ban",
        ownerId
      )
    ],

    [
      settingButton(
        "فوروارد",
        "set_forward",
        ownerId
      )
    ],

    [
      settingButton(
        "ضدفلود",
        "set_flood",
        ownerId
      )
    ],

    [
      settingButton(
        "ورود و خروج",
        "set_joinleave",
        ownerId
      )
    ],

    [
      settingButton(
        "پیام‌ها",
        "set_messages",
        ownerId
      )
    ],

    [
      settingButton(
        "قوانین",
        "set_rules",
        ownerId
      )
    ],

    [
      settingButton(
        "بازگشت",
        "settings_back",
        ownerId
      ),

      settingButton(
        "بستن",
        "settings_close",
        ownerId
      )
    ]

  ]);

}


// =====================================
// متن تنظیمات
// =====================================

function settingsText() {

  return `『𓆩 تنظیمات PulseGroupManager 𓆪』

تنظیمات موردنظر را انتخاب کنید.

تمام تغییرات این بخش فقط توسط مدیران گروه قابل انجام است.`;

}


// =====================================
// کنترل دسترسی پنل تنظیمات
// =====================================

async function protectSettings(ctx) {

  const access =
    await checkAdmin(ctx);

  if (!access.ok) {

    try {

      await ctx.answerCbQuery(
        access.text,
        {
          show_alert: true
        }
      );

    } catch {}

    return false;

  }

  return true;

}


// =====================================
// ثبت تنظیمات
// =====================================

function registerSettings(bot) {


  // ===================================
  // دستور تنظیمات
  // ===================================

  bot.hears(
    /^تنظیمات$/u,
    async ctx => {

      const access =
        await checkAdmin(ctx);

      if (!access.ok) {

        return ctx.reply(
          access.text
        );

      }

      const message =
        await ctx.reply(
          settingsText(),
          settingsPanel(
            ctx.from.id
          )
        );

      console.log(
        "SETTINGS OPENED:",
        ctx.from.id,
        message.message_id
      );

    }
  );


  // ===================================
  // صفحه اصلی تنظیمات
  // ===================================

  bot.action(
    /^settings:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) {
        return;
      }

      if (
        String(ctx.from.id) !==
        String(ctx.match[1])
      ) {

        return ctx.answerCbQuery(
          "این تنظیمات برای شما نیست.",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        settingsText(),
        settingsPanel(
          ctx.from.id
        )
      );

    }
  );


  // ===================================
  // تنظیمات خوشامدگویی
  // ===================================

  bot.action(
    /^set_welcome:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات خوشامدگویی 𓆪』

از این بخش می‌توان تنظیم کرد:

★ خوشامدگویی فعال باشد
☆ خوشامدگویی غیرفعال باشد

متن خوشامدگویی نیز در همین بخش قابل تنظیم خواهد بود.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات مدیریت
  // ===================================

  bot.action(
    /^set_management:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات مدیریت 𓆪』

تنظیمات مربوط به مدیران گروه.

★ اجازه استفاده از پنل
★ اجازه اجرای دستورات
★ مدیریت مدیران
★ مدیریت دسترسی‌ها

دسترسی‌ها فقط برای مدیر و مالک قابل تغییر هستند.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات اختیار
  // ===================================

  bot.action(
    /^set_warn:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات اختیار 𓆪』

تعداد اختیار:

۳

اقدام بعد از رسیدن به حد:

سکوت

مدت سکوت:

۲ ساعت

این مقادیر در مرحله بعد به صورت دکمه‌ای قابل تغییر می‌شوند.

مثال:

۱ → ۲ → ۳ → ۴ → ۵ اختیار

و اقدام:

سکوت
محدودیت
بن
هیچ‌کاری انجام نشود`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات سکوت
  // ===================================

  bot.action(
    /^set_mute:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات سکوت 𓆪』

مدت‌های قابل استفاده:

۱ ساعت
۲ ساعت
۳ ساعت
۴ ساعت
۶ ساعت
۱۲ ساعت
۲۴ ساعت

تنظیم مدت پیش‌فرض در مرحله بعد اضافه می‌شود.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات محدودیت
  // ===================================

  bot.action(
    /^set_restrict:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات محدودیت 𓆪』

در این بخش مشخص می‌شود کاربر چه نوع محدودیتی داشته باشد.

مثلاً:

★ ارسال متن
★ ارسال عکس
★ ارسال ویدیو
★ ارسال فایل
★ ارسال ویس

تنظیم واقعی محدودیت در مرحله بعد اضافه می‌شود.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات بن
  // ===================================

  bot.action(
    /^set_ban:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات بن 𓆪』

تنظیمات مربوط به بن کاربران.

مالک گروه قابل مدیریت نیست.

مدیر عادی نیز اجازه مدیریت مدیر دیگر را ندارد.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات فوروارد
  // ===================================

  bot.action(
    /^set_forward:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات فوروارد 𓆪』

می‌توان مشخص کرد فوروارد پیام‌ها مجاز باشد یا محدود شود.

★ فعال
☆ غیرفعال`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات ضدفلود
  // ===================================

  bot.action(
    /^set_flood:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات ضدفلود 𓆪』

ضدفلود برای جلوگیری از ارسال تعداد زیادی پیام پشت سر هم است.

★ فعال
☆ غیرفعال

حد پیام و زمان بررسی در مرحله بعد قابل تنظیم خواهد بود.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // ورود و خروج
  // ===================================

  bot.action(
    /^set_joinleave:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات ورود و خروج 𓆪』

تنظیم خوشامدگویی اعضای جدید.

تنظیم پیام خروج اعضا.

★ فعال
☆ غیرفعال`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // تنظیمات پیام‌ها
  // ===================================

  bot.action(
    /^set_messages:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات پیام‌ها 𓆪』

مدیریت پیام‌های گروه.

موارد قابل تنظیم:

★ حذف پیام‌های ممنوع
★ پاکسازی پیام‌ها
★ مدیریت پیام‌های خودکار`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // قوانین
  // ===================================

  bot.action(
    /^set_rules:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات قوانین 𓆪』

در این بخش قوانین گروه تنظیم و ویرایش می‌شوند.

قوانین می‌توانند از داخل گروه نمایش داده شوند.`,
        Markup.inlineKeyboard([
          [
            settingButton(
              "بازگشت به تنظیمات",
              "settings",
              ctx.from.id
            )
          ]
        ])
      );

    }
  );


  // ===================================
  // بازگشت
  // ===================================

  bot.action(
    /^settings_back:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        settingsText(),
        settingsPanel(
          ctx.from.id
        )
      );

    }
  );


  // ===================================
  // بستن
  // ===================================

  bot.action(
    /^settings_close:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      try {

        await ctx.deleteMessage();

      } catch {

        await ctx.editMessageText(
          "تنظیمات بسته شد."
        );

      }

    }
  );

}


module.exports = {
  registerSettings,
  settingsPanel,
  settingsText
};
