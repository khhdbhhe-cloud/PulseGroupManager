const { Markup } = require("telegraf");
const { permissionText } = require("./permissions");


// =====================================
// ساخت دکمه
// =====================================

function button(text, action, ownerId) {

  return Markup.button.callback(
    `『𓆩 ${text} 𓆪』`,
    `${action}:${ownerId}`
  );

}


// =====================================
// پنل اصلی مدیریت
// =====================================

function mainPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      button(
        "مدیریت کاربران",
        "users",
        ownerId
      )
    ],

    [
      button(
        "دسترسی‌ها",
        "permissions",
        ownerId
      )
    ],

    [
      button(
        "قفل‌های گروه",
        "locks",
        ownerId
      )
    ],

    [
      button(
        "مدیریت پیام‌ها",
        "messages",
        ownerId
      )
    ],

    [
      button(
        "سیستم اخطار",
        "warnings",
        ownerId
      )
    ],

    [
      button(
        "ورود و خروج",
        "joinleave",
        ownerId
      )
    ],

    [
      button(
        "قوانین",
        "rules",
        ownerId
      )
    ],

    [
      button(
        "آمار گروه",
        "stats",
        ownerId
      )
    ],

    [
      button(
        "بستن پنل",
        "panel_close",
        ownerId
      )
    ]

  ]);

}


// =====================================
// پنل مدیریت کاربر
// =====================================

function userPanel(ownerId) {

  return Markup.inlineKeyboard([

    [
      button(
        "بن",
        "ban",
        ownerId
      ),

      button(
        "آن‌بن",
        "unban",
        ownerId
      )
    ],

    [
      button(
        "میوت",
        "mute",
        ownerId
      ),

      button(
        "آمار کاربر",
        "userstats",
        ownerId
      )
    ],

    [
      button(
        "شناسنامه",
        "userinfo",
        ownerId
      )
    ],

    [
      button(
        "بازگشت",
        "panel_home",
        ownerId
      )
    ]

  ]);

}


// =====================================
// پنل دسترسی‌ها
// =====================================

function permissionsPanel(
  ownerId,
  chatId,
  userId
) {

  return Markup.inlineKeyboard([

    [
      button(
        "نمایش دسترسی‌ها",
        "showpermissions",
        ownerId
      )
    ],

    [
      button(
        "تنظیم مدیر",
        "setadmin",
        ownerId
      )
    ],

    [
      button(
        "بازگشت",
        "panel_home",
        ownerId
      )
    ]

  ]);

}


// =====================================
// متن پنل
// =====================================

function panelText() {

  return (
`『𓆩 پنل مدیریت 𓆪』

بخش موردنظر را انتخاب کنید.

★ مدیریت کاربران
★ مدیریت پیام‌ها
★ قفل‌های گروه
★ سیستم اخطار
★ ورود و خروج
★ قوانین
★ آمار گروه
★ دسترسی‌ها`
  );

}


// =====================================
// EXPORT
// =====================================

module.exports = {

  mainPanel,
  userPanel,
  permissionsPanel,
  panelText

};
