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
  setLock,
  setLockFromPanel,
  getLongTextSettings,
  setLongTextLimitFromPanel
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
    if (!ctx.chat || !ctx.from) {
      return {
        ok: false,
        role: "unknown"
      };
    }

    const chatType = ctx.chat.type;

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

    if (member.status === "creator") {
      return {
        ok: true,
        role: "owner"
      };
    }

    if (member.status === "administrator") {
      return {
        ok: true,
        role: "admin"
      };
    }

    return {
      ok: false,
      role: "member"
    };

  } catch (error) {
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
// بررسی اجازه استفاده از پنل
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

  const role =
    await getGroupRole(ctx);

  // عضو عادی یا خطا
  if (!role.ok) {
    try {
      await ctx.answerCbQuery(
        "『𓆩 ★ شما اجازه استفاده از پنل مدیریت را ندارید ★ 𓆪』",
        {
          show_alert: true
        }
      );
    } catch {}

    return false;
  }

  // مالک
  if (role.role === "owner") {
    return true;
  }

  // مدیر
  if (role.role === "admin") {

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
      } catch {}

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

    // مالک همیشه اجازه دارد
    if (role.role === "owner") {
      return true;
    }

    // مدیر باید دسترسی قفل‌ها را داشته باشد
    if (role.role === "admin") {
      const permissions =
        getPermissions(
          ctx.chat.id,
          ctx.from.id
        );

      return Boolean(
        permissions &&
        permissions.locks === true
      );
    }

    return false;

  } catch (error) {
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
    enabled ? "★" : "☆";

  return Markup.button.callback(
    `『𓆩 ${title} ${symbol} 𓆪』`,
    `media_lock:${lockType}:${ownerId}`
  );
}

// =====================================
// صفحه قفل‌های رسانه‌ای
// =====================================

