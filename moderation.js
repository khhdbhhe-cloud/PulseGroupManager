// =====================================
// PulseGroupManager
// MODERATION
// بن | حذف بن
// سیک | حذف سیک
// اخراج
// سکوت | حذف سکوت
// خفه | حذف خفه
// اخطار | حذف اخطار
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

  knownUsers[String(user.id)] = {
    id: user.id,
    username: user.username || null,
    first_name: user.first_name || "",
    last_name: user.last_name || ""
  };
}


// =====================================
// نام کاربر
// =====================================

function getUserName(user) {

  if (!user) {
    return "کاربر";
  }

  const first =
    user.first_name || "";

  const last =
    user.last_name || "";

  const full =
    `${first} ${last}`.trim();

  return (
    full ||
    (user.username
      ? `@${user.username}`
      : "کاربر")
  );
}


// =====================================
// تبدیل متن برای HTML
// =====================================

function escapeHtml(text) {

  return String(text || "")
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
    escapeHtml(getUserName(user));

  return `<a href="tg://user?id=${user.id}">${name}</a>`;
}


// =====================================
// بررسی گروه
// =====================================

function isGroupChat(ctx) {

  const type =
    ctx.chat &&
    ctx.chat.type;

  return (
    type === "group" ||
    type === "supergroup"
  );
}


// =====================================
// پیام هدف
// مهم‌ترین قسمت Reply
// =====================================

function getTargetMessage(ctx) {

  if (
    ctx.message &&
    ctx.message.reply_to_message
  ) {
    return ctx.message.reply_to_message;
  }

  return null;
}


// =====================================
// کاربر هدف از Reply
// =====================================

function getReplyTarget(ctx) {

  const targetMessage =
    getTargetMessage(ctx);

  if (
    targetMessage &&
    targetMessage.from
  ) {

    return targetMessage.from;
  }

  return null;
}


// =====================================
// شناسه پیام هدف
// =====================================

function getTargetReplyId(ctx) {

  const targetMessage =
    getTargetMessage(ctx);

  if (!targetMessage) {
    return null;
  }

  return targetMessage.message_id || null;
}


// =====================================
// پاسخ به پیام ریپلای‌شده
// =====================================

async function replyToTarget(
  ctx,
  text,
  extra = {}
) {

  const replyId =
    getTargetReplyId(ctx);

  const options = {
    ...extra
  };

  if (replyId) {

    options.reply_parameters = {
      message_id: replyId
    };
  }

  return ctx.reply(
    text,
    options
  );
}


// =====================================
// دریافت نقش واقعی کاربر از تلگرام
// =====================================

async function getMemberRole(
  ctx,
  userId
) {

  if (!userId) {
    return "unknown";
  }

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (!member) {
      return "unknown";
    }

    if (member.status === "creator") {
      return "owner";
    }

    if (member.status === "administrator") {
      return "admin";
    }

    if (
      member.status === "member" ||
      member.status === "restricted"
    ) {
      return "member";
    }

    if (member.status === "left") {
      return "left";
    }

    if (member.status === "kicked") {
      return "kicked";
    }

    return "unknown";

  } catch (error) {

    console.error(
      "getMemberRole error:",
      error.message
    );

    return "unknown";
  }
}


// =====================================
// مالک گروه
// =====================================

async function isOwner(
  ctx,
  userId
) {

  const role =
    await getMemberRole(
      ctx,
      userId
    );

  return role === "owner";
}


// =====================================
// مدیر گروه
// =====================================

async function isAdmin(
  ctx,
  userId
) {

  const role =
    await getMemberRole(
      ctx,
      userId
    );

  return (
    role === "owner" ||
    role === "admin"
  );
}


// =====================================
// بررسی دسترسی مدیر اجراکننده
//
// کاربر عادی:
// ❌ هیچ دسترسی مدیریتی ندارد
//
// مدیر:
// ✅ اجازه اجرای دستورات مدیریتی دارد
//
// مالک:
// ✅ اجازه کامل دارد
// =====================================

