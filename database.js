// =====================================
// PulseGroupManager
// DATABASE SYSTEM
// =====================================

const fs = require("fs");
const path = require("path");


// =====================================
// محل ذخیره دیتابیس
// =====================================

const DB_FILE =
  path.join(
    __dirname,
    "group-data.json"
  );


// =====================================
// دیتابیس اصلی
// =====================================

let db = {
  groups: {}
};


// =====================================
// تنظیمات پیش‌فرض گروه
// =====================================

function defaultGroup() {

  return {

    // -------------------------------
    // مدیران
    // -------------------------------

    admins: {},


    // -------------------------------
    // دسترسی اختصاصی کاربران
    // -------------------------------

    userPermissions: {},


    // -------------------------------
    // مقام خوشامد
    // -------------------------------

    welcomeAdmins: {},


    // -------------------------------
    // اخطارها
    // -------------------------------

    warns: {},


    // -------------------------------
    // آمار
    // -------------------------------

    stats: {

      messages: 0,

      joins: 0,

      leaves: 0

    },


    // -------------------------------
    // پنل‌های باز شده
    // -------------------------------

    panels: {},


    // -------------------------------
    // قوانین
    // -------------------------------

    rules: "",


    // -------------------------------
    // خوشامدگویی
    // -------------------------------

    welcome: {

      enabled: true,

      type: "text",

      fileId: null,

      text:
        "『𓆩 ★ خوش اومدی ★ 𓆪』\n\nسلام {mention} عزیز 🌹\n\nبه گروه «{group}» خوش اومدی ❤️"

    },


    // -------------------------------
    // خروج
    // -------------------------------

    goodbye: {

      enabled: false,

      text:
        "{mention} از گروه خارج شد."

    },


    // -------------------------------
    // قفل‌های گروه
    // -------------------------------

    locks: {

      links: false,

      photos: false,

      videos: false,

      documents: false,

      voice: false,

      gif: false,

      sticker: false,

      forward: false,

      polls: false,

      mentions: false,

      ads: false

    },


    // -------------------------------
    // تنظیمات گروه
    // -------------------------------

    settings: {

      antiFlood: false,

      autoWarn: false,

      deleteServiceMessages: false,

      deleteWelcome: false

    }

  };

}


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


      if (
        data.trim()
      ) {

        const parsed =
          JSON.parse(data);


        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.groups &&
          typeof parsed.groups === "object"
        ) {

          db = parsed;

        }

      }

    }

  }

  catch (error) {

    console.log(
      "DATABASE LOAD ERROR:",
      error.message
    );


    db = {
      groups: {}
    };

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
        db,
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
// تکمیل اطلاعات گروه‌های قدیمی
// =====================================

function mergeDefaults(
  group
) {

  const defaults =
    defaultGroup();


  // -------------------------------
  // بخش‌های اصلی
  // -------------------------------

  for (
    const key of Object.keys(defaults)
  ) {

    if (
      group[key] === undefined ||
      group[key] === null
    ) {

      group[key] =
        defaults[key];

    }

  }


  // -------------------------------
  // خوشامد
  // -------------------------------

  group.welcome =
    {
      ...defaults.welcome,
      ...(group.welcome || {})
    };


  // -------------------------------
  // خروج
  // -------------------------------

  group.goodbye =
    {
      ...defaults.goodbye,
      ...(group.goodbye || {})
    };


  // -------------------------------
  // قفل‌ها
  // -------------------------------

  group.locks =
    {
      ...defaults.locks,
      ...(group.locks || {})
    };


  // -------------------------------
  // تنظیمات
  // -------------------------------

  group.settings =
    {
      ...defaults.settings,
      ...(group.settings || {})
    };


  // -------------------------------
  // آمار
  // -------------------------------

  group.stats =
    {
      ...defaults.stats,
      ...(group.stats || {})
    };


  // -------------------------------
  // آبجکت‌ها
  // -------------------------------

  if (
    !group.admins ||
    typeof group.admins !== "object"
  ) {

    group.admins = {};

  }


  if (
    !group.userPermissions ||
    typeof group.userPermissions !== "object"
  ) {

    group.userPermissions = {};

  }


  if (
    !group.welcomeAdmins ||
    typeof group.welcomeAdmins !== "object"
  ) {

    group.welcomeAdmins = {};

  }


  if (
    !group.warns ||
    typeof group.warns !== "object"
  ) {

    group.warns = {};

  }


  if (
    !group.panels ||
    typeof group.panels !== "object"
  ) {

    group.panels = {};

  }


  return group;

}


// =====================================
// دریافت اطلاعات گروه
// =====================================

function getGroup(
  chatId
) {

  const id =
    String(chatId);


  if (
    !db.groups[id]
  ) {

    db.groups[id] =
      defaultGroup();


    saveDB();

  }


  else {

    const before =
      JSON.stringify(
        db.groups[id]
      );


    db.groups[id] =
      mergeDefaults(
        db.groups[id]
      );


    const after =
      JSON.stringify(
        db.groups[id]
      );


    if (
      before !== after
    ) {

      saveDB();

    }

  }


  return db.groups[id];

}


// =====================================
// دریافت کل دیتابیس
// =====================================

function getDB() {

  return db;

}


// =====================================
// حذف گروه از دیتابیس
// =====================================

function deleteGroup(
  chatId
) {

  const id =
    String(chatId);


  if (
    db.groups[id]
  ) {

    delete db.groups[id];

    saveDB();

    return true;

  }


  return false;

}


// =====================================
// بررسی وجود گروه
// =====================================

function hasGroup(
  chatId
) {

  const id =
    String(chatId);


  return !!db.groups[id];

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getGroup,

  saveDB,

  getDB,

  deleteGroup,

  hasGroup

};


// =====================================
// شروع
// =====================================

loadDB();


console.log(
  "DATABASE SYSTEM LOADED"
);
