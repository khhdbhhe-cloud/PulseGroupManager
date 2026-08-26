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

  // -------------------------------
  // مقام خوشامد
  // -------------------------------

  welcome: false

};


// =====================================
// دریافت دسترسی کاربر
// =====================================

function getUserPermissions(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  const id =
    String(userId);


  if (!group.userPermissions) {

    group.userPermissions = {};

  }


  if (!group.userPermissions[id]) {

    group.userPermissions[id] = {
      ...defaultPermissions
    };

    saveDB();

  }


  // -------------------------------
  // تکمیل دسترسی‌های قدیمی
  // -------------------------------

  for (
    const key of Object.keys(defaultPermissions)
  ) {

    if (
      group.userPermissions[id][key] === undefined
    ) {

      group.userPermissions[id][key] =
        defaultPermissions[key];

    }

  }


  return group.userPermissions[id];

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
    defaultPermissions[permission] !== undefined
  ) {

    permissions[permission] =
      Boolean(value);

    saveDB();

  }


  return permissions;

}


// =====================================
// فعال کردن دسترسی
// =====================================

function grantPermission(
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
// حذف دسترسی
// =====================================

function revokePermission(
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
// بررسی یک دسترسی
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
// ★ / ☆
// =====================================

function star(value) {

  return value
    ? "★"
    : "☆";

}


// =====================================
// متن دسترسی‌های کاربر
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

مقام خوشامد: ${star(p.welcome)}`
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  defaultPermissions,

  getUserPermissions,

  setPermission,

  grantPermission,

  revokePermission,

  hasPermission,

  permissionText,

  star

};
