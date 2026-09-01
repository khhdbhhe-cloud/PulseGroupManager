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
// برای پیدا کردن @username و اسم
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
// ریپلای صحیح به پیام هدف
// =====================================

function getTargetReplyId(ctx) {

  if (
    ctx.message &&
    ctx.message.reply_to_message
  ) {

    return ctx.message
      .reply_to_message
      .message_id;
  }

  return ctx.message
    ? ctx.message.message_id
    : undefined;
}


// =====================================
// پاسخ روی پیام هدف
// =====================================

async function replyToTarget(
  ctx,
  text,
  options = {}
) {

  return ctx.reply(
    text,
    {
      ...options,

      reply_parameters: {
        message_id:
          getTargetReplyId(ctx)
      }
    }
  );
}


// =====================================
// تشخیص مقام
// =====================================

async function getMemberRole(
  ctx,
  userId
) {

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

    if (
      member.status === "restricted"
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

  if (
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
      String(user.first_name || "")
        .trim()
        .toLowerCase();

    const last =
      String(user.last_name || "")
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
// هدف دستور
// ریپلای | آیدی | یوزرنیم | اسم
// =====================================

async function resolveTarget(
  ctx,
  args = []
) {

  // -----------------------------------
  // ریپلای
  // -----------------------------------

  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {

    const user =
      ctx.message
        .reply_to_message
        .from;

    rememberUser(user);

    return user;
  }


  // -----------------------------------
  // بدون هدف
  // -----------------------------------

  if (
    !args ||
    args.length === 0
  ) {

    return null;
  }


  const input =
    args.join(" ").trim();


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

      if (member.user) {
        rememberUser(member.user);
      }

      return member.user;

    }

    catch (error) {

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

    const user =
      findKnownUserByUsername(input);

    if (user) {
      return user;
    }

    return null;
  }


  // -----------------------------------
  // اسم
  // -----------------------------------

  const user =
    findKnownUserByName(input);

  if (user) {
    return user;
  }


  return null;
}


// =====================================
// بررسی هدف
// =====================================

async function checkTarget(
  ctx,
  target
) {

  if (!target) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ کاربر موردنظر پیدا نشد ★ 𓆪』"
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

    if (
      await isOwner(ctx)
    ) {

      // مالک گروه را خود تلگرام
      // اجازه نمی‌دهد ربات بن کند.
      await replyToTarget(
        ctx,
        "『𓆩 ★ مالک گروه قابل بن شدن نیست ★ 𓆪』"
      );

    }
    else {

      await replyToTarget(
        ctx,
        `『𓆩 ★ ${mentionUser(target)} مالک گروه هست ★ 𓆪』`,
        {
          parse_mode: "HTML"
        }
      );
    }

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
// بررسی گروه
// =====================================

function isGroupChat(ctx) {

  return (
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );
}


// =====================================
// دریافت مدت
// عدد ساده = ساعت
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

  // عدد ساده یعنی ساعت
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
}


// =====================================
// گرفتن تنظیمات اخطار
// =====================================

function getWarningSettings(
  chatId
) {

  const group =
    getGroup(chatId);


  if (
    !group.warningSettings
  ) {

    group.warningSettings = {

      maxWarnings: 3,

      punishment: "mute",

      duration: 60

    };

    saveDB();
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
// تعداد اخطار
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

  const settings =
    getWarningSettings(chatId);


  settings.maxWarnings =
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

  const settings =
    getWarningSettings(chatId);


  settings.punishment =
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


  // -----------------------------------
  // بن
  // -----------------------------------

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
        `『𓆩 ★ ${mentionUser(target)} به دلیل رسیدن اخطارها به ${settings.maxWarnings} بن شد ★ 𓆪』`,
        {
          parse_mode: "HTML"
        }
      );

      return true;

    }

    catch (error) {

      console.log(
        "WARNING BAN ERROR:",
        error.message
      );

      return false;
    }
  }


  // -----------------------------------
  // سکوت
  // -----------------------------------

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

      await replyToTarget(
        ctx,
        `『𓆩 ★ ${mentionUser(target)} به دلیل رسیدن اخطارها به ${settings.maxWarnings} ساکت شد ★ 𓆪』`,
        {
          parse_mode: "HTML"
        }
      );

      return true;

    }

    catch (error) {

      console.log(
        "WARNING MUTE ERROR:",
        error.message
      );

      return false;
    }
  }


  return false;
}


