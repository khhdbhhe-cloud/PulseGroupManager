// =====================================
// PulseGroupManager
// MODERATION
// بن | سیک | اخراج | سکوت | خفه | اخطار
// =====================================

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// حافظه کاربران دیده‌شده
// =====================================

const knownUsers = {};


// =====================================
// ذخیره کاربر
// =====================================

function rememberUser(user) {

  if (!user || !user.id) {
    return;
  }

  knownUsers[String(user.id)] = user;
}


// =====================================
// نام کاربر
// =====================================

function getUserName(user) {

  if (!user) {
    return "کاربر";
  }

  if (user.username) {
    return `@${user.username}`;
  }

  if (user.first_name) {
    return user.first_name;
  }

  return "کاربر";
}


// =====================================
// ایمن‌سازی HTML
// =====================================

function escapeHtml(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// =====================================
// منشن کاربر
// =====================================

function mentionUser(user) {

  if (!user || !user.id) {
    return "کاربر";
  }

  const name =
    user.first_name ||
    user.username ||
    "کاربر";

  return `<a href="tg://user?id=${user.id}">${escapeHtml(name)}</a>`;
}


// =====================================
// بررسی گروه
// =====================================

function isGroupChat(ctx) {

  return Boolean(
    ctx &&
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );
}


// =====================================
// گرفتن پیام Reply شده
// =====================================

function getTargetMessage(ctx) {

  if (
    !ctx ||
    !ctx.message ||
    !ctx.message.reply_to_message
  ) {
    return null;
  }

  return ctx.message.reply_to_message;
}


// =====================================
// گرفتن کاربر هدف از Reply
// =====================================

function getReplyTarget(ctx) {

  const targetMessage =
    getTargetMessage(ctx);

  if (
    !targetMessage ||
    !targetMessage.from
  ) {
    return null;
  }

  return targetMessage.from;
}


// =====================================
// آیدی پیام هدف
// =====================================

function getTargetReplyId(ctx) {

  const targetMessage =
    getTargetMessage(ctx);

  if (
    targetMessage &&
    targetMessage.message_id
  ) {
    return targetMessage.message_id;
  }

  return undefined;
}


// =====================================
// پاسخ به صورت Reply
// =====================================

async function replyToTarget(
  ctx,
  text,
  options = {}
) {

  const replyId =
    getTargetReplyId(ctx);

  try {

    if (replyId) {

      return await ctx.reply(
        text,
        {
          ...options,

          reply_parameters: {
            message_id: replyId
          }
        }
      );
    }

    return await ctx.reply(
      text,
      options
    );

  } catch (error) {

    console.log(
      "REPLY TO TARGET ERROR:",
      error.message
    );

    try {

      return await ctx.reply(
        text,
        options
      );

    } catch (secondError) {

      console.log(
        "NORMAL REPLY ERROR:",
        secondError.message
      );

      return null;
    }
  }
}


// =====================================
// تشخیص مقام کاربر
// =====================================

async function getMemberRole(
  ctx,
  userId
) {

  if (
    !ctx ||
    !ctx.chat ||
    !userId
  ) {
    return "other";
  }

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (
      member.status === "creator"
    ) {
      return "owner";
    }

    if (
      member.status === "administrator"
    ) {
      return "admin";
    }

    if (
      member.status === "member" ||
      member.status === "restricted"
    ) {
      return "member";
    }

    return "other";

  } catch (error) {

    console.log(
      "GET MEMBER ROLE ERROR:",
      error.message
    );

    return "other";
  }
}


// =====================================
// بررسی مالک
// =====================================

async function isOwner(ctx) {

  if (
    !ctx ||
    !ctx.from ||
    !ctx.chat
  ) {
    return false;
  }

  const role =
    await getMemberRole(
      ctx,
      ctx.from.id
    );

  return role === "owner";
}


// =====================================
// بررسی مالک یا مدیر
// =====================================

async function isAdmin(ctx) {

  if (
    !ctx ||
    !ctx.from ||
    !ctx.chat
  ) {
    return false;
  }

  const role =
    await getMemberRole(
      ctx,
      ctx.from.id
    );

  return (
    role === "owner" ||
    role === "admin"
  );
}


// =====================================
// بررسی دسترسی ربات
// برای بن و سکوت
// =====================================

