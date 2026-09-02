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
// اول یوزرنیم
// بعد اسم و فامیل
// =====================================

function getUserName(user) {

  if (!user) {
    return "کاربر";
  }

  if (user.username) {
    return `@${user.username}`;
  }

  const first =
    user.first_name || "";

  const last =
    user.last_name || "";

  const full =
    `${first} ${last}`.trim();

  return full || "کاربر";
}

// =====================================
// HTML
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
    escapeHtml(
      getUserName(user)
    );

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

  const message =
    getTargetMessage(ctx);

  if (
    message &&
    message.from
  ) {
    return message.from;
  }

  return null;
}

// =====================================
// شناسه پیام هدف
// =====================================

function getTargetReplyId(ctx) {

  const message =
    getTargetMessage(ctx);

  if (!message) {
    return null;
  }

  return message.message_id || null;
}

// =====================================
// جواب حتماً Reply
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
// پاسخ عادی فقط برای پیام‌های خطایی
// اگر Reply باشد، باز هم Reply می‌کند
// =====================================

async function replyOrNormal(
  ctx,
  text,
  extra = {}
) {

  if (
    getTargetReplyId(ctx)
  ) {

    return replyToTarget(
      ctx,
      text,
      extra
    );
  }

  return ctx.reply(
    text,
    extra
  );
}

// =====================================
// نقش کاربر
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

    if (
      member.status === "left"
    ) {
      return "left";
    }

    if (
      member.status === "kicked"
    ) {
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
// مالک
// =====================================

async function isOwner(
  ctx,
  userId
) {

  return (
    await getMemberRole(
      ctx,
      userId
    )
  ) === "owner";
}

// =====================================
// مدیر
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
// بررسی اجراکننده
// ممبر عادی کاملاً بی‌صدا
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

  // =====================================
  // ممبر عادی
  // هیچ پاسخی نده
  // =====================================

  if (
    role !== "owner" &&
    role !== "admin"
  ) {
    return false;
  }

  return true;
}

// =====================================
// دسترسی ربات
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

      await replyOrNormal(
        ctx,
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

      await replyOrNormal(
        ctx,
        "『𓆩 ★ ربات باید مدیر گروه باشد ★ 𓆪』"
      );

      return false;
    }

    if (
      action === "restrict" &&
      member.status !== "creator" &&
      !member.can_restrict_members
    ) {

      await replyOrNormal(
        ctx,
        "『𓆩 ★ ربات دسترسی مدیریت کاربران را ندارد ★ 𓆪』"
      );

      return false;
    }

    return true;

  } catch (error) {

    console.error(
      "checkBotPermissions error:",
      error.message
    );

    await replyOrNormal(
      ctx,
      "『𓆩 ★ بررسی دسترسی ربات انجام نشد ★ 𓆪』"
    );

    return false;
  }
}

// =====================================
// پیدا کردن کاربر با username
// فقط از حافظه کاربران شناخته‌شده
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
      String(user.username).toLowerCase() === clean
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

  if (
    !/^-?\d+$/.test(clean)
  ) {
    return null;
  }

  if (
    knownUsers[clean]
  ) {
    return knownUsers[clean];
  }

  return null;
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
      String(
        user.first_name || ""
      ).toLowerCase();

    const last =
      String(
        user.last_name || ""
      ).toLowerCase();

    const fullName =
      `${first} ${last}`.trim();

    if (
      fullName === search ||
      first === search
    ) {
      return user;
    }
  }

  return null;
}

// =====================================
// text_mention
// =====================================

function getTextMentionUser(
  message
) {

  if (!message) {
    return null;
  }

  const entities =
    message.entities ||
    message.caption_entities ||
    [];

  if (
    !Array.isArray(entities)
  ) {
    return null;
  }

  for (
    const entity of entities
  ) {

    if (
      entity &&
      entity.type === "text_mention" &&
      entity.user &&
      entity.user.id
    ) {

      rememberUser(
        entity.user
      );

      return entity.user;
    }
  }

  return null;
}// =====================================
// پیدا کردن username داخل متن
// =====================================

