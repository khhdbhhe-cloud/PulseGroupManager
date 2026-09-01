// =====================================
// PulseGroupManager
// DATABASE
// =====================================

const fs = require("fs");
const path = require("path");


// =====================================
// مسیر فایل دیتابیس
// =====================================

const DB_FILE =
  path.join(__dirname, "database.json");


// =====================================
// ساختار اولیه دیتابیس
// =====================================

let DB = {
  groups: {}
};


// =====================================
// بارگذاری دیتابیس
// =====================================

function loadDB() {

  try {

    if (
      fs.existsSync(DB_FILE)
    ) {

      const data =
        fs.readFileSync(
          DB_FILE,
          "utf8"
        );

      if (data.trim()) {

        DB =
          JSON.parse(data);

      }

    }

  }

  catch (error) {

    console.log(
      "DATABASE LOAD ERROR:",
      error.message
    );

    DB = {
      groups: {}
    };

  }


  if (
    !DB ||
    typeof DB !== "object"
  ) {

    DB = {
      groups: {}
    };

  }


  if (
    !DB.groups ||
    typeof DB.groups !== "object"
  ) {

    DB.groups = {};

  }

}


// =====================================
// ذخیره دیتابیس
// =====================================

function saveDB() {

  try {

    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        DB,
        null,
        2
      ),
      "utf8"
    );

  }

  catch (error) {

    console.log(
      "DATABASE SAVE ERROR:",
      error.message
    );

  }

}


// =====================================
// ساخت گروه
// =====================================

function createDefaultGroup(
  chatId
) {

  return {

    id:
      String(chatId),

    // -------------------------------
    // اخطارها
    // -------------------------------

    warns: {},

    warningSettings: {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    },

    // -------------------------------
    // تنظیمات گروه
    // -------------------------------

    settings: {

      welcome: true,

      botReply: true,

      rules: "",

      nickname: true

    },

    // -------------------------------
    // کاربران
    // -------------------------------

    users: {},

    // -------------------------------
    // دسترسی‌ها
    // -------------------------------

    permissions: {},

    // -------------------------------
    // قفل‌ها
    // -------------------------------

    locks: {}

  };

}


// =====================================
// دریافت گروه
// =====================================

function getGroup(
  chatId
) {

  const id =
    String(chatId);


  if (
    !DB.groups[id]
  ) {

    DB.groups[id] =
      createDefaultGroup(id);

    saveDB();

  }


  return DB.groups[id];

}


// =====================================
// دریافت کل دیتابیس
// =====================================

function getDB() {

  return DB;

}


// =====================================
// تنظیم کاربر
// =====================================

function getUser(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  const id =
    String(userId);


  if (
    !group.users[id]
  ) {

    group.users[id] = {

      id:
        userId,

      warns: 0,

      nickname: null

    };

    saveDB();

  }


  return group.users[id];

}


// =====================================
// تنظیم مقدار کاربر
// =====================================

function setUser(
  chatId,
  userId,
  data
) {

  const group =
    getGroup(chatId);

  const id =
    String(userId);


  if (
    !group.users[id]
  ) {

    group.users[id] = {

      id:
        userId

    };

  }


  Object.assign(
    group.users[id],
    data
  );


  saveDB();


  return group.users[id];

}


// =====================================
// دریافت دسترسی کاربر
// =====================================

function getPermissions(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  const id =
    String(userId);


  if (
    !group.permissions[id]
  ) {

    group.permissions[id] = {

      ban: false,

      kick: false,

      mute: false,

      warn: false,

      info: false,

      locks: false,

      settings: false,

      welcome: false

    };

    saveDB();

  }


  return group.permissions[id];

}


// =====================================
// تنظیم دسترسی کاربر
// =====================================

function setPermissions(
  chatId,
  userId,
  permissions
) {

  const group =
    getGroup(chatId);

  const id =
    String(userId);


  if (
    !group.permissions[id]
  ) {

    group.permissions[id] = {};

  }


  Object.assign(
    group.permissions[id],
    permissions
  );


  saveDB();


  return group.permissions[id];

}


// =====================================
// بارگذاری اولیه
// =====================================

loadDB();


// =====================================
// خروجی
// =====================================

module.exports = {

  getDB,

  getGroup,

  getUser,

  setUser,

  getPermissions,

  setPermissions,

  saveDB

};
