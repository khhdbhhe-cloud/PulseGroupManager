// =====================================
// PulseGroupManager
// SETTINGS SYSTEM - FINAL
// =====================================

const { Markup } = require("telegraf");

const {
  checkAdmin,
  checkOwner
} = require("./security");

const {
  getWarningSettings,
  setMaxWarnings,
  setWarningPunishment,
  setWarningDuration
} = require("./warning-settings");

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// دکمه تنظیمات
// =====================================

function settingButton(
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
// آماده‌سازی سیستم لقب
// =====================================

function ensureNicknameSettings(group) {

  if (!group.botNicknames) {
    group.botNicknames = {};
  }

  if (group.nicknameLocked === undefined) {
    group.nicknameLocked = false;
  }

  if (
    group.botReply &&
    group.botReply.nicknames &&
    typeof group.botReply.nicknames === "object"
  ) {

    const oldNicknames =
      group.botReply.nicknames;

    for (
      const userId of Object.keys(oldNicknames)
    ) {

      if (
        !group.botNicknames[userId] &&
        oldNicknames[userId]
      ) {

        group.botNicknames[userId] =
          oldNicknames[userId];

      }

    }

    delete group.botReply.nicknames;

    saveDB();

  }

  return group.botNicknames;

}


// =====================================
// وضعیت قفل لقب
// =====================================

function isNicknameLocked(chatId) {

  const group =
    getGroup(chatId);

  ensureNicknameSettings(group);

  return Boolean(
    group.nicknameLocked
  );

}


// =====================================
// قفل / باز کردن لقب
// =====================================

function setNicknameLocked(
  chatId,
  value
) {

  const group =
    getGroup(chatId);

  ensureNicknameSettings(group);

  group.nicknameLocked =
    Boolean(value);

  saveDB();

  return group.nicknameLocked;

}


// =====================================
// دریافت لقب کاربر
// =====================================

function getUserNickname(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  const nicknames =
    ensureNicknameSettings(group);

  return (
    nicknames[String(userId)] ||
    null
  );

}


// =====================================
// تعیین لقب کاربر
// =====================================

function setUserNickname(
  chatId,
  userId,
  nickname
) {

  const group =
    getGroup(chatId);

  const nicknames =
    ensureNicknameSettings(group);

  const text =
    String(nickname).trim();

  if (!text) {
    return false;
  }

  nicknames[String(userId)] =
    text;

  saveDB();

  return text;

}


// =====================================
// حذف لقب کاربر
// =====================================

function removeUserNickname(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  const nicknames =
    ensureNicknameSettings(group);

  const id =
    String(userId);

  if (!nicknames[id]) {
    return false;
  }

  delete nicknames[id];

  saveDB();

  return true;

}


// =====================================
// تعداد لقب‌های ثبت‌شده
// =====================================

function getNicknameCount(chatId) {

  const group =
    getGroup(chatId);

  const nicknames =
    ensureNicknameSettings(group);

  return Object.keys(
    nicknames
  ).length;

}


// =====================================
// دکمه لقب
// =====================================

function nicknameSettingButton(
  ownerId,
  chatId
) {

  const locked =
    chatId
      ? isNicknameLocked(chatId)
      : false;

  return settingButton(
    locked
      ? "☆ لقب"
      : "★ لقب",
    "set_nickname",
    ownerId
  );

}


// =====================================
// صفحه اصلی تنظیمات
// =====================================

function settingsPanel(
  ownerId,
  chatId = null
) {

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
      nicknameSettingButton(
        ownerId,
        chatId
      )
    ],

    [
      settingButton(
        "لقب و پاسخ ربات",
        "set_bot_reply",
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
// متن تنظیمات
// =====================================

function settingsText() {

  return `『𓆩 تنظیمات PulseGroupManager 𓆪』

بخش تنظیمات گروه

گزینه موردنظر را انتخاب کنید.

★ فقط مدیران و مالک گروه دسترسی دارند.

★ تنظیمات هر پنل فقط برای شخصی است
که آن را باز کرده است.`;

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
        access.text ||
        "⛔ فقط مدیران و مالک گروه دسترسی دارند.",
        {
          show_alert: true
        }
      );

    }

    catch {}

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

      }

      catch {}

      return false;

    }

  }

  return true;

}


// =====================================
// بررسی فقط مالک
// =====================================

