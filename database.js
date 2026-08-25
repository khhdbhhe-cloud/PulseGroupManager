const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "group-data.json");

let db = {
  groups: {}
};

function defaultGroup() {
  return {
    admins: {},

    warns: {},

    stats: {},

    panels: {},

    userPermissions: {},

    rules: "",

    welcome: {
      enabled: false,
      text: "خوش آمدی {name}"
    },

    goodbye: {
      enabled: false,
      text: "{name} از گروه خارج شد."
    },

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
      mentions: false
    },

    settings: {
      antiFlood: false,
      autoWarn: false
    }
  };
}


function loadDB() {
  try {

    if (fs.existsSync(DB_FILE)) {

      const data =
        fs.readFileSync(
          DB_FILE,
          "utf8"
        );

      if (data.trim()) {
        db = JSON.parse(data);
      }

    }

  } catch (error) {

    console.log(
      "Database load error:",
      error.message
    );

    db = {
      groups: {}
    };

  }
}


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

  } catch(error) {

    console.log(
      "Database save error:",
      error.message
    );

  }

}


function getGroup(chatId) {

  const id = String(chatId);


  if (!db.groups[id]) {

    db.groups[id] =
      defaultGroup();

    saveDB();

  }


  return db.groups[id];

}


function getDB() {
  return db;
}


loadDB();


module.exports = {
  getGroup,
  saveDB,
  getDB
};
