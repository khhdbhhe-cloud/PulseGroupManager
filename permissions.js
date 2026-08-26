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

  // مقام خوشامد
  welcome: false

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
    !group.userPermissions
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


  // اگر دسترسی جدیدی به سیستم
  // اضافه شده باشد، آن را اضافه کن

  for (
    const permission in defaultPermissions
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
// تنظیم یک دسترسی
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
    defaultPermissions[permission]
    !== undefined
  ) {

    permissions[permission] =
      Boolean(value);

    saveDB();

  }


  return permissions;

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


  return Boolean(
    permissions[permission]
  );

}


// =====================================
// تشخیص مالک گروه
// =====================================

async function isOwner(
  bot,
  chatId,
  userId
) {

  try {

    const member =
      await bot.telegram.getChatMember(
        chatId,
        userId
      );


    return (
      member.status === "creator"
    );

  }

  catch (error) {

    console.log(
      "OWNER CHECK ERROR:",
      error.message
    );

    return false;

  }

}


// =====================================
// تشخیص مدیر
// =====================================

async function isAdmin(
  bot,
  chatId,
  userId
) {

  try {

    const member =
      await bot.telegram.getChatMember(
        chatId,
        userId
      );


    return (
      member.status === "administrator" ||
      member.status === "creator"
    );

  }

  catch (error) {

    console.log(
      "ADMIN CHECK ERROR:",
      error.message
    );

    return false;

  }

}


// =====================================
// بررسی مقام خوشامد
// =====================================

function hasWelcomeRole(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);


  if (
    !group.welcome
  ) {

    return false;

  }


  if (
    !group.welcome.managers
  ) {

    group.welcome.managers = {};

  }


  return Boolean(
    group.welcome.managers[
      String(userId)
    ]
  );

}


// =====================================
// دادن مقام خوشامد
// فقط مالک باید این کار را انجام دهد
// =====================================

function setWelcomeRole(
  chatId,
  userId,
  value
) {

  const group =
    getGroup(chatId);


  if (
    !group.welcome
  ) {

    group.welcome = {

      enabled: true,

      text: null,

      type: "text",

      fileId: null,

      managers: {}

    };

  }


  if (
    !group.welcome.managers
  ) {

    group.welcome.managers = {};

  }


  const id =
    String(userId);


  if (value) {

    group.welcome.managers[id] =
      true;

    // همزمان دسترسی عمومی خوشامد
    // هم فعال می‌شود

    getUserPermissions(
      chatId,
      userId
    ).welcome = true;

  }

  else {

    delete group.welcome.managers[id];

    getUserPermissions(
      chatId,
      userId
    ).welcome = false;

  }


  saveDB();


  return hasWelcomeRole(
    chatId,
    userId
  );

}


// =====================================
// حذف تمام دسترسی‌های یک کاربر
// =====================================

function resetPermissions(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);


  const id =
    String(userId);


  group.userPermissions[id] = {
    ...defaultPermissions
  };


  if (
    group.welcome &&
    group.welcome.managers
  ) {

    delete group.welcome.managers[id];

  }


  saveDB();


  return group.userPermissions[id];

}


// =====================================
// تبدیل دسترسی به ستاره
// =====================================

function star(
  value
) {

  return value
    ? "★"
    : "☆";

}


// =====================================
// نمایش دسترسی‌ها
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

مقام خوشامد: ${star(
  hasWelcomeRole(
    chatId,
    userId
  )
)}`
  );

}


// =====================================
// گرفتن همه دسترسی‌ها
// =====================================

function getAllPermissions(
  chatId,
  userId
) {

  return getUserPermissions(
    chatId,
    userId
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  defaultPermissions,

  getUserPermissions,

  setPermission,

  hasPermission,

  isOwner,

  isAdmin,

  hasWelcomeRole,

  setWelcomeRole,

  resetPermissions,

  permissionText,

  getAllPermissions,

  star

};