async function protectOwner(ctx) {

  const access =
    await checkOwner(ctx);

  if (!access.ok) {

    try {

      await ctx.answerCbQuery(
        access.text ||
        "⛔ فقط مالک گروه اجازه این کار را دارد.",
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


// =====================================
// دکمه‌های برگشت
// =====================================

function backToSettings(
  ownerId
) {

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
// ساخت تنظیمات پاسخ ربات
// =====================================

function ensureBotReplySettings(group) {

  if (!group.botReply) {

    group.botReply = {

      enabled: true,

      random: true,

      replies: [
        "جانم، هستم 🌹",
        "جانم؟ من همیشه فعالم 😎",
        "بله؟ ربات اینجاست ❤️",
        "هستم، بگو ببینم چی شده 😄",
        "جانم، گوشم با توئه 🌹",
        "حاضرم، زیبای گپ 😎"
      ]

    };

    saveDB();

  }

  if (
    !Array.isArray(
      group.botReply.replies
    )
  ) {

    group.botReply.replies = [];

    saveDB();

  }

  if (
    group.botReply.enabled === undefined
  ) {

    group.botReply.enabled = true;

    saveDB();

  }

  if (
    group.botReply.random === undefined
  ) {

    group.botReply.random = true;

    saveDB();

  }

  ensureNicknameSettings(group);

  return group.botReply;

}


// =====================================
// دریافت پاسخ‌های ربات
// =====================================

function getBotReplies(chatId) {

  const group =
    getGroup(chatId);

  const botReply =
    ensureBotReplySettings(group);

  return botReply.replies;

}


// =====================================
// اضافه کردن پاسخ ربات
// =====================================

function addBotReply(
  chatId,
  reply
) {

  const group =
    getGroup(chatId);

  const botReply =
    ensureBotReplySettings(group);

  const text =
    String(reply).trim();

  if (!text) {
    return false;
  }

  if (
    !botReply.replies.includes(text)
  ) {

    botReply.replies.push(text);

    saveDB();

  }

  return true;

}


// =====================================
// حذف پاسخ ربات
// =====================================

function removeBotReply(
  chatId,
  reply
) {

  const group =
    getGroup(chatId);

  const botReply =
    ensureBotReplySettings(group);

  botReply.replies =
    botReply.replies.filter(
      item => item !== reply
    );

  saveDB();

  return true;

}


// =====================================
// فعال / غیرفعال کردن پاسخ ربات
// =====================================

function setBotReplyEnabled(
  chatId,
  value
) {

  const group =
    getGroup(chatId);

  const botReply =
    ensureBotReplySettings(group);

  botReply.enabled =
    Boolean(value);

  saveDB();

  return botReply.enabled;

}


// =====================================
// انتخاب پاسخ ربات
// =====================================

function getRandomBotReply(chatId) {

  const group =
    getGroup(chatId);

  const botReply =
    ensureBotReplySettings(group);

  if (
    !botReply.enabled ||
    !botReply.replies.length
  ) {

    return null;

  }

  const index =
    Math.floor(
      Math.random() *
      botReply.replies.length
    );

  return botReply.replies[index];

}


// =====================================
// جایگذاری لقب داخل پاسخ
// =====================================

function formatBotReply(
  text,
  nickname
) {

  let result =
    String(text);

  if (nickname) {

    result =
      result
        .replace(
          /\{nickname\}/gi,
          nickname
        )
        .replace(
          /\{لقب\}/gu,
          nickname
        );

  }

  return result;

}


// =====================================
// نمایش صفحه تنظیمات
// =====================================

async function showSettingsHome(ctx) {

  await ctx.editMessageText(
    settingsText(),
    settingsPanel(
      ctx.from.id,
      ctx.chat.id
    )
  );

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

      try {

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

        await ctx.reply(
          settingsText(),
          {

            ...settingsPanel(
              ctx.from.id,
              ctx.chat.id
            ),

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

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      try {

        await showSettingsHome(ctx);

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
  // لقب
  // ===================================

  bot.action(
    /^set_nickname:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      const locked =
        isNicknameLocked(
          ctx.chat.id
        );

      const count =
        getNicknameCount(
          ctx.chat.id
        );

      await ctx.editMessageText(

`『𓆩 لقب 𓆪』

وضعیت:

${locked ? "☆ لقب" : "★ لقب"}

تعداد لقب‌های ثبت‌شده:

★ ${count}

تنظیم یا حذف لقب فقط توسط مدیران و مالک انجام می‌شود.

لقب مالک فقط توسط خود مالک قابل تغییر است.

کاربران عادی فقط می‌توانند لقب خودشان یا لقب کاربر ریپلای‌شده را مشاهده کنند.`,

        Markup.inlineKeyboard([

          [
            settingButton(
              locked
                ? "★ لقب"
                : "☆ لقب",
              "nickname_toggle",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "settings_home",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // قفل / بازکردن لقب
  // ===================================

  bot.action(
    /^nickname_toggle:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      const locked =
        isNicknameLocked(
          ctx.chat.id
        );

      const newValue =
        !locked;

      setNicknameLocked(
        ctx.chat.id,
        newValue
      );

      await ctx.answerCbQuery(
        newValue
          ? "☆ لقب قفل شد."
          : "★ لقب باز شد."
      );

      const count =
        getNicknameCount(
          ctx.chat.id
        );

      await ctx.editMessageText(

`『𓆩 لقب 𓆪』

وضعیت:

${newValue
  ? "☆ لقب"
  : "★ لقب"}

تعداد لقب‌های ثبت‌شده:

★ ${count}`,

        Markup.inlineKeyboard([

          [
            settingButton(
              newValue
                ? "★ لقب"
                : "☆ لقب",
              "nickname_toggle",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "settings_home",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // خوشامدگویی
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

★ مقام خوشامد

مقام خوشامد تنظیم

فقط مالک گروه می‌تواند این مقام را به یک مدیر بدهد.

حذف مقام خوشامد

مقام خوشامد مدیر را حذف می‌کند.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // مدیریت
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

تنظیمات مربوط به دسترسی مدیران.

★ استفاده از پنل
★ اجرای دستورات
★ مدیریت کاربران
★ مدیریت تنظیمات

فقط مدیر و مالک اجازه تغییر دارند.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // اختیار / اخطار
  // ===================================

  bot.action(
    /^set_warn:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

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

      if (
        !(await protectSettings(ctx))
      ) return;

      const count =
        Number(ctx.match[1]);

      setMaxWarnings(
        ctx.chat.id,
        count
      );

      await ctx.answerCbQuery(
        `تعداد اخطار روی ${count} تنظیم شد.`
      );

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
تعداد اخطار با موفقیت تغییر کرد.`,

        Markup.inlineKeyboard([

          [
            settingButton(
              "بازگشت",
              "set_warn",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // مجازات اخطار - سکوت
  // ===================================

  bot.action(
    /^warn_punish_mute:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      setWarningPunishment(
        ctx.chat.id,
        "mute"
      );

      await ctx.answerCbQuery(
        "مجازات اخطار روی سکوت تنظیم شد."
      );

      const config =
        getWarningSettings(
          ctx.chat.id
        );

      await ctx.editMessageText(

`『𓆩 تنظیمات اختیار 𓆪』

تعداد اخطار:
★ ${config.maxWarnings}

مجازات:
★ سکوت

مدت مجازات:
★ ${config.duration} دقیقه

مجازات اخطار با موفقیت تغییر کرد.`,

        Markup.inlineKeyboard([

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
              "بازگشت",
              "set_warn",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // مجازات اخطار - محدودیت
  // ===================================

  bot.action(
    /^warn_punish_restrict:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      setWarningPunishment(
        ctx.chat.id,
        "restrict"
      );

      await ctx.answerCbQuery(
        "مجازات اخطار روی محدودیت تنظیم شد."
      );

      const config =
        getWarningSettings(
          ctx.chat.id
        );

      await ctx.editMessageText(

`『𓆩 تنظیمات اختیار 𓆪』

تعداد اخطار:
★ ${config.maxWarnings}

مجازات:
★ محدودیت

مدت مجازات:
★ ${config.duration} دقیقه

مجازات اخطار با موفقیت تغییر کرد.`,

        Markup.inlineKeyboard([

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
              "بازگشت",
              "set_warn",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // مجازات اخطار - بن
  // ===================================

  bot.action(
    /^warn_punish_ban:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      setWarningPunishment(
        ctx.chat.id,
        "ban"
      );

      await ctx.answerCbQuery(
        "مجازات اخطار روی بن تنظیم شد."
      );

      const config =
        getWarningSettings(
          ctx.chat.id
        );

      await ctx.editMessageText(

`『𓆩 تنظیمات اختیار 𓆪』

تعداد اخطار:
★ ${config.maxWarnings}

مجازات:
★ بن

مدت مجازات:
★ ${config.duration} دقیقه

مجازات اخطار با موفقیت تغییر کرد.`,

        Markup.inlineKeyboard([

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
              "بازگشت",
              "set_warn",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // مدت مجازات
  // ===================================

  bot.action(
    /^warn_duration_(60|120|180|360):(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      const duration =
        Number(ctx.match[1]);

      setWarningDuration(
        ctx.chat.id,
        duration
      );

      await ctx.answerCbQuery(
        `مدت مجازات روی ${duration} دقیقه تنظیم شد.`
      );

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

تعداد اخطار:
★ ${config.maxWarnings}

مجازات:
★ ${punishmentText}

مدت مجازات:
★ ${config.duration} دقیقه

مدت مجازات با موفقیت تغییر کرد.`,

        Markup.inlineKeyboard([

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
              "set_warn",
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
    /^set_mute:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(

`『𓆩 تنظیمات سکوت 𓆪』

مدیریت تنظیمات مربوط به سکوت کاربران.

★ فعال‌سازی سکوت
★ مدت سکوت
★ دسترسی مدیریت سکوت

این بخش از سیستم مدیریت گروه استفاده می‌کند.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // محدودیت
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

مدیریت محدودیت کاربران.

★ محدود کردن ارسال پیام
★ محدود کردن رسانه
★ محدود کردن لینک
★ محدود کردن استیکر

این بخش از سیستم مدیریت گروه استفاده می‌کند.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // بن
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

مدیریت سیستم بن کاربران.

★ بن کاربر
★ حذف بن
★ مشاهده وضعیت بن

دسترسی این بخش فقط برای مدیران مجاز است.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // فوروارد
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

مدیریت پیام‌های فوروارد شده.

★ کنترل فوروارد
★ جلوگیری از فوروارد غیرمجاز

این بخش برای مدیریت پیام‌های گروه است.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // ضدفلود
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

سیستم ضدفلود گروه.

★ کنترل پیام‌های پشت‌سرهم
★ جلوگیری از اسپم
★ محدود کردن کاربر فلودر

این بخش برای کنترل اسپم گروه است.`,

        backToSettings(
          ctx.from.id
        )

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

مدیریت پیام‌های ورود و خروج اعضا.

★ پیام ورود
★ پیام خروج
★ حذف پیام‌های ورود و خروج

این بخش از سیستم ورود و خروج گروه استفاده می‌کند.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // پیام‌ها
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

★ حذف پیام
★ پاکسازی پیام‌ها
★ مدیریت پیام‌های اضافی

این بخش برای مدیریت پیام‌های گروه است.`,

        backToSettings(
          ctx.from.id
        )

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

`『𓆩 قوانین گروه 𓆪』

از این بخش می‌توانید قوانین گروه را مدیریت کنید.

★ مشاهده قوانین
★ تنظیم قوانین
★ حذف قوانین

دستورهای مربوط به قوانین در بخش راهنما قرار دارند.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // لقب و پاسخ ربات
  // ===================================

  bot.action(
    /^set_bot_reply:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      const config =
        ensureBotReplySettings(
          getGroup(ctx.chat.id)
        );

      await ctx.editMessageText(

`『𓆩 لقب و پاسخ ربات 𓆪』

وضعیت پاسخ ربات:

${config.enabled ? "★ روشن" : "☆ خاموش"}

تعداد پاسخ‌ها:

★ ${config.replies.length}

برای پاسخ‌ها می‌توانید از این قالب استفاده کنید:

{nickname}

یا:

{لقب}

مثال:

جانم {nickname} 🌹`,

        Markup.inlineKeyboard([

          [
            settingButton(
              config.enabled
                ? "☆ خاموش کردن ربات"
                : "★ روشن کردن ربات",
              "bot_reply_toggle",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "settings_home",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // روشن / خاموش پاسخ ربات
  // ===================================

  bot.action(
    /^bot_reply_toggle:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      const config =
        ensureBotReplySettings(
          getGroup(ctx.chat.id)
        );

      setBotReplyEnabled(
        ctx.chat.id,
        !config.enabled
      );

      await ctx.answerCbQuery(
        config.enabled
          ? "پاسخ ربات خاموش شد."
          : "پاسخ ربات روشن شد."
      );

      const updated =
        ensureBotReplySettings(
          getGroup(ctx.chat.id)
        );

      await ctx.editMessageText(

`『𓆩 لقب و پاسخ ربات 𓆪』

وضعیت پاسخ ربات:

${updated.enabled ? "★ روشن" : "☆ خاموش"}

تعداد پاسخ‌ها:

★ ${updated.replies.length}`,

        Markup.inlineKeyboard([

          [
            settingButton(
              updated.enabled
                ? "☆ خاموش کردن ربات"
                : "★ روشن کردن ربات",
              "bot_reply_toggle",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "settings_home",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // بستن تنظیمات
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
  settingsText,

  protectSettings,
  protectOwner,

  ensureBotReplySettings,

  getBotReplies,
  addBotReply,
  removeBotReply,

  setBotReplyEnabled,
  getRandomBotReply,
  formatBotReply,

  ensureNicknameSettings,
  isNicknameLocked,
  setNicknameLocked,

  getUserNickname,
  setUserNickname,
  removeUserNickname,
  getNicknameCount

};
