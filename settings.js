const { Markup } = require("telegraf");
const { checkAdmin } = require("./security");

const {
  getWarningSettings,
  setMaxWarnings,
  setWarningPunishment,
  setWarningDuration
} = require("./warning-settings");


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
      settingButton("خوشامدگویی", "set_welcome", ownerId)
    ],

    [
      settingButton("مدیریت", "set_management", ownerId)
    ],

    [
      settingButton("اختیار", "set_warn", ownerId)
    ],

    [
      settingButton("سکوت", "set_mute", ownerId)
    ],

    [
      settingButton("محدودیت", "set_restrict", ownerId)
    ],

    [
      settingButton("بن", "set_ban", ownerId)
    ],

    [
      settingButton("فوروارد", "set_forward", ownerId)
    ],

    [
      settingButton("ضدفلود", "set_flood", ownerId)
    ],

    [
      settingButton("ورود و خروج", "set_joinleave", ownerId)
    ],

    [
      settingButton("پیام‌ها", "set_messages", ownerId)
    ],

    [
      settingButton("قوانین", "set_rules", ownerId)
    ],

    [
      settingButton("بستن", "settings_close", ownerId)
    ]

  ]);

}


// =====================================
// متن تنظیمات
// =====================================

function settingsText() {

  return `『𓆩 تنظیمات PulseGroupManager 𓆪』

بخش تنظیمات گروه

گزینه موردنظر را انتخاب کنید.

★ فقط مدیران و مالک گروه دسترسی دارند.`;

}


// =====================================
// بررسی دسترسی + صاحب پنل
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
          "『𓆩 ★ این بخش برای شما نیست ★ 𓆪』",
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
// دکمه‌های برگشت
// =====================================

