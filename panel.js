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
★ هر پنل مخصوص شخصی است که آن را باز کرده است.
★ مالک اصلی بالاترین دسترسی را دارد.`;

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
// تشخیص مالک و مدیر واقعی گروه
// =====================================

async function getGroupRole(ctx) {

  try {

    if (
      !ctx.chat ||
      !ctx.from
    ) {

      return {
        ok: false,
        role: "unknown"
      };

    }


    const chatType =
      ctx.chat.type;


    // فقط گروه و سوپرگروه
    if (
      chatType !== "group" &&
      chatType !== "supergroup"
    ) {

      return {
        ok: false,
        role: "not_group"
      };

    }


    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );


    if (!member) {

      return {
        ok: false,
        role: "unknown"
      };

    }


    // مالک اصلی گروه
    if (
      member.status === "creator"
    ) {

      return {
        ok: true,
        role: "owner"
      };

    }


    // مدیر گروه
    if (
      member.status === "administrator"
    ) {

      return {
        ok: true,
        role: "admin"
      };

    }


    // عضو عادی
    return {
      ok: false,
      role: "member"
    };

  }

  catch (error) {

    console.log(
      "PANEL ROLE CHECK ERROR:",
      error.message
    );


    return {
      ok: false,
      role: "unknown"
    };

  }

}


// =====================================
// بررسی دسترسی به پنل
// =====================================

async function protectPanel(ctx) {

  if (
    !ctx.callbackQuery ||
    !ctx.match ||
    !ctx.match[1]
  ) {

    return false;

  }


  const panelOwnerId =
    String(ctx.match[1]);


  const currentUserId =
    String(ctx.from.id);


  // ===================================
  // تشخیص نقش واقعی کاربر
  // ===================================

  const role =
    await getGroupRole(ctx);


  // ===================================
  // عضو عادی یا فرد بدون دسترسی
  // ===================================

  if (!role.ok) {

    try {

      await ctx.answerCbQuery(
        "『𓆩 ★ شما اجازه استفاده از پنل مدیریت را ندارید ★ 𓆪』",
        {
          show_alert: true
        }
      );

    }

    catch {}

    return false;

  }


  // ===================================
  // مالک اصلی
  // ===================================
  //
  // مالک می‌تواند پنل خودش را باز کند
  // و همچنین می‌تواند پنل مدیران را مشاهده کند.
  //

  if (
    role.role === "owner"
  ) {

    return true;

  }


  // ===================================
  // مدیر
  // ===================================
  //
  // مدیر فقط پنلی را می‌تواند کنترل کند
  // که خودش آن را باز کرده است.
  //

  if (
    role.role === "admin"
  ) {

    if (
      panelOwnerId !== currentUserId
    ) {

      try {

        await ctx.answerCbQuery(
          "『𓆩 ★ این پنل برای شما نیست ★ 𓆪』",
          {
            show_alert: true
          }
        );

      }

      catch {}

      return false;

    }


    return true;

  }


  return false;

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
// ثبت اکشن‌های پنل
// =====================================

function registerPanelActions(bot) {


  // ===================================
  // صفحه بعد
  // ===================================

  bot.action(
    /^panel_next:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 صفحه بعد 𓆪』

قابلیت‌های بیشتر مدیریت گروه:`,

        nextPanel(
          ctx.match[1]
        )

      );

    }
  );


  // ===================================
  // بازگشت
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
          ctx.match[1]
        )

      );

    }
  );


  // ===================================
  // قفل گروه
  // ===================================

  bot.action(
    /^group_locks:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 قفل گروه 𓆪』

قفل‌های مربوط به مدیریت گروه:`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "قفل لینک",
              "lock_link",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل فوروارد",
              "lock_forward",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل هشتگ",
              "lock_hashtag",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل منشن",
              "lock_mention",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل پیام بلند",
              "lock_long_message",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل یوزرنیم",
              "lock_username",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل رسانه",
              "lock_media",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل آیدی",
              "lock_id",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل ممبر دزد",
              "lock_member_thief",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل خیانت",
              "lock_treason",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل ضد خیانت",
              "lock_anti_treason",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "قفل دشمن",
              "lock_enemy",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 مدیریت کاربران 𓆪』

بخش مدیریت کاربران گروه.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 مدیریت پیام‌ها 𓆪』

بخش مدیریت پیام‌های گروه.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 سیستم اخطار 𓆪』

مدیریت سیستم اخطار گروه.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 ورود و خروج 𓆪』

مدیریت ورود و خروج اعضای گروه.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 قوانین 𓆪』

مدیریت قوانین گروه.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 آمار گروه 𓆪』

آمار گروه در این بخش نمایش داده خواهد شد.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      await ctx.editMessageText(

        `『𓆩 دسترسی‌ها 𓆪』

مدیریت دسترسی مدیران گروه.`,

        Markup.inlineKeyboard([

          [
            panelButton(
              "بازگشت",
              "panel_home",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بستن پنل",
              "panel_close",
              ctx.match[1]
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

    [
      "manager_authority",
      "اختیار مدیر"
    ],

    [
      "post_limit",
      "محدودیت ارسال پست سرهم"
    ],

    [
      "anti_spam",
      "ضد اسپم"
    ],

    [
      "anti_flood",
      "ضد فلود"
    ],

    [
      "bad_media",
      "قفل رسانه‌های نامناسب"
    ],

    [
      "sales_lock",
      "قفل فروش"
    ],

    [
      "ads_messages",
      "قفل پیام‌های تبلیغاتی"
    ],

    [
      "poll_lock",
      "قفل نظرسنجی"
    ],

    [
      "voice_lock",
      "قفل ویس"
    ],

    [
      "file_lock",
      "قفل فایل"
    ],

    [
      "sticker_lock",
      "قفل استیکر"
    ],

    [
      "gif_lock",
      "قفل گیف"
    ],

    [
      "video_lock",
      "قفل فیلم"
    ],

    [
      "long_message",
      "قفل پیام بلند"
    ]

  ];


  for (
    const [action, title]
    of options
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

          `『𓆩 ${title} 𓆪』

وضعیت این گزینه در این مرحله فقط نمایشی است.`,

          optionPanel(
            title,
            action,
            ctx.match[1]
          )

        );

      }

    );

  }


  // ===================================
  // گزینه‌های قفل گروه
  // ===================================

  const lockOptions = [

    [
      "lock_link",
      "لینک"
    ],

    [
      "lock_forward",
      "فوروارد"
    ],

    [
      "lock_hashtag",
      "هشتگ"
    ],

    [
      "lock_mention",
      "منشن"
    ],

    [
      "lock_long_message",
      "پیام بلند"
    ],

    [
      "lock_username",
      "یوزرنیم"
    ],

    [
      "lock_media",
      "رسانه"
    ],

    [
      "lock_id",
      "آیدی"
    ],

    [
      "lock_member_thief",
      "ممبر دزد"
    ],

    [
      "lock_treason",
      "خیانت"
    ],

    [
      "lock_anti_treason",
      "ضد خیانت"
    ],

    [
      "lock_enemy",
      "دشمن"
    ]

  ];


  for (
    const [action, title]
    of lockOptions
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

          `『𓆩 قفل ${title} 𓆪』`,

          optionPanel(
            title,
            action,
            ctx.match[1]
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
  panelText,
  protectPanel,
  getGroupRole

};