async function checkExecutor(
  ctx
) {

  if (!isGroupChat(ctx)) {
    return false;
  }

  if (
    !ctx.from ||
    !ctx.from.id
  ) {

    return false;
  }

  const role =
    await getMemberRole(
      ctx,
      ctx.from.id
    );

  // -------------------------------
  // مالک
  // -------------------------------

  if (role === "owner") {
    return true;
  }

  // -------------------------------
  // مدیر
  // -------------------------------

  if (role === "admin") {
    return true;
  }

  // -------------------------------
  // کاربر عادی
  // -------------------------------

  await ctx.reply(
    "『𓆩 ★ شما دسترسی مدیریت این ربات را ندارید ★ 𓆪』"
  );

  return false;
}


// =====================================
// بررسی دسترسی ربات
// =====================================

async function checkBotPermissions(
  ctx,
  action = "restrict"
) {

  try {

    const botId =
      ctx.botInfo &&
      ctx.botInfo.id;

    if (!botId) {

      await ctx.reply(
        "『𓆩 ★ شناسه ربات پیدا نشد ★ 𓆪』"
      );

      return false;
    }

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        botId
      );

    if (
      !member ||
      (
        member.status !== "administrator" &&
        member.status !== "creator"
      )
    ) {

      await ctx.reply(
        "『𓆩 ★ ربات باید مدیر گروه باشد ★ 𓆪』"
      );

      return false;
    }

    if (
      action === "restrict" &&
      member.status !== "creator" &&
      !member.can_restrict_members
    ) {

      await ctx.reply(
        "『𓆩 ★ ربات دسترسی بن، سکوت یا اخراج ندارد ★ 𓆪』"
      );

      return false;
    }

    return true;

  } catch (error) {

    console.error(
      "checkBotPermissions error:",
      error.message
    );

    await ctx.reply(
      "『𓆩 ★ بررسی دسترسی ربات انجام نشد ★ 𓆪』"
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

  if (!username) {
    return null;
  }

  const clean =
    String(username)
      .replace(/^@/, "")
      .toLowerCase();

  for (
    const key of Object.keys(knownUsers)
  ) {

    const user =
      knownUsers[key];

    if (
      user.username &&
      user.username.toLowerCase() === clean
    ) {

      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن کاربر با ID
// =====================================

function findKnownUserById(
  id
) {

  if (
    id === undefined ||
    id === null
  ) {
    return null;
  }

  const clean =
    String(id).trim();

  if (!/^-?\d+$/.test(clean)) {
    return null;
  }

  if (knownUsers[clean]) {
    return knownUsers[clean];
  }

  return {
    id: Number(clean),
    first_name: "کاربر",
    last_name: "",
    username: null
  };
}


// =====================================
// پیدا کردن کاربر با نام
// =====================================

function findKnownUserByName(
  name
) {

  if (!name) {
    return null;
  }

  const search =
    String(name)
      .trim()
      .toLowerCase();

  for (
    const key of Object.keys(knownUsers)
  ) {

    const user =
      knownUsers[key];

    const first =
      String(user.first_name || "")
        .toLowerCase();

    const last =
      String(user.last_name || "")
        .toLowerCase();

    const fullName =
      getUserName(user)
        .toLowerCase();

    if (
      fullName === search ||
      first === search ||
      `${first} ${last}`.trim() === search
    ) {

      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن User از text_mention
// =====================================

function getTextMentionUser(
  message
) {

  if (
    !message ||
    !message.entities ||
    !Array.isArray(message.entities)
  ) {
    return null;
  }

  for (
    const entity of message.entities
  ) {

    if (
      entity &&
      entity.type === "text_mention" &&
      entity.user &&
      entity.user.id
    ) {

      rememberUser(entity.user);

      return entity.user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن یوزرنیم داخل متن پیام
// =====================================

function getUsernameFromText(
  text
) {

  if (!text) {
    return null;
  }

  const match =
    String(text).match(
      /(^|\s)@([A-Za-z0-9_]{5,32})\b/
    );

  if (!match) {
    return null;
  }

  return `@${match[2]}`;
}


// =====================================
// پیدا کردن ID داخل متن پیام
// =====================================

function getIdFromText(
  text
) {

  if (!text) {
    return null;
  }

  const match =
    String(text).match(
      /(^|\s)(-?\d{5,20})(?=\s|$)/
    );

  if (!match) {
    return null;
  }

  return match[2];
}


// =====================================
// تشخیص هدف از محتوای Reply
// =====================================

function resolveTargetFromReplyContent(
  ctx
) {

  const message =
    getTargetMessage(ctx);

  if (!message) {
    return null;
  }

  const mentionedUser =
    getTextMentionUser(message);

  if (
    mentionedUser &&
    mentionedUser.id
  ) {

    return mentionedUser;
  }

  const text =
    message.text ||
    message.caption ||
    "";

  const username =
    getUsernameFromText(text);

  if (username) {

    const user =
      findKnownUserByUsername(username);

    if (user) {
      return user;
    }
  }

  const id =
    getIdFromText(text);

  if (id) {

    const user =
      findKnownUserById(id);

    if (user) {
      return user;
    }
  }

  return null;
}


// =====================================
// تشخیص کاربر هدف
//
// اولویت:
// 1. هدف صریح
// 2. اطلاعات داخل Reply
// 3. خود کاربر Reply شده
//
// =====================================

function resolveTarget(
  ctx,
  args = []
) {

  if (
    args &&
    args.length > 0
  ) {

    const first =
      String(args[0]).trim();

    if (/^-?\d+$/.test(first)) {

      const user =
        findKnownUserById(first);

      if (user) {
        return user;
      }
    }

    if (
      first.startsWith("@")
    ) {

      const user =
        findKnownUserByUsername(first);

      if (user) {
        return user;
      }
    }

    const byName =
      findKnownUserByName(
        args.join(" ")
      );

    if (byName) {
      return byName;
    }
  }

  const contentTarget =
    resolveTargetFromReplyContent(ctx);

  if (
    contentTarget &&
    contentTarget.id
  ) {

    rememberUser(contentTarget);

    return contentTarget;
  }

  const replyUser =
    getReplyTarget(ctx);

  if (
    replyUser &&
    replyUser.id
  ) {

    rememberUser(replyUser);

    return replyUser;
  }

  return null;
}// =====================================
// بررسی کاربر هدف
//
// مالک → غیرقابل مدیریت
// مدیر → غیرقابل مدیریت
// کاربر عادی → قابل مدیریت
// =====================================

async function checkTarget(
  ctx,
  target
) {

  if (
    !target ||
    !target.id
  ) {

    await ctx.reply(
      "『𓆩 ★ روی پیام کاربر Reply کن ★ 𓆪』"
    );

    return false;
  }


  // -----------------------------------
  // جلوگیری از اجرای دستور روی ربات
  // -----------------------------------

  if (
    ctx.botInfo &&
    Number(target.id) ===
    Number(ctx.botInfo.id)
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ روی خود ربات نمی‌توانی این کار را انجام بدهی ★ 𓆪』"
    );

    return false;
  }


  // -----------------------------------
  // دریافت نقش واقعی هدف
  // -----------------------------------

  const role =
    await getMemberRole(
      ctx,
      target.id
    );


  // -----------------------------------
  // مالک گروه
  // -----------------------------------

  if (role === "owner") {

    await replyToTarget(
      ctx,
      "『𓆩 ★ کاربر مالک گروه است و قابل بن، سکوت، سیک، خفه یا اخطار نیست ★ 𓆪』"
    );

    return false;
  }


  // -----------------------------------
  // مدیر گروه
  // -----------------------------------

  if (role === "admin") {

    await replyToTarget(
      ctx,
      "『𓆩 ★ کاربر مدیر گروه است و قابل بن، سکوت، سیک، خفه یا اخطار نیست ★ 𓆪』"
    );

    return false;
  }


  // -----------------------------------
  // کاربر پیدا نشد
  // -----------------------------------

  if (
    role === "unknown" ||
    role === "left" ||
    role === "kicked"
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ اطلاعات عضویت این کاربر از تلگرام دریافت نشد ★ 𓆪』"
    );

    return false;
  }


  // -----------------------------------
  // کاربر عادی
  // -----------------------------------

  return true;
}


// =====================================
// مدت سکوت
// =====================================

function getDuration(
  args
) {

  if (
    !args ||
    !args.length
  ) {
    return 1;
  }

  const value =
    Number(args[0]);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 1;
  }

  return Math.min(
    value,
    168
  );
}


// =====================================
// متن مدت
// =====================================

function durationText(
  hours
) {

  if (hours === 1) {
    return "یک ساعت";
  }

  if (hours === 2) {
    return "دو ساعت";
  }

  if (hours === 3) {
    return "سه ساعت";
  }

  if (hours === 4) {
    return "چهار ساعت";
  }

  return `${hours} ساعت`;
}


// =====================================
// BAN
// =====================================

async function banUser(
  ctx,
  target
) {

  // اول مدیر بودن اجراکننده
  if (
    !await checkExecutor(ctx)
  ) {
    return false;
  }

  // بعد دسترسی ربات
  if (
    !await checkBotPermissions(
      ctx,
      "restrict"
    )
  ) {
    return false;
  }

  // بعد بررسی هدف
  if (
    !await checkTarget(
      ctx,
      target
    )
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
      `『𓆩 ★ کاربر ${mentionUser(target)} بن شد ★ 𓆪』`
    );

    return true;

  } catch (error) {

    console.error(
      "banUser error:",
      error.message
    );

    await replyToTarget(
      ctx,
      "『𓆩 ★ بن کردن کاربر انجام نشد ★ 𓆪』"
    );

    return false;
  }
}


// =====================================
// حذف بن
// =====================================

async function unbanUser(
  ctx,
  target
) {

  if (
    !await checkExecutor(ctx)
  ) {
    return false;
  }

  if (
    !await checkBotPermissions(
      ctx,
      "restrict"
    )
  ) {
    return false;
  }

  if (
    !await checkTarget(
      ctx,
      target
    )
  ) {
    return false;
  }

  try {

    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.id,
      {
        only_if_banned: true
      }
    );

    await replyToTarget(
      ctx,
      `『𓆩 ★ بن کاربر ${mentionUser(target)} حذف شد ★ 𓆪』`
    );

    return true;

  } catch (error) {

    console.error(
      "unbanUser error:",
      error.message
    );

    await replyToTarget(
      ctx,
      "『𓆩 ★ حذف بن کاربر انجام نشد ★ 𓆪』"
    );

    return false;
  }
}


// =====================================
// سیک
// =====================================

async function sikUser(
  ctx,
  target
) {

  return banUser(
    ctx,
    target
  );
}


// =====================================
// حذف سیک
// =====================================

async function unsikUser(
  ctx,
  target
) {

  return unbanUser(
    ctx,
    target
  );
}


// =====================================
// اخراج
// =====================================

async function kickUser(
  ctx,
  target
) {

  if (
    !await checkExecutor(ctx)
  ) {
    return false;
  }

  if (
    !await checkBotPermissions(
      ctx,
      "restrict"
    )
  ) {
    return false;
  }

  if (
    !await checkTarget(
      ctx,
      target
    )
  ) {
    return false;
  }

  try {

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );

    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.id,
      {
        only_if_banned: true
      }
    );

    await replyToTarget(
      ctx,
      `『𓆩 ★ کاربر ${mentionUser(target)} اخراج شد ★ 𓆪』`
    );

    return true;

  } catch (error) {

    console.error(
      "kickUser error:",
      error.message
    );

    await replyToTarget(
      ctx,
      "『𓆩 ★ اخراج کاربر انجام نشد ★ 𓆪』"
    );

    return false;
  }
}


// =====================================
// سکوت
// =====================================

async function muteUser(
  ctx,
  target,
  hours = 1
) {

  if (
    !await checkExecutor(ctx)
  ) {
    return false;
  }

  if (
    !await checkBotPermissions(
      ctx,
      "restrict"
    )
  ) {
    return false;
  }

  if (
    !await checkTarget(
      ctx,
      target
    )
  ) {
    return false;
  }

  try {

    const untilDate =
      Math.floor(
        Date.now() / 1000
      ) +
      (
        Number(hours) *
        60 *
        60
      );

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        until_date: untilDate,

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
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false,
          can_manage_topics: false
        }
      }
    );

    await replyToTarget(
      ctx,
      `『𓆩 ★ کاربر ${mentionUser(target)} ${durationText(hours)} سکوت شد ★ 𓆪』`
    );

    return true;

  } catch (error) {

    console.error(
      "muteUser error:",
      error.message
    );

    await replyToTarget(
      ctx,
      "『𓆩 ★ انجام سکوت امکان‌پذیر نیست ★ 𓆪』"
    );

    return false;
  }
}


