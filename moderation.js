// =====================================
// PulseGroupManager
// MODERATION.JS
// بن | سیک | اخراج | سکوت | اخطار
// =====================================

const {
  getGroup,
  getPermissions,
  saveDB
} = require("./database");


// =====================================
// ابزارهای عمومی
// =====================================

function isGroup(ctx) {
  return !!(
    ctx &&
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );
}


// =====================================
// فقط با ریپلای
// =====================================

function hasReply(ctx) {
  return !!(
    ctx &&
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from &&
    ctx.message.reply_to_message.from.id
  );
}


// =====================================
// دریافت کاربر هدف
// =====================================

function getTarget(ctx) {
  if (!hasReply(ctx)) {
    return null;
  }

  return ctx.message.reply_to_message.from;
}


// =====================================
// نام کاربر هدف
// =====================================

function getTargetName(ctx) {
  const user = getTarget(ctx);

  if (!user) {
    return "کاربر";
  }

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  if (user.first_name) {
    return user.first_name;
  }

  if (user.username) {
    return `@${user.username}`;
  }

  return "کاربر";
}


// =====================================
// پاسخ حتماً روی پیام هدف
// =====================================

async function replyToTarget(ctx, text) {
  if (!hasReply(ctx)) {
    return null;
  }

  try {
    return await ctx.reply(text, {
      reply_parameters: {
        message_id: ctx.message.reply_to_message.message_id
      }
    });
  } catch (error) {
    console.error(
      "MODERATION REPLY ERROR:",
      error.message
    );
    return null;
  }
}


// =====================================
// گرفتن اطلاعات عضو
// =====================================

async function getMember(ctx, userId) {
  try {
    return await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );
  } catch (error) {
    return null;
  }
}


// =====================================
// تشخیص مالک
// =====================================

async function isOwner(ctx, userId) {
  const member = await getMember(ctx, userId);

  return !!(
    member &&
    member.status === "creator"
  );
}


// =====================================
// تشخیص مدیر
// =====================================

async function isAdmin(ctx, userId) {
  const member = await getMember(ctx, userId);

  return !!(
    member &&
    (
      member.status === "creator" ||
      member.status === "administrator"
    )
  );
}


// =====================================
// اطلاعات ربات
// =====================================

async function getBotMember(ctx) {
  try {
    const me = await ctx.telegram.getMe();

    return await ctx.telegram.getChatMember(
      ctx.chat.id,
      me.id
    );
  } catch (error) {
    console.error(
      "BOT MEMBER ERROR:",
      error.message
    );

    return null;
  }
}


// =====================================
// بررسی مدیر بودن ربات
// =====================================

async function checkBotAdmin(ctx) {
  const member = await getBotMember(ctx);

  if (!member) {
    return false;
  }

  return (
    member.status === "administrator" ||
    member.status === "creator"
  );
}


// =====================================
// بررسی دسترسی خود ربات
// =====================================

async function checkBotPermission(ctx, permission) {
  const member = await getBotMember(ctx);

  if (!member) {
    return false;
  }

  if (member.status === "creator") {
    return true;
  }

  if (member.status !== "administrator") {
    return false;
  }

  return member[permission] === true;
}


// =====================================
// بررسی دسترسی مدیری که فرمان داده
// =====================================

async function hasManagementPermission(ctx, permission) {
  if (!isGroup(ctx)) {
    return false;
  }

  const senderId = ctx.from && ctx.from.id;

  if (!senderId) {
    return false;
  }

  // مالک همیشه دسترسی کامل دارد
  if (await isOwner(ctx, senderId)) {
    return true;
  }

  // فقط مدیر می‌تواند از دسترسی‌های مدیریتی استفاده کند
  if (!(await isAdmin(ctx, senderId))) {
    return false;
  }

  const permissions = getPermissions(
    ctx.chat.id,
    senderId
  );

  return permissions && permissions[permission] === true;
}


// =====================================
// جلوگیری از مدیریت مالک و مدیر
// =====================================

