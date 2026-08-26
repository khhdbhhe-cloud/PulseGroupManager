// =====================================
// PulseGroupManager
// PERMISSIONS SYSTEM
// =====================================

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// دسترسی‌های پیش‌فرض
// =====================================

const defaultPermissions = {

  ban: false,
  unban: false,

  mute: false,
  unmute: false,

  warn: false,
  removeWarn: false,

  userInfo: false,
  userStats: false,

  locks: false,
  settings: false,

  welcome: false,
  goodbye: false,

  messages: false,
  flood: false,

  rules: false

};


// =====================================
// گرفتن دسترسی‌های کاربر
// =====================================

function getUserPermissions(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);


  const id =
    String(userId);


  if (
    !group.userPermissions ||
    typeof group.userPermissions !== "object"
  ) {

    group.userPermissions = {};

  }


  if (
    !group.userPermissions[id]
  ) {

    group.userPermissions[id] = {
      ...defaultPermissions
    };


    saveDB();

  }


  // اگر در نسخه قبلی بعضی دسترسی‌ها
  // وجود نداشتند، اضافه شوند.

  for (
    const permission
    of Object.keys(defaultPermissions)
  ) {

    if (
      group.userPermissions[id][permission]
      === undefined
    ) {

      group.userPermissions[id][permission] =
        defaultPermissions[permission];

    }

  }


  return group.userPermissions[id];

}


// =====================================
// بررسی داشتن یک دسترسی
// =====================================

function hasPermission(
  chatId,
  userId,
  permission
) {

  const permissions =
    getUserPermissions(
      chatId,
      userId
    );


  return (
    permissions[permission] === true
  );

}


// =====================================
// تغییر یک دسترسی
// =====================================

function setPermission(
  chatId,
  userId,
  permission,
  value
) {

  const permissions =
    getUserPermissions(
      chatId,
      userId
    );


  if (
    !Object.prototype.hasOwnProperty.call(
      defaultPermissions,
      permission
    )
  ) {

    return permissions;

  }


  permissions[permission] =
    Boolean(value);


  saveDB();


  return permissions;

}


// =====================================
// فعال کردن دسترسی
// =====================================

function enablePermission(
  chatId,
  userId,
  permission
) {

  return setPermission(
    chatId,
    userId,
    permission,
    true
  );

}


// =====================================
// غیرفعال کردن دسترسی
// =====================================

function disablePermission(
  chatId,
  userId,
  permission
) {

  return setPermission(
    chatId,
    userId,
    permission,
    false
  );

}


// =====================================
// ★ / ☆
// =====================================

function star(
  value
) {

  return value
    ? "★"
    : "☆";

}


// =====================================
// متن دسترسی‌ها
// =====================================

function permissionText(
  chatId,
  userId
) {

  const p =
    getUserPermissions(
      chatId,
      userId
    );


  return (
`『𓆩 دسترسی‌های کاربر 𓆪』

بن کردن: ${star(p.ban)}
آن‌بن: ${star(p.unban)}

میوت: ${star(p.mute)}
آن‌میوت: ${star(p.unmute)}

اخطار: ${star(p.warn)}
حذف اخطار: ${star(p.removeWarn)}

اطلاعات کاربر: ${star(p.userInfo)}
آمار کاربر: ${star(p.userStats)}

قفل‌های گروه: ${star(p.locks)}
تنظیمات: ${star(p.settings)}

خوشامدگویی: ${star(p.welcome)}
پیام خروج: ${star(p.goodbye)}

مدیریت پیام‌ها: ${star(p.messages)}
ضدفلود: ${star(p.flood)}

قوانین: ${star(p.rules)}

★ = دسترسی فعال
☆ = دسترسی غیرفعال`
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  defaultPermissions,

  getUserPermissions,

  hasPermission,

  setPermission,

  enablePermission,

  disablePermission,

  permissionText,

  star

};
