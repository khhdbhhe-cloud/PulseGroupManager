// =====================================
// PulseGroupManager
// DATABASE
// =====================================

const fs = require("fs");
const path = require("path");

const DB_FILE =
  path.join(__dirname, "group-data.json");


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
    // دسترسی کاربران
    // -------------------------------

    userPermissions: {},


    // -------------------------------
    // اخطارها
    // -------------------------------

    warns: {},


    // -------------------------------
    // آمار
    // -------------------------------

    stats: {},


    // -------------------------------
    // پنل‌ها
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

      text:
        "『𓆩 ★ خوش اومدی ★ 𓆪』\n\nسلام {mention} عزیز 🌹\n\nبه گروه «{group}» خوش اومدی ❤️",

      type: "text",

      fileId: null,

      // کسی که مقام خوشامد دارد
      managers: {}

    },


    // -------------------------------
    // پیام خروج
    // -------------------------------

    goodbye: {

      enabled: false,

      text:
        "{mention} از گروه خارج شد.",

      type: "text",

      fileId: null

    },


    // -------------------------------
    // قفل‌ها
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

      welcomeEnabled: true,

      goodbyeEnabled: false

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

        db =
          JSON.parse(data);

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
// گرفتن اطلاعات گروه
// =====================================

function getGroup(chatId) {

  const id =
    String(chatId);


  if (
    !db.groups[id]
  ) {

    db.groups[id] =
      defaultGroup();

    saveDB();

  }


  return db.groups[id];

}


// =====================================
// اطمینان از وجود ساختارهای قدیمی
// =====================================

function repairGroup(group) {

  const defaults =
    defaultGroup();


  // اگر دیتابیس قدیمی باشد
  // قسمت‌های جدید اضافه می‌شوند

  if (!group.admins)
    group.admins = {};


  if (!group.userPermissions)
    group.userPermissions = {};


  if (!group.warns)
    group.warns = {};


  if (!group.stats)
    group.stats = {};


  if (!group.panels)
    group.panels = {};


  if (!group.rules)
    group.rules = "";


  if (!group.welcome)
    group.welcome =
      defaults.welcome;


  if (!group.goodbye)
    group.goodbye =
      defaults.goodbye;


  if (!group.locks)
    group.locks =
      defaults.locks;


  if (!group.settings)
    group.settings =
      defaults.settings;


  // ساخت managers خوشامد

  if (
    !group.welcome.managers
  ) {

    group.welcome.managers = {};

  }


  return group;

}


// =====================================
// گرفتن گروه + تعمیر خودکار
// =====================================

function getGroupSafe(chatId) {

  const group =
    getGroup(chatId);


  repairGroup(group);


  return group;

}


// =====================================
// گرفتن کل دیتابیس
// =====================================

function getDB() {

  return db;

}


// =====================================
// ذخیره هنگام خروج
// =====================================

process.once(
  "SIGINT",
  () => {

    saveDB();

  }
);


process.once(
  "SIGTERM",
  () => {

    saveDB();

  }
);


// =====================================
// شروع دیتابیس
// =====================================

loadDB();


// =====================================
// خروجی
// =====================================

module.exports = {

  getGroup,

  getGroupSafe,

  saveDB,

  getDB,

  defaultGroup,

  repairGroup

};