async function canModerateTarget(ctx, targetId) {
  if (!targetId) {
    return false;
  }

  const targetMember = await getMember(
    ctx,
    targetId
  );

  if (!targetMember) {
    return false;
  }

  // مالک قابل مدیریت نیست
  if (targetMember.status === "creator") {
    return false;
  }

  // مدیر گروه قابل مدیریت نیست
  if (targetMember.status === "administrator") {
    return false;
  }

  return true;
}


// =====================================
// پیام خطای دسترسی
// فقط برای مدیر دارای ریپلای
// =====================================

async function permissionDenied(ctx) {
  if (!hasReply(ctx)) {
    return;
  }

  await replyToTarget(
    ctx,
    "⛔ شما دسترسی انجام این عملیات را ندارید."
  );
}


// =====================================
// بررسی اولیه فرمان مدیریت
// =====================================

async function prepareModeration(ctx, permission) {
  if (!isGroup(ctx)) {
    return false;
  }

  // تمام فرمان‌های این فایل فقط با ریپلای
  if (!hasReply(ctx)) {
    return false;
  }

  // بررسی دسترسی مدیر
  const allowed = await hasManagementPermission(
    ctx,
    permission
  );

  if (!allowed) {
    // کاربر عادی یا مدیر بدون دسترسی کاملاً ساکت
    const senderId = ctx.from && ctx.from.id;

    if (
      senderId &&
      (await isOwner(ctx, senderId) ||
        await isAdmin(ctx, senderId))
    ) {
      await permissionDenied(ctx);
    }

    return false;
  }

  const target = getTarget(ctx);

  if (!target) {
    return false;
  }

  // جلوگیری از مدیریت مدیر/مالک
  const targetAllowed = await canModerateTarget(
    ctx,
    target.id
  );

  if (!targetAllowed) {
    await replyToTarget(
      ctx,
      "⛔ این کاربر قابل مدیریت نیست."
    );

    return false;
  }

  return true;
}


// =====================================
// بررسی توانایی بن کردن ربات
// =====================================

async function canBotBan(ctx) {
  return await checkBotPermission(
    ctx,
    "can_restrict_members"
  );
}


// =====================================
// بررسی توانایی محدود کردن ربات
// =====================================

async function canBotRestrict(ctx) {
  return await checkBotPermission(
    ctx,
    "can_restrict_members"
  );
}


// =====================================
// بررسی توانایی حذف پیام
// =====================================

async function canBotDelete(ctx) {
  return await checkBotPermission(
    ctx,
    "can_delete_messages"
  );
}


// =====================================
// بررسی دسترسی‌های لازم ربات
// =====================================

async function requireBotPermission(
  ctx,
  permission,
  message
) {
  const ok = await checkBotPermission(
    ctx,
    permission
  );

  if (!ok) {
    await replyToTarget(
      ctx,
      message
    );

    return false;
  }

  return true;
}


// =====================================
// ساختار سکوت‌ها
// =====================================

function ensureMutes(group) {
  if (!group.mutes || typeof group.mutes !== "object") {
    group.mutes = {};
  }

  return group.mutes;
}


// =====================================
// پاک کردن سکوت‌های منقضی
// =====================================

function cleanExpiredMutes(group) {
  const mutes = ensureMutes(group);
  const now = Date.now();

  for (const userId of Object.keys(mutes)) {
    const mute = mutes[userId];

    if (
      !mute ||
      !mute.until ||
      mute.until <= now
    ) {
      delete mutes[userId];
    }
  }
}


// =====================================
// ثبت سکوت
// =====================================

function setMute(group, userId, until) {
  const mutes = ensureMutes(group);

  mutes[String(userId)] = {
    until
  };
}


// =====================================
// حذف سکوت
// =====================================

function removeMute(group, userId) {
  const mutes = ensureMutes(group);

  delete mutes[String(userId)];
}


// =====================================
// دریافت وضعیت سکوت
// =====================================

function getMute(group, userId) {
  const mutes = ensureMutes(group);

  const mute = mutes[String(userId)];

  if (!mute) {
    return null;
  }

  if (
    mute.until &&
    mute.until <= Date.now()
  ) {
    delete mutes[String(userId)];
    return null;
  }

  return mute;
}


// =====================================
// تبدیل عدد فارسی به انگلیسی
// =====================================