function getUsernameFromText(text) {

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
// پیدا کردن ID داخل متن
// =====================================

function getIdFromText(text) {

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
// تشخیص هدف از پیام Reply
// =====================================

function resolveTargetFromReplyContent(ctx) {

  const message =
    getTargetMessage(ctx);

  if (!message) {
    return null;
  }

  // text_mention
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

  // =====================================
  // اگر پیام فقط username باشد
  // =====================================

  const username =
    getUsernameFromText(text);

  if (username) {

    const user =
      findKnownUserByUsername(
        username
      );

    // اگر username شناخته نشده،
    // هرگز فرستنده پیام را هدف قرار نده
    return user || null;
  }

  // =====================================
  // اگر پیام شامل ID باشد
  // =====================================

  const id =
    getIdFromText(text);

  if (id) {

    const user =
      findKnownUserById(id);

    return user || null;
  }

  return null;
}

// =====================================
// آیا Reply شامل هدف مشخص است؟
// =====================================

function hasTargetReferenceInReply(ctx) {

  const message =
    getTargetMessage(ctx);

  if (!message) {
    return false;
  }

  if (
    getTextMentionUser(message)
  ) {
    return true;
  }

  const text =
    message.text ||
    message.caption ||
    "";

  return Boolean(
    getUsernameFromText(text) ||
    getIdFromText(text)
  );
}

// =====================================
// تشخیص نهایی کاربر هدف
// =====================================

function resolveTarget(
  ctx,
  args = []
) {

  // =====================================
  // هدف داخل خود دستور
  // =====================================

  if (
    args &&
    args.length > 0
  ) {

    const first =
      String(args[0]).trim();

    // ID
    if (
      /^-?\d+$/.test(first)
    ) {

      return findKnownUserById(
        first
      );
    }

    // username
    if (
      first.startsWith("@")
    ) {

      return findKnownUserByUsername(
        first
      );
    }

    // اسم
    return findKnownUserByName(
      args.join(" ")
    );
  }

  // =====================================
  // اول محتوای پیام Reply
  // =====================================

  const contentTarget =
    resolveTargetFromReplyContent(ctx);

  if (
    contentTarget &&
    contentTarget.id
  ) {

    rememberUser(
      contentTarget
    );

    return contentTarget;
  }

  // =====================================
  // اگر Reply شامل username یا ID بود
  // ولی پیدا نشد، فرستنده را هدف نکن
  // =====================================

  if (
    hasTargetReferenceInReply(ctx)
  ) {
    return null;
  }

  // =====================================
  // Reply معمولی به خود کاربر
  // =====================================

  const replyUser =
    getReplyTarget(ctx);

  if (
    replyUser &&
    replyUser.id
  ) {

    rememberUser(
      replyUser
    );

    return replyUser;
  }

  return null;
}

// =====================================
// بررسی کاربر هدف
// =====================================

async function checkTarget(
  ctx,
  target,
  allowRemoved = false
) {

  if (
    !target ||
    !target.id
  ) {

    await replyOrNormal(
      ctx,
      "『𓆩 ★ روی پیام کاربر Reply کن ★ 𓆪』"
    );

    return false;
  }

  // =====================================
  // خود ربات
  // =====================================

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

  const role =
    await getMemberRole(
      ctx,
      target.id
    );

  // =====================================
  // مالک
  // =====================================

  if (
    role === "owner"
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ کاربر گرامی، مالک گروه است ★ 𓆪』"
    );

    return false;
  }

  // =====================================
  // مدیر
  // =====================================

  if (
    role === "admin"
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ کاربر گرامی، مدیر گروه است ★ 𓆪』"
    );

    return false;
  }

  // =====================================
  // کاربر خارج‌شده یا بن‌شده
  // =====================================

  if (
    role === "kicked" ||
    role === "left"
  ) {

    if (allowRemoved) {
      return true;
    }

    await replyToTarget(
      ctx,
      "『𓆩 ★ اطلاعات عضویت این کاربر از تلگرام دریافت نشد ★ 𓆪』"
    );

    return false;
  }

  // =====================================
  // نقش نامشخص
  // =====================================

  if (
    role === "unknown"
  ) {

    await replyToTarget(
      ctx,
      "『𓆩 ★ اطلاعات عضویت این کاربر از تلگرام دریافت نشد ★ 𓆪』"
    );

    return false;
  }

  return true;
}

// =====================================
// مدت سکوت
// =====================================