function mediaLocksPanel(
  ownerId,
  chatId
) {
  const sticker =
    getLock(chatId, "sticker");

  const gif =
    getLock(chatId, "gif");

  const photo =
    getLock(chatId, "photo");

  const video =
    getLock(chatId, "video");

  const voice =
    getLock(chatId, "voice");

  const longText =
    getLock(chatId, "longText");

  const poll =
    getLock(chatId, "poll");

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
        "تنظیم حد پیام بلند",
        "long_text_limit",
        ownerId
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

🔒 وضعیت: فعال`;
  }

  return `『𓆩 قفل ${name} 𓆪』

🔓 وضعیت: غیرفعال`;
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
// صفحه تنظیم حد پیام بلند
// =====================================

function longTextLimitPanel(
  ownerId,
  chatId
) {
  const settings =
    getLongTextSettings(chatId);

  const buttons = [];

  for (const limit of settings.options) {
    const selected =
      Number(limit) === Number(settings.limit)
        ? "★"
        : "☆";

    buttons.push([
      panelButton(
        `${limit} کاراکتر ${selected}`,
        `long_text_set:${limit}`,
        ownerId
      )
    ]);
  }

  buttons.push([
    panelButton(
      "بازگشت",
      "lock_media",
      ownerId
    )
  ]);

  buttons.push([
    panelButton(
      "بستن پنل",
      "panel_close",
      ownerId
    )
  ]);

  return Markup.inlineKeyboard(buttons);
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
// نمایش صفحه ساده
// =====================================

async function showSimplePanel(
  ctx,
  title,
  text
) {
  try {
    await ctx.editMessageText(
      `『𓆩 ${title} 𓆪』

${text}`,
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
  } catch (error) {
    console.log(
      "SIMPLE PANEL ERROR:",
      error.message
    );
  }
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

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      try {
        await ctx.editMessageText(
          `『𓆩 صفحه بعد 𓆪』

قابلیت‌های بیشتر مدیریت گروه:`,

          nextPanel(
            ctx.match[1]
          )
        );
      } catch (error) {
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

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      try {
        await ctx.editMessageText(
          panelText(),
          mainPanel(
            ctx.match[1]
          )
        );
      } catch (error) {
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

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
        console.log(
          "GROUP LOCKS PANEL ERROR:",
          error.message
        );
      }
    }
  );

  // ===================================
  // صفحه قفل‌های رسانه‌ای
  // ===================================

  bot.action(
    /^lock_media:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

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
        } catch {}

        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      try {
        await ctx.editMessageText(
          `『𓆩 قفل رسانه 𓆪』

وضعیت قفل‌های رسانه‌ای:

★ فعال
☆ غیرفعال`,

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )
        );
      } catch (error) {
        console.log(
          "MEDIA LOCK PANEL ERROR:",
          error.message
        );
      }
    }
  );

  // ===================================
  // تغییر واقعی قفل‌های رسانه‌ای
  // ===================================

  bot.action(
    /^media_lock:(sticker|gif|photo|video|voice|longText|poll):(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

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
        } catch {}

        return;
      }

      const lockType =
        ctx.match[1];

      const ownerId =
        ctx.match[2];

      // --------------------------------
      // پیام بلند
      // --------------------------------

      if (lockType === "longText") {
        try {
          await ctx.answerCbQuery();
        } catch {}

        try {
          const settings =
            getLongTextSettings(
              ctx.chat.id
            );

          await ctx.editMessageText(
            `『𓆩 پیام بلند 𓆪』

🔒 وضعیت قفل:
${settings.enabled ? "★ فعال" : "☆ غیرفعال"}

📏 حد فعلی:
${settings.limit} کاراکتر`,

            Markup.inlineKeyboard([
              [
                panelButton(
                  settings.enabled
                    ? "باز کردن قفل"
                    : "فعال کردن قفل",
                  "long_text_toggle",
                  ownerId
                )
              ],

              [
                panelButton(
                  "تنظیم حد پیام",
                  "long_text_limit",
                  ownerId
                )
              ],

              [
                panelButton(
                  "بازگشت",
                  "lock_media",
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
            ])
          );
        } catch (error) {
          console.log(
            "LONG TEXT PANEL ERROR:",
            error.message
          );
        }

        return;
      }

      // --------------------------------
      // سایر قفل‌ها
      // --------------------------------

      const current =
        getLock(
          ctx.chat.id,
          lockType
        );

      const newValue =
        !current;

      const result =
        await setLockFromPanel(
          ctx,
          lockType,
          newValue
        );

      if (result !== newValue) {
        try {
          await ctx.answerCbQuery(
            "『𓆩 ★ تغییر قفل انجام نشد ★ 𓆪』",
            {
              show_alert: true
            }
          );
        } catch {}

        return;
      }

      const name =
        MEDIA_LOCK_NAMES[lockType];

      try {
        await ctx.answerCbQuery(
          newValue
            ? `قفل ${name} فعال شد.`
            : `قفل ${name} باز شد.`
        );
      } catch {}

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
      } catch (error) {
        console.log(
          "MEDIA LOCK TOGGLE ERROR:",
          error.message
        );
      }
    }
  );

  // ===================================
  // روشن / خاموش کردن پیام بلند
  // ===================================

  bot.action(
    /^long_text_toggle:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

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
        } catch {}

        return;
      }

      const current =
        getLock(
          ctx.chat.id,
          "longText"
        );

      const newValue =
        !current;

      const result =
        await setLockFromPanel(
          ctx,
          "longText",
          newValue
        );

      if (result !== newValue) {
        try {
          await ctx.answerCbQuery(
            "『𓆩 ★ تغییر قفل انجام نشد ★ 𓆪』",
            {
              show_alert: true
            }
          );
        } catch {}

        return;
      }

      try {
        await ctx.answerCbQuery(
          newValue
            ? "قفل پیام بلند فعال شد."
            : "قفل پیام بلند باز شد."
        );
      } catch {}

      try {
        const settings =
          getLongTextSettings(
            ctx.chat.id
          );

        await ctx.editMessageText(
          `『𓆩 پیام بلند 𓆪』

🔒 وضعیت قفل:
${settings.enabled ? "★ فعال" : "☆ غیرفعال"}

📏 حد فعلی:
${settings.limit} کاراکتر`,

          Markup.inlineKeyboard([
            [
              panelButton(
                settings.enabled
                  ? "باز کردن قفل"
                  : "فعال کردن قفل",
                "long_text_toggle",
                ctx.match[1]
              )
            ],

            [
              panelButton(
                "تنظیم حد پیام",
                "long_text_limit",
                ctx.match[1]
              )
            ],

            [
              panelButton(
                "بازگشت",
                "lock_media",
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
      } catch (error) {
        console.log(
          "LONG TEXT TOGGLE ERROR:",
          error.message
        );
      }
    }
  );

  // ===================================
  // صفحه انتخاب حد پیام بلند
  // ===================================

  bot.action(
    /^long_text_limit:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

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
        } catch {}

        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      try {
        const settings =
          getLongTextSettings(
            ctx.chat.id
          );

        await ctx.editMessageText(
          `『𓆩 تنظیم حد پیام بلند 𓆪』

حد فعلی:
★ ${settings.limit} کاراکتر

یکی از گزینه‌ها را انتخاب کنید:`,

          longTextLimitPanel(
            ctx.match[1],
            ctx.chat.id
          )
        );
      } catch (error) {
        console.log(
          "LONG TEXT LIMIT PANEL ERROR:",
          error.message
        );
      }
    }
  );

  // ===================================
  // انتخاب حد پیام بلند
  // ===================================

  bot.action(
    /^long_text_set:(100|200|300|400|500|600|700|800|900|1000|2000):(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

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
        } catch {}

        return;
      }

      const limit =
        Number(ctx.match[1]);

      const ownerId =
        ctx.match[2];

      const result =
        await setLongTextLimitFromPanel(
          ctx,
          limit
        );

      if (result !== limit) {
        try {
          await ctx.answerCbQuery(
            "『𓆩 ★ مقدار انتخاب‌شده معتبر نیست ★ 𓆪』",
            {
              show_alert: true
            }
          );
        } catch {}

        return;
      }

      try {
        await ctx.answerCbQuery(
          `حد پیام روی ${limit} کاراکتر تنظیم شد.`
        );
      } catch {}

      try {
        const settings =
          getLongTextSettings(
            ctx.chat.id
          );

        await ctx.editMessageText(
          `『𓆩 پیام بلند 𓆪』

🔒 وضعیت قفل:
${settings.enabled ? "★ فعال" : "☆ غیرفعال"}

📏 حد فعلی:
★ ${settings.limit} کاراکتر`,

          Markup.inlineKeyboard([
            [
              panelButton(
                settings.enabled
                  ? "باز کردن قفل"
                  : "فعال کردن قفل",
                "long_text_toggle",
                ownerId
              )
            ],

            [
              panelButton(
                "تنظیم حد پیام",
                "long_text_limit",
                ownerId
              )
            ],

            [
              panelButton(
                "بازگشت",
                "lock_media",
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
          ])
        );
      } catch (error) {
        console.log(
          "LONG TEXT SET ERROR:",
          error.message
        );
      }
    }
  );// =====================================
// مدیریت کاربران
// =====================================

  bot.action(
    /^users:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
        console.log(
          "USERS PANEL ERROR:",
          error.message
        );
      }
    }
  );

// =====================================
// مدیریت پیام‌ها
// =====================================

  bot.action(
    /^messages:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
        console.log(
          "MESSAGES PANEL ERROR:",
          error.message
        );
      }
    }
  );

// =====================================
// سیستم اخطار
// =====================================

  bot.action(
    /^warnings:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
        console.log(
          "WARNINGS PANEL ERROR:",
          error.message
        );
      }
    }
  );

// =====================================
// ورود و خروج
// =====================================

  bot.action(
    /^joinleave:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
        console.log(
          "JOINLEAVE PANEL ERROR:",
          error.message
        );
      }
    }
  );

// =====================================
// قوانین
// =====================================

  bot.action(
    /^rules:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
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

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
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

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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
      } catch (error) {
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
      "file_lock",
      "قفل فایل"
    ]
  ];

// =====================================
// ثبت گزینه‌های غیررسانه‌ای صفحه دوم
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

        if (!(await protectPanel(ctx))) {
          return;
        }

        try {
          await ctx.answerCbQuery();
        } catch {}

        try {
          await ctx.editMessageText(
            `『𓆩 ${title} 𓆪』

وضعیت این قابلیت در این مرحله فقط نمایشی است.`,

            optionPanel(
              title,
              action,
              ctx.match[1]
            )
          );
        } catch (error) {
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

        if (!(await protectPanel(ctx))) {
          return;
        }

        try {
          await ctx.answerCbQuery();
        } catch {}

        try {
          await ctx.editMessageText(
            `『𓆩 قفل ${title} 𓆪』`,

            optionPanel(
              title,
              action,
              ctx.match[1]
            )
          );
        } catch (error) {
          console.log(
            "GROUP LOCK OPTION ERROR:",
            error.message
          );
        }
      }
    );
  }

// =====================================
// باز کردن قفل رسانه از صفحه دوم
// =====================================

  bot.action(
    /^sticker_lock:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "sticker"
      );
    }
  );

  bot.action(
    /^gif_lock:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "gif"
      );
    }
  );

  bot.action(
    /^video_lock:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "video"
      );
    }
  );

  bot.action(
    /^voice_lock:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "voice"
      );
    }
  );

  bot.action(
    /^poll_lock:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "poll"
      );
    }
  );

  bot.action(
    /^long_message:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "longText"
      );
    }
  );

// =====================================
// قفل عکس از مسیر صفحه دوم
// =====================================

  bot.action(
    /^photo_lock:(\d+)$/,
    async ctx => {

      await handleSecondPageMediaLock(
        ctx,
        "photo"
      );
    }
  );

// =====================================
// تابع مشترک قفل‌های رسانه‌ای صفحه دوم
// =====================================

async function handleSecondPageMediaLock(
  ctx,
  lockType
) {

  if (!(await protectPanel(ctx))) {
    return;
  }

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
    } catch {}

    return;
  }

  // پیام بلند
  if (lockType === "longText") {

    try {
      await ctx.answerCbQuery();
    } catch {}

    try {

      const settings =
        getLongTextSettings(
          ctx.chat.id
        );

      await ctx.editMessageText(
        `『𓆩 پیام بلند 𓆪』

🔒 وضعیت:
${settings.enabled ? "★ فعال" : "☆ غیرفعال"}

📏 حد:
${settings.limit} کاراکتر`,

        Markup.inlineKeyboard([
          [
            panelButton(
              settings.enabled
                ? "باز کردن قفل"
                : "فعال کردن قفل",
              "long_text_toggle",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "تنظیم حد پیام",
              "long_text_limit",
              ctx.match[1]
            )
          ],

          [
            panelButton(
              "بازگشت",
              "panel_next",
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

    } catch (error) {
      console.log(
        "SECOND PAGE LONG TEXT ERROR:",
        error.message
      );
    }

    return;
  }

  const current =
    getLock(
      ctx.chat.id,
      lockType
    );

  const newValue =
    !current;

  const result =
    await setLockFromPanel(
      ctx,
      lockType,
      newValue
    );

  if (result !== newValue) {

    try {
      await ctx.answerCbQuery(
        "『𓆩 ★ تغییر قفل انجام نشد ★ 𓆪』",
        {
          show_alert: true
        }
      );
    } catch {}

    return;
  }

  const name =
    MEDIA_LOCK_NAMES[lockType];

  try {
    await ctx.answerCbQuery(
      newValue
        ? `قفل ${name} فعال شد.`
        : `قفل ${name} باز شد.`
    );
  } catch {}

  try {

    await ctx.editMessageText(

      mediaLockStatusText(
        lockType,
        newValue
      ),

      mediaLocksPanel(
        ctx.match[1],
        ctx.chat.id
      )

    );

  } catch (error) {

    console.log(
      "SECOND PAGE MEDIA LOCK ERROR:",
      error.message
    );
  }
}

// =====================================
// بازگشت از قفل‌های رسانه‌ای
// =====================================

  bot.action(
    /^media_locks_back:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      try {
        await ctx.editMessageText(
          `『𓆩 صفحه بعد 𓆪』

قابلیت‌های بیشتر مدیریت گروه:`,

          nextPanel(
            ctx.match[1]
          )
        );
      } catch (error) {
        console.log(
          "MEDIA LOCK BACK ERROR:",
          error.message
        );
      }
    }
  );// =====================================
// بازگشت به صفحه قفل رسانه
// =====================================

  bot.action(
    /^media_lock_back:(\d+)$/,
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

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
        } catch {}

        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      try {
        await ctx.editMessageText(
          `『𓆩 قفل رسانه 𓆪』

وضعیت قفل‌های رسانه‌ای:

★ فعال
☆ غیرفعال`,

          mediaLocksPanel(
            ctx.match[1],
            ctx.chat.id
          )
        );
      } catch (error) {
        console.log(
          "MEDIA LOCK BACK ERROR:",
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

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

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

// =====================================
// ثبت موفق اکشن‌های پنل
// =====================================

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