// =====================================
// حذف سکوت
// =====================================

async function unmuteUser(
  ctx,
  target
) {

  if (
    !await checkExecutor(ctx)
  ) {
    return false;
  }

  if (
    !await checkBotPermissions(
      ctx,
      "restrict"
    )
  ) {
    return false;
  }

  if (
    !await checkTarget(
      ctx,
      target
    )
  ) {
    return false;
  }

  try {

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        permissions: {
          can_send_messages: true,
          can_send_audios: true,
          can_send_documents: true,
          can_send_photos: true,
          can_send_videos: true,
          can_send_video_notes: true,
          can_send_voice_notes: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
          can_change_info: false,
          can_invite_users: true,
          can_pin_messages: false,
          can_manage_topics: false
        }
      }
    );

    await replyToTarget(
      ctx,
      `『𓆩 ★ سکوت کاربر ${mentionUser(target)} حذف شد ★ 𓆪』`
    );

    return true;

  } catch (error) {

    console.error(
      "unmuteUser error:",
      error.message
    );

    await replyToTarget(
      ctx,
      "『𓆩 ★ حذف سکوت کاربر انجام نشد ★ 𓆪』"
    );

    return false;
  }
}


// =====================================
// خفه
// دقیقاً همان عملکرد سکوت
// =====================================