function parseMuteDuration(
  args = []
) {

  if (!args.length) {

    return {
      hours: 1,
      text: "یک ساعت"
    };
  }

  const value =
    Number(args[0]);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    return {
      hours: 1,
      text: "یک ساعت"
    };
  }

  const unit =
    String(args[1] || "")
      .toLowerCase();

  // =====================================
  // دقیقه
  // 6 تا 60 دقیقه
  // =====================================

  if (
    unit === "دقیقه" ||
    unit === "دقیقه‌ای"
  ) {

    const minutes =
      Math.min(
        Math.max(
          Math.floor(value),
          1
        ),
        60
      );

    return {
      hours: minutes / 60,
      text: `${minutes} دقیقه`
    };
  }

  // =====================================
  // ساعت
  // 1 تا 10 ساعت
  // =====================================

  if (
    unit === "ساعت" ||
    unit === "ساعته"
  ) {

    const hours =
      Math.min(
        Math.max(
          Math.floor(value),
          1
        ),
        10
      );

    return {
      hours,
      text:
        hours === 1
          ? "یک ساعت"
          : `${hours} ساعت`
    };
  }

  // =====================================
  // فقط عدد = ساعت
  // =====================================

  const hours =
    Math.min(
      Math.max(
        Math.floor(value),
        1
      ),
      10
    );

  return {
    hours,
    text:
      hours === 1
        ? "یک ساعت"
        : `${hours} ساعت`
  };
}

// =====================================
// متن مدت قدیمی
// =====================================

