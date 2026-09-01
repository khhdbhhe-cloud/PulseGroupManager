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
// ابزارها
// =====================================

function getUserName(user) {

  if (!user) return "کاربر";

  if (user.username) {
    return `@${user.username}`;
  }

  if (user.first_name) {
    return user.first_name;
  }

  return "کاربر";
}


// =====================================
// منشن کاربر
// =====================================

function mentionUser(user) {

  if (!user) {
    return "کاربر";
  }

  const name =
    user.first_name ||
    user.username ||
    "کاربر";

  return `<a href="tg://user?id=${user.id}">${name}</a>`;
}


// =====================================
// تشخیص مقام
// =====================================

async function getMemberRole(ctx, userId) {

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
      member.status === "member"
    ) {
      return "member";
    }

    return "other";

  }

  catch (error) {

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
// هدف دستور
// ریپلای | آیدی | یوزرنیم
// =====================================

async function resolveTarget(ctx, args = []) {

  // -------------------------------
  // ریپلای
  // -------------------------------

  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {

    return ctx.message.reply_to_message.from;
  }


  // -------------------------------
  // آیدی
  // -------------------------------

  if (args.length > 0) {

    const first =
      String(args[0]).trim();

    if (/^\d+$/.test(first)) {

      try {

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            Number(first)
          );

        return member.user;

      }

      catch {}

    }


    // -----------------------------
    // یوزرنیم
    // -----------------------------

    if (
      first.startsWith("@")
    ) {

      try {

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            first
          );

        return member.user;

      }

      catch {}

    }

  }


  return null;
}


// =====================================
// بررسی هدف
// =====================================

