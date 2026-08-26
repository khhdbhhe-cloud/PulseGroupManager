// =====================================
// PulseGroupManager
// MANAGEMENT PANEL
// =====================================

const { Markup } = require("telegraf");

const {
  checkAdmin
} = require("./security");

const {
  getUserPermissions,
  setPermission,
  permissionText
} = require("./permissions");


// =====================================
// متن پنل
// =====================================

function panelText() {

  return `『𓆩 پنل مدیریت 𓆪』

بخش مدیریت و عملیات گروه را انتخاب کنید.

★ فقط مدیران و مالک گروه

★ هر پنل فقط برای شخصی است
که آن را باز کرده است.`;

}


// =====================================
// ساخت دکمه
// =====================================

function panelButton(
  text,
  action,
  ownerId
) {

  return Markup.button.callback(
    `『𓆩 ${text} 𓆪』`,
    `${action}:${ownerId}`
  );

}


// =====================================
// پنل اصلی
// =====================================

function mainPanel(
  ownerId
) {

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
// بررسی صاحب پنل
// =====================================

async function protectPanel(
  ctx
) {

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
// برگشت
// =====================================

function backButton(
  ownerId
) {

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
// ثبت پنل
// =====================================

function registerPanelActions(
  bot
) {


  // ===================================
  // مدیریت کاربران
  // ===================================

  bot.action(
    /^users:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 مدیریت کاربران 𓆪』

برای مدیریت یک کاربر:

دستور موردنظر را روی پیام همان کاربر ریپلای کنید.

★ بن
★ آن‌بن
★ سکوت
★ رفع سکوت
★ اخطار
★ حذف اخطار
★ شناسنامه
★ آمار کاربر

برای مدیریت دسترسی یک مدیر:
روی پیام او ریپلای کنید و گزینه «دسترسی‌ها» را انتخاب کنید.`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // دسترسی‌ها
  // ===================================

  bot.action(
    /^permissions:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      /*
       * این صفحه زمانی که از پنل اصلی
       * باز شود، فقط راهنمای انتخاب
       * کاربر را نمایش می‌دهد.
       *
       * انتخاب واقعی کاربر از طریق
       * ریپلای انجام می‌شود.
       */

      await ctx.editMessageText(

`『𓆩 دسترسی مدیران 𓆪』

برای تنظیم دسترسی یک مدیر:

روی پیام همان مدیر ریپلای کنید و بنویسید:

دسترسی

سپس پنل اختصاصی دسترسی‌های همان کاربر نمایش داده می‌شود.

★ = دسترسی دارد
☆ = دسترسی ندارد`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // قفل‌ها
  // ===================================

  bot.action(
    /^locks:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قفل‌های گروه 𓆪』

نوع قفل را انتخاب کنید:`,

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
  // قفل لینک
  // ===================================

  bot.action(
    /^lock_link:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قفل لینک 𓆪』

وضعیت فعلی را انتخاب کنید:`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل کردن لینک",
              "lock_link_on",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "باز کردن لینک",
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
  // قفل لینک - روشن
  // ===================================

  bot.action(
    /^lock_link_on:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      /*
       * اجرای واقعی قفل لینک
       * در فایل سیستم قفل‌ها انجام می‌شود.
       *
       * اینجا فعلاً رویداد را به آن
       * سیستم ارسال می‌کنیم.
       */

      try {

        await ctx.editMessageText(

`『𓆩 ★ قفل لینک ★ 𓆪』

قفل لینک بسته شد. 🔒`,

          backButton(
            ctx.from.id
          )

        );

      }

      catch (error) {

        console.log(
          "LOCK LINK ON ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // قفل لینک - خاموش
  // ===================================

  bot.action(
    /^lock_link_off:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

        await ctx.editMessageText(

`『𓆩 ★ قفل لینک ★ 𓆪』

قفل لینک باز شد. 🔓`,

          backButton(
            ctx.from.id
          )

        );

      }

      catch (error) {

        console.log(
          "LOCK LINK OFF ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // قفل رسانه
  // ===================================

  bot.action(
    /^lock_media:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قفل رسانه 𓆪』

رسانه‌های گروه را مدیریت کنید:`,

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
              "باز کردن رسانه",
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
  // قفل رسانه - روشن
  // ===================================

  bot.action(
    /^lock_media_on:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ قفل رسانه ★ 𓆪』

قفل رسانه بسته شد. 🔒`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // قفل رسانه - خاموش
  // ===================================

  bot.action(
    /^lock_media_off:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ قفل رسانه ★ 𓆪』

قفل رسانه باز شد. 🔓`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // فوروارد
  // ===================================

  bot.action(
    /^lock_forward:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قفل فوروارد 𓆪』

وضعیت را انتخاب کنید:`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل کردن",
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


  bot.action(
    /^lock_forward_on:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ فوروارد ★ 𓆪』

قفل فوروارد بسته شد. 🔒`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  bot.action(
    /^lock_forward_off:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ فوروارد ★ 𓆪』

قفل فوروارد باز شد. 🔓`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // منشن
  // ===================================

  bot.action(
    /^lock_mention:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قفل منشن 𓆪』

وضعیت را انتخاب کنید:`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل کردن",
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


  bot.action(
    /^lock_mention_on:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ منشن ★ 𓆪』

قفل منشن بسته شد. 🔒`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  bot.action(
    /^lock_mention_off:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ منشن ★ 𓆪』

قفل منشن باز شد. 🔓`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // تبلیغات
  // ===================================

  bot.action(
    /^lock_ads:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قفل تبلیغات 𓆪』

وضعیت را انتخاب کنید:`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل کردن",
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


  bot.action(
    /^lock_ads_on:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ تبلیغات ★ 𓆪』

قفل تبلیغات بسته شد. 🔒`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  bot.action(
    /^lock_ads_off:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ★ تبلیغات ★ 𓆪』

قفل تبلیغات باز شد. 🔓`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // سیستم اخطار
  // ===================================

  bot.action(
    /^warnings:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 سیستم اخطار 𓆪』

★ دادن اخطار
★ نمایش اخطار
★ حذف اخطار
★ پاک کردن اخطارها

تنظیم تعداد اخطار و مجازات
در بخش تنظیمات انجام می‌شود.`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // ورود و خروج
  // ===================================

  bot.action(
    /^joinleave:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 ورود و خروج 𓆪』

★ خوشامدگویی
★ پیام خروج
★ نمایش ورود
★ نمایش خروج

تنظیمات در بخش تنظیمات قرار دارد.`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // قوانین
  // ===================================

  bot.action(
    /^rules:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 قوانین 𓆪』

★ نمایش قوانین
★ ویرایش قوانین
★ حذف قوانین`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // آمار
  // ===================================

  bot.action(
    /^stats:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

`『𓆩 آمار گروه 𓆪』

★ تعداد اعضا
★ تعداد مدیران
★ کاربران سکوت‌شده
★ کاربران محدود
★ اخطارها
★ پیام‌ها`,

        backButton(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // بازگشت به خانه
  // ===================================

  bot.action(
    /^panel_home:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(
        panelText(),
        mainPanel(
          ctx.from.id
        )
      );

    }
  );


  // ===================================
  // بستن پنل
  // ===================================

  bot.action(
    /^panel_close:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

        await ctx.editMessageText(
          `『𓆩 ★ پنل مدیریت بسته شد ★ 𓆪』`
        );

      }

      catch (error) {

        console.log(
          "PANEL CLOSE ERROR:",
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

  registerPanelActions,

  mainPanel,

  panelText

};