function backToSettings(ownerId) {

  return Markup.inlineKeyboard([

    [
      settingButton(
        "بازگشت",
        "settings_home",
        ownerId
      )
    ],

    [
      settingButton(
        "بستن",
        "settings_close",
        ownerId
      )
    ]

  ]);

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

      if (
        !ctx.chat ||
        (
          ctx.chat.type !== "group" &&
          ctx.chat.type !== "supergroup"
        )
      ) {

        return;

      }


      const access =
        await checkAdmin(ctx);

      if (!access.ok) {

        return;

      }


      try {

        await ctx.reply(
          settingsText(),
          {
            ...settingsPanel(ctx.from.id),

            reply_parameters: {
              message_id:
                ctx.message.message_id
            }

          }
        );

      }

      catch (error) {

        console.log(
          "SETTINGS OPEN ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // بازگشت
  // ===================================

  bot.action(
    /^settings_home:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) {

        return;

      }

      await ctx.answerCbQuery();

      try {

        await ctx.editMessageText(
          settingsText(),
          settingsPanel(ctx.from.id)
        );

      }

      catch (error) {

        console.log(
          "SETTINGS HOME ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // خوشامدگویی
  // ===================================

  bot.action(
    /^set_welcome:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) {

        return;

      }

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات خوشامدگویی 𓆪』

از این قسمت می‌توانید سیستم خوشامدگویی اعضای جدید را مدیریت کنید.

★ وضعیت خوشامدگویی

خوشامد روشن
خوشامد خاموش

★ تنظیم رسانه خوشامد

تنظیم گیف
تنظیم ویدیو
تنظیم عکس
تنظیم استیکر

برای تنظیم رسانه:
روی رسانه موردنظر ریپلای کنید و دستور مربوطه را ارسال کنید.

مثال:

روی GIF ریپلای کنید
تنظیم گیف

★ حذف رسانه

حذف خوشامد

با این دستور رسانه خوشامد حذف می‌شود و ربات به حالت متن برمی‌گردد.

★ مشاهده وضعیت

وضعیت خوشامد

با این دستور وضعیت فعلی خوشامدگویی و نوع رسانه نمایش داده می‌شود.

★ مقام خوشامد

مقام خوشامد تنظیم

فقط مالک گروه می‌تواند این مقام را به یک مدیر بدهد.

حذف مقام خوشامد

مقام خوشامد مدیر را حذف می‌کند.

★ متن خوشامدگویی

متن پیش‌فرض خوشامدگویی توسط سیستم ارسال می‌شود.

تنظیم متن اختصاصی خوشامدگویی در بخش بعدی قابل اضافه شدن است.`,

        backToSettings(ctx.from.id)

      );

    }
  );


  // ===================================
  // مدیریت
  // ===================================

  bot.action(
    /^set_management:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات مدیریت 𓆪』

تنظیمات مربوط به دسترسی مدیران.

★ استفاده از پنل
★ اجرای دستورات
★ مدیریت کاربران
★ مدیریت تنظیمات

فقط مدیر و مالک اجازه تغییر دارند.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // اختیار / اخطار
  // ===================================

  bot.action(
    /^set_warn:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();

      const config =
        getWarningSettings(
          ctx.chat.id
        );


      const punishmentText =
        config.punishment === "mute"
          ? "سکوت"
          : config.punishment === "restrict"
            ? "محدودیت"
            : "بن";


      await ctx.editMessageText(
`『𓆩 تنظیمات اختیار 𓆪』

تعداد اخطار فعلی:
★ ${config.maxWarnings}

مجازات فعلی:
★ ${punishmentText}

مدت مجازات:
★ ${config.duration} دقیقه

تعداد اخطار را انتخاب کنید:`,

        Markup.inlineKeyboard([

          [
            settingButton(
              "۱ اخطار",
              "warn_count_1",
              ctx.from.id
            ),

            settingButton(
              "۲ اخطار",
              "warn_count_2",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "۳ اخطار",
              "warn_count_3",
              ctx.from.id
            ),

            settingButton(
              "۵ اخطار",
              "warn_count_5",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "۱۰ اخطار",
              "warn_count_10",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مجازات: سکوت",
              "warn_punish_mute",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مجازات: محدودیت",
              "warn_punish_restrict",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مجازات: بن",
              "warn_punish_ban",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مدت ۱ ساعت",
              "warn_duration_60",
              ctx.from.id
            ),

            settingButton(
              "مدت ۲ ساعت",
              "warn_duration_120",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مدت ۳ ساعت",
              "warn_duration_180",
              ctx.from.id
            ),

            settingButton(
              "مدت ۶ ساعت",
              "warn_duration_360",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "settings_home",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // تعداد اخطار
  // ===================================

  bot.action(
    /^warn_count_(1|2|3|5|10):(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;


      const count =
        Number(ctx.match[1]);


      setMaxWarnings(
        ctx.chat.id,
        count
      );


      await ctx.answerCbQuery(
        `تعداد اخطار روی ${count} تنظیم شد.`
      );


      await ctx.editMessageText(
`『𓆩 تنظیم اخطار 𓆪』

تعداد اخطار مجاز:

★ ${count}

بعد از رسیدن کاربر به این تعداد، مجازات انتخاب‌شده اجرا خواهد شد.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // نوع مجازات
  // ===================================

  bot.action(
    /^warn_punish_(mute|restrict|ban):(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;


      const punishment =
        ctx.match[1];


      setWarningPunishment(
        ctx.chat.id,
        punishment
      );


      const text =
        punishment === "mute"
          ? "سکوت"
          : punishment === "restrict"
            ? "محدودیت"
            : "بن";


      await ctx.answerCbQuery(
        `مجازات روی ${text} تنظیم شد.`
      );


      await ctx.editMessageText(
`『𓆩 مجازات اخطار 𓆪』

مجازات انتخاب‌شده:

★ ${text}

این مجازات پس از رسیدن کاربر به حد تعیین‌شده اجرا می‌شود.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // مدت مجازات
  // ===================================

  bot.action(
    /^warn_duration_(60|120|180|360):(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;


      const minutes =
        Number(ctx.match[1]);


      setWarningDuration(
        ctx.chat.id,
        minutes
      );


      const hours =
        minutes / 60;


      await ctx.answerCbQuery(
        `مدت روی ${hours} ساعت تنظیم شد.`
      );


      await ctx.editMessageText(
`『𓆩 مدت مجازات 𓆪』

مدت انتخاب‌شده:

★ ${hours} ساعت

این مدت برای مجازات اخطار استفاده خواهد شد.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // سکوت
  // ===================================

  bot.action(
    /^set_mute:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات سکوت 𓆪』

مدت سکوت:

۱ ساعت
۲ ساعت
۳ ساعت
۴ ساعت
۶ ساعت
۱۲ ساعت
۲۴ ساعت`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // محدودیت
  // ===================================

  bot.action(
    /^set_restrict:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات محدودیت 𓆪』

نوع محدودیت کاربر:

★ متن
★ عکس
★ ویدیو
★ فایل
★ ویس
★ استیکر`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // بن
  // ===================================

  bot.action(
    /^set_ban:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات بن 𓆪』

تنظیمات مربوط به بن کاربران.

★ مالک گروه قابل مدیریت نیست.
★ مدیر عادی نمی‌تواند مدیر دیگر را مدیریت کند.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // فوروارد
  // ===================================

  bot.action(
    /^set_forward:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات فوروارد 𓆪』

★ فوروارد مجاز
☆ فوروارد ممنوع`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // ضدفلود
  // ===================================

  bot.action(
    /^set_flood:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات ضدفلود 𓆪』

★ ضدفلود فعال
☆ ضدفلود غیرفعال

تعداد پیام و زمان بررسی در مرحله بعد قابل تنظیم است.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // ورود و خروج
  // ===================================

  bot.action(
    /^set_joinleave:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات ورود و خروج 𓆪』

★ خوشامدگویی
★ پیام خروج
★ فعال / غیرفعال`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // پیام‌ها
  // ===================================

  bot.action(
    /^set_messages:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات پیام‌ها 𓆪』

★ حذف پیام‌های ممنوع
★ پاکسازی پیام‌ها
★ پیام‌های خودکار`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // قوانین
  // ===================================

  bot.action(
    /^set_rules:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();


      await ctx.editMessageText(
`『𓆩 تنظیمات قوانین 𓆪』

قوانین گروه از این قسمت تنظیم و ویرایش می‌شوند.`,

        backToSettings(ctx.from.id)
      );

    }
  );


  // ===================================
  // بستن تنظیمات
  // ===================================

  bot.action(
    /^settings_close:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) {

        return;

      }


      await ctx.answerCbQuery();


      try {

        await ctx.editMessageText(
          `『𓆩 ★ بخش تنظیمات بسته شد ★ 𓆪』`
        );

      }

      catch (error) {

        console.log(
          "SETTINGS CLOSE ERROR:",
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

  registerSettings,
  settingsPanel,
  settingsText

};
