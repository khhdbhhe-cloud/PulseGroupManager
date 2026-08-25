const { Markup } = require("telegraf");
const { checkAdmin } = require("./security");

// =====================================
// متن پنل اصلی
// =====================================

function panelText() {
  return `『𓆩 پنل مدیریت 𓆪』

بخش مدیریت و عملیات گروه را انتخاب کنید.

★ فقط مدیران و مالک گروه
★ هر پنل فقط برای شخصی است که آن را باز کرده است.`;
}


// =====================================
// ساخت دکمه
// =====================================

function panelButton(text, action, ownerId) {

  return Markup.button.callback(
    `『𓆩 ${text} 𓆪』`,
    `${action}:${ownerId}`
  );

}


// =====================================
// پنل اصلی
// =====================================

function mainPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        "مدیریت کاربران",
        "users",
        ownerId
      )
    ],

    [
      panelButton(
        "مدیریت پیام‌ها",
        "messages",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل‌های گروه",
        "locks",
        ownerId
      )
    ],

    [
      panelButton(
        "سیستم اخطار",
        "warnings",
        ownerId
      )
    ],

    [
      panelButton(
        "ورود و خروج",
        "joinleave",
        ownerId
      )
    ],

    [
      panelButton(
        "قوانین",
        "rules",
        ownerId
      )
    ],

    [
      panelButton(
        "آمار گروه",
        "stats",
        ownerId
      )
    ],

    [
      panelButton(
        "دسترسی‌ها",
        "permissions",
        ownerId
      )
    ],

    [
      panelButton(
        "بستن پنل",
        "panel_close",
        ownerId
      )
    ]

  ]);

}


// =====================================
// بررسی دسترسی و صاحب پنل
// =====================================

async function protectPanel(ctx) {

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


  // صاحب پنل
  if (
    ctx.callbackQuery &&
    ctx.match &&
    ctx.match[1]
  ) {

    const ownerId =
      String(ctx.match[1]);

    const currentUserId =
      String(ctx.from.id);


    if (
      ownerId !== currentUserId
    ) {

      try {

        await ctx.answerCbQuery(
          "『𓆩 ★ این پنل برای شما نیست ★ 𓆪』",
          {
            show_alert: true
          }
        );

      } catch {}

      return false;
    }
  }


  return true;
}


// =====================================
// دکمه برگشت
// =====================================

function backButton(ownerId) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        "بازگشت",
        "panel_home",
        ownerId
      )
    ],

    [
      panelButton(
        "بستن پنل",
        "panel_close",
        ownerId
      )
    ]

  ]);

}


// =====================================
// ثبت اکشن‌های پنل
// =====================================