async function checkTarget(ctx, target) {

  if (!target) {

    await ctx.reply(
      "『𓆩 ★ کاربر موردنظر پیدا نشد ★ 𓆪』"
    );

    return false;
  }


  const role =
    await getMemberRole(
      ctx,
      target.id
    );


  // عضو عادی
  if (role === "member") {
    return true;
  }


  // مدیر
  if (role === "admin") {

    if (
      await isOwner(ctx)
    ) {

      return true;
    }


    await ctx.reply(
      `『𓆩 ★ ${mentionUser(target)} مدیر گروه هست ★ 𓆪』`,
      {
        parse_mode: "HTML"
      }
    );

    return false;
  }


  // مالک
  if (role === "owner") {

    if (
      await isOwner(ctx)
    ) {

      return true;
    }


    await ctx.reply(
      `『𓆩 ★ ${mentionUser(target)} مالک گروه هست ★ 𓆪』`,
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
// =====================================

function getDuration(value) {

  if (!value) {
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
// ساخت متن زمان
// =====================================

function durationText(minutes) {

  if (
    minutes === null ||
    minutes === undefined
  ) {

    return "دائمی";
  }

  if (minutes < 60) {

    return `${minutes} دقیقه`;
  }

  if (
    minutes % 60 === 0
  ) {

    return `${minutes / 60} ساعت`;
  }

  return `${minutes} دقیقه`;
}


// =====================================
// ذخیره اخطار
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
// تعداد اخطار کاربر
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
// =====================================

function setMaxWarnings(
  chatId,
  number
) {

  const group =
    getGroup(chatId);


  if (!group.warningSettings) {

    group.warningSettings = {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    };

  }


  group.warningSettings.maxWarnings =
    number;


  saveDB();


  return number;
}


// =====================================
// تنظیم مجازات اخطار
// =====================================

function setWarningPunishment(
  chatId,
  punishment
) {

  const group =
    getGroup(chatId);


  if (!group.warningSettings) {

    group.warningSettings = {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    };

  }


  group.warningSettings.punishment =
    punishment;


  saveDB();


  return punishment;
}


// =====================================
// اجرای مجازات اخطار
// =====================================

async function executeWarningPunishment(
  ctx,
  target
) {

  const group =
    getGroup(ctx.chat.id);


  const settings =
    group.warningSettings || {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    };


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


  // -------------------------------
  // بن
  // -------------------------------

  if (
    settings.punishment === "ban"
  ) {

    try {

      await ctx.telegram.banChatMember(
        ctx.chat.id,
        target.id
      );

    }
    catch (error) {

      console.log(
        "WARNING BAN ERROR:",
        error.message
      );

    }

    return true;
  }


  // -------------------------------
  // سکوت
  // -------------------------------

  if (
    settings.punishment === "mute"
  ) {

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
          }
        }
      );

    }
    catch (error) {

      console.log(
        "WARNING MUTE ERROR:",
        error.message
      );

    }

    return true;
  }


  return false;
}


// =====================================
// دستورهای مدیریت
// =====================================

function registerModeration(bot) {


  // ===================================
  // بن
  // ===================================

  bot.hears(
    /^بن(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const args =
        ctx.match[1]
          ? ctx.match[1].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }


      try {

        await ctx.telegram.banChatMember(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
          `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
          {
            parse_mode: "HTML",
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

      catch (error) {

        await ctx.reply(
          "『𓆩 ★ انجام بن امکان‌پذیر نیست ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

    }
  );


  // ===================================
  // سیک
  // ===================================

  bot.hears(
    /^سیک(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const args =
        ctx.match[1]
          ? ctx.match[1].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }


      try {

        await ctx.telegram.banChatMember(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
          `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
          {
            parse_mode: "HTML",
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

      catch {

        await ctx.reply(
          "『𓆩 ★ انجام سیک امکان‌پذیر نیست ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

    }
  );


  // ===================================
  // دستور ویژه مالک
  // ===================================

  bot.hears(
    /^کس\s+ننت(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isOwner(ctx))
      ) {
        return;
      }


      const args =
        ctx.match[1]
          ? ctx.match[1].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (!target) {

        await ctx.reply(
          "『𓆩 ★ کاربر موردنظر پیدا نشد ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

        return;
      }


      try {

        await ctx.telegram.banChatMember(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
          `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
          {
            parse_mode: "HTML",
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

      catch {

        await ctx.reply(
          "『𓆩 ★ انجام عملیات امکان‌پذیر نیست ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

    }
  );


  // ===================================
  // اخراج
  // ===================================

  bot.hears(
    /^اخراج(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const args =
        ctx.match[1]
          ? ctx.match[1].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }


      try {

        await ctx.telegram.banChatMember(
          ctx.chat.id,
          target.id
        );


        await ctx.telegram.unbanChatMember(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
          `『𓆩 ★ ${mentionUser(target)} از گروه اخراج شد ★ 𓆪』`,
          {
            parse_mode: "HTML",
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

      catch {

        await ctx.reply(
          "『𓆩 ★ اخراج کاربر انجام نشد ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

    }
  );


  // ===================================
  // سکوت
  // ===================================

  bot.hears(
    /^سکوت(?:\s+(\d+))?(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const duration =
        getDuration(
          ctx.match[1]
        );


      const args =
        ctx.match[2]
          ? ctx.match[2].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }


      try {

        const until =
          duration
            ? Math.floor(Date.now() / 1000) + duration
            : undefined;


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
            ...(until
              ? {
                  until_date: until
                }
              : {})
          }
        );


        await ctx.reply(
          `『𓆩 ★ ${mentionUser(target)} سکوت ${durationText(duration)} شد ★ 𓆪』`,
          {
            parse_mode: "HTML",
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

      catch {

        await ctx.reply(
          "『𓆩 ★ سکوت کاربر انجام نشد ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

    }
  );


  // ===================================
  // خفه
  // ===================================

  bot.hears(
    /^خفه(?:\s+(\d+))?(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const duration =
        getDuration(
          ctx.match[1]
        );


      const args =
        ctx.match[2]
          ? ctx.match[2].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }


      try {

        const until =
          duration
            ? Math.floor(Date.now() / 1000) + duration
            : undefined;


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
            ...(until
              ? {
                  until_date: until
                }
              : {})
          }
        );


        await ctx.reply(
          `『𓆩 ★ ${mentionUser(target)} خفه ${durationText(duration)} شد ★ 𓆪』`,
          {
            parse_mode: "HTML",
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

      catch {

        await ctx.reply(
          "『𓆩 ★ خفه کردن کاربر انجام نشد ★ 𓆪』",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      }

    }
  );


  // ===================================
  // اخطار
  // ===================================

  bot.hears(
    /^اخطار(?:\s+(\d+))?(?:\s+(.+))?$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const amount =
        parseInt(
          ctx.match[1] || "1"
        );


      const args =
        ctx.match[2]
          ? ctx.match[2].split(/\s+/)
          : [];


      const target =
        await resolveTarget(
          ctx,
          args
        );


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


      await ctx.reply(
        `『𓆩 ★ ${mentionUser(target)} یک اخطار گرفت ★ 𓆪』

تعداد اخطار: ${count}`,
        {
          parse_mode: "HTML",
          reply_to_message_id:
            ctx.message.message_id
        }
      );


      await executeWarningPunishment(
        ctx,
        target
      );

    }
  );


  // ===================================
  // تعداد اخطار
  // ===================================

  bot.hears(
    /^تعداد\s+اخطار\s+(\d+)$/i,
    async ctx => {

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
        number <= 0
      ) {

        return;
      }


      setMaxWarnings(
        ctx.chat.id,
        number
      );


      await ctx.reply(
        `『𓆩 ★ تعداد اخطار روی ${number} تنظیم شد ★ 𓆪』`,
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );

    }
  );


  // ===================================
  // تنظیم اخطار بن
  // ===================================

  bot.hears(
    /^تنظیم\s+اخطار\s+بن$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      setWarningPunishment(
        ctx.chat.id,
        "ban"
      );


      await ctx.reply(
        "『𓆩 ★ مجازات اخطار روی بن تنظیم شد ★ 𓆪』",
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );

    }
  );


  // ===================================
  // تنظیم اخطار سکوت
  // ===================================

  bot.hears(
    /^تنظیم\s+اخطار\s+سکوت$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      setWarningPunishment(
        ctx.chat.id,
        "mute"
      );


      await ctx.reply(
        "『𓆩 ★ مجازات اخطار روی سکوت تنظیم شد ★ 𓆪』",
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );

    }
  );


  // ===================================
  // نمایش اخطار کاربر
  // ===================================

  bot.hears(
    /^اخطارها$/i,
    async ctx => {

      if (
        !(await isAdmin(ctx))
      ) {
        return;
      }


      const target =
        await resolveTarget(
          ctx
        );


      if (!target) {

        return;
      }

      const count =
        getWarnings(
          ctx.chat.id,
          target.id
        );


      const group =
        getGroup(
          ctx.chat.id
        );


      const max =
        group.warningSettings &&
        group.warningSettings.maxWarnings
          ? group.warningSettings.maxWarnings
          : 3;


      await ctx.reply(
        `『𓆩 ★ وضعیت اخطار ${mentionUser(target)} ★ 𓆪』

تعداد اخطار: ${count}
حداکثر اخطار: ${max}`,
        {
          parse_mode: "HTML",
          reply_to_message_id:
            ctx.message.message_id
        }
      );

    }
  );

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

  getWarnings,

  setMaxWarnings,

  setWarningPunishment,

  executeWarningPunishment

};
