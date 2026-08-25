const { Markup } = require("telegraf");
const { permissionText } = require("./permissions");


function button(text, action, ownerId) {

  return Markup.button.callback(
    `『𓆩 ${text} 𓆪』`,
    `${action}:${ownerId}`
  );

}



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
        "warns",
        ownerId
      )
    ],

    [
      button(
        "ورود و خروج",
        "welcome",
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
        "تنظیمات",
        "settings",
        ownerId
      )
    ],

    [
      button(
        "بستن پنل",
        "close",
        ownerId
      )
    ]

  ]);

}



function userPanel(ownerId){

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
        "back",
        ownerId
      )
    ]

  ]);

}



function permissionsPanel(
  ownerId,
  chatId,
  userId
){

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
        "back",
        ownerId
      )
    ]

  ]);

}



function panelText(){

  return (
`『𓆩 پنل مدیریت 𓆪』

بخش موردنظر را انتخاب کنید.`
  );

}



module.exports = {

  mainPanel,
  userPanel,
  permissionsPanel,
  panelText

};