function normalizeNumbers(text) {
  if (!text) {
    return "";
  }

  return String(text)
    .replace(/۰/g, "0")
    .replace(/۱/g, "1")
    .replace(/۲/g, "2")
    .replace(/۳/g, "3")
    .replace(/۴/g, "4")
    .replace(/۵/g, "5")
    .replace(/۶/g, "6")
    .replace(/۷/g, "7")
    .replace(/۸/g, "8")
    .replace(/۹/g, "9");
}


// =====================================
// تبدیل عدد فارسی/انگلیسی
// =====================================

function parseNumber(value) {
  const normalized = normalizeNumbers(value);

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const number = Number(normalized);

  if (!Number.isSafeInteger(number)) {
    return null;
  }

  return number;
}// =====================================
// PulseGroupManager
// MODERATION.JS
// قسمت ۲ از ۴
// =====================================


// =====================================
// محدودیت‌های سکوت
// =====================================

const MIN_MUTE_HOURS = 1;
const MAX_MUTE_HOURS = 24;


// =====================================
// اجرای بن
// =====================================

async function handleBan(ctx) {

  if (!(await prepareModeration(ctx, "ban"))) {
    return;
  }

  const target = getTarget(ctx);

  if (!target) {
    return;
  }

  const botCanBan = await canBotBan(ctx);

  if (!botCanBan) {
    await replyToTarget(
      ctx,
      "⛔ ربات دسترسی لازم برای بن کردن کاربر را ندارد."
    );
    return;
  }

  try {

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );

    await replyToTarget(
      ctx,
      `🚫 کاربر ${getTargetName(ctx)} بن شد.`
    );

    saveDB();

  } catch (error) {

    console.error(
      "BAN ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "❌ انجام بن کردن کاربر ممکن نشد."
    );
  }
}


// =====================================
// اجرای سیک
// =====================================

async function handleSik(ctx) {

  if (!(await prepareModeration(ctx, "kick"))) {
    return;
  }

  const target = getTarget(ctx);

  if (!target) {
    return;
  }

  const botCanBan = await canBotBan(ctx);

  if (!botCanBan) {
    await replyToTarget(
      ctx,
      "⛔ ربات دسترسی لازم برای سیک کردن کاربر را ندارد."
    );
    return;
  }

  try {

    // سیک:
    // ابتدا کاربر از گروه حذف می‌شود
    // سپس اجازه ورود مجدد دارد.
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
      `👢 کاربر ${getTargetName(ctx)} سیک شد.`
    );

    saveDB();

  } catch (error) {

    console.error(
      "SIK ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "❌ انجام سیک کردن کاربر ممکن نشد."
    );
  }
}


// =====================================
// اجرای اخراج
// =====================================

async function handleKick(ctx) {

  if (!(await prepareModeration(ctx, "kick"))) {
    return;
  }

  const target = getTarget(ctx);

  if (!target) {
    return;
  }

  const botCanKick = await canBotBan(ctx);

  if (!botCanKick) {
    await replyToTarget(
      ctx,
      "⛔ ربات دسترسی لازم برای اخراج کاربر را ندارد."
    );
    return;
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
      `👢 کاربر ${getTargetName(ctx)} اخراج شد.`
    );

    saveDB();

  } catch (error) {

    console.error(
      "KICK ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "❌ انجام اخراج کاربر ممکن نشد."
    );
  }
}


// =====================================
// اجرای سکوت
// =====================================

async function handleMute(ctx, hours) {

  if (!(await prepareModeration(ctx, "mute"))) {
    return;
  }

  const target = getTarget(ctx);

  if (!target) {
    return;
  }

  const botCanMute = await canBotRestrict(ctx);

  if (!botCanMute) {
    await replyToTarget(
      ctx,
      "⛔ ربات دسترسی لازم برای سکوت کردن کاربر را ندارد."
    );
    return;
  }

  let muteHours = hours;

  if (!muteHours) {
    muteHours = 1;
  }

  muteHours = parseNumber(muteHours);

  if (!muteHours) {
    return;
  }

  if (
    muteHours < MIN_MUTE_HOURS ||
    muteHours > MAX_MUTE_HOURS
  ) {
    await replyToTarget(
      ctx,
      `⛔ مدت سکوت باید بین ${MIN_MUTE_HOURS} تا ${MAX_MUTE_HOURS} ساعت باشد.`
    );
    return;
  }

  const durationSeconds =
    muteHours * 60 * 60;

  const untilDate =
    Math.floor(Date.now() / 1000) +
    durationSeconds;

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
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false,
          can_manage_topics: false
        },
        until_date: untilDate
      }
    );

    const group = getGroup(ctx.chat.id);

    setMute(
      group,
      target.id,
      Date.now() + (muteHours * 60 * 60 * 1000)
    );

    saveDB();

    await replyToTarget(
      ctx,
      `🔇 کاربر ${getTargetName(ctx)} ${muteHours} ساعت سکوت شد.`
    );

  } catch (error) {

    console.error(
      "MUTE ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "❌ انجام سکوت کاربر ممکن نشد."
    );
  }
}


