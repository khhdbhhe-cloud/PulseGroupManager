// =====================================
// PulseGroupManager
// WELCOME SYSTEM - FULL
// =====================================

const { checkAdmin } =
  require("./security");

const {
  getGroup,
  saveDB
} = require("./database");

const {
  getDefaultWelcomeText,
  formatWelcomeText
} = require("./welcome-text");


// =====================================
// بررسی گروه
// =====================================

function isGroup(ctx) {

  return !!(
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );

}


// =====================================
// HTML امن
// =====================================

function escapeHtml(text) {

  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


// =====================================
// نام کاربر
// =====================================

function getUserName(user) {

  if (!user)
    return "دوست عزیز";

  const first =
    user.first_name || "";

  const last =
    user.last_name || "";

  const name =
    `${first} ${last}`.trim();

  return escapeHtml(
    name || "دوست عزیز"
  );

}


// =====================================
// منشن کاربر
// =====================================

function getUserMention(user) {

  if (
    !user ||
    !user.id
  ) {

    return "دوست عزیز";

  }

  return (
    `<a href="tg://user?id=${user.id}">` +
    `${getUserName(user)}` +
    `</a>`
  );

}


// =====================================
// نام روز هفته
// =====================================

function getPersianDay() {

  const days = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه"
  ];

  return days[
    new Date().getDay()
  ];

}


// =====================================
// تبدیل اعداد به فارسی
// =====================================

function toPersianNumbers(value) {

  const map = {
    "0": "۰",
    "1": "۱",
    "2": "۲",
    "3": "۳",
    "4": "۴",
    "5": "۵",
    "6": "۶",
    "7": "۷",
    "8": "۸",
    "9": "۹"
  };

  return String(value).replace(
    /\d/g,
    number => map[number]
  );

}


// =====================================
// تاریخ شمسی
// =====================================

function getPersianDate() {

  const date =
    new Date();

  try {

    const formatter =
      new Intl.DateTimeFormat(
        "fa-IR-u-ca-persian",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }
      );

    return formatter.format(date);

  }

  catch (error) {

    return "۱۴۰۵/۰۶/۰۴";

  }

}


// =====================================
// ساعت
// =====================================

function getTime() {

  const date =
    new Date();

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  const seconds =
    String(
      date.getSeconds()
    ).padStart(2, "0");

  return toPersianNumbers(
    `${hours}:${minutes}:${seconds}`
  );

}


// =====================================
// دریافت تنظیمات خوشامد
// =====================================

function getWelcomeSettings(chatId) {

  const group =
    getGroup(chatId);


  if (!group.welcome) {

    group.welcome = {

      enabled: true,

      type: "text",

      fileId: null,

      text: null

    };

    saveDB();

  }


  if (
    group.welcome.enabled ===
    undefined
  ) {

    group.welcome.enabled =
      true;

  }


  if (
    !group.welcome.type
  ) {

    group.welcome.type =
      "text";

  }


  if (
    group.welcome.fileId ===
    undefined
  ) {

    group.welcome.fileId =
      null;

  }


  if (
    group.welcome.text ===
    undefined
  ) {

    group.welcome.text =
      null;

  }


  saveDB();

  return group.welcome;

}


// =====================================
// متن پیش‌فرض خوشامد
// =====================================

function getWelcomeText(
  user,
  chat
) {

  const settings =
    getWelcomeSettings(
      chat.id
    );


  // اگر مدیر متن اختصاصی تنظیم کرده باشد
  if (settings.text) {

    return formatWelcomeText(
      settings.text,
      user,
      chat
    );

  }


  // -----------------------------------
  // خوشامد پیش‌فرض جدید
  // -----------------------------------

  const day =
    getPersianDay();

  const date =
    getPersianDate();

  const time =
    getTime();


  const mention =
    getUserMention(user);


  const groupName =
    escapeHtml(
      chat.title ||
      "گروه"
    );


  return (
`• سلام ${mention} . به گروه 🫀𝐏 𝐔 𝐋 𝐒 𝐄 خوش آمدید 🌷

📆 تاریخ : ${day} , ${date}
⏰ ساعت : ${time}`
  );

}


// =====================================
// ریپلای به دستور
// =====================================

function replyToCommand(
  ctx,
  text
) {

  return ctx.reply(
    text,
    {

      parse_mode:
        "HTML",

      reply_parameters: {

        message_id:
          ctx.message.message_id

      }

    }
  );

}


// =====================================
// تنظیم رسانه
// =====================================

function setWelcomeMedia(
  chatId,
  type,
  fileId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.type =
    type;

  settings.fileId =
    fileId;

  settings.enabled =
    true;


  saveDB();

  return settings;

}


// =====================================
// حذف رسانه
// =====================================

function clearWelcomeMedia(
  chatId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.type =
    "text";

  settings.fileId =
    null;


  saveDB();

  return settings;

}


// =====================================
// روشن کردن خوشامد
// =====================================

function enableWelcome(
  chatId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.enabled =
    true;


  saveDB();

  return settings;

}


// =====================================
// خاموش کردن خوشامد
// =====================================