// =====================================
// ثبت دستورات مدیریت
// =====================================

function registerModeration(bot) {


  // ===================================
  // ذخیره کاربران دیده‌شده
  // ===================================

  bot.on(
    "message",
    async ctx => {

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

      }

      catch (error) {

        console.log(
          "REMEMBER USER ERROR:",
          error.message
        );
      }

    }
  );


  // ===================================
  // بن
  // ===================================

  bot.hears(
    /^بن(?:\s+(.+))?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "BAN ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ انجام بن امکان‌پذیر نیست ★ 𓆪』"
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "SIK ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ انجام سیک امکان‌پذیر نیست ★ 𓆪』"
        );
      }

    }
  );


  // ===================================
  // دستور ویژه مالک
  // کس ننت
  // ===================================

  bot.hears(
    /^کس\s+ننت(?:\s+(.+))?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isOwner(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} بن شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "OWNER BAN ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ انجام عملیات امکان‌پذیر نیست ★ 𓆪』"
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} از گروه اخراج شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "KICK ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ اخراج کاربر انجام نشد ★ 𓆪』"
        );
      }

    }
  );


  // ===================================
  // سکوت
  // عدد ساده = ساعت
  // ===================================

  bot.hears(
    /^سکوت(?:\s+(\d+))?(?:\s+(.+))?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} سکوت ${durationText(duration)} شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "MUTE ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ سکوت کاربر انجام نشد ★ 𓆪』"
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} سکوت ${durationText(duration)} شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "MUTE ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ سکوت کاربر انجام نشد ★ 𓆪』"
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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


        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} خفه ${durationText(duration)} شد ★ 𓆪』`,
          {
            parse_mode: "HTML"
          }
        );

      }

      catch (error) {

        console.log(
          "KHAFE ERROR:",
          error.message
        );

        await replyToTarget(
          ctx,
          "『𓆩 ★ خفه کردن کاربر انجام نشد ★ 𓆪』"
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
        return;
      }


      const amount =
        parseInt(
          ctx.match[1] || "1"
        );


      if (
        amount <= 0
      ) {
        return;
      }


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


      await replyToTarget(
        ctx,
        `『𓆩 ★ ${mentionUser(target)} ${amount} اخطار گرفت ★ 𓆪』\n\nتعداد اخطار: ${count}`,
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
  // تعداد اخطار
  // مثال:
  // تعداد اخطار 3
  // ===================================

  bot.hears(
    /^تعداد\s+اخطار\s+(\d+)$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
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
          reply_parameters: {
            message_id:
              ctx.message.message_id
          }
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
        return;
      }


      setWarningPunishment(
        ctx.chat.id,
        "ban"
      );


      await ctx.reply(
        "『𓆩 ★ مجازات اخطار روی بن تنظیم شد ★ 𓆪』",
        {
          reply_parameters: {
            message_id:
              ctx.message.message_id
          }
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

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
        return;
      }


      setWarningPunishment(
        ctx.chat.id,
        "mute"
      );


      await ctx.reply(
        "『𓆩 ★ مجازات اخطار روی سکوت تنظیم شد ★ 𓆪』",
        {
          reply_parameters: {
            message_id:
              ctx.message.message_id
          }
        }
      );

    }
  );


  // ===================================
  // نمایش اخطارهای کاربر
  // روی پیام کاربر:
  // اخطارها
  // ===================================

  bot.hears(
    /^اخطارها$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!(await isAdmin(ctx))) {
        return;
      }


      const target =
        await resolveTarget(
          ctx
        );


      if (!target) {

        await replyToTarget(
          ctx,
          "『𓆩 ★ کاربر موردنظر پیدا نشد ★ 𓆪』"
        );

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
        `『𓆩 ★ وضعیت اخطار ${mentionUser(target)} ★ 𓆪』\n\nتعداد اخطار: ${count}\nحداکثر اخطار: ${settings.maxWarnings}`,
        {
          parse_mode: "HTML"
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
