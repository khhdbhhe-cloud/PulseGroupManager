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

    if (fs.existsSync(DB_FILE)) {

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


  // -----------------------------------
  // اطمینان از سالم بودن ساختار دیتابیس
  // -----------------------------------

  if (
    !DB ||
    typeof DB !== "object" ||
    Array.isArray(DB)
  ) {

    DB = {
      groups: {}
    };

  }


  if (
    !DB.groups ||
    typeof DB.groups !== "object" ||
    Array.isArray(DB.groups)
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
// ساختار پیش‌فرض قفل‌ها
// =====================================

function createDefaultLocks() {

  return {

    sticker: false,

    gif: false,

    photo: false,

    video: false,

    voice: false,

    longText: false,

    poll: false

  };

}


// =====================================
// ساختار پیش‌فرض گروه
// =====================================

function createDefaultGroup(
  chatId
) {

  return {

    id:
      String(chatId),


    // ---------------------------------
    // اخطارها
    // ---------------------------------

    warns: {},


    warningSettings: {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    },


    // ---------------------------------
    // تنظیمات گروه
    // ---------------------------------

    settings: {

      welcome: true,

      botReply: true,

      rules: "",

      nickname: true

    },


    // ---------------------------------
    // کاربران
    // ---------------------------------

    users: {},


    // ---------------------------------
    // دسترسی‌ها
    // ---------------------------------

    permissions: {},


    // ---------------------------------
    // قفل‌های گروه
    // ---------------------------------

    locks:
      createDefaultLocks()

  };

}


// =====================================
// اطمینان از وجود تمام بخش‌های گروه
// =====================================

function ensureGroupStructure(
  group,
  chatId
) {

  if (
    !group ||
    typeof group !== "object"
  ) {

    return createDefaultGroup(
      chatId
    );

  }


  // ---------------------------------
  // شناسه گروه
  // ---------------------------------

  if (!group.id) {

    group.id =
      String(chatId);

  }


  // ---------------------------------
  // اخطارها
  // ---------------------------------

  if (
    !group.warns ||
    typeof group.warns !== "object"
  ) {

    group.warns = {};

  }


  // ---------------------------------
  // تنظیمات اخطار
  // ---------------------------------

  if (
    !group.warningSettings ||
    typeof group.warningSettings !== "object"
  ) {

    group.warningSettings = {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    };

  }


  if (
    typeof group.warningSettings.maxWarnings !==
    "number"
  ) {

    group.warningSettings.maxWarnings = 3;

  }


  if (
    typeof group.warningSettings.punishment !==
    "string"
  ) {

    group.warningSettings.punishment =
      "mute";

  }


  if (
    typeof group.warningSettings.duration !==
    "number"
  ) {

    group.warningSettings.duration =
      60;

  }


  // ---------------------------------
  // تنظیمات گروه
  // ---------------------------------

  if (
    !group.settings ||
    typeof group.settings !== "object"
  ) {

    group.settings = {};

  }


  if (
    typeof group.settings.welcome !==
    "boolean"
  ) {

    group.settings.welcome = true;

  }


  if (
    typeof group.settings.botReply !==
    "boolean"
  ) {

    group.settings.botReply = true;

  }


  if (
    typeof group.settings.rules !==
    "string"
  ) {

    group.settings.rules = "";

  }


  if (
    typeof group.settings.nickname !==
    "boolean"
  ) {

    group.settings.nickname = true;

  }


  // ---------------------------------
  // کاربران
  // ---------------------------------

  if (
    !group.users ||
    typeof group.users !== "object"
  ) {

    group.users = {};

  }


  // ---------------------------------
  // دسترسی‌ها
  // ---------------------------------

  if (
    !group.permissions ||
    typeof group.permissions !== "object"
  ) {

    group.permissions = {};

  }


  // ---------------------------------
  // قفل‌ها
  // ---------------------------------

  if (
    !group.locks ||
    typeof group.locks !== "object"
  ) {

    group.locks =
      createDefaultLocks();

  }


  const defaultLocks =
    createDefaultLocks();


  for (
    const lockName of Object.keys(
      defaultLocks
    )
  ) {

    if (
      typeof group.locks[lockName] !==
      "boolean"
    ) {

      group.locks[lockName] =
        defaultLocks[lockName];

    }

  }


  return group;

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


  else {

    const oldGroup =
      DB.groups[id];


    const fixedGroup =
      ensureGroupStructure(
        oldGroup,
        id
      );


    if (
      fixedGroup !== oldGroup
    ) {

      DB.groups[id] =
        fixedGroup;

      saveDB();

    }

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
// دریافت اطلاعات کاربر
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
// تنظیم اطلاعات کاربر
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


  if (
    data &&
    typeof data === "object"
  ) {

    Object.assign(
      group.users[id],
      data
    );

  }


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


  if (
    permissions &&
    typeof permissions === "object"
  ) {

    Object.assign(
      group.permissions[id],
      permissions
    );

  }


  saveDB();


  return group.permissions[id];

}


// =====================================
// مقداردهی اولیه دیتابیس
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