function disableWelcome(
  chatId
) {

  const settings =
    getWelcomeSettings(
      chatId
    );


  settings.enabled =
    false;


  saveDB();

  return settings;

}


// =====================================
// ارسال خوشامد
// =====================================

async function sendWelcome(
  ctx,
  user
) {

  try {

    if (!isGroup(ctx))
      return;


    if (
      !user ||
      !user.id
    )
      return;


    const settings =
      getWelcomeSettings(
        ctx.chat.id
      );


    console.log(
      "================================="
    );

    console.log(
      "WELCOME NEW MEMBER"
    );

    console.log(
      "GROUP:",
      ctx.chat.title
    );

    console.log(
      "USER:",
      user.first_name
    );

    console.log(
      "USER ID:",
      user.id
    );

    console.log(
      "WELCOME ENABLED:",
      settings.enabled
    );

    console.log(
      "WELCOME TYPE:",
      settings.type
    );

    console.log(
      "================================="
    );


    // ---------------------------------
    // اگر خاموش است
    // ---------------------------------

    if (!settings.enabled) {

      console.log(
        "WELCOME: DISABLED"
      );

      return;

    }


    // ---------------------------------
    // ساخت متن
    // ---------------------------------

    const text =
      getWelcomeText(
        user,
        ctx.chat
      );


    // ---------------------------------
    // متن
    // ---------------------------------

    if (
      settings.type === "text" ||
      !settings.fileId
    ) {

      return await ctx.reply(
        text,
        {
          parse_mode:
            "HTML"
        }
      );

    }


    // ---------------------------------
    // GIF
    // ---------------------------------

    if (
      settings.type ===
      "animation"
    ) {

      return await ctx.replyWithAnimation(
        settings.fileId,
        {

          caption:
            text,

          parse_mode:
            "HTML"

        }
      );

    }


    // ---------------------------------
    // ویدیو
    // ---------------------------------

    if (
      settings.type ===
      "video"
    ) {

      return await ctx.replyWithVideo(
        settings.fileId,
        {

          caption:
            text,

          parse_mode:
            "HTML"

        }
      );

    }


    // ---------------------------------
    // عکس
    // ---------------------------------

    if (
      settings.type ===
      "photo"
    ) {

      return await ctx.replyWithPhoto(
        settings.fileId,
        {

          caption:
            text,

          parse_mode:
            "HTML"

        }
      );

    }


    // ---------------------------------
    // استیکر
    // ---------------------------------

    if (
      settings.type ===
      "sticker"
    ) {

      await ctx.replyWithSticker(
        settings.fileId
      );


      return await ctx.reply(
        text,
        {
          parse_mode:
            "HTML"
        }
      );

    }


    // ---------------------------------
    // حالت ناشناخته
    // ---------------------------------

    return await ctx.reply(
      text,
      {
        parse_mode:
          "HTML"
      }
    );

  }

  catch (error) {

    console.log(
      "================================="
    );

    console.log(
      "WELCOME SEND ERROR"
    );

    console.log(
      error.message
    );

    console.log(
      error
    );

    console.log(
      "================================="
    );

  }

}


// =====================================
// ثبت سیستم خوشامد
// =====================================

