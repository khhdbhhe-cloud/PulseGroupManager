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
// بررسی دسترسی
// =====================================

async function protectSettings(ctx) {

  const access = await checkAdmin(ctx);

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

      // فقط داخل گروه
      if (
        !ctx.chat ||
        (
          ctx.chat.type !== "group" &&
          ctx.chat.type !== "supergroup"
        )
      ) {
        return;
      }

      // فقط مدیر و مالک
      const access =
        await checkAdmin(ctx);

      if (!access.ok) {

        // کاربر عادی هیچ پنلی دریافت نمی‌کند
        return;
      }

      // باز کردن تنظیمات با ریپلای به همان پیام
      try {

        await ctx.reply(
          settingsText(),
          {
            ...settingsPanel(ctx.from.id),
            reply_parameters: {
              message_id: ctx.message.message_id
            }
          }
        );

      } catch (error) {

        console.log(
          "SETTINGS OPEN ERROR:",
          error.message
        );

      }

    }
  );

  // ===================================
  // برگشت به صفحه اصلی تنظیمات
  // ===================================

  bot.action(
    /^settings_home:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) {
        return;
      }

      if (
        String(ctx.from.id) !==
        String(ctx.match[1])
      ) {

        return ctx.answerCbQuery(
          "『𓆩 ★ این تنظیمات برای شما نیست ★ 𓆪』",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      try {

        await ctx.editMessageText(
          settingsText(),
          settingsPanel(ctx.from.id)
        );

      } catch (error) {

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

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات خوشامدگویی 𓆪』

از این قسمت خوشامدگویی اعضای جدید تنظیم می‌شود.

★ فعال
☆ غیرفعال

متن خوشامدگویی نیز قابل تنظیم خواهد بود.`,
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
  // اختیار
  // ===================================

  bot.action(
    /^set_warn:(\d+)$/,
    async ctx => {

      if (!(await protectSettings(ctx))) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(
`『𓆩 تنظیمات اختیار 𓆪』

تعداد اختیار:
۳

بعد از رسیدن به حد:
سکوت

مدت سکوت:
۲ ساعت

این قسمت بعداً به تنظیمات واقعی متصل می‌شود.

مثال:

۳ اختیار
↓
سکوت
↓
۲ ساعت`,
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

      if (
        String(ctx.from.id) !==
        String(ctx.match[1])
      ) {

        return ctx.answerCbQuery(
          "『𓆩 ★ این تنظیمات برای شما نیست ★ 𓆪』",
          {
            show_alert: true
          }
        );

      }

      await ctx.answerCbQuery();

      try {

        await ctx.editMessageText(
          `『𓆩 ★ بخش تنظیمات بسته شد ★ 𓆪』`
        );

      } catch (error) {

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