function registerPanelActions(bot) {


  // ===================================
  // مدیریت کاربران
  // ===================================

  bot.action(
    /^users:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 مدیریت کاربران 𓆪』

عملیات مدیریت کاربران:

★ بن
★ آن‌بن
★ سکوت
★ رفع سکوت
★ محدودیت
★ رفع محدودیت
★ شناسنامه
★ آمار کاربر

دستورهای مدیریت روی پیام کاربر قابل اجرا هستند.`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // مدیریت پیام‌ها
  // ===================================

  bot.action(
    /^messages:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 مدیریت پیام‌ها 𓆪』

مدیریت پیام‌های گروه:

★ حذف پیام
★ پاکسازی
★ پیام‌های تکراری
★ پیام‌های ممنوع
★ تبلیغات`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // قفل‌های گروه
  // ===================================

  bot.action(
    /^locks:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل‌های گروه 𓆪』

نوع قفل را انتخاب کنید:

★ لینک
★ عکس
★ ویدیو
★ فایل
★ ویس
★ گیف
★ استیکر
★ فوروارد
★ منشن
★ نظرسنجی`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "لینک",
              "lock_link",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "رسانه",
              "lock_media",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "فوروارد",
              "lock_forward",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "منشن",
              "lock_mention",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "تبلیغات",
              "lock_ads",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // سیستم اخطار
  // ===================================

  bot.action(
    /^warnings:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 سیستم اخطار 𓆪』

مدیریت اخطار کاربران:

★ دادن اخطار
★ نمایش اخطارها
★ حذف اخطار
★ پاک کردن همه اخطارها

تنظیم تعداد اخطار و مجازات در بخش «تنظیمات» انجام می‌شود.`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // ورود و خروج
  // ===================================

  bot.action(
    /^joinleave:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 ورود و خروج 𓆪』

مدیریت اعضای جدید و خارج‌شده:

★ خوشامدگویی
★ پیام خروج
★ نمایش ورود
★ نمایش خروج

تنظیمات جزئی در بخش «تنظیمات» قرار دارد.`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // قوانین
  // ===================================

  bot.action(
    /^rules:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قوانین 𓆪』

مدیریت قوانین گروه:

★ نمایش قوانین
★ ویرایش قوانین
★ حذف قوانین

تنظیمات جزئی قوانین در بخش «تنظیمات» قرار دارد.`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // آمار گروه
  // ===================================

  bot.action(
    /^stats:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 آمار گروه 𓆪』

آمار گروه:

★ تعداد اعضا
★ تعداد مدیران
★ کاربران سکوت‌شده
★ کاربران محدود
★ اخطارها
★ پیام‌ها`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // دسترسی‌ها
  // ===================================

  bot.action(
    /^permissions:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 دسترسی‌ها 𓆪』

مدیریت دسترسی مدیران:

★ مدیران گروه
★ سطح دسترسی
★ اختیار مدیران
★ دسترسی به پنل
★ دسترسی به تنظیمات

تنظیمات دقیق دسترسی‌ها در بخش «تنظیمات» انجام می‌شود.`,
        backButton(ctx.from.id)
      );

    }
  );


  // ===================================
  // برگشت به پنل اصلی
  // ===================================

  bot.action(
    /^panel_home:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        panelText(),
        mainPanel(ctx.from.id)
      );

    }
  );


  // ===================================
  // قفل لینک
  // ===================================

  bot.action(
    /^lock_link:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل لینک 𓆪』

وضعیت فعلی:

☆ باز

از این قسمت قفل لینک مدیریت می‌شود.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل",
              "lock_link_on",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "باز کردن",
              "lock_link_off",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "locks",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // قفل رسانه
  // ===================================

  bot.action(
    /^lock_media:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل رسانه 𓆪』

رسانه‌هایی که می‌توان مدیریت کرد:

★ عکس
★ ویدیو
★ گیف
★ استیکر
★ ویس
★ فایل`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل رسانه",
              "lock_media_on",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "باز کردن",
              "lock_media_off",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "locks",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // قفل فوروارد
  // ===================================

  bot.action(
    /^lock_forward:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل فوروارد 𓆪』

وضعیت:

☆ باز`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل",
              "lock_forward_on",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "باز کردن",
              "lock_forward_off",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "locks",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // قفل منشن
  // ===================================

  bot.action(
    /^lock_mention:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل منشن 𓆪』

وضعیت:

☆ باز`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل",
              "lock_mention_on",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "باز کردن",
              "lock_mention_off",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "locks",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // قفل تبلیغات
  // ===================================

  bot.action(
    /^lock_ads:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل تبلیغات 𓆪』

وضعیت:

☆ باز`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل",
              "lock_ads_on",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "باز کردن",
              "lock_ads_off",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "locks",
              ctx.from.id
            )
          ]

        ])
      );

    }
  );


  // ===================================
  // بستن پنل
  // ===================================

  bot.action(
    /^panel_close:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) return;

      await ctx.answerCbQuery();

      try {

        await ctx.editMessageText(
          `『𓆩 ★ پنل مدیریت بسته شد ★ 𓆪』`
        );

      } catch (error) {

        console.log(
          "PANEL CLOSE ERROR:",
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
  registerPanelActions,
  mainPanel,
  panelText
};
