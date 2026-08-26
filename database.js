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
    // مالک و مدیران
    // -------------------------------

    ownerId: null,

    admins: {},


    // -------------------------------
    // دسترسی کاربران
    // -------------------------------

    userPermissions: {},


    // -------------------------------
    // مقام خوشامد
    // -------------------------------

    welcomeManagers: {},


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

      leaves: 0,

      warns: 0,

      bans: 0,

      mutes: 0

    },


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

      type: "text",

      fileId: null,

      text:
        "『𓆩 ★ خوش اومدی ★ 𓆪』\n\nسلام {mention} عزیز 🌹\n\nبه گروه «{group}» خوش اومدی ❤️"

    },


    // -------------------------------
    // خروج اعضا
    // -------------------------------

    goodbye: {

      enabled: false,

      text:
        "خداحافظ {mention} 👋"

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

      welcome: true,

      goodbye: false

    },


    // -------------------------------
    // تنظیمات اخطار
    // -------------------------------

    warningSettings: {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    }

  };

}


// =====================================
// ساخت دیتابیس
// =====================================

function createDatabase() {

  if (!db || typeof db !== "object") {

    db = {
      groups: {}
    };

  }

  if (!db.groups) {

    db.groups = {};

  }

}


// =====================================
// بارگذاری دیتابیس
// =====================================

function loadDB() {

  try {

    if (!fs.existsSync(DB_FILE)) {

      createDatabase();

      saveDB();

      return;

    }


    const data =
      fs.readFileSync(
        DB_FILE,
        "utf8"
      );


    if (!data.trim()) {

      createDatabase();

      saveDB();

      return;

    }


    const parsed =
      JSON.parse(data);


    if (
      parsed &&
      typeof parsed === "object"
    ) {

      db = parsed;

    }


    createDatabase();


    console.log(
      "DATABASE: loaded successfully"
    );

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

    createDatabase();


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
// دریافت گروه
// =====================================

function getGroup(chatId) {

  const id =
    String(chatId);


  if (!db.groups[id]) {

    db.groups[id] =
      defaultGroup();

    saveDB();

  }


  const group =
    db.groups[id];


  // =================================
  // سازگاری با دیتابیس قدیمی
  // =================================

  if (!group.admins)
    group.admins = {};


  if (!group.userPermissions)
    group.userPermissions = {};


  if (!group.welcomeManagers)
    group.welcomeManagers = {};


  if (!group.warns)
    group.warns = {};


  if (!group.panels)
    group.panels = {};


  if (!group.stats) {

    group.stats = {

      messages: 0,

      joins: 0,

      leaves: 0,

      warns: 0,

      bans: 0,

      mutes: 0

    };

  }


  if (!group.rules)
    group.rules = "";


  if (!group.welcome) {

    group.welcome = {

      enabled: true,

      type: "text",

      fileId: null,

      text:
        "『𓆩 ★ خوش اومدی ★ 𓆪』\n\nسلام {mention} عزیز 🌹\n\nبه گروه «{group}» خوش اومدی ❤️"

    };

  }


  if (!group.goodbye) {

    group.goodbye = {

      enabled: false,

      text:
        "خداحافظ {mention} 👋"

    };

  }


  if (!group.locks) {

    group.locks = {

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

    };

  }


  if (!group.settings) {

    group.settings = {

      antiFlood: false,

      autoWarn: false,

      welcome: true,

      goodbye: false

    };

  }


  if (!group.warningSettings) {

    group.warningSettings = {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    };

  }


  return group;

}


// =====================================
// دریافت کل دیتابیس
// =====================================

function getDB() {

  return db;

}


// =====================================
// حذف گروه
// =====================================

function deleteGroup(chatId) {

  const id =
    String(chatId);


  if (db.groups[id]) {

    delete db.groups[id];

    saveDB();

    return true;

  }


  return false;

}


// =====================================
// تعیین مالک گروه
// =====================================

function setOwner(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);


  group.ownerId =
    String(userId);


  saveDB();


  return group;

}


// =====================================
// گرفتن مالک گروه
// =====================================

function getOwner(
  chatId
) {

  const group =
    getGroup(chatId);


  return group.ownerId;

}


// =====================================
// اجرای اولیه
// =====================================

loadDB();


// =====================================
// خروجی
// =====================================

module.exports = {

  getGroup,

  getDB,

  saveDB,

  loadDB,

  deleteGroup,

  setOwner,

  getOwner

};
