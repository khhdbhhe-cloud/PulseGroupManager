const { Markup } = require("telegraf");
const { checkAdmin } = require("./security");

// =====================================
// متن پنل اصلی
// =====================================

function panelText() {
  return `『𓆩 پنل مدیریت 𓆪』

بخش مدیریت قفل‌های گروه

از گزینه‌های زیر برای مدیریت قفل‌ها استفاده کنید.

★ فقط مدیران و مالک گروه
★ هر پنل فقط برای شخصی است که آن را باز کرده است.`;
}

// =====================================
// دکمه
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
        "قفل‌ها",
        "locks",
        ownerId
      )
    ],

    [
      panelButton(
        "پیام‌ها",
        "message_locks",
        ownerId
      )
    ],

    [
      panelButton(
        "رسانه‌ها",
        "media_locks",
        ownerId
      )
    ],

    [
      panelButton(
        "لینک و فوروارد",
        "link_locks",
        ownerId
      )
    ],

    [
      panelButton(
        "کاربران",
        "user_management",
        ownerId
      )
    ],

    [
      panelButton(
        "آمار گروه",
        "group_stats",
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


  // -----------------------------------
  // بررسی صاحب پنل
  // -----------------------------------

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
// ثبت اکشن‌های پنل
// =====================================

function registerPanelActions(bot) {

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

نوع قفل را انتخاب کنید:

★ لینک
★ منشن
★ تگ
★ فوروارد
★ ربات
★ تبلیغات`,
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
              "منشن",
              "lock_mention",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "تگ",
              "lock_tag",
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
              "ربات",
              "lock_bot",
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
  // قفل پیام‌ها
  // ===================================

  bot.action(
    /^message_locks:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل پیام‌ها 𓆪』

تنظیمات پیام‌های گروه:

★ متن
★ پیام‌های تکراری
★ تبلیغات
★ لینک
★ منشن`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "متن",
              "lock_text",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "لینک",
              "lock_link",
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
  // رسانه‌ها
  // ===================================

  bot.action(
    /^media_locks:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 قفل رسانه‌ها 𓆪』

نوع رسانه را انتخاب کنید:

★ عکس
★ ویدیو
★ گیف
★ استیکر
★ ویس
★ فایل`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "عکس",
              "lock_photo",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "ویدیو",
              "lock_video",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "گیف",
              "lock_gif",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "استیکر",
              "lock_sticker",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "ویس",
              "lock_voice",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "فایل",
              "lock_document",
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
  // لینک و فوروارد
  // ===================================

  bot.action(
    /^link_locks:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 لینک و فوروارد 𓆪』

تنظیمات:

★ لینک
★ فوروارد
★ تبلیغات
★ منشن`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل لینک",
              "lock_link",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل فوروارد",
              "lock_forward",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل تبلیغات",
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
  // مدیریت کاربران
  // ===================================

  bot.action(
    /^user_management:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 مدیریت کاربران 𓆪』

برای مدیریت یک کاربر، دستور مربوطه را روی پیام همان کاربر اجرا کنید.

★ بن
★ آن‌بن
★ سکوت
★ رفع سکوت
★ محدودیت
★ شناسنامه`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "راهنما",
              "user_help",
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
  // آمار
  // ===================================

  bot.action(
    /^group_stats:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 آمار گروه 𓆪』

آمار کامل گروه در مرحله بعد به سیستم آمار متصل می‌شود.

★ اعضا
★ مدیران
★ کاربران محدود
★ کاربران سکوت‌شده
★ اخطارها`,
        Markup.inlineKeyboard([

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
  // برگشت به پنل اصلی
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
        mainPanel(ctx.from.id)
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

      } catch (error) {

        console.log(
          "PANEL CLOSE ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // اکشن‌های فعلی قفل‌ها
  // فعلاً فقط نمایش وضعیت
  // ===================================

  const lockActions = [
    ["lock_link", "لینک"],
    ["lock_mention", "منشن"],
    ["lock_tag", "تگ"],
    ["lock_forward", "فوروارد"],
    ["lock_bot", "ربات"],
    ["lock_ads", "تبلیغات"],
    ["lock_text", "متن"],
    ["lock_photo", "عکس"],
    ["lock_video", "ویدیو"],
    ["lock_gif", "گیف"],
    ["lock_sticker", "استیکر"],
    ["lock_voice", "ویس"],
    ["lock_document", "فایل"]
  ];


  for (
    const [action, title]
    of lockActions
  ) {

    bot.action(
      new RegExp(
        `^${action}:(\\d+)$`
      ),

      async ctx => {

        if (
          !(await protectPanel(ctx))
        ) return;

        await ctx.answerCbQuery();

        await ctx.editMessageText(
`『𓆩 قفل ${title} 𓆪』

وضعیت فعلی:

☆ باز

از این قسمت می‌توان وضعیت قفل را تغییر داد.`,
          Markup.inlineKeyboard([

            [
              panelButton(
                "قفل",
                `${action}_on`,
                ctx.from.id
              )
            ],

            [
              panelButton(
                "باز کردن",
                `${action}_off`,
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

  }


  // ===================================
  // وضعیت قفل
  // ===================================

  for (
    const [action, title]
    of lockActions
  ) {

    bot.action(
      new RegExp(
        `^${action}_on:(\\d+)$`
      ),

      async ctx => {

        if (
          !(await protectPanel(ctx))
        ) return;

        await ctx.answerCbQuery(
          `★ قفل ${title} انتخاب شد`
        );

      }
    );


    bot.action(
      new RegExp(
        `^${action}_off:(\\d+)$`
      ),

      async ctx => {

        if (
          !(await protectPanel(ctx))
        ) return;

        await ctx.answerCbQuery(
          `☆ قفل ${title} باز شد`
        );

      }
    );

  }


  // ===================================
  // راهنمای مدیریت کاربران
  // ===================================

  bot.action(
    /^user_help:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 راهنمای مدیریت کاربران 𓆪』

برای مدیریت کاربر، دستور را روی پیام همان کاربر اجرا کنید.

مثال:

بن
آن‌بن
سکوت
رفع سکوت
محدودیت
شناسنامه

جزئیات کامل هر دستور در بخش راهنمای اصلی ربات قرار دارد.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "user_management",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.from.id
            )
          ]

        ])
      );

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
