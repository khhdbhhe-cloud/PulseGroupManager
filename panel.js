// =====================================
// PulseGroupManager
// PANEL
// =====================================

const { Markup } = require("telegraf");

// =====================================
// متن پنل
// =====================================

function panelText() {

  return `『𓆩 پنل مدیریت 𓆪』

بخش مدیریت و عملیات گروه را انتخاب کنید.

★ فقط مالک و مدیران
★ هر پنل مخصوص شخصی است که آن را باز کرده است.`;

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
// دکمه‌های پایین صفحات
// =====================================

function navigationButtons(ownerId) {

  return [

    [
      panelButton(
        "صفحه بعد",
        "panel_next",
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

  ];

}


// =====================================
// پنل اصلی
// =====================================

function mainPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        "قفل گروه",
        "group_locks",
        ownerId
      )
    ],

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
        "صفحه بعد",
        "panel_next",
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

function protectPanel(ctx) {

  if (
    !ctx.callbackQuery ||
    !ctx.match ||
    !ctx.match[1]
  ) {

    return false;

  }


  const ownerId =
    String(ctx.match[1]);

  const currentUserId =
    String(ctx.from.id);


  if (
    ownerId !== currentUserId
  ) {

    try {

      ctx.answerCbQuery(
        "『𓆩 ★ این پنل برای شما نیست ★ 𓆪』",
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
// صفحه بعد
// =====================================

function nextPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        "اختیار مدیر",
        "manager_authority",
        ownerId
      )
    ],

    [
      panelButton(
        "محدودیت ارسال پست سرهم",
        "post_limit",
        ownerId
      )
    ],

    [
      panelButton(
        "ضد اسپم",
        "anti_spam",
        ownerId
      )
    ],

    [
      panelButton(
        "ضد فلود",
        "anti_flood",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل رسانه‌های نامناسب",
        "bad_media",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل فروش",
        "sales_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل پیام‌های تبلیغاتی",
        "ads_messages",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل نظرسنجی",
        "poll_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل ویس",
        "voice_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل فایل",
        "file_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل استیکر",
        "sticker_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل گیف",
        "gif_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل فیلم",
        "video_lock",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل پیام بلند",
        "long_message",
        ownerId
      )
    ],

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
// صفحه یک گزینه
// =====================================

function optionPanel(
  title,
  action,
  ownerId
) {

  return Markup.inlineKeyboard([

    [
      panelButton(
        `${title} ☆`,
        `${action}_toggle`,
        ownerId
      )
    ],

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
// ثبت اکشن‌ها
// =====================================

function registerPanelActions(bot) {


  // ===================================
  // صفحه بعد
  // ===================================

  bot.action(
    /^panel_next:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 صفحه بعد 𓆪』

قابلیت‌های بیشتر مدیریت گروه:`,
        nextPanel(ctx.from.id)
      );

    }
  );


  // ===================================
  // بازگشت
  // ===================================

  bot.action(
    /^panel_home:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        panelText(),
        mainPanel(ctx.from.id)
      );

    }
  );


  // ===================================
  // قفل گروه
  // ===================================

  bot.action(
    /^group_locks:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 قفل گروه 𓆪』

قفل‌های مربوط به مدیریت گروه در این بخش قرار می‌گیرند.`,
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
              "قفل هشتگ",
              "lock_hashtag",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل منشن",
              "lock_mention",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل پیام بلند",
              "lock_long_message",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل یوزرنیم",
              "lock_username",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل رسانه",
              "lock_media",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل آیدی",
              "lock_id",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل ممبر دزد",
              "lock_member_thief",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل خیانت",
              "lock_treason",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل ضد خیانت",
              "lock_anti_treason",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "قفل دشمن",
              "lock_enemy",
              ctx.from.id
            )
          ],

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // مدیریت کاربران
  // ===================================

  bot.action(
    /^users:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 مدیریت کاربران 𓆪』

بخش مدیریت کاربران گروه.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // مدیریت پیام‌ها
  // ===================================

  bot.action(
    /^messages:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 مدیریت پیام‌ها 𓆪』

بخش مدیریت پیام‌های گروه.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // قفل‌های گروه
  // ===================================

  bot.action(
    /^locks:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 قفل‌های گروه 𓆪』

قفل‌های گروه از این بخش مدیریت خواهند شد.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // سیستم اخطار
  // ===================================

  bot.action(
    /^warnings:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 سیستم اخطار 𓆪』

مدیریت سیستم اخطار گروه.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // ورود و خروج
  // ===================================

  bot.action(
    /^joinleave:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 ورود و خروج 𓆪』

مدیریت ورود و خروج اعضای گروه.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // قوانین
  // ===================================

  bot.action(
    /^rules:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 قوانین 𓆪』

مدیریت قوانین گروه.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // آمار
  // ===================================

  bot.action(
    /^stats:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 آمار گروه 𓆪』

آمار گروه در این بخش نمایش داده خواهد شد.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // دسترسی‌ها
  // ===================================

  bot.action(
    /^permissions:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
        `『𓆩 دسترسی‌ها 𓆪』

مدیریت دسترسی مدیران گروه.`,
        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
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


  // ===================================
  // گزینه‌های صفحه دوم
  // ===================================

  const options = [

    ["manager_authority", "اختیار مدیر"],
    ["post_limit", "محدودیت ارسال پست سرهم"],
    ["anti_spam", "ضد اسپم"],
    ["anti_flood", "ضد فلود"],
    ["bad_media", "قفل رسانه‌های نامناسب"],
    ["sales_lock", "قفل فروش"],
    ["ads_messages", "قفل پیام‌های تبلیغاتی"],
    ["poll_lock", "قفل نظرسنجی"],
    ["voice_lock", "قفل ویس"],
    ["file_lock", "قفل فایل"],
    ["sticker_lock", "قفل استیکر"],
    ["gif_lock", "قفل گیف"],
    ["video_lock", "قفل فیلم"],
    ["long_message", "قفل پیام بلند"]

  ];


  for (const [action, title] of options) {

    bot.action(
      new RegExp(`^${action}:(\\d+)$`),
      async ctx => {

        if (!protectPanel(ctx)) return;

        await ctx.answerCbQuery();

        await ctx.editMessageText(
          `『𓆩 ${title} 𓆪』\n\nوضعیت این گزینه در این مرحله فقط نمایشی است.`,
          optionPanel(
            title,
            action,
            ctx.from.id
          )
        );

      }
    );

  }


  // ===================================
  // گزینه‌های قفل گروه
  // ===================================

  const lockOptions = [

    ["lock_link", "لینک"],
    ["lock_forward", "فوروارد"],
    ["lock_hashtag", "هشتگ"],
    ["lock_mention", "منشن"],
    ["lock_long_message", "پیام بلند"],
    ["lock_username", "یوزرنیم"],
    ["lock_media", "رسانه"],
    ["lock_id", "آیدی"],
    ["lock_member_thief", "ممبر دزد"],
    ["lock_treason", "خیانت"],
    ["lock_anti_treason", "ضد خیانت"],
    ["lock_enemy", "دشمن"]

  ];


  for (const [action, title] of lockOptions) {

    bot.action(
      new RegExp(`^${action}:(\\d+)$`),
      async ctx => {

        if (!protectPanel(ctx)) return;

        await ctx.answerCbQuery();

        await ctx.editMessageText(
          `『𓆩 قفل ${title} 𓆪』`,
          optionPanel(
            title,
            action,
            ctx.from.id
          )
        );

      }
    );

  }


  // ===================================
  // بستن پنل
  // ===================================

  bot.action(
    /^panel_close:(\d+)$/,
    async ctx => {

      if (!protectPanel(ctx)) return;

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