function durationText(hours) {

  if (hours === 1) {
    return "یک ساعت";
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

  if (!await checkExecutor(ctx)) {
    return false;
  }

  if (!await checkBotPermissions(
    ctx,
    "restrict"
  )) {
    return false;
  }

  if (!await checkTarget(
    ctx,
    target
  )) {
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

  if (!await checkExecutor(ctx)) {
    return false;
  }

  if (!await checkBotPermissions(
    ctx,
    "restrict"
  )) {
    return false;
  }

  if (!await checkTarget(
    ctx,
    target,
    true
  )) {
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

  if (!await checkExecutor(ctx)) {
    return false;
  }

  if (!await checkBotPermissions(
    ctx,
    "restrict"
  )) {
    return false;
  }

  if (!await checkTarget(
    ctx,
    target
  )) {
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
}// =====================================
// سکوت
// =====================================

async function muteUser(
  ctx,
  target,
  hours = 1,
  customText = null
) {

  if (!await checkExecutor(ctx)) {
    return false;
  }

  if (!await checkBotPermissions(
    ctx,
    "restrict"
  )) {
    return false;
  }

  if (!await checkTarget(
    ctx,
    target
  )) {
    return false;
  }

  try {

    const untilDate =
      Math.floor(
        Date.now() / 1000
      ) +
      Math.floor(
        Number(hours) * 60 * 60
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

    const text =
      customText ||
      durationText(hours);

    await replyToTarget(
      ctx,
      `『𓆩 ★ کاربر ${mentionUser(target)} ${text} سکوت شد ★ 𓆪』`
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

  if (!await checkExecutor(ctx)) {
    return false;
  }

  if (!await checkBotPermissions(
    ctx,
    "restrict"
  )) {
    return false;
  }

  if (!await checkTarget(
    ctx,
    target
  )) {
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
// دقیقاً مثل سکوت
// =====================================

async function khafeUser(
  ctx,
  target,
  hours = 1,
  customText = null
) {

  return muteUser(
    ctx,
    target,
    hours,
    customText
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

function registerBanCommands(bot) {

  bot.hears(
    /^بن$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      await banUser(
        ctx,
        target
      );
    }
  );

  bot.hears(
    /^حذف بن$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

function registerSikCommands(bot) {

  bot.hears(
    /^سیک$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
        );

      await sikUser(
        ctx,
        target
      );
    }
  );

  bot.hears(
    /^حذف سیک$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

function registerKickCommands(bot) {

  bot.hears(
    /^اخراج$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const target =
        resolveTarget(
          ctx,
          []
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

function registerMuteCommands(bot) {

  bot.hears(
    /^سکوت(?:\s+(\d+)\s*(دقیقه|دقیقه‌ای|ساعت|ساعته)?)?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const args = [];

      if (
        ctx.match &&
        ctx.match[1]
      ) {
        args.push(
          ctx.match[1]
        );

        if (ctx.match[2]) {
          args.push(
            ctx.match[2]
          );
        }
      }

      const duration =
        parseMuteDuration(args);

      const target =
        resolveTarget(
          ctx,
          []
        );

      await muteUser(
        ctx,
        target,
        duration.hours,
        duration.text
      );
    }
  );

  bot.hears(
    /^حذف سکوت$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

function registerKhafeCommands(bot) {

  bot.hears(
    /^خفه(?:\s+(\d+)\s*(دقیقه|دقیقه‌ای|ساعت|ساعته)?)?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const args = [];

      if (
        ctx.match &&
        ctx.match[1]
      ) {
        args.push(
          ctx.match[1]
        );

        if (ctx.match[2]) {
          args.push(
            ctx.match[2]
          );
        }
      }

      const duration =
        parseMuteDuration(args);

      const target =
        resolveTarget(
          ctx,
          []
        );

      await khafeUser(
        ctx,
        target,
        duration.hours,
        duration.text
      );
    }
  );

  bot.hears(
    /^حذف خفه$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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
// ثبت همه عملیات
// =====================================

function registerModerationActions(bot) {

  registerBanCommands(bot);
  registerSikCommands(bot);
  registerKickCommands(bot);
  registerMuteCommands(bot);
  registerKhafeCommands(bot);
}

// =====================================
// تنظیمات اخطار
// =====================================

function getWarningSettings(group) {

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
// اخطار
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
// تنظیم سقف اخطار
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
// تنظیم مدت اخطار
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
// مجازات اخطار
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
    Number(
      settings.duration || 1
    );

  const hours =
    minutes / 60;

  return muteUser(
    ctx,
    target,
    hours,
    `${minutes} دقیقه`
  );
}

// =====================================
// دستورات اخطار
// =====================================

function registerWarningCommands(bot) {

  // =====================================
  // اخطار
  // =====================================

  bot.hears(
    /^اخطار(?:\s+(\d+))?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

        await replyOrNormal(
          ctx,
          "『𓆩 ★ روی پیام کاربر Reply کن و اخطار را بفرست ★ 𓆪』"
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

      const settings =
        getWarningSettings(group);

      let total =
        getWarnings(
          group,
          target.id
        );

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

  // =====================================
  // حذف اخطار
  // =====================================

  bot.hears(
    /^حذف اخطار(?:\s+(\d+))?$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

        await replyOrNormal(
          ctx,
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

  // =====================================
  // تعداد اخطار
  // =====================================

  bot.hears(
    /^تعداد اخطار\s+(\d+)$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

        await replyOrNormal(
          ctx,
          "『𓆩 ★ تعداد اخطار نامعتبر است ★ 𓆪』"
        );

        return;
      }

      saveDB();

      await replyOrNormal(
        ctx,
        `『𓆩 ★ سقف اخطار روی ${value} تنظیم شد ★ 𓆪』`
      );
    }
  );

  // =====================================
  // اخطار بن
  // =====================================

  bot.hears(
    /^تنظیم اخطار بن$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      setWarningPunishment(
        group,
        "ban"
      );

      saveDB();

      await replyOrNormal(
        ctx,
        "『𓆩 ★ مجازات اخطار روی بن تنظیم شد ★ 𓆪』"
      );
    }
  );

  // =====================================
  // اخطار سکوت
  // =====================================

  bot.hears(
    /^تنظیم اخطار سکوت$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      setWarningPunishment(
        group,
        "mute"
      );

      saveDB();

      await replyOrNormal(
        ctx,
        "『𓆩 ★ مجازات اخطار روی سکوت تنظیم شد ★ 𓆪』"
      );
    }
  );

  // =====================================
  // مدت اخطار
  // =====================================

  bot.hears(
    /^تنظیم مدت اخطار\s+(\d+)$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

        await replyOrNormal(
          ctx,
          "『𓆩 ★ مدت اخطار نامعتبر است ★ 𓆪』"
        );

        return;
      }

      saveDB();

      await replyOrNormal(
        ctx,
        `『𓆩 ★ مدت مجازات اخطار روی ${minutes} دقیقه تنظیم شد ★ 𓆪』`
      );
    }
  );

  // =====================================
  // نمایش اخطارهای کاربر
  // =====================================

  bot.hears(
    /^اخطارها$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

        await replyOrNormal(
          ctx,
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

  // =====================================
  // وضعیت اخطار
  // =====================================

  bot.hears(
    /^اخطار وضعیت$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

      await replyOrNormal(
        ctx,
        `『𓆩 ⚠️ وضعیت سیستم اخطار\n\nحداکثر اخطار: ${settings.maxWarnings}\nمجازات: ${punishment}\nمدت سکوت: ${settings.duration} دقیقه 𓆪』`
      );
    }
  );

  // =====================================
  // شناسه
  // =====================================

  bot.hears(
    /^شناسه$/i,
    async ctx => {

      if (!isGroupChat(ctx)) {
        return;
      }

      if (!await checkExecutor(ctx)) {
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

        await replyOrNormal(
          ctx,
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

function registerModeration(bot) {

  bot.use(
    async (
      ctx,
      next
    ) => {
      
      try {

        if (ctx.from) {
          rememberUser(ctx.from);
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

  registerModerationActions(bot);

  registerWarningCommands(bot);
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