async function khafeUser(
  ctx,
  target,
  hours = 1
) {

  return muteUser(
    ctx,
    target,
    hours
  );
}


// =====================================
// حذف خفه
// =====================================

async function unkhafeUser(
  ctx,
  target
) {

  return unmuteUser(
    ctx,
    target
  );
}


// =====================================
// ثبت دستور بن
// =====================================

function registerBanCommands(
  bot
) {

  bot.hears(
    /^بن(?:\s+(.+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const args =
        ctx.match &&
        ctx.match[1]
          ? ctx.match[1]
              .trim()
              .split(/\s+/)
          : [];

      const target =
        resolveTarget(
          ctx,
          args
        );

      await banUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // حذف بن
  // -----------------------------------

  bot.hears(
    /^حذف بن$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      await unbanUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// ثبت دستور سیک
// =====================================

function registerSikCommands(
  bot
) {

  bot.hears(
    /^سیک(?:\s+(.+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const args =
        ctx.match &&
        ctx.match[1]
          ? ctx.match[1]
              .trim()
              .split(/\s+/)
          : [];

      const target =
        resolveTarget(
          ctx,
          args
        );

      await sikUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // حذف سیک
  // -----------------------------------

  bot.hears(
    /^حذف سیک$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      await unsikUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// ثبت دستور اخراج
// =====================================

function registerKickCommands(
  bot
) {

  bot.hears(
    /^اخراج(?:\s+(.+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const args =
        ctx.match &&
        ctx.match[1]
          ? ctx.match[1]
              .trim()
              .split(/\s+/)
          : [];

      const target =
        resolveTarget(
          ctx,
          args
        );

      await kickUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// ثبت دستور سکوت
// =====================================

function registerMuteCommands(
  bot
) {

  bot.hears(
    /^سکوت(?:\s+(.+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const text =
        ctx.match &&
        ctx.match[1]
          ? ctx.match[1].trim()
          : "";

      const args =
        text
          ? text.split(/\s+/)
          : [];

      let hours = 1;

      if (
        args.length &&
        /^\d+$/.test(args[0])
      ) {

        hours =
          getDuration(args);

        args.shift();
      }

      const target =
        resolveTarget(
          ctx,
          args
        );

      await muteUser(
        ctx,
        target,
        hours
      );
    }
  );


  // -----------------------------------
  // حذف سکوت
  // -----------------------------------

  bot.hears(
    /^حذف سکوت$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      await unmuteUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// ثبت دستور خفه
// =====================================

function registerKhafeCommands(
  bot
) {

  bot.hears(
    /^خفه(?:\s+(.+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const text =
        ctx.match &&
        ctx.match[1]
          ? ctx.match[1].trim()
          : "";

      const args =
        text
          ? text.split(/\s+/)
          : [];

      let hours = 1;

      if (
        args.length &&
        /^\d+$/.test(args[0])
      ) {

        hours =
          getDuration(args);

        args.shift();
      }

      const target =
        resolveTarget(
          ctx,
          args
        );

      await khafeUser(
        ctx,
        target,
        hours
      );
    }
  );


  // -----------------------------------
  // حذف خفه
  // -----------------------------------

  bot.hears(
    /^حذف خفه$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      await unkhafeUser(
        ctx,
        target
      );
    }
  );
}


// =====================================
// ثبت همه عملیات مدیریتی
// =====================================

function registerModerationActions(
  bot
) {

  registerBanCommands(bot);

  registerSikCommands(bot);

  registerKickCommands(bot);

  registerMuteCommands(bot);

  registerKhafeCommands(bot);
}// =====================================
// تنظیمات اخطار
// =====================================

function getWarningSettings(
  group
) {

  if (!group.warningSettings) {

    group.warningSettings = {
      maxWarnings: 3,
      punishment: "mute",
      duration: 1
    };
  }

  if (
    !Number.isFinite(
      Number(
        group.warningSettings.maxWarnings
      )
    )
  ) {

    group.warningSettings.maxWarnings = 3;
  }

  if (
    !group.warningSettings.punishment
  ) {

    group.warningSettings.punishment =
      "mute";
  }

  if (
    !Number.isFinite(
      Number(
        group.warningSettings.duration
      )
    )
  ) {

    group.warningSettings.duration = 1;
  }

  return group.warningSettings;
}


// =====================================
// اضافه کردن اخطار
// =====================================

function addWarning(
  group,
  userId
) {

  if (!group.warns) {
    group.warns = {};
  }

  const id =
    String(userId);

  if (
    !Number.isFinite(
      Number(group.warns[id])
    )
  ) {

    group.warns[id] = 0;
  }

  group.warns[id] += 1;

  return group.warns[id];
}


// =====================================
// حذف یک اخطار
// =====================================

function removeWarning(
  group,
  userId
) {

  if (!group.warns) {
    group.warns = {};
  }

  const id =
    String(userId);

  if (!group.warns[id]) {
    return 0;
  }

  group.warns[id] -= 1;

  if (group.warns[id] < 0) {
    group.warns[id] = 0;
  }

  return group.warns[id];
}


// =====================================
// پاک کردن همه اخطارها
// =====================================

function clearWarnings(
  group,
  userId
) {

  if (!group.warns) {
    group.warns = {};
  }

  group.warns[String(userId)] = 0;

  return 0;
}


// =====================================
// دریافت تعداد اخطار
// =====================================

function getWarnings(
  group,
  userId
) {

  if (!group.warns) {
    return 0;
  }

  return Number(
    group.warns[String(userId)] || 0
  );
}


// =====================================
// تنظیم تعداد اخطار
// =====================================

function setMaxWarnings(
  group,
  count
) {

  const settings =
    getWarningSettings(group);

  const value =
    Number(count);

  if (
    !Number.isFinite(value) ||
    value < 1
  ) {

    return false;
  }

  settings.maxWarnings =
    Math.floor(value);

  return true;
}


// =====================================
// تنظیم مجازات اخطار
// =====================================

function setWarningPunishment(
  group,
  punishment
) {

  const settings =
    getWarningSettings(group);

  const value =
    String(punishment)
      .toLowerCase();

  if (
    value !== "ban" &&
    value !== "mute"
  ) {

    return false;
  }

  settings.punishment =
    value;

  return true;
}


// =====================================
// تنظیم مدت مجازات اخطار
// دقیقه
// =====================================

function setWarningDuration(
  group,
  minutes
) {

  const settings =
    getWarningSettings(group);

  const value =
    Number(minutes);

  if (
    !Number.isFinite(value) ||
    value < 1
  ) {

    return false;
  }

  settings.duration =
    Math.floor(value);

  return true;
}


// =====================================
// اجرای مجازات اخطار
// =====================================

async function executeWarningPunishment(
  ctx,
  target,
  settings
) {

  if (
    settings.punishment === "ban"
  ) {

    return banUser(
      ctx,
      target
    );
  }

  const minutes =
    Number(settings.duration || 1);

  const hours =
    Math.max(
      1,
      Math.ceil(minutes / 60)
    );

  return muteUser(
    ctx,
    target,
    hours
  );
}


// =====================================
// دستورات اخطار
// =====================================

function registerWarningCommands(
  bot
) {

  // ===================================
  // اخطار
  // ===================================

  bot.hears(
    /^اخطار(?:\s+(\d+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      // فقط مدیر و مالک
      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const number =
        ctx.match &&
        ctx.match[1]
          ? Number(ctx.match[1])
          : 1;

      const target =
        resolveTarget(
          ctx,
          []
        );

      if (
        !target ||
        !target.id
      ) {

        await ctx.reply(
          "『𓆩 ★ روی پیام کاربر Reply کن و اخطار را بفرست ★ 𓆪』"
        );

        return;
      }

      // مالک / مدیر / کاربر عادی
      if (
        !await checkTarget(
          ctx,
          target
        )
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      const settings =
        getWarningSettings(group);

      let total = 0;

      for (
        let i = 0;
        i < number;
        i++
      ) {

        total =
          addWarning(
            group,
            target.id
          );
      }

      saveDB();

      await replyToTarget(
        ctx,
        `『𓆩 ⚠️ کاربر ${mentionUser(target)} اخطار گرفت\n\nتعداد اخطار: ${total} از ${settings.maxWarnings} 𓆪』`
      );

      // رسیدن به سقف اخطار
      if (
        total >=
        settings.maxWarnings
      ) {

        clearWarnings(
          group,
          target.id
        );

        saveDB();

        await executeWarningPunishment(
          ctx,
          target,
          settings
        );
      }
    }
  );


  // ===================================
  // حذف اخطار
  // ===================================

  bot.hears(
    /^حذف اخطار(?:\s+(\d+))?$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      // فقط مدیر و مالک
      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const number =
        ctx.match &&
        ctx.match[1]
          ? Number(ctx.match[1])
          : 1;

      const target =
        resolveTarget(
          ctx,
          []
        );

      if (
        !target ||
        !target.id
      ) {

        await ctx.reply(
          "『𓆩 ★ روی پیام کاربر Reply کن و حذف اخطار را بفرست ★ 𓆪』"
        );

        return;
      }

      if (
        !await checkTarget(
          ctx,
          target
        )
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      const before =
        getWarnings(
          group,
          target.id
        );

      if (before <= 0) {

        await replyToTarget(
          ctx,
          `『𓆩 ★ ${mentionUser(target)} اخطاری ندارد ★ 𓆪』`
        );

        return;
      }

      let remaining =
        before;

      for (
        let i = 0;
        i < number;
        i++
      ) {

        remaining =
          removeWarning(
            group,
            target.id
          );
      }

      saveDB();

      await replyToTarget(
        ctx,
        `『𓆩 ★ اخطار ${mentionUser(target)} حذف شد\n\nتعداد اخطار باقی‌مانده: ${remaining} 𓆪』`
      );
    }
  );


  // ===================================
  // تعداد اخطار
  // ===================================

  bot.hears(
    /^تعداد اخطار\s+(\d+)$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const value =
        Number(ctx.match[1]);

      const group =
        getGroup(ctx.chat.id);

      if (
        !setMaxWarnings(
          group,
          value
        )
      ) {

        await ctx.reply(
          "『𓆩 ★ تعداد اخطار نامعتبر است ★ 𓆪』"
        );

        return;
      }

      saveDB();

      await ctx.reply(
        `『𓆩 ★ سقف اخطار روی ${value} تنظیم شد ★ 𓆪』`
      );
    }
  );


  // ===================================
  // تنظیم اخطار بن
  // ===================================

  bot.hears(
    /^تنظیم اخطار بن$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      setWarningPunishment(
        group,
        "ban"
      );

      saveDB();

      await ctx.reply(
        "『𓆩 ★ مجازات اخطار روی بن تنظیم شد ★ 𓆪』"
      );
    }
  );


  // ===================================
  // تنظیم اخطار سکوت
  // ===================================

  bot.hears(
    /^تنظیم اخطار سکوت$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      setWarningPunishment(
        group,
        "mute"
      );

      saveDB();

      await ctx.reply(
        "『𓆩 ★ مجازات اخطار روی سکوت تنظیم شد ★ 𓆪』"
      );
    }
  );


  // ===================================
  // تنظیم مدت اخطار
  // مثال:
  // تنظیم مدت اخطار 60
  // ===================================

  bot.hears(
    /^تنظیم مدت اخطار\s+(\d+)$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const minutes =
        Number(ctx.match[1]);

      const group =
        getGroup(ctx.chat.id);

      if (
        !setWarningDuration(
          group,
          minutes
        )
      ) {

        await ctx.reply(
          "『𓆩 ★ مدت اخطار نامعتبر است ★ 𓆪』"
        );

        return;
      }

      saveDB();

      await ctx.reply(
        `『𓆩 ★ مدت مجازات اخطار روی ${minutes} دقیقه تنظیم شد ★ 𓆪』`
      );
    }
  );


  // ===================================
  // اخطارها
  // ===================================

  bot.hears(
    /^اخطارها$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      if (
        !target ||
        !target.id
      ) {

        await ctx.reply(
          "『𓆩 ★ روی پیام کاربر Reply کن ★ 𓆪』"
        );

        return;
      }

      if (
        !await checkTarget(
          ctx,
          target
        )
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      const count =
        getWarnings(
          group,
          target.id
        );

      const settings =
        getWarningSettings(group);

      await replyToTarget(
        ctx,
        `『𓆩 ⚠️ اخطارهای ${mentionUser(target)}\n\nتعداد: ${count} از ${settings.maxWarnings} 𓆪』`
      );
    }
  );


  // ===================================
  // وضعیت اخطار
  // ===================================

  bot.hears(
    /^اخطار وضعیت$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      const settings =
        getWarningSettings(group);

      const punishment =
        settings.punishment === "ban"
          ? "بن"
          : "سکوت";

      await ctx.reply(
        `『𓆩 ⚠️ وضعیت سیستم اخطار\n\nحداکثر اخطار: ${settings.maxWarnings}\nمجازات: ${punishment}\nمدت سکوت: ${settings.duration} دقیقه 𓆪』`
      );
    }
  );


  // ===================================
  // شناسه
  // ===================================

  bot.hears(
    /^شناسه$/i,
    async (ctx) => {

      if (!isGroupChat(ctx)) {
        return;
      }

      // شناسه هم فقط برای مدیر و مالک
      if (
        !await checkExecutor(ctx)
      ) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      if (
        !target ||
        !target.id
      ) {

        await ctx.reply(
          "『𓆩 ★ روی پیام کاربر Reply کن ★ 𓆪』"
        );

        return;
      }

      await replyToTarget(
        ctx,
        `『𓆩 ★ شناسه کاربر ★ 𓆪』\n\n${mentionUser(target)}\n\nID: <code>${target.id}</code>`,
        {
          parse_mode: "HTML"
        }
      );
    }
  );
}


// =====================================
// ثبت سیستم مدیریت
// =====================================

function registerModeration(
  bot
) {

  // -----------------------------------
  // ذخیره کاربران دیده‌شده
  // -----------------------------------

  bot.use(
    async (ctx, next) => {

      try {

        if (
          ctx.from
        ) {

          rememberUser(
            ctx.from
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

        // -------------------------------
        // ذخیره کاربران text_mention
        // -------------------------------

        if (
          ctx.message &&
          ctx.message.reply_to_message
        ) {

          const mentionedUser =
            getTextMentionUser(
              ctx.message.reply_to_message
            );

          if (
            mentionedUser &&
            mentionedUser.id
          ) {

            rememberUser(
              mentionedUser
            );
          }
        }

      } catch (error) {

        console.error(
          "remember user error:",
          error.message
        );
      }

      return next();
    }
  );


  // -----------------------------------
  // عملیات اصلی
  // -----------------------------------

  registerModerationActions(
    bot
  );


  // -----------------------------------
  // سیستم اخطار
  // -----------------------------------

  registerWarningCommands(
    bot
  );
}


// =====================================
// خروجی فایل
// =====================================

module.exports = {

  registerModeration,

  rememberUser,

  getMemberRole,

  isOwner,

  isAdmin,

  checkExecutor,

  checkBotPermissions,

  resolveTarget,

  checkTarget,

  banUser,

  unbanUser,

  sikUser,

  unsikUser,

  kickUser,

  muteUser,

  unmuteUser,

  khafeUser,

  unkhafeUser,

  getWarningSettings,

  addWarning,

  removeWarning,

  clearWarnings,

  getWarnings,

  setMaxWarnings,

  setWarningPunishment,

  setWarningDuration
};