// =====================================
// رفع سکوت
// =====================================

async function handleUnmute(ctx) {

  if (!(await prepareModeration(ctx, "mute"))) {
    return;
  }

  const target = getTarget(ctx);

  if (!target) {
    return;
  }

  const botCanMute = await canBotRestrict(ctx);

  if (!botCanMute) {
    await replyToTarget(
      ctx,
      "⛔ ربات دسترسی لازم برای رفع سکوت را ندارد."
    );
    return;
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

    const group = getGroup(ctx.chat.id);

    removeMute(
      group,
      target.id
    );

    saveDB();

    await replyToTarget(
      ctx,
      `🔊 سکوت کاربر ${getTargetName(ctx)} برداشته شد.`
    );

  } catch (error) {

    console.error(
      "UNMUTE ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "❌ رفع سکوت کاربر ممکن نشد."
    );
  }
}


// =====================================
// بررسی وضعیت سکوت کاربر
// =====================================

function isUserMuted(group, userId) {

  cleanExpiredMutes(group);

  return !!getMute(
    group,
    userId
  );
}


// =====================================
// پاکسازی سکوت‌های منقضی
// =====================================

function cleanupMutes() {

  const db = require("./database").getDB();

  if (!db || !db.groups) {
    return;
  }

  let changed = false;

  for (const chatId of Object.keys(db.groups)) {

    const group = db.groups[chatId];

    if (!group) {
      continue;
    }

    const before =
      group.mutes
        ? Object.keys(group.mutes).length
        : 0;

    cleanExpiredMutes(group);

    const after =
      group.mutes
        ? Object.keys(group.mutes).length
        : 0;

    if (before !== after) {
      changed = true;
    }
  }

  if (changed) {
    saveDB();
  }
}


// =====================================
// ساختار اخطار
// =====================================

function ensureWarnings(group) {

  if (
    !group.warns ||
    typeof group.warns !== "object"
  ) {
    group.warns = {};
  }

  if (
    !group.warningSettings ||
    typeof group.warningSettings !== "object"
  ) {
    group.warningSettings = {
      maxWarnings: 3,
      punishment: "mute",
      duration: 60
    };
  }

  if (
    typeof group.warningSettings.maxWarnings !==
    "number"
  ) {
    group.warningSettings.maxWarnings = 3;
  }

  if (
    !group.warningSettings.punishment
  ) {
    group.warningSettings.punishment = "mute";
  }

  if (
    typeof group.warningSettings.duration !==
    "number"
  ) {
    group.warningSettings.duration = 60;
  }
}


// =====================================
// دریافت تعداد اخطار
// =====================================

function getWarningCount(group, userId) {

  ensureWarnings(group);

  return Number(
    group.warns[String(userId)] || 0
  );
}


// =====================================
// ثبت اخطار
// =====================================

function setWarningCount(
  group,
  userId,
  count
) {

  ensureWarnings(group);

  group.warns[String(userId)] =
    Math.max(
      0,
      Number(count) || 0
    );
}


// =====================================
// پاک کردن اخطارهای کاربر
// =====================================

function clearWarningsForUser(
  group,
  userId
) {

  ensureWarnings(group);

  delete group.warns[
    String(userId)
  ];
}


// =====================================
// تنظیم تعداد اخطار
// =====================================