function registerWelcome(bot) {

  console.log(
    "================================="
  );

  console.log(
    "WELCOME SYSTEM REGISTERED"
  );

  console.log(
    "NEW MEMBER LISTENER ACTIVE"
  );

  console.log(
    "================================="
  );


  // ===================================
  // ورود عضو جدید
  // ===================================

  bot.on(
    "new_chat_members",
    async ctx => {

      try {

        console.log(
          "================================="
        );

        console.log(
          "NEW CHAT MEMBER EVENT RECEIVED"
        );

        console.log(
          "CHAT:",
          ctx.chat
            ? ctx.chat.title
            : "UNKNOWN"
        );

        console.log(
          "================================="
        );


        if (!isGroup(ctx)) {

          console.log(
            "WELCOME: NOT A GROUP"
          );

          return;

        }


        const members =
          (
            ctx.message &&
            ctx.message.new_chat_members
          ) || [];


        if (
          !Array.isArray(members) ||
          members.length === 0
        ) {

          console.log(
            "WELCOME: NO NEW MEMBERS"
          );

          return;

        }


        // --------------------------------
        // ثبت آمار ورود
        // --------------------------------

        const group =
          getGroup(
            ctx.chat.id
          );


        if (!group.stats)
          group.stats = {};


        if (
          typeof group.stats.joins !==
          "number"
        ) {

          group.stats.joins =
            0;

        }


        group.stats.joins +=
          members.length;


        saveDB();


        // --------------------------------
        // خوشامد اعضا
        // --------------------------------

        for (
          const user of members
        ) {

          await sendWelcome(
            ctx,
            user
          );

        }

      }

      catch (error) {

        console.log(
          "NEW MEMBER HANDLER ERROR:",
          error.message
        );

        console.log(error);

      }

    }
  );


  // ===================================
  // تنظیم GIF
  // ===================================

  bot.hears(
    /^تنظیم\s+گیف$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok) {

        return replyToCommand(
          ctx,
          access.text
        );

      }


      const reply =
        ctx.message.reply_to_message;


      if (
        !reply ||
        !reply.animation
      ) {

        return replyToCommand(
          ctx,
`『𓆩 ★ تنظیم گیف ★ 𓆪』

روی GIF ریپلای کنید و بنویسید:

تنظیم گیف`
        );

      }


      setWelcomeMedia(
        ctx.chat.id,
        "animation",
        reply.animation.file_id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

گیف خوشامد با موفقیت تنظیم شد. ✅`
      );

    }
  );


  // ===================================
  // تنظیم ویدیو
  // ===================================

  bot.hears(
    /^تنظیم\s+ویدیو$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok) {

        return replyToCommand(
          ctx,
          access.text
        );

      }


      const reply =
        ctx.message.reply_to_message;


      if (
        !reply ||
        !reply.video
      ) {

        return replyToCommand(
          ctx,
`『𓆩 ★ تنظیم ویدیو ★ 𓆪』

روی ویدیو ریپلای کنید و بنویسید:

تنظیم ویدیو`
        );

      }


      setWelcomeMedia(
        ctx.chat.id,
        "video",
        reply.video.file_id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

ویدیوی خوشامد با موفقیت تنظیم شد. ✅`
      );

    }
  );


  // ===================================
  // تنظیم عکس
  // ===================================

  bot.hears(
    /^تنظیم\s+عکس$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok) {

        return replyToCommand(
          ctx,
          access.text
        );

      }


      const reply =
        ctx.message.reply_to_message;


      if (
        !reply ||
        !reply.photo ||
        !reply.photo.length
      ) {

        return replyToCommand(
          ctx,
`『𓆩 ★ تنظیم عکس ★ 𓆪』

روی عکس ریپلای کنید و بنویسید:

تنظیم عکس`
        );

      }


      const photo =
        reply.photo[
          reply.photo.length - 1
        ];


      setWelcomeMedia(
        ctx.chat.id,
        "photo",
        photo.file_id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

عکس خوشامد با موفقیت تنظیم شد. ✅`
      );

    }
  );


  // ===================================
  // تنظیم استیکر
  // ===================================

  bot.hears(
    /^تنظیم\s+استیکر$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok) {

        return replyToCommand(
          ctx,
          access.text
        );

      }


      const reply =
        ctx.message.reply_to_message;


      if (
        !reply ||
        !reply.sticker
      ) {

        return replyToCommand(
          ctx,
`『𓆩 ★ تنظیم استیکر ★ 𓆪』

روی استیکر ریپلای کنید و بنویسید:

تنظیم استیکر`
        );

      }


      setWelcomeMedia(
        ctx.chat.id,
        "sticker",
        reply.sticker.file_id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

استیکر خوشامد با موفقیت تنظیم شد. ✅`
      );

    }
  );


  // ===================================
  // خوشامد روشن
  // ===================================

  bot.hears(
    /^خوشامد\s+روشن$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok)
        return;


      enableWelcome(
        ctx.chat.id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

سیستم خوشامدگویی فعال شد. ✅`
      );

    }
  );


  // ===================================
  // خوشامد خاموش
  // ===================================

  bot.hears(
    /^خوشامد\s+خاموش$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok)
        return;


      disableWelcome(
        ctx.chat.id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

سیستم خوشامدگویی خاموش شد. ❌`
      );

    }
  );


  // ===================================
  // حذف خوشامد
  // ===================================

  bot.hears(
    /^حذف\s+خوشامد$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok)
        return;


      clearWelcomeMedia(
        ctx.chat.id
      );


      return replyToCommand(
        ctx,
`『𓆩 ★ خوشامدگویی ★ 𓆪』

رسانه خوشامد حذف شد. ✅

از این به بعد خوشامد به صورت متنی ارسال می‌شود.`
      );

    }
  );


  // ===================================
  // وضعیت خوشامد
  // ===================================

  bot.hears(
    /^وضعیت\s+خوشامد$/u,
    async ctx => {

      if (!isGroup(ctx))
        return;


      const access =
        await checkAdmin(ctx);


      if (!access.ok)
        return;


      const settings =
        getWelcomeSettings(
          ctx.chat.id
        );


      let media =
        "متن";


      if (
        settings.type ===
        "animation"
      )
        media = "GIF";


      else if (
        settings.type ===
        "video"
      )
        media = "ویدیو";


      else if (
        settings.type ===
        "photo"
      )
        media = "عکس";


      else if (
        settings.type ===
        "sticker"
      )
        media = "استیکر";


      return replyToCommand(
        ctx,
`『𓆩 ★ وضعیت خوشامد ★ 𓆪』

وضعیت:
${settings.enabled ? "فعال ✅" : "خاموش ❌"}

رسانه:
${media}`
      );

    }
  );

}


// =====================================
// EXPORT
// =====================================

module.exports = {

  registerWelcome,

  getWelcomeSettings,

  getWelcomeText,

  sendWelcome,

  setWelcomeMedia,

  clearWelcomeMedia,

  enableWelcome,

  disableWelcome

};
