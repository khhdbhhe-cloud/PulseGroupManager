// =====================================
// PulseGroupManager
// PANEL
// =====================================

const { Markup } = require("telegraf");


// =====================================
// اتصال دیتابیس
// =====================================

const {
  getPermissions
} = require("./database");


// =====================================
// اتصال قفل‌های رسانه‌ای
// =====================================

const {
  getLock,
  setLock
} = require("./media-locks");


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


    // -------------------------------
    // فقط گروه و سوپرگروه
    // -------------------------------

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


    // -------------------------------
    // مالک اصلی
    // -------------------------------

    if (
      member.status === "creator"
    ) {

      return {
        ok: true,
        role: "owner"
      };

    }


    // -------------------------------
    // مدیر
    // -------------------------------

    if (
      member.status === "administrator"
    ) {

      return {
        ok: true,
        role: "admin"
      };

    }


    // -------------------------------
    // عضو عادی
    // -------------------------------

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
  // تشخیص نقش واقعی
  // ===================================

  const role =
    await getGroupRole(ctx);


  // ===================================
  // عضو عادی
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
  // مالک
  // ===================================

  if (
    role.role === "owner"
  ) {

    return true;

  }


  // ===================================
  // مدیر
  // ===================================

  if (
    role.role === "admin"
  ) {

    // مدیر فقط پنل خودش را کنترل می‌کند

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
// بررسی اجازه مدیریت قفل‌ها
// =====================================

async function canManageLocks(ctx) {

  try {

    const role =
      await getGroupRole(ctx);


    // -------------------------------
    // مالک همیشه اجازه دارد
    // -------------------------------

    if (
      role.role === "owner"
    ) {

      return true;

    }


    // -------------------------------
    // مدیر باید دسترسی locks داشته باشد
    // -------------------------------

    if (
      role.role === "admin"
    ) {

      const permissions =
        getPermissions(
          ctx.chat.id,
          ctx.from.id
        );


      return (
        permissions &&
        permissions.locks === true
      );

    }


    return false;

  }

  catch (error) {

    console.log(
      "PANEL LOCK PERMISSION ERROR:",
      error.message
    );


    return false;

  }

}


// =====================================
// نام فارسی قفل‌ها
// =====================================

const MEDIA_LOCK_NAMES = {

  sticker: "استیکر",

  gif: "گیف",

  photo: "عکس",

  video: "فیلم",

  voice: "ویس",

  longText: "پیام بلند",

  poll: "نظرسنجی"

};


// =====================================
// ساخت دکمه قفل رسانه
// =====================================

function mediaLockButton(
  title,
  lockType,
  ownerId,
  enabled
) {

  const symbol =
    enabled
      ? "★"
      : "☆";


  return Markup.button.callback(
    `『𓆩 ${title} ${symbol} 𓆪』`,
    `media_lock:${lockType}:${ownerId}`
  );

}


// =====================================
// ساخت صفحه قفل‌های رسانه
// =====================================

function mediaLocksPanel(
  ownerId,
  chatId
) {

  const sticker =
    getLock(
      chatId,
      "sticker"
    );


  const gif =
    getLock(
      chatId,
      "gif"
    );


  const photo =
    getLock(
      chatId,
      "photo"
    );


  const video =
    getLock(
      chatId,
      "video"
    );


  const voice =
    getLock(
      chatId,
      "voice"
    );


  const longText =
    getLock(
      chatId,
      "longText"
    );


  const poll =
    getLock(
      chatId,
      "poll"
    );


  return Markup.inlineKeyboard([

    [
      mediaLockButton(
        "استیکر",
        "sticker",
        ownerId,
        sticker
      )
    ],

    [
      mediaLockButton(
        "گیف",
        "gif",
        ownerId,
        gif
      )
    ],

    [
      mediaLockButton(
        "عکس",
        "photo",
        ownerId,
        photo
      )
    ],

    [
      mediaLockButton(
        "فیلم",
        "video",
        ownerId,
        video
      )
    ],

    [
      mediaLockButton(
        "ویس",
        "voice",
        ownerId,
        voice
      )
    ],

    [
      mediaLockButton(
        "پیام بلند",
        "longText",
        ownerId,
        longText
      )
    ],

    [
      mediaLockButton(
        "نظرسنجی",
        "poll",
        ownerId,
        poll
      )
    ],

    [
      panelButton(
        "بازگشت",
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
// متن وضعیت قفل
// =====================================

function mediaLockStatusText(
  lockType,
  enabled
) {

  const name =
    MEDIA_LOCK_NAMES[lockType] ||
    lockType;


  if (enabled) {

    return `『𓆩 قفل ${name} 𓆪』

🔒 وضعیت: فعال

اعضای عادی اجازه ارسال ${name} را ندارند.`;

  }


  return `『𓆩 قفل ${name} 𓆪』

🔓 وضعیت: غیرفعال

اعضای عادی می‌توانند ${name} ارسال کنند.`;

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

        }// =====================================
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


      try {

        await ctx.editMessageText(

          `『𓆩 صفحه بعد 𓆪』

قابلیت‌های بیشتر مدیریت گروه:`,

          nextPanel(
            ctx.match[1]
          )

        );

      }

      catch (error) {

        console.log(
          "PANEL NEXT ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // بازگشت به صفحه اصلی
  // ===================================

  bot.action(
    /^panel_home:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

        await ctx.editMessageText(

          panelText(),

          mainPanel(
            ctx.match[1]
          )

        );

      }

      catch (error) {

        console.log(
          "PANEL HOME ERROR:",
          error.message
        );

      }

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


      try {

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

      catch (error) {

        console.log(
          "GROUP LOCKS PANEL ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // قفل‌های رسانه‌ای واقعی
  // ===================================

  bot.action(
    /^lock_media:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

        await ctx.editMessageText(

          `『𓆩 قفل رسانه 𓆪』

وضعیت قفل‌های رسانه‌ای گروه:

★ فعال
☆ غیرفعال`,

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "MEDIA LOCK PANEL ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // تغییر واقعی قفل رسانه
  // ===================================

  bot.action(
    /^media_lock:(sticker|gif|photo|video|voice|longText|poll):(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const lockType =
        ctx.match[1];


      const ownerId =
        ctx.match[2];


      // --------------------------------
      // بررسی دسترسی مدیریت قفل
      // --------------------------------

      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      // --------------------------------
      // وضعیت فعلی
      // --------------------------------

      const current =
        getLock(
          ctx.chat.id,
          lockType
        );


      // --------------------------------
      // تغییر وضعیت
      // --------------------------------

      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        lockType,
        newValue
      );


      const name =
        MEDIA_LOCK_NAMES[lockType];


      try {

        await ctx.answerCbQuery(

          newValue
            ? `قفل ${name} فعال شد.`
            : `قفل ${name} باز شد.`

        );

      }

      catch {}


      // --------------------------------
      // بازسازی صفحه با وضعیت جدید
      // --------------------------------

      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            lockType,
            newValue
          ),

          mediaLocksPanel(
            ownerId,
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "MEDIA LOCK TOGGLE ERROR:",
          error.message
        );

      }

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


      try {

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

      catch (error) {

        console.log(
          "USERS PANEL ERROR:",
          error.message
        );

      }

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


      try {

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

      catch (error) {

        console.log(
          "MESSAGES PANEL ERROR:",
          error.message
        );

      }

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


      try {

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

      catch (error) {

        console.log(
          "WARNINGS PANEL ERROR:",
          error.message
        );

      }

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


      try {

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

      catch (error) {

        console.log(
          "JOINLEAVE PANEL ERROR:",
          error.message
        );

      }

    }
  );// =====================================
// قوانین
// =====================================

  bot.action(
    /^rules:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

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

      catch (error) {

        console.log(
          "RULES PANEL ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// آمار
// =====================================

  bot.action(
    /^stats:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

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

      catch (error) {

        console.log(
          "STATS PANEL ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// دسترسی‌ها
// =====================================

  bot.action(
    /^permissions:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      await ctx.answerCbQuery();


      try {

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

      catch (error) {

        console.log(
          "PERMISSIONS PANEL ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// گزینه‌های صفحه دوم
// =====================================

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


// =====================================
// ثبت گزینه‌های صفحه دوم
// =====================================

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


        try {

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

        catch (error) {

          console.log(
            "OPTION PANEL ERROR:",
            error.message
          );

        }

      }

    );

  }


// =====================================
// گزینه‌های قفل گروه
// =====================================

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


// =====================================
// ثبت گزینه‌های قفل گروه
// =====================================

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


        try {

          await ctx.editMessageText(

            `『𓆩 قفل ${title} 𓆪』`,

            optionPanel(
              title,
              action,
              ctx.match[1]
            )

          );

        }

        catch (error) {

          console.log(
            "GROUP LOCK OPTION ERROR:",
            error.message
          );

        }

      }

    );

  }


// =====================================
// قفل رسانه‌های صفحه دوم
// =====================================

  bot.action(
    /^sticker_lock:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "sticker"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "sticker",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل استیکر فعال شد."
            : "قفل استیکر باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "sticker",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "STICKER LOCK ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// قفل گیف صفحه دوم
// =====================================

  bot.action(
    /^gif_lock:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "gif"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "gif",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل گیف فعال شد."
            : "قفل گیف باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "gif",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "GIF LOCK ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// قفل فیلم صفحه دوم
// =====================================

  bot.action(
    /^video_lock:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "video"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "video",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل فیلم فعال شد."
            : "قفل فیلم باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "video",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "VIDEO LOCK ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// قفل ویس صفحه دوم
// =====================================

  bot.action(
    /^voice_lock:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "voice"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "voice",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل ویس فعال شد."
            : "قفل ویس باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "voice",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "VOICE LOCK ERROR:",
          error.message
        );

      }

    }
  );// =====================================
// قفل نظرسنجی صفحه دوم
// =====================================

  bot.action(
    /^poll_lock:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "poll"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "poll",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل نظرسنجی فعال شد."
            : "قفل نظرسنجی باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "poll",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "POLL LOCK ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// قفل پیام بلند صفحه دوم
// =====================================

  bot.action(
    /^long_message:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "longText"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "longText",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل پیام بلند فعال شد."
            : "قفل پیام بلند باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "longText",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "LONG MESSAGE LOCK ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// قفل عکس
// =====================================

  bot.action(
    /^media_photo:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      const allowed =
        await canManageLocks(ctx);


      if (!allowed) {

        try {

          await ctx.answerCbQuery(
            "『𓆩 ★ شما دسترسی مدیریت قفل‌ها را ندارید ★ 𓆪』",
            {
              show_alert: true
            }
          );

        }

        catch {}

        return;

      }


      const current =
        getLock(
          ctx.chat.id,
          "photo"
        );


      const newValue =
        !current;


      setLock(
        ctx.chat.id,
        "photo",
        newValue
      );


      try {

        await ctx.answerCbQuery(
          newValue
            ? "قفل عکس فعال شد."
            : "قفل عکس باز شد."
        );

      }

      catch {}


      try {

        await ctx.editMessageText(

          mediaLockStatusText(
            "photo",
            newValue
          ),

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )

        );

      }

      catch (error) {

        console.log(
          "PHOTO LOCK ERROR:",
          error.message
        );

      }

    }
  );


// =====================================
// بستن پنل
// =====================================

  bot.action(
    /^panel_close:(\d+)$/,
    async ctx => {

      if (
        !(await protectPanel(ctx))
      ) return;


      try {

        await ctx.answerCbQuery();

      }

      catch {}


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


  // ===================================
  // ثبت موفق پنل
  // ===================================

  console.log(
    "PANEL ACTIONS: registered."
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