function setMaxWarningsValue(
  group,
  value
) {

  ensureWarnings(group);

  group.warningSettings.maxWarnings =
    value;
}


// =====================================
// تنظیم مجازات اخطار
// =====================================

function setWarningPunishmentValue(
  group,
  punishment
) {

  ensureWarnings(group);

  group.warningSettings.punishment =
    punishment;
}


// =====================================
// تنظیم مدت مجازات اخطار
// duration = دقیقه
// =====================================

function setWarningDurationValue(
  group,
  duration
) {

  ensureWarnings(group);

  group.warningSettings.duration =
    duration;
}// =====================================
// PulseGroupManager
// MODERATION.JS
// قسمت ۳ از ۴
// سیستم اخطار و مجازات خودکار
// =====================================


// =====================================
// اجرای مجازات اخطار
// =====================================

async function applyWarningPunishment(
  ctx,
  target,
  group
) {

  ensureWarnings(group);

  const punishment =
    String(
      group.warningSettings.punishment || "mute"
    ).toLowerCase();

  const duration =
    Number(
      group.warningSettings.duration || 60
    );

  // ===================================
  // مجازات = بن
  // ===================================

  if (
    punishment === "ban" ||
    punishment === "بن"
  ) {

    const botCanBan =
      await canBotBan(ctx);

    if (!botCanBan) {

      await replyToTarget(
        ctx,
        "⛔ ربات دسترسی لازم برای بن کردن کاربر را ندارد."
      );

      return false;
    }

    try {

      await ctx.telegram.banChatMember(
        ctx.chat.id,
        target.id
      );

      clearWarningsForUser(
        group,
        target.id
      );

      saveDB();

      await replyToTarget(
        ctx,
        `🚫 حد اخطار تکمیل شد؛ کاربر ${getTargetName(ctx)} بن شد.`
      );

      return true;

    } catch (error) {

      console.error(
        "WARNING BAN ERROR:",
        error.message
      );

      await replyToTarget(
        ctx,
        "❌ مجازات اخطار انجام نشد."
      );

      return false;
    }
  }


  // ===================================
  // مجازات = سکوت
  // duration بر حسب دقیقه
  // ===================================

  const botCanMute =
    await canBotRestrict(ctx);

  if (!botCanMute) {

    await replyToTarget(
      ctx,
      "⛔ ربات دسترسی لازم برای سکوت کردن کاربر را ندارد."
    );

    return false;
  }

  const safeDuration =
    Math.max(
      1,
      Math.min(
        10080,
        duration
      )
    );

  const untilDate =
    Math.floor(Date.now() / 1000) +
    (safeDuration * 60);

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
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false,
          can_manage_topics: false
        },
        until_date: untilDate
      }
    );

    setMute(
      group,
      target.id,
      Date.now() +
      (safeDuration * 60 * 1000)
    );

    clearWarningsForUser(
      group,
      target.id
    );

    saveDB();

    await replyToTarget(
      ctx,
      `🔇 حد اخطار تکمیل شد؛ کاربر ${getTargetName(ctx)} به مدت ${safeDuration} دقیقه سکوت شد.`
    );

    return true;

  } catch (error) {

    console.error(
      "WARNING MUTE ERROR:",
      error.message
    );

    await replyToTarget(
      ctx,
      "❌ مجازات اخطار انجام نشد."
    );

    return false;
  }
}


// =====================================
// اجرای اخطار
// =====================================

async function handleWarn(ctx, requestedCount) {

  if (!(await prepareModeration(ctx, "warn"))) {
    return;
  }

  const target = getTarget(ctx);

  if (!target) {
    return;
  }

  const group =
    getGroup(ctx.chat.id);

  ensureWarnings(group);

  let count =
    getWarningCount(
      group,
      target.id
    );

  let amount = 1;

  if (
    requestedCount !== undefined &&
    requestedCount !== null &&
    requestedCount !== ""
  ) {

    amount =
      parseNumber(requestedCount);

    if (!amount || amount < 1) {

      await replyToTarget(
        ctx,
        "⛔ تعداد اخطار نامعتبر است."
      );

      return;
    }
  }

  count += amount;

  const maxWarnings =
    Math.max(
      1,
      Number(
        group.warningSettings.maxWarnings || 3
      )
    );

  // ===================================
  // اگر تعداد اخطار به حد مجاز رسید
  // ===================================

  if (count >= maxWarnings) {

    setWarningCount(
      group,
      target.id,
      count
    );

    saveDB();

    await applyWarningPunishment(
      ctx,
      target,
      group
    );

    return;
  }

  // ===================================
  // ثبت اخطار عادی
  // ===================================

  setWarningCount(
    group,
    target.id,
    count
  );

  saveDB();

  await replyToTarget(
    ctx,
    `⚠️ به کاربر ${getTargetName(ctx)} اخطار داده شد.\n\n📌 تعداد اخطار: ${count} از ${maxWarnings}`
  );
}