async function checkBotPermissions(ctx) {

  try {

    if (
      !ctx ||
      !ctx.chat
    ) {
      return false;
    }

    if (
      !ctx.botInfo ||
      !ctx.botInfo.id
    ) {

      await replyToTarget(
        ctx,
        "『𓆩 ★ اطلاعات ربات پیدا نشد ★ 𓆪』"
      );

      return false;
    }

    const botMember =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.botInfo.id
      );

    if (
      botMember.status !== "administrator"
    ) {

      await replyToTarget(
        ctx,
        "『𓆩 ★ ربات باید مدیر گروه باشد ★ 𓆪』"
      );

      return false;
    }

    if (
      !botMember.can_restrict_members
    ) {

      await replyToTarget(
        ctx,
        "『𓆩 ★ ربات دسترسی بن و سکوت اعضا را ندارد ★ 𓆪』"
      );

      return false;
    }

    return true;

  } catch (error) {

    console.log(
      "BOT PERMISSION ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "『𓆩 ★ دسترسی مدیریت ربات بررسی نشد ★ 𓆪』"
    );

    return false;
  }
}


// =====================================
// پیدا کردن کاربر با یوزرنیم
// =====================================

function findKnownUserByUsername(
  username
) {

  const wanted =
    String(username)
      .replace(/^@/, "")
      .toLowerCase();

  for (
    const id in knownUsers
  ) {

    const user =
      knownUsers[id];

    if (
      user &&
      user.username &&
      user.username.toLowerCase() === wanted
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن کاربر با اسم
// =====================================

function findKnownUserByName(
  name
) {

  const wanted =
    String(name)
      .trim()
      .toLowerCase();

  for (
    const id in knownUsers
  ) {

    const user =
      knownUsers[id];

    if (!user) {
      continue;
    }

    const first =
      String(
        user.first_name || ""
      )
        .trim()
        .toLowerCase();

    const last =
      String(
        user.last_name || ""
      )
        .trim()
        .toLowerCase();

    const full =
      `${first} ${last}`
        .trim();

    if (
      first === wanted ||
      full === wanted
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن هدف دستور
//
// اولویت:
// 1. Reply
// 2. آیدی
// 3. یوزرنیم
// 4. اسم
// =====================================

async function resolveTarget(
  ctx,
  args = []
) {

  // -----------------------------------
  // اگر Reply شده باشد
  // همان کاربر هدف است
  // -----------------------------------

  const replyTarget =
    getReplyTarget(ctx);

  if (replyTarget) {

    rememberUser(
      replyTarget
    );

    return replyTarget;
  }


  // -----------------------------------
  // اگر هدف مشخص نشده
  // -----------------------------------

  if (
    !args ||
    args.length === 0
  ) {
    return null;
  }


  const input =
    args
      .join(" ")
      .trim();

  if (!input) {
    return null;
  }


  // -----------------------------------
  // آیدی
  // -----------------------------------

  if (
    /^\d+$/.test(input)
  ) {

    try {

      const member =
        await ctx.telegram.getChatMember(
          ctx.chat.id,
          Number(input)
        );

      if (
        member &&
        member.user
      ) {

        rememberUser(
          member.user
        );

        return member.user;
      }

      return null;

    } catch (error) {

      console.log(
        "RESOLVE ID ERROR:",
        error.message
      );

      return null;
    }
  }


  // -----------------------------------
  // یوزرنیم
  // -----------------------------------

  if (
    input.startsWith("@")
  ) {

    return findKnownUserByUsername(
      input
    );
  }


  // -----------------------------------
  // اسم
  // -----------------------------------

  return findKnownUserByName(
    input
  );
}


// =====================================
// بررسی هدف
// مالک و مدیر قابل مدیریت نیستند
// =====================================

async function checkTarget(
  ctx,
  target
) {

  if (!target) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ باید روی پیام کاربر Reply کنی یا هدف را مشخص کنی ★ 𓆪』"
    );

    return false;
  }


  const role =
    await getMemberRole(
      ctx,
      target.id
    );


  // -----------------------------------
  // مالک
  // -----------------------------------

  if (
    role === "owner"
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ مالک گروه قابل بن، سکوت یا اخراج شدن نیست ★ 𓆪』"
    );

    return false;
  }


  // -----------------------------------
  // مدیر
  // -----------------------------------

  if (
    role === "admin"
  ) {

    await replyToTarget(
      ctx,
      `『𓆩 ★ ${mentionUser(target)} مدیر گروه هست ★ 𓆪』`,
      {
        parse_mode: "HTML"
      }
    );

    return false;
  }


  return true;
}


// =====================================
// دریافت مدت
// عدد ساده = ساعت
// =====================================

function getDuration(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number =
    parseInt(value);

  if (
    isNaN(number) ||
    number <= 0
  ) {
    return null;
  }

  return number * 60;
}


// =====================================
// متن زمان
// =====================================

function durationText(minutes) {

  if (
    minutes === null ||
    minutes === undefined
  ) {
    return "دائمی";
  }

  if (
    minutes < 60
  ) {
    return `${minutes} دقیقه`;
  }

  if (
    minutes % 60 === 0
  ) {
    return `${minutes / 60} ساعت`;
  }

  return `${minutes} دقیقه`;
}// =====================================
// PulseGroupManager
// MODERATION ACTIONS
// بن | سیک | اخراج | سکوت | خفه
// =====================================


// =====================================
// اجرای بن
// =====================================

async function banUser(
  ctx,
  target
) {

  if (
    !target ||
    !target.id
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی هدف
  // -----------------------------------

  if (
    !(await checkTarget(
      ctx,
      target
    ))
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی دسترسی ربات
  // -----------------------------------

  if (
    !(await checkBotPermissions(ctx))
  ) {
    return false;
  }


  try {

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );


    await replyToTarget(
      ctx,
      `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
      {
        parse_mode: "HTML"
      }
    );


    return true;

  } catch (error) {

    console.log(
      "BAN ERROR:",
      error.message
    );


    await replyToTarget(
      ctx,
      "『𓆩 ★ انجام بن امکان‌پذیر نیست ★ 𓆪』"
    );


    return false;
  }
}


// =====================================
// اجرای سیک
// سیک = بن کاربر
// =====================================

async function sikUser(
  ctx,
  target
) {

  if (
    !target ||
    !target.id
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی هدف
  // -----------------------------------

  if (
    !(await checkTarget(
      ctx,
      target
    ))
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی دسترسی ربات
  // -----------------------------------

  if (
    !(await checkBotPermissions(ctx))
  ) {
    return false;
  }


  try {

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );


    await replyToTarget(
      ctx,
      `『𓆩 ★ ${mentionUser(target)} سیک شد ★ 𓆪』`,
      {
        parse_mode: "HTML"
      }
    );


    return true;

  } catch (error) {

    console.log(
      "SIK ERROR:",
      error.message
    );


    await replyToTarget(
      ctx,
      "『𓆩 ★ انجام سیک امکان‌پذیر نیست ★ 𓆪』"
    );


    return false;
  }
}


// =====================================
// اجرای اخراج
// اخراج = حذف کاربر بدون بن دائمی
// =====================================

async function kickUser(
  ctx,
  target
) {

  if (
    !target ||
    !target.id
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی هدف
  // -----------------------------------

  if (
    !(await checkTarget(
      ctx,
      target
    ))
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی دسترسی ربات
  // -----------------------------------

  if (
    !(await checkBotPermissions(ctx))
  ) {
    return false;
  }


  try {

    // ابتدا کاربر بن می‌شود
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );


    // سپس بلافاصله از بن خارج می‌شود
    // بنابراین کاربر اخراج شده ولی
    // امکان ورود مجدد دارد.

    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.id,
      {
        only_if_banned: true
      }
    );


    await replyToTarget(
      ctx,
      `『𓆩 ★ ${mentionUser(target)} از گروه اخراج شد ★ 𓆪』`,
      {
        parse_mode: "HTML"
      }
    );


    return true;

  } catch (error) {

    console.log(
      "KICK ERROR:",
      error.message
    );


    await replyToTarget(
      ctx,
      "『𓆩 ★ انجام اخراج امکان‌پذیر نیست ★ 𓆪』"
    );


    return false;
  }
}


// =====================================
// اجرای سکوت
// عدد = ساعت
// مثال:
// سکوت 1
// سکوت 2
// سکوت 3
// سکوت 4
// =====================================

async function muteUser(
  ctx,
  target,
  hours = 1
) {

  if (
    !target ||
    !target.id
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی هدف
  // -----------------------------------

  if (
    !(await checkTarget(
      ctx,
      target
    ))
  ) {
    return false;
  }


  // -----------------------------------
  // بررسی دسترسی ربات
  // -----------------------------------

  if (
    !(await checkBotPermissions(ctx))
  ) {
    return false;
  }


  const value =
    parseInt(hours);


  if (
    isNaN(value) ||
    value <= 0
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ مدت سکوت باید بیشتر از صفر باشد ★ 𓆪』"
    );

    return false;
  }


  const minutes =
    value * 60;


  const untilDate =
    Math.floor(
      Date.now() / 1000
    ) + (minutes * 60);


  try {

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        permissions: {
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false
        },

        until_date: untilDate
      }
    );


    await replyToTarget(
      ctx,
      `『𓆩 ★ ${mentionUser(target)} ${value} ساعته سکوت شد ★ 𓆪』`,
      {
        parse_mode: "HTML"
      }
    );


    return true;

  } catch (error) {

    console.log(
      "MUTE ERROR:",
      error.message
    );


    await replyToTarget(
      ctx,
      "『𓆩 ★ انجام سکوت امکان‌پذیر نیست ★ 𓆪'"
    );


    return false;
  }
}


// =====================================
// خفه
// خفه دقیقاً همان عملکرد سکوت است
// =====================================

async function khafeUser(
  ctx,
  target,
  hours = 1
) {

  return await muteUser(
    ctx,
    target,
    hours
  );
}


// =====================================
// دستور بن
// فقط Reply
// =====================================

function registerBanCommands(bot) {

  // -----------------------------------
  // بن
  // -----------------------------------

  bot.hears(
    /^\s*بن\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }


      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const target =
        await resolveTarget(ctx);


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ روی پیام کاربر Reply کن و بن را بفرست ★ 𓆪』"
        );

        return;
      }


      await banUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // بن با آیدی / یوزرنیم / اسم
  // -----------------------------------

  bot.hears(
    /^\s*بن\s+(.+?)\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }


      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const args =
        ctx.match[1]
          .trim()
          .split(/\s+/);


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ کاربر موردنظر پیدا نشد ★ 𓆪』"
        );

        return;
      }


      await banUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// دستور سیک
// =====================================

function registerSikCommands(bot) {

  bot.hears(
    /^\s*سیک\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }


      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const target =
        await resolveTarget(ctx);


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ روی پیام کاربر Reply کن و سیک را بفرست ★ 𓆪』"
        );

        return;
      }


      await sikUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// دستور اخراج
// =====================================

function registerKickCommands(bot) {

  bot.hears(
    /^\s*اخراج\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }


      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const target =
        await resolveTarget(ctx);


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ روی پیام کاربر Reply کن و اخراج را بفرست ★ 𓆩』"
        );

        return;
      }


      await kickUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// دستور سکوت
//
// سکوت
// = یک ساعت
//
// سکوت 1
// = یک ساعت
//
// سکوت 2
// = دو ساعت
//
// سکوت 3
// = سه ساعت
//
// سکوت 4
// = چهار ساعت
// =====================================

function registerMuteCommands(bot) {

  bot.hears(
    /^\s*سکوت(?:\s+(\d+))?\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }


      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const target =
        await resolveTarget(ctx);


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ روی پیام کاربر Reply کن و سکوت را بفرست ★ 𓆪』"
        );

        return;
      }


      const hours =
        parseInt(
          ctx.match[1] || "1"
        );


      await muteUser(
        ctx,
        target,
        hours
      );
    }
  );
}


// =====================================
// دستور خفه
// خفه = سکوت
// =====================================

function registerKhafeCommands(bot) {

  bot.hears(
    /^\s*خفه(?:\s+(\d+))?\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }


      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const target =
        await resolveTarget(ctx);


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ روی پیام کاربر Reply کن و خفه را بفرست ★ 𓆪』"
        );

        return;
      }


      const hours =
        parseInt(
          ctx.match[1] || "1"
        );


      await khafeUser(
        ctx,
        target,
        hours
      );
    }
  );
}


// =====================================
// ثبت تمام دستورات این قسمت
// =====================================

function registerModerationActions(bot) {

  registerBanCommands(bot);

  registerSikCommands(bot);

  registerKickCommands(bot);

  registerMuteCommands(bot);

  registerKhafeCommands(bot);
  }// =====================================
// تنظیمات اخطار
// =====================================

function getWarningSettings(chatId) {

  const group =
    getGroup(chatId);

  if (!group.warningSettings) {

    group.warningSettings = {
      maxWarnings: 3,
      punishment: "mute",
      duration: 60
    };

    saveDB();
  }

  if (
    !group.warningSettings.maxWarnings ||
    group.warningSettings.maxWarnings < 1
  ) {
    group.warningSettings.maxWarnings = 3;
  }

  if (
    !group.warningSettings.punishment
  ) {
    group.warningSettings.punishment = "mute";
  }

  if (
    !group.warningSettings.duration ||
    group.warningSettings.duration < 1
  ) {
    group.warningSettings.duration = 60;
  }

  return group.warningSettings;
}


// =====================================
// اضافه کردن اخطار
// =====================================

function addWarning(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  if (!group.warns) {
    group.warns = {};
  }

  const id =
    String(userId);

  if (!group.warns[id]) {
    group.warns[id] = 0;
  }

  group.warns[id]++;

  saveDB();

  return group.warns[id];
}


// =====================================
// کم کردن اخطار
// =====================================

function removeWarning(
  chatId,
  userId,
  amount = 1
) {

  const group =
    getGroup(chatId);

  if (!group.warns) {
    return 0;
  }

  const id =
    String(userId);

  if (!group.warns[id]) {
    return 0;
  }

  group.warns[id] -=
    Math.max(
      1,
      parseInt(amount) || 1
    );

  if (
    group.warns[id] < 0
  ) {
    group.warns[id] = 0;
  }

  saveDB();

  return group.warns[id];
}


// =====================================
// پاک کردن تمام اخطارها
// =====================================

function clearWarnings(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  if (!group.warns) {
    return 0;
  }

  const id =
    String(userId);

  delete group.warns[id];

  saveDB();

  return 0;
}


// =====================================
// دریافت تعداد اخطار
// =====================================

function getWarnings(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  if (!group.warns) {
    return 0;
  }

  return (
    group.warns[String(userId)] ||
    0
  );
}


// =====================================
// تنظیم تعداد اخطار
// دستور:
// تعداد اخطار 3
// =====================================

function setMaxWarnings(
  chatId,
  number
) {

  const settings =
    getWarningSettings(chatId);

  const value =
    parseInt(number);

  if (
    isNaN(value) ||
    value <= 0
  ) {
    return settings.maxWarnings;
  }

  settings.maxWarnings =
    value;

  saveDB();

  return value;
}


// =====================================
// تنظیم مجازات اخطار
// =====================================

function setWarningPunishment(
  chatId,
  punishment
) {

  const settings =
    getWarningSettings(chatId);

  if (
    punishment !== "ban" &&
    punishment !== "mute"
  ) {
    return settings.punishment;
  }

  settings.punishment =
    punishment;

  saveDB();

  return punishment;
}


// =====================================
// تنظیم مدت مجازات اخطار
// عدد = دقیقه
// =====================================

function setWarningDuration(
  chatId,
  duration
) {

  const settings =
    getWarningSettings(chatId);

  const value =
    parseInt(duration);

  if (
    isNaN(value) ||
    value <= 0
  ) {
    return settings.duration;
  }

  settings.duration =
    value;

  saveDB();

  return value;
}


// =====================================
// اجرای مجازات خودکار اخطار
// =====================================

async function executeWarningPunishment(
  ctx,
  target
) {

  if (
    !target ||
    !target.id
  ) {
    return false;
  }

  const settings =
    getWarningSettings(
      ctx.chat.id
    );

  const count =
    getWarnings(
      ctx.chat.id,
      target.id
    );

  if (
    count < settings.maxWarnings
  ) {
    return false;
  }

  if (
    !(await checkTarget(
      ctx,
      target
    ))
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    return false;
  }


  // ===================================
  // مجازات بن
  // ===================================

  if (
    settings.punishment === "ban"
  ) {

    try {

      await ctx.telegram.banChatMember(
        ctx.chat.id,
        target.id
      );

      await replyToTarget(
        ctx,
        `『𓆩 ★ ${mentionUser(target)} به دلیل رسیدن به ${settings.maxWarnings} اخطار بن شد ★ 𓆪』`,
        {
          parse_mode: "HTML"
        }
      );

      return true;

    } catch (error) {

      console.log(
        "WARNING BAN ERROR:",
        error.message
      );

      await replyToTarget(
        ctx,
        "『𓆩 ★ انجام بن خودکار امکان‌پذیر نیست ★ 𓆪』"
      );

      return false;
    }
  }


  // ===================================
  // مجازات سکوت
  // ===================================

  if (
    settings.punishment === "mute"
  ) {

    try {

      const duration =
        settings.duration || 60;

      const until =
        Math.floor(
          Date.now() / 1000
        ) + (
          duration * 60
        );

      await ctx.telegram.restrictChatMember(
        ctx.chat.id,
        target.id,
        {
          permissions: {
            can_send_messages: false,
            can_send_audios: false,
            can_send_documents: false,
            can_send_photos: false,
            can_send_videos: false,
            can_send_video_notes: false,
            can_send_voice_notes: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
          },

          until_date: until
        }
      );

      await replyToTarget(
        ctx,
        `『𓆩 ★ ${mentionUser(target)} به دلیل رسیدن به ${settings.maxWarnings} اخطار، ${durationText(duration)} سکوت شد ★ 𓆪』`,
        {
          parse_mode: "HTML"
        }
      );

      return true;

    } catch (error) {

      console.log(
        "WARNING MUTE ERROR:",
        error.message
      );

      await replyToTarget(
        ctx,
        "『𓆩 ★ انجام سکوت خودکار امکان‌پذیر نیست ★ 𓆪"
      );

      return false;
    }
  }

  return false;
}


// =====================================
// ثبت دستورات اخطار
// =====================================

function registerWarningCommands(bot) {


  // ===================================
  // اخطار
  //
  // اخطار
  // اخطار 2
  // اخطار 3
  // ===================================

  bot.hears(
    /^\s*اخطار(?:\s+(\d+))?\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const amount =
        parseInt(
          ctx.match[1] || "1"
        );

      if (
        isNaN(amount) ||
        amount <= 0
      ) {
        return;
      }

      const target =
        await resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      let count = 0;

      for (
        let i = 0;
        i < amount;
        i++
      ) {

        count =
          addWarning(
            ctx.chat.id,
            target.id
          );
      }

      const settings =
        getWarningSettings(
          ctx.chat.id
        );

      await replyToTarget(
        ctx,
        `『𓆩 ★ ${mentionUser(target)} ${amount} اخطار گرفت ★ 𓆪』

تعداد اخطار: ${count}
حداکثر اخطار: ${settings.maxWarnings}`,
        {
          parse_mode: "HTML"
        }
      );

      await executeWarningPunishment(
        ctx,
        target
      );
    }
  );


  // ===================================
  // حذف یک اخطار
  // ===================================

  bot.hears(
    /^\s*(حذف اخطار|کم کردن اخطار)\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const target =
        await resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      const count =
        removeWarning(
          ctx.chat.id,
          target.id
        );

      await replyToTarget(
        ctx,
        `『𓆩 ★ یک اخطار ${mentionUser(target)} حذف شد ★ 𓆪』

تعداد اخطار فعلی: ${count}`,
        {
          parse_mode: "HTML"
        }
      );
    }
  );


  // ===================================
  // حذف تمام اخطارها
  // ===================================

  bot.hears(
    /^\s*(حذف همه اخطار|پاک کردن اخطارها|پاک کردن همه اخطار)\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const target =
        await resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      clearWarnings(
        ctx.chat.id,
        target.id
      );

      await replyToTarget(
        ctx,
        `『𓆩 ★ تمام اخطارهای ${mentionUser(target)} پاک شد ★ 𓆪』`,
        {
          parse_mode: "HTML"
        }
      );
    }
  );


  // ===================================
  // تعداد اخطار
  // ===================================

  bot.hears(
    /^\s*تعداد\s+اخطار\s+(\d+)\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const number =
        parseInt(
          ctx.match[1]
        );

      if (
        isNaN(number) ||
        number <= 0
      ) {
        return;
      }

      setMaxWarnings(
        ctx.chat.id,
        number
      );

      await replyToTarget(
        ctx,
        `『𓆩 ★ تعداد اخطار روی ${number} تنظیم شد ★ 𓆪』`
      );
    }
  );


  // ===================================
  // تنظیم اخطار بن
  // ===================================

  bot.hears(
    /^\s*تنظیم\s+اخطار\s+بن\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      setWarningPunishment(
        ctx.chat.id,
        "ban"
      );

      await replyToTarget(
        ctx,
        "『𓆩 ★ مجازات اخطار روی بن تنظیم شد ★ 𓆪』"
      );
    }
  );


  // ===================================
  // تنظیم اخطار سکوت
  // ===================================

  bot.hears(
    /^\s*تنظیم\s+اخطار\s+سکوت\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      setWarningPunishment(
        ctx.chat.id,
        "mute"
      );

      await replyToTarget(
        ctx,
        "『𓆩 ★ مجازات اخطار روی سکوت تنظیم شد ★ 𓆪』"
      );
    }
  );


  // ===================================
  // تنظیم مدت اخطار
  // عدد = دقیقه
  // ===================================

  bot.hears(
    /^\s*تنظیم\s+مدت\s+اخطار\s+(\d+)\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const duration =
        parseInt(
          ctx.match[1]
        );

      if (
        isNaN(duration) ||
        duration <= 0
      ) {
        return;
      }

      setWarningDuration(
        ctx.chat.id,
        duration
      );

      await replyToTarget(
        ctx,
        `『𓆩 ★ مدت مجازات اخطار روی ${duration} دقیقه تنظیم شد ★ 𓆪』`
      );
    }
  );


  // ===================================
  // نمایش اخطارهای کاربر
  // ===================================

  bot.hears(
    /^\s*اخطارها\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const target =
        await resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      const count =
        getWarnings(
          ctx.chat.id,
          target.id
        );

      const settings =
        getWarningSettings(
          ctx.chat.id
        );

      await replyToTarget(
        ctx,
        `『𓆩 ★ وضعیت اخطار ${mentionUser(target)} ★ 𓆪』

تعداد اخطار: ${count}
حداکثر اخطار: ${settings.maxWarnings}
مجازات: ${
          settings.punishment === "ban"
            ? "بن"
            : "سکوت"
        }
مدت مجازات: ${durationText(settings.duration)}`,
        {
          parse_mode: "HTML"
        }
      );
    }
  );


  // ===================================
  // اخطار وضعیت
  // ===================================

  bot.hears(
    /^\s*اخطار\s+وضعیت\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const target =
        await resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      const count =
        getWarnings(
          ctx.chat.id,
          target.id
        );

      const settings =
        getWarningSettings(
          ctx.chat.id
        );

      await replyToTarget(
        ctx,
        `『𓆩 ★ وضعیت ${mentionUser(target)} ★ 𓆪』

اخطار فعلی: ${count}
حد اخطار: ${settings.maxWarnings}
مجازات خودکار: ${
          settings.punishment === "ban"
            ? "بن"
            : "سکوت"
        }`,
        {
          parse_mode: "HTML"
        }
      );
    }
  );


  // ===================================
  // شناسنامه
  // ===================================

  bot.hears(
    /^\s*شناسه\s*$/i,
    async ctx => {

      if (
        !isGroupChat(ctx)
      ) {
        return;
      }

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }

      const target =
        await resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      await replyToTarget(
        ctx,
        `『𓆩 ★ شناسنامه کاربر ★ 𓆪』

نام: ${escapeHtml(
          getUserName(target)
        )}

آیدی: <code>${target.id}</code>

یوزرنیم: ${
          target.username
            ? "@" + escapeHtml(target.username)
            : "ندارد"
        }`,
        {
          parse_mode: "HTML"
        }
      );
    }
  );
}


// =====================================
// ثبت نهایی تمام دستورات Moderation
// =====================================

function registerModeration(bot) {

  // -----------------------------------
  // ذخیره کاربران دیده‌شده
  // -----------------------------------

  bot.use(
    async (ctx, next) => {

      try {

        if (
          ctx.message &&
          ctx.message.from
        ) {

          rememberUser(
            ctx.message.from
          );
        }

        if (
          ctx.message &&
          ctx.message.reply_to_message &&
          ctx.message.reply_to_message.from
        ) {

          rememberUser(
            ctx.message.reply_to_message.from
          );
        }

      } catch (error) {

        console.log(
          "REMEMBER USER ERROR:",
          error.message
        );
      }

      return next();
    }
  );


  // -----------------------------------
  // دستورات مدیریت
  // -----------------------------------

  registerModerationActions(bot);


  // -----------------------------------
  // دستورات اخطار
  // -----------------------------------

  registerWarningCommands(bot);
}


// =====================================
// خروجی
// =====================================

module.exports = {

  registerModeration,

  getMemberRole,

  isOwner,

  isAdmin,

  resolveTarget,

  addWarning,

  removeWarning,

  clearWarnings,

  getWarnings,

  setMaxWarnings,

  setWarningPunishment,

  setWarningDuration,

  executeWarningPunishment,

  banUser,

  sikUser,

  kickUser,

  muteUser,

  khafeUser
};