// =====================================
// دریافت تنظیمات اخطار
// =====================================

function getWarningSettings(ctx) {

  const group =
    getGroup(ctx.chat.id);

  ensureWarnings(group);

  return group.warningSettings;
}


// =====================================
// فرمان «تعداد اخطار»
// مثال:
// تعداد اخطار 3
// =====================================

async function handleSetMaxWarnings(
  ctx,
  value
) {

  if (!(await hasManagementPermission(
    ctx,
    "warn"
  ))) {
    return;
  }

  const number =
    parseNumber(value);

  if (
    !number ||
    number < 1 ||
    number > 100
  ) {

    await ctx.reply(
      "⛔ تعداد اخطار باید بین ۱ تا ۱۰۰ باشد."
    );

    return;
  }

  const group =
    getGroup(ctx.chat.id);

  setMaxWarningsValue(
    group,
    number
  );

  saveDB();

  await ctx.reply(
    `✅ حد اخطار روی ${number} تنظیم شد.`
  );
}


// =====================================
// فرمان «تنظیم اخطار»
// =====================================

async function handleSetWarningPunishment(
  ctx,
  value
) {

  if (!(await hasManagementPermission(
    ctx,
    "warn"
  ))) {
    return;
  }

  if (!value) {
    return;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  let punishment = null;

  if (
    normalized === "بن" ||
    normalized === "ban"
  ) {
    punishment = "ban";
  }

  if (
    normalized === "سکوت" ||
    normalized === "mute" ||
    normalized === "محدود"
  ) {
    punishment = "mute";
  }

  if (!punishment) {

    await ctx.reply(
      "⛔ مجازات نامعتبر است.\n\nگزینه‌ها: بن یا سکوت"
    );

    return;
  }

  const group =
    getGroup(ctx.chat.id);

  setWarningPunishmentValue(
    group,
    punishment
  );

  saveDB();

  const text =
    punishment === "ban"
      ? "بن"
      : "سکوت";

  await ctx.reply(
    `✅ مجازات اخطار روی «${text}» تنظیم شد.`
  );
}


// =====================================
// فرمان تنظیم مدت مجازات اخطار
// این مقدار بر حسب دقیقه است
// =====================================

async function handleSetWarningDuration(
  ctx,
  value
) {

  if (!(await hasManagementPermission(
    ctx,
    "warn"
  ))) {
    return;
  }

  const duration =
    parseNumber(value);

  if (
    !duration ||
    duration < 1 ||
    duration > 10080
  ) {

    await ctx.reply(
      "⛔ مدت مجازات باید بین ۱ تا ۱۰۰۸۰ دقیقه باشد."
    );

    return;
  }

  const group =
    getGroup(ctx.chat.id);

  setWarningDurationValue(
    group,
    duration
  );

  saveDB();

  await ctx.reply(
    `✅ مدت مجازات اخطار روی ${duration} دقیقه تنظیم شد.`
  );
}


// =====================================
// نمایش تنظیمات اخطار
// =====================================

async function handleWarningSettings(ctx) {

  if (!(await hasManagementPermission(
    ctx,
    "warn"
  ))) {
    return;
  }

  const settings =
    getWarningSettings(ctx);

  const punishmentText =
    settings.punishment === "ban"
      ? "بن"
      : "سکوت";

  await ctx.reply(
    [
      "⚙️ تنظیمات اخطار",
      "",
      `⚠️ حد اخطار: ${settings.maxWarnings}`,
      `🔨 مجازات: ${punishmentText}`,
      `⏱ مدت سکوت: ${settings.duration} دقیقه`
    ].join("\n")
  );
}


// =====================================
// پاک کردن اخطارهای یک کاربر
// فقط با ریپلای
// =====================================

async function handleClearWarnings(ctx) {

  if (!(await prepareModeration(ctx, "warn"))) {
    return;
  }

  const target =
    getTarget(ctx);

  if (!target) {
    return;
  }

  const group =
    getGroup(ctx.chat.id);

  clearWarningsForUser(
    group,
    target.id
  );

  saveDB();

  await replyToTarget(
    ctx,
    `✅ تمام اخطارهای ${getTargetName(ctx)} پاک شد.`
  );
}


// =====================================
// نمایش تعداد اخطار کاربر
// فقط با ریپلای
// =====================================

async function handleWarningCount(ctx) {

  if (!(await prepareModeration(ctx, "warn"))) {
    return;
  }

  const target =
    getTarget(ctx);

  if (!target) {
    return;
  }

  const group =
    getGroup(ctx.chat.id);

  const count =
    getWarningCount(
      group,
      target.id
    );

  ensureWarnings(group);

  const maxWarnings =
    group.warningSettings.maxWarnings;

  await replyToTarget(
    ctx,
    `⚠️ تعداد اخطارهای ${getTargetName(ctx)}: ${count} از ${maxWarnings}`
  );
}


// =====================================
// ذخیره نهایی تغییرات اخطار
// =====================================

function saveModerationChanges() {
  saveDB();
    }// =====================================
// PulseGroupManager
// MODERATION.JS
// قسمت ۴ از ۴
// فرمان‌ها + ثبت ربات + Export
// =====================================


// =====================================
// پردازش فرمان‌های مدیریت
// =====================================

async function handleModeration(ctx) {

  if (!isGroup(ctx)) {
    return;
  }

  if (!ctx.message || !ctx.message.text) {
    return;
  }

  const text =
    String(ctx.message.text).trim();

  if (!text) {
    return;
  }


  // ===================================
  // بن
  // فقط با ریپلای
  // ===================================

  if (/^بن$/iu.test(text)) {
    await handleBan(ctx);
    return;
  }


  // ===================================
  // سیک
  // فقط با ریپلای
  // ===================================

  if (/^سیک$/iu.test(text)) {
    await handleSik(ctx);
    return;
  }


  // ===================================
  // اخراج
  // فقط با ریپلای
  // ===================================

  if (/^اخراج$/iu.test(text)) {
    await handleKick(ctx);
    return;
  }


  // ===================================
  // سکوت
  // سکوت
  // سکوت 1
  // سکوت ۲
  // ===================================

  let match =
    text.match(/^سکوت(?:\s+(.+))?$/iu);

  if (match) {

    const value =
      match[1]
        ? match[1].trim()
        : null;

    // بدون عدد = یک ساعت
    await handleMute(
      ctx,
      value || 1
    );

    return;
  }


  // ===================================
  // رفع سکوت
  // ===================================

  if (
    /^رفع\s+سکوت$/iu.test(text) ||
    /^رفع‌سکوت$/iu.test(text)
  ) {
    await handleUnmute(ctx);
    return;
  }


  // ===================================
  // اخطار
  // اخطار
  // اخطار 3
  // اخطار ۳
  // ===================================

  match =
    text.match(/^اخطار(?:\s+(.+))?$/iu);

  if (match) {

    const value =
      match[1]
        ? match[1].trim()
        : null;

    await handleWarn(
      ctx,
      value
    );

    return;
  }


  // ===================================
  // پاک کردن اخطار
  // فقط با ریپلای
  // ===================================

  if (
    /^پاک\s+کردن\s+اخطار$/iu.test(text) ||
    /^پاک\s+اخطار$/iu.test(text) ||
    /^حذف\s+اخطار$/iu.test(text)
  ) {
    await handleClearWarnings(ctx);
    return;
  }


  // ===================================
  // تعداد اخطار کاربر
  // فقط با ریپلای
  // ===================================

  if (
    /^تعداد\s+اخطار$/iu.test(text)
  ) {
    await handleWarningCount(ctx);
    return;
  }


  // ===================================
  // تعداد اخطار 3
  // تعداد اخطار ۳
  // ===================================

  match =
    text.match(
      /^تعداد\s+اخطار\s+(.+)$/iu
    );

  if (match) {

    await handleSetMaxWarnings(
      ctx,
      match[1].trim()
    );

    return;
  }


  // ===================================
  // تنظیم اخطار بن
  // تنظیم اخطار سکوت
  // ===================================

  match =
    text.match(
      /^تنظیم\s+اخطار\s+(.+)$/iu
    );

  if (match) {

    const value =
      match[1].trim();

    // اگر کاربر «بن» یا «سکوت» زده باشد
    if (
      /^بن$/iu.test(value) ||
      /^ban$/iu.test(value) ||
      /^سکوت$/iu.test(value) ||
      /^mute$/iu.test(value)
    ) {

      await handleSetWarningPunishment(
        ctx,
        value
      );

      return;
    }

    // اگر عدد داده شده باشد:
    // تنظیم اخطار 60
    const duration =
      parseNumber(value);

    if (duration) {

      await handleSetWarningDuration(
        ctx,
        value
      );

      return;
    }

    await handleSetWarningPunishment(
      ctx,
      value
    );

    return;
  }


  // ===================================
  // مدت اخطار
  // مدت اخطار 60
  // ===================================

  match =
    text.match(
      /^مدت\s+اخطار\s+(.+)$/iu
    );

  if (match) {

    await handleSetWarningDuration(
      ctx,
      match[1].trim()
    );

    return;
  }


  // ===================================
  // تنظیمات اخطار
  // ===================================

  if (
    /^تنظیمات\s+اخطار$/iu.test(text) ||
    /^تنظیم\s+اخطار$/iu.test(text)
  ) {

    // «تنظیم اخطار» بدون مقدار،
    // فقط در صورتی نمایش تنظیمات می‌دهد
    // که ریپلای وجود داشته باشد یا مدیر مالک باشد.
    //
    // برای جلوگیری از پیام ناخواسته،
    // فقط مدیر دارای دسترسی پاسخ می‌گیرد.

    if (
      await hasManagementPermission(
        ctx,
        "warn"
      )
    ) {
      await handleWarningSettings(ctx);
    }

    return;
  }
}


// =====================================
// ثبت Listener اصلی مدیریت
// =====================================

function registerModeration(bot) {

  if (!bot) {
    throw new Error(
      "MODERATION: bot is required"
    );
  }

  // ===================================
  // تمام فرمان‌های moderation
  // از طریق hears
  // ===================================

  bot.on(
    "text",
    async (ctx, next) => {

      try {

        await handleModeration(ctx);

      } catch (error) {

        console.error(
          "MODERATION HANDLER ERROR:",
          error
        );
      }

      // اجازه بده سایر بخش‌های ربات
      // مثل links / locks / panel
      // نیز پیام را بررسی کنند.
      if (typeof next === "function") {
        return next();
      }
    }
  );


  // ===================================
  // پاکسازی دوره‌ای سکوت‌ها
  // ===================================

  const cleanupInterval =
    setInterval(
      () => {

        try {
          cleanupMutes();
        } catch (error) {
          console.error(
            "MODERATION CLEANUP ERROR:",
            error.message
          );
        }

      },
      60 * 1000
    );


  // ===================================
  // جلوگیری از نگه داشتن تایمر در
  // بعضی محیط‌های Hosting
  // ===================================

  if (
    cleanupInterval &&
    typeof cleanupInterval.unref === "function"
  ) {
    cleanupInterval.unref();
  }

  return {
    cleanup: cleanupMutes
  };
}


// =====================================
// Export
// =====================================

module.exports = {
  registerModeration,

  handleModeration,

  handleBan,
  handleSik,
  handleKick,

  handleMute,
  handleUnmute,

  handleWarn,

  handleClearWarnings,
  handleWarningCount,

  handleSetMaxWarnings,
  handleSetWarningPunishment,
  handleSetWarningDuration,

  handleWarningSettings,

  getWarningCount,
  isUserMuted,

  cleanupMutes,

  saveModerationChanges
};


// =====================================
// پایان moderation.js
// =====================================
