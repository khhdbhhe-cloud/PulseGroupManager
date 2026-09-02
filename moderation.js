// =====================================
// PulseGroupManager
// MODERATION
// بن | سیک | اخراج | سکوت | خفه | اخطار
// لیست‌ها | پاکسازی | دسترسی | Reply
// =====================================

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// حافظه کاربران دیده‌شده
// =====================================

const knownUsers = {};
const openLists = {};
const LIST_PAGE_SIZE = 10;


// =====================================
// تشخیص گروه
// =====================================

function isGroupChat(ctx) {
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
// دریافت اطلاعات گروه
// =====================================

function getGroupData(ctx) {
  if (!ctx || !ctx.chat) return null;

  try {
    return getGroup(ctx.chat.id);
  } catch {
    return null;
  }
}


// =====================================
// ساخت حافظه مدیریت
// =====================================

function ensureModerationStorage(group) {
  if (!group.moderation) {
    group.moderation = {};
  }

  if (!Array.isArray(group.moderation.bans)) {
    group.moderation.bans = [];
  }

  if (!Array.isArray(group.moderation.mutes)) {
    group.moderation.mutes = [];
  }

  if (!Array.isArray(group.moderation.khafe)) {
    group.moderation.khafe = [];
  }

  if (!Array.isArray(group.moderation.warnings)) {
    group.moderation.warnings = [];
  }

  if (!Array.isArray(group.moderation.permissions)) {
    group.moderation.permissions = [];
  }

  if (!Array.isArray(group.moderation.kicks)) {
    group.moderation.kicks = [];
  }

  if (!group.moderation.warningSettings) {
    group.moderation.warningSettings = {
      maxWarnings: 3,
      punishment: "none"
    };
  }

  return group;
}


// =====================================
// ذخیره مدیریت
// =====================================

function saveModeration(group) {
  ensureModerationStorage(group);

  try {
    saveDB();
  } catch {
    try {
      saveDB(group);
    } catch {}
  }
}


// =====================================
// ذخیره کاربر در حافظه کلی
// =====================================

function rememberUser(user) {
  if (!user || !user.id) return null;

  const id = String(user.id);

  knownUsers[id] = {
    id: user.id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    language_code: user.language_code || ""
  };

  return knownUsers[id];
}


// =====================================
// ذخیره کاربر داخل گروه
// =====================================

function rememberUserInGroup(group, user) {
  if (!group || !user || !user.id) return null;

  if (!group.users) {
    group.users = {};
  }

  const id = String(user.id);

  group.users[id] = {
    id: user.id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    language_code: user.language_code || ""
  };

  rememberUser(user);

  return group.users[id];
}


// =====================================
// یادگیری کاربر از پیام
// =====================================

function learnUserFromMessage(ctx) {
  if (!ctx || !ctx.from) return null;

  const group = getGroupData(ctx);

  rememberUser(ctx.from);

  if (group) {
    rememberUserInGroup(group, ctx.from);
  }

  return ctx.from;
}


// =====================================
// بارگذاری کاربران شناخته‌شده گروه
// =====================================

function loadGroupKnownUsers(group) {
  if (!group) return;

  if (!group.users || typeof group.users !== "object") {
    group.users = {};
  }

  for (const id of Object.keys(group.users)) {
    const user = group.users[id];

    if (user && user.id) {
      rememberUser(user);
    }
  }
}


// =====================================
// نام کاربر
// =====================================

function getUserName(user) {
  if (!user) return "کاربر";

  const first = String(user.first_name || "").trim();
  const last = String(user.last_name || "").trim();

  const name = `${first} ${last}`.trim();

  return name || "کاربر";
}


// =====================================
// نمایش کاربر
// =====================================

function mentionUser(user) {
  if (!user || !user.id) {
    return "کاربر";
  }

  const name = getUserName(user);

  return `<a href="tg://user?id=${user.id}">${name}</a>`;
}


// =====================================
// نام مناسب برای پیام لیست
// یوزرنیم → @username
// بدون یوزرنیم → اسم اصلی، بدون لینک
// =====================================

function getListUserLabel(user) {
  if (!user) return "کاربر";

  if (user.username) {
    return `@${String(user.username).replace(/^@/, "")}`;
  }

  return getUserName(user);
}


// =====================================
// پیام مورد Reply
// =====================================

function getTargetMessage(ctx) {
  if (!ctx || !ctx.message) return null;

  return ctx.message.reply_to_message || null;
}


// =====================================
// کاربر مورد Reply
// =====================================

function getReplyTarget(ctx) {
  const message = getTargetMessage(ctx);

  if (!message || !message.from) {
    return null;
  }

  const user = message.from;

  rememberUser(user);

  const group = getGroupData(ctx);

  if (group) {
    rememberUserInGroup(group, user);
  }

  return user;
}


// =====================================
// شناسه Reply
// =====================================

function getTargetReplyId(ctx) {
  const target = getReplyTarget(ctx);

  return target && target.id
    ? target.id
    : null;
}


// =====================================
// نرمال‌سازی نام
// =====================================

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


// =====================================
// پیدا کردن کاربر با ID
// =====================================

function findKnownUserById(id) {
  if (!id) return null;

  return knownUsers[String(id)] || null;
}


// =====================================
// پیدا کردن کاربر با Username
// =====================================

function findKnownUserByUsername(username) {
  if (!username) return null;

  const wanted = String(username)
    .replace(/^@/, "")
    .toLowerCase();

  for (const id of Object.keys(knownUsers)) {
    const user = knownUsers[id];

    if (
      user &&
      user.username &&
      String(user.username).toLowerCase() === wanted
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن کاربر با نام
// =====================================

function findKnownUserByName(name) {
  const wanted = normalizeName(name);

  if (!wanted) return null;

  for (const id of Object.keys(knownUsers)) {
    const user = knownUsers[id];

    if (!user) continue;

    const fullName = normalizeName(
      `${user.first_name || ""} ${user.last_name || ""}`
    );

    if (fullName === wanted) {
      return user;
    }

    if (
      normalizeName(user.first_name) === wanted ||
      normalizeName(user.last_name) === wanted
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن کاربر گروه با ID
// =====================================

function findGroupUserById(group, id) {
  if (!group || !group.users || !id) {
    return null;
  }

  return group.users[String(id)] || null;
}


// =====================================
// پیدا کردن کاربر گروه با Username
// =====================================

function findGroupUserByUsername(group, username) {
  if (!group || !group.users || !username) {
    return null;
  }

  const wanted = String(username)
    .replace(/^@/, "")
    .toLowerCase();

  for (const id of Object.keys(group.users)) {
    const user = group.users[id];

    if (
      user &&
      user.username &&
      String(user.username).toLowerCase() === wanted
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن کاربر گروه با نام
// =====================================

function findGroupUserByName(group, name) {
  if (!group || !group.users || !name) {
    return null;
  }

  const wanted = normalizeName(name);

  if (!wanted) return null;

  for (const id of Object.keys(group.users)) {
    const user = group.users[id];

    if (!user) continue;

    const fullName = normalizeName(
      `${user.first_name || ""} ${user.last_name || ""}`
    );

    if (fullName === wanted) {
      return user;
    }

    if (
      normalizeName(user.first_name) === wanted ||
      normalizeName(user.last_name) === wanted
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// پیدا کردن کاربر از Text Mention
// =====================================

function getTextMentionUser(message) {
  if (!message || !Array.isArray(message.entities)) {
    return null;
  }

  const text = message.text || message.caption || "";

  for (const entity of message.entities) {
    if (
      entity &&
      entity.type === "text_mention" &&
      entity.user
    ) {
      return entity.user;
    }
  }

  return null;
}


// =====================================
// گرفتن Username از متن
// =====================================

function getUsernameFromText(text) {
  if (!text) return null;

  const match = String(text).match(/@([a-zA-Z0-9_]{5,32})/);

  return match ? match[1] : null;
}


// =====================================
// گرفتن ID از متن
// =====================================

function getIdFromText(text) {
  if (!text) return null;

  const match = String(text).match(/\b\d{5,20}\b/);

  return match ? match[0] : null;
}


// =====================================
// متن پیام
// =====================================

function getMessageText(message) {
  if (!message) return "";

  return String(
    message.text ||
    message.caption ||
    ""
  ).trim();
}


// =====================================
// بررسی وجود هدف در Reply
// =====================================

function hasTargetReferenceInReply(ctx) {
  const message = getTargetMessage(ctx);

  if (!message) return false;

  if (message.from && message.from.id) {
    return true;
  }

  if (getTextMentionUser(message)) {
    return true;
  }

  const text = getMessageText(message);

  if (getUsernameFromText(text)) {
    return true;
  }

  if (getIdFromText(text)) {
    return true;
  }

  return false;
}// =====================================
// پیدا کردن هدف از محتوای Reply
// =====================================

function resolveTargetFromReplyContent(ctx) {
  const message = getTargetMessage(ctx);

  if (!message) return null;

  if (message.from && message.from.id) {
    return getReplyTarget(ctx);
  }

  const mentionedUser = getTextMentionUser(message);

  if (mentionedUser && mentionedUser.id) {
    rememberUser(mentionedUser);

    const group = getGroupData(ctx);

    if (group) {
      rememberUserInGroup(group, mentionedUser);
    }

    return mentionedUser;
  }

  const text = getMessageText(message);

  const username = getUsernameFromText(text);

  if (username) {
    const group = getGroupData(ctx);

    const groupUser = findGroupUserByUsername(group, username);

    if (groupUser) {
      return groupUser;
    }

    const knownUser = findKnownUserByUsername(username);

    if (knownUser) {
      return knownUser;
    }
  }

  const id = getIdFromText(text);

  if (id) {
    const group = getGroupData(ctx);

    const groupUser = findGroupUserById(group, id);

    if (groupUser) {
      return groupUser;
    }

    const knownUser = findKnownUserById(id);

    if (knownUser) {
      return knownUser;
    }
  }

  return null;
}


// =====================================
// پیدا کردن هدف
// =====================================

function resolveTarget(ctx, args = []) {
  if (!ctx) return null;

  learnUserFromMessage(ctx);

  const group = getGroupData(ctx);

  if (group) {
    loadGroupKnownUsers(group);
  }

  const cleanArgs = Array.isArray(args)
    ? args
        .map(item => String(item || "").trim())
        .filter(Boolean)
    : [];

  if (cleanArgs.length) {
    const text = cleanArgs.join(" ").trim();

    const id = getIdFromText(text);

    if (id) {
      const groupUser = findGroupUserById(group, id);

      if (groupUser) {
        return groupUser;
      }

      const knownUser = findKnownUserById(id);

      if (knownUser) {
        return knownUser;
      }
    }

    const username = getUsernameFromText(text);

    if (username) {
      const groupUser = findGroupUserByUsername(group, username);

      if (groupUser) {
        return groupUser;
      }

      const knownUser = findKnownUserByUsername(username);

      if (knownUser) {
        return knownUser;
      }
    }

    const groupUser = findGroupUserByName(group, text);

    if (groupUser) {
      return groupUser;
    }

    const knownUser = findKnownUserByName(text);

    if (knownUser) {
      return knownUser;
    }
  }

  const replyTarget = resolveTargetFromReplyContent(ctx);

  if (replyTarget && replyTarget.id) {
    return replyTarget;
  }

  return getReplyTarget(ctx);
}


// =====================================
// نقش کاربر در گروه
// =====================================

async function getMemberRole(ctx, userId) {
  if (!ctx || !ctx.telegram || !ctx.chat || !userId) {
    return "member";
  }

  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      userId
    );

    if (!member) {
      return "member";
    }

    if (member.status === "creator") {
      return "owner";
    }

    if (member.status === "administrator") {
      return "admin";
    }

    return "member";
  } catch {
    return "member";
  }
}


// =====================================
// بررسی مالک
// =====================================

async function isOwner(ctx, userId) {
  const role = await getMemberRole(ctx, userId);

  return role === "owner";
}


// =====================================
// بررسی ادمین
// =====================================

async function isAdmin(ctx, userId) {
  const role = await getMemberRole(ctx, userId);

  return (
    role === "owner" ||
    role === "admin"
  );
}


// =====================================
// بررسی اجراکننده فرمان
// =====================================

async function checkExecutor(ctx) {
  if (!isGroupChat(ctx)) {
    return false;
  }

  learnUserFromMessage(ctx);

  if (!ctx.from || !ctx.from.id) {
    return false;
  }

  const allowed = await isAdmin(
    ctx,
    ctx.from.id
  );

  if (!allowed) {
    return false;
  }

  return true;
}


// =====================================
// بررسی هدف
// =====================================

async function checkTarget(ctx, target) {
  if (target && target.id) {
    const group = getGroupData(ctx);

    if (group) {
      rememberUserInGroup(group, target);
      saveModeration(group);
    }

    return true;
  }

  await replyToCommand(
    ctx,
    "『𓆩 ★ خطا ★ 𓆪』\n\n" +
    "روی پیام کاربر Reply کن یا کاربر شناخته‌شده را " +
    "با شناسه، نام یا @username مشخص کن."
  );

  return false;
}


// =====================================
// بررسی دسترسی ربات
// =====================================

async function checkBotPermissions(ctx) {
  if (
    !ctx ||
    !ctx.telegram ||
    !ctx.chat
  ) {
    return false;
  }

  try {
    const me = await ctx.telegram.getMe();

    if (!me || !me.id) {
      return false;
    }

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        me.id
      );

    if (!member) {
      return false;
    }

    if (member.status === "creator") {
      return true;
    }

    if (member.status !== "administrator") {
      return false;
    }

    return member.can_restrict_members === true;
  } catch {
    return false;
  }
}


// =====================================
// پیدا کردن رکورد
// =====================================

function findRecord(list, userId) {
  if (!Array.isArray(list)) {
    return null;
  }

  const id = String(userId);

  return (
    list.find(
      item =>
        item &&
        String(item.userId) === id
    ) || null
  );
}


// =====================================
// پردازش مدت سکوت
// =====================================

function parseMuteDuration(args = []) {
  if (
    !Array.isArray(args) ||
    !args.length
  ) {
    return null;
  }

  const text = args
    .join(" ")
    .trim()
    .toLowerCase();

  const hourMatch = text.match(
    /^(\d{1,2})$/
  );

  if (hourMatch) {
    const hours = Number(
      hourMatch[1]
    );

    if (
      Number.isInteger(hours) &&
      hours >= 1 &&
      hours <= 10
    ) {
      return {
        type: "hours",
        value: hours,
        minutes: hours * 60
      };
    }

    return null;
  }

  const minuteMatch = text.match(
    /^(\d{1,2})\s*(دقیقه|دقیقه‌ای|دقیقه ای|min|minute|minutes)$/
  );

  if (minuteMatch) {
    const minutes = Number(
      minuteMatch[1]
    );

    if (
      Number.isInteger(minutes) &&
      minutes >= 10 &&
      minutes <= 45
    ) {
      return {
        type: "minutes",
        value: minutes,
        minutes
      };
    }
  }

  return null;
}


// =====================================
// متن مدت
// =====================================

function durationText(duration) {
  if (!duration) {
    return "نامشخص";
  }

  if (duration.type === "hours") {
    return `${duration.value} ساعت`;
  }

  return `${duration.value} دقیقه`;
}


// =====================================
// زمان پایان
// =====================================

function getEndTime(minutes) {
  return (
    Date.now() +
    Number(minutes) * 60 * 1000
  );
}


// =====================================
// مدت باقی‌مانده
// =====================================

function remainingDuration(until) {
  if (!until) {
    return "نامحدود";
  }

  const diff =
    Number(until) - Date.now();

  if (diff <= 0) {
    return "پایان‌یافته";
  }

  const minutes = Math.ceil(
    diff / 60000
  );

  if (minutes < 60) {
    return `${minutes} دقیقه`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  const rest = minutes % 60;

  if (rest === 0) {
    return `${hours} ساعت`;
  }

  return `${hours} ساعت و ${rest} دقیقه`;
}


// =====================================
// پاکسازی سکوت‌های منقضی
// =====================================

function cleanExpiredMutes(group) {
  if (
    !group ||
    !group.moderation
  ) {
    return 0;
  }

  let removed = 0;

  const list =
    Array.isArray(
      group.moderation.mutes
    )
      ? group.moderation.mutes
      : [];

  group.moderation.mutes =
    list.filter(record => {
      if (!record) {
        removed++;
        return false;
      }

      if (
        record.until &&
        Number(record.until) <= Date.now()
      ) {
        removed++;
        return false;
      }

      return true;
    });

  return removed;
}


// =====================================
// پاکسازی خفه‌های منقضی
// =====================================

function cleanExpiredKhafe(group) {
  if (
    !group ||
    !group.moderation
  ) {
    return 0;
  }

  let removed = 0;

  const list =
    Array.isArray(
      group.moderation.khafe
    )
      ? group.moderation.khafe
      : [];

  group.moderation.khafe =
    list.filter(record => {
      if (!record) {
        removed++;
        return false;
      }

      if (
        record.until &&
        Number(record.until) <= Date.now()
      ) {
        removed++;
        return false;
      }

      return true;
    });

  return removed;
}


// =====================================
// ذخیره رکورد بن
// =====================================

function saveBanRecord(
  group,
  target,
  executor,
  reason = ""
) {
  ensureModerationStorage(group);

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) {
    return null;
  }

  const id = String(user.id);

  let record =
    findRecord(
      group.moderation.bans,
      id
    );

  if (record) {
    record.first_name =
      user.first_name || "";

    record.last_name =
      user.last_name || "";

    record.username =
      user.username || "";

    record.reason =
      reason || record.reason || "";

    record.executorId =
      executor && executor.id
        ? executor.id
        : record.executorId;

    record.updatedAt =
      Date.now();

    return record;
  }

  record = {
    userId: user.id,
    first_name:
      user.first_name || "",
    last_name:
      user.last_name || "",
    username:
      user.username || "",
    reason: reason || "",
    executorId:
      executor && executor.id
        ? executor.id
        : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  group.moderation.bans.push(
    record
  );

  return record;
}


// =====================================
// ذخیره رکورد سکوت
// =====================================

function saveMuteRecord(
  group,
  target,
  executor,
  duration,
  reason = ""
) {
  ensureModerationStorage(group);

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) {
    return null;
  }

  const id = String(user.id);

  const until =
    getEndTime(
      duration.minutes
    );

  let record =
    findRecord(
      group.moderation.mutes,
      id
    );

  if (record) {
    record.first_name =
      user.first_name || "";

    record.last_name =
      user.last_name || "";

    record.username =
      user.username || "";

    record.durationType =
      duration.type;

    record.durationValue =
      duration.value;

    record.minutes =
      duration.minutes;

    record.until =
      until;

    record.reason =
      reason || record.reason || "";

    record.executorId =
      executor && executor.id
        ? executor.id
        : record.executorId;

    record.updatedAt =
      Date.now();

    return record;
  }

  record = {
    userId: user.id,
    first_name:
      user.first_name || "",
    last_name:
      user.last_name || "",
    username:
      user.username || "",
    durationType:
      duration.type,
    durationValue:
      duration.value,
    minutes:
      duration.minutes,
    until,
    reason: reason || "",
    executorId:
      executor && executor.id
        ? executor.id
        : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  group.moderation.mutes.push(
    record
  );

  return record;
}// =====================================
// ذخیره رکورد خفه
// =====================================

function saveKhafeRecord(
  group,
  target,
  executor,
  duration,
  reason = ""
) {
  ensureModerationStorage(group);

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) {
    return null;
  }

  const id = String(user.id);

  const until =
    getEndTime(
      duration.minutes
    );

  let record =
    findRecord(
      group.moderation.khafe,
      id
    );

  if (record) {
    record.first_name =
      user.first_name || "";

    record.last_name =
      user.last_name || "";

    record.username =
      user.username || "";

    record.durationType =
      duration.type;

    record.durationValue =
      duration.value;

    record.minutes =
      duration.minutes;

    record.until =
      until;

    record.reason =
      reason || record.reason || "";

    record.executorId =
      executor && executor.id
        ? executor.id
        : record.executorId;

    record.updatedAt =
      Date.now();

    return record;
  }

  record = {
    userId: user.id,
    first_name:
      user.first_name || "",
    last_name:
      user.last_name || "",
    username:
      user.username || "",
    durationType:
      duration.type,
    durationValue:
      duration.value,
    minutes:
      duration.minutes,
    until,
    reason: reason || "",
    executorId:
      executor && executor.id
        ? executor.id
        : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  group.moderation.khafe.push(
    record
  );

  return record;
}


// =====================================
// پیدا کردن رکورد اخطار
// =====================================

function findWarningRecord(
  group,
  userId
) {
  if (
    !group ||
    !group.moderation ||
    !Array.isArray(
      group.moderation.warnings
    )
  ) {
    return null;
  }

  return findRecord(
    group.moderation.warnings,
    userId
  );
}


// =====================================
// ذخیره اخطار
// =====================================

function saveWarningRecord(
  group,
  target,
  executor,
  reason = ""
) {
  ensureModerationStorage(group);

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) {
    return null;
  }

  const id = String(user.id);

  let record =
    findWarningRecord(
      group,
      id
    );

  if (record) {
    record.first_name =
      user.first_name || "";

    record.last_name =
      user.last_name || "";

    record.username =
      user.username || "";

    record.count =
      Number(record.count || 0) + 1;

    record.reason =
      reason || "";

    record.executorId =
      executor && executor.id
        ? executor.id
        : record.executorId;

    record.updatedAt =
      Date.now();

    return record;
  }

  record = {
    userId: user.id,
    first_name:
      user.first_name || "",
    last_name:
      user.last_name || "",
    username:
      user.username || "",
    count: 1,
    reason: reason || "",
    executorId:
      executor && executor.id
        ? executor.id
        : null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  group.moderation.warnings.push(
    record
  );

  return record;
}


// =====================================
// حذف اخطار
// =====================================

function removeWarningRecord(
  group,
  userId
) {
  if (
    !group ||
    !group.moderation ||
    !Array.isArray(
      group.moderation.warnings
    )
  ) {
    return false;
  }

  const before =
    group.moderation.warnings.length;

  group.moderation.warnings =
    group.moderation.warnings.filter(
      record =>
        !record ||
        String(record.userId) !==
          String(userId)
    );

  return (
    group.moderation.warnings.length !==
    before
  );
}


// =====================================
// ارسال پیام فرمان
// =====================================

async function replyToCommand(
  ctx,
  text
) {
  if (
    !ctx ||
    !ctx.reply
  ) {
    return null;
  }

  try {
    return await ctx.reply(
      text,
      {
        parse_mode: "HTML"
      }
    );
  } catch {
    try {
      return await ctx.reply(text);
    } catch {
      return null;
    }
  }
}


// =====================================
// ارسال پاسخ به پیام هدف
// =====================================

async function replyToTarget(
  ctx,
  text
) {
  if (
    !ctx ||
    !ctx.reply
  ) {
    return null;
  }

  const target =
    getTargetMessage(ctx);

  try {
    if (target && target.message_id) {
      return await ctx.reply(
        text,
        {
          parse_mode: "HTML",
          reply_to_message_id:
            target.message_id
        }
      );
    }

    return await ctx.reply(
      text,
      {
        parse_mode: "HTML"
      }
    );
  } catch {
    try {
      if (
        target &&
        target.message_id
      ) {
        return await ctx.reply(
          text,
          {
            reply_to_message_id:
              target.message_id
          }
        );
      }

      return await ctx.reply(text);
    } catch {
      return null;
    }
  }
}


// =====================================
// بن کردن کاربر
// =====================================

async function banUser(
  ctx,
  target,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی مدیریت اعضا را ندارد."
    );

    return false;
  }

  try {
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "بن کردن کاربر انجام نشد."
    );

    return false;
  }

  saveBanRecord(
    group,
    target,
    ctx.from,
    reason
  );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ بن شد ★ 𓆪』\n\n` +
    `کاربر ${userLabel} به لیست بن اضافه شد.`
  );

  return true;
}


// =====================================
// حذف بن
// =====================================

async function unbanUser(
  ctx,
  target
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی مدیریت اعضا را ندارد."
    );

    return false;
  }

  try {
    await ctx.telegram.unbanChatMember(
      ctx.chat.id,
      target.id,
      {
        only_if_banned: false
      }
    );
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "حذف بن کاربر انجام نشد."
    );

    return false;
  }

  group.moderation.bans =
    group.moderation.bans.filter(
      record =>
        !record ||
        String(record.userId) !==
          String(target.id)
    );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف بن ★ 𓆪』\n\n` +
    `کاربر ${userLabel} از لیست بن حذف شد.`
  );

  return true;
}


// =====================================
// اخراج کاربر
// =====================================

async function kickUser(
  ctx,
  target,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی مدیریت اعضا را ندارد."
    );

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
        only_if_banned: false
      }
    );
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "اخراج کاربر انجام نشد."
    );

    return false;
  }

  ensureModerationStorage(group);

  group.moderation.kicks.push({
    userId: target.id,
    first_name:
      target.first_name || "",
    last_name:
      target.last_name || "",
    username:
      target.username || "",
    reason: reason || "",
    executorId:
      ctx.from && ctx.from.id
        ? ctx.from.id
        : null,
    createdAt: Date.now()
  });

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ اخراج شد ★ 𓆪』\n\n` +
    `کاربر ${userLabel} از گروه اخراج شد.`
  );

  return true;
}


// =====================================
// سکوت واقعی کاربر
// =====================================

async function muteUser(
  ctx,
  target,
  duration,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id ||
    !duration
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی محدود کردن اعضا را ندارد."
    );

    return false;
  }

  const untilDate =
    Math.floor(
      getEndTime(
        duration.minutes
      ) / 1000
    );

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
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "سکوت کاربر انجام نشد."
    );

    return false;
  }

  saveMuteRecord(
    group,
    target,
    ctx.from,
    duration,
    reason
  );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ سکوت اضافه شد ★ 𓆪』\n\n` +
    `کاربر ${userLabel} به لیست سکوت ${durationText(duration)} اضافه شد.`
  );

  return true;
}


// =====================================
// حذف سکوت واقعی
// =====================================

async function unmuteUser(
  ctx,
  target
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی محدود کردن اعضا را ندارد."
    );

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
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "حذف سکوت کاربر انجام نشد."
    );

    return false;
  }

  group.moderation.mutes =
    group.moderation.mutes.filter(
      record =>
        !record ||
        String(record.userId) !==
          String(target.id)
    );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف سکوت ★ 𓆪』\n\n` +
    `کاربر ${userLabel} از لیست سکوت حذف شد.`
  );

  return true;
      }// =====================================
// خفه کردن واقعی کاربر
// =====================================

async function khafeUser(
  ctx,
  target,
  duration,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id ||
    !duration
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی محدود کردن اعضا را ندارد."
    );

    return false;
  }

  const untilDate =
    Math.floor(
      getEndTime(
        duration.minutes
      ) / 1000
    );

  try {
    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        permissions: {
          can_send_messages: true,
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
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "خفه کردن کاربر انجام نشد."
    );

    return false;
  }

  saveKhafeRecord(
    group,
    target,
    ctx.from,
    duration,
    reason
  );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ خفه اضافه شد ★ 𓆪』\n\n` +
    `کاربر ${userLabel} به لیست خفه ${durationText(duration)} اضافه شد.`
  );

  return true;
}


// =====================================
// حذف خفه واقعی
// =====================================

async function unkhafeUser(
  ctx,
  target
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "ربات دسترسی محدود کردن اعضا را ندارد."
    );

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
  } catch {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\n" +
      "حذف خفه کاربر انجام نشد."
    );

    return false;
  }

  group.moderation.khafe =
    group.moderation.khafe.filter(
      record =>
        !record ||
        String(record.userId) !==
          String(target.id)
    );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف خفه ★ 𓆪』\n\n` +
    `کاربر ${userLabel} از لیست خفه حذف شد.`
  );

  return true;
}


// =====================================
// اخطار کاربر
// =====================================

async function warnUser(
  ctx,
  target,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  ensureModerationStorage(group);

  const record =
    saveWarningRecord(
      group,
      target,
      ctx.from,
      reason
    );

  if (!record) {
    return false;
  }

  const settings =
    group.moderation.warningSettings ||
    {
      maxWarnings: 3,
      punishment: "none"
    };

  const maxWarnings =
    Number(
      settings.maxWarnings || 3
    );

  const count =
    Number(
      record.count || 0
    );

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  await replyToTarget(
    ctx,
    `『𓆩 ★ اخطار ★ 𓆪』\n\n` +
    `کاربر ${userLabel} به لیست اخطار اضافه شد.\n` +
    `⚠️ تعداد اخطار: ${count} از ${maxWarnings}`
  );

  // ===================================
  // اجرای تنبیه خودکار اخطار
  // ===================================

  if (
    count >= maxWarnings &&
    settings.punishment &&
    settings.punishment !== "none"
  ) {
    if (
      settings.punishment === "ban"
    ) {
      await banUser(
        ctx,
        target,
        "رسیدن به حد مجاز اخطار"
      );
    }

    if (
      settings.punishment === "mute"
    ) {
      const duration = {
        type: "hours",
        value: 1,
        minutes: 60
      };

      await muteUser(
        ctx,
        target,
        duration,
        "رسیدن به حد مجاز اخطار"
      );
    }

    if (
      settings.punishment === "khafe"
    ) {
      const duration = {
        type: "hours",
        value: 1,
        minutes: 60
      };

      await khafeUser(
        ctx,
        target,
        duration,
        "رسیدن به حد مجاز اخطار"
      );
    }
  }

  return true;
}


// =====================================
// حذف اخطار
// =====================================

async function unwarnUser(
  ctx,
  target
) {
  const group =
    getGroupData(ctx);

  if (
    !group ||
    !target ||
    !target.id
  ) {
    return false;
  }

  const record =
    findWarningRecord(
      group,
      target.id
    );

  if (!record) {
    await replyToTarget(
      ctx,
      `『𓆩 ★ اخطار ★ 𓆪』\n\n` +
      `برای کاربر ${getListUserLabel(target)} اخطاری ثبت نشده است.`
    );

    return false;
  }

  const count =
    Number(record.count || 0);

  if (count > 1) {
    record.count = count - 1;
    record.updatedAt = Date.now();
  } else {
    removeWarningRecord(
      group,
      target.id
    );
  }

  saveModeration(group);

  const userLabel =
    getListUserLabel(target);

  const newRecord =
    findWarningRecord(
      group,
      target.id
    );

  const newCount =
    newRecord
      ? Number(newRecord.count || 0)
      : 0;

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف اخطار ★ 𓆪』\n\n` +
    `یک اخطار از کاربر ${userLabel} حذف شد.\n` +
    `⚠️ تعداد فعلی: ${newCount}`
  );

  return true;
}


// =====================================
// متن فرمان
// =====================================

function getCommandText(ctx) {
  if (
    !ctx ||
    !ctx.message
  ) {
    return "";
  }

  return String(
    ctx.message.text ||
    ctx.message.caption ||
    ""
  ).trim();
}


// =====================================
// آرگومان‌های فرمان
// =====================================

function getCommandArgs(ctx) {
  const text =
    getCommandText(ctx);

  if (!text) {
    return [];
  }

  const parts =
    text.split(/\s+/);

  parts.shift();

  return parts;
}


// =====================================
// دلیل فرمان
// =====================================

function getReasonFromArgs(
  args = [],
  durationUsed = false
) {
  if (
    !Array.isArray(args) ||
    !args.length
  ) {
    return "";
  }

  const items = [...args];

  if (durationUsed) {
    if (
      items.length &&
      /^\d{1,2}$/.test(items[0])
    ) {
      items.shift();

      if (
        items.length &&
        /^(دقیقه|دقیقه‌ای|دقیقه ای|min|minute|minutes)$/i.test(
          items[0]
        )
      ) {
        items.shift();
      }
    }
  }

  return items.join(" ").trim();
}


// =====================================
// تشخیص مدت در آرگومان‌ها
// =====================================

function getDurationArgs(args = []) {
  if (!Array.isArray(args)) {
    return [];
  }

  const result = [];

  for (let i = 0; i < args.length; i++) {
    const item =
      String(args[i] || "").trim();

    if (/^\d{1,2}$/.test(item)) {
      result.push(item);

      if (
        args[i + 1] &&
        /^(دقیقه|دقیقه‌ای|دقیقه ای|min|minute|minutes)$/i.test(
          String(args[i + 1])
        )
      ) {
        result.push(
          String(args[i + 1])
        );
      }

      continue;
    }

    if (
      /^(دقیقه|دقیقه‌ای|دقیقه ای|min|minute|minutes)$/i.test(
        item
      )
    ) {
      continue;
    }
  }

  return result;
}


// =====================================
// ثبت فرمان‌های مدیریت
// =====================================

function registerModeration(bot) {
  if (!bot) return;

  // ادامه فرمان‌ها در قسمت ۵
      }// =====================================
// ادامه ثبت فرمان‌های مدیریت
// =====================================

function registerModeration(bot) {
  if (!bot) return;


  // ===================================
  // بن
  // ===================================

  bot.hears(/^بن(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);
    const target = resolveTarget(ctx, args);

    if (!(await checkTarget(ctx, target))) return;

    const reason = getReasonFromArgs(args, false);

    await banUser(
      ctx,
      target,
      reason
    );
  });


  // ===================================
  // حذف بن
  // ===================================

  bot.hears(/^حذف\s+بن(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);
    const target = resolveTarget(ctx, args);

    if (!(await checkTarget(ctx, target))) return;

    await unbanUser(
      ctx,
      target
    );
  });


  // ===================================
  // اخراج
  // ===================================

  bot.hears(/^اخراج(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);
    const target = resolveTarget(ctx, args);

    if (!(await checkTarget(ctx, target))) return;

    const reason = getReasonFromArgs(args, false);

    await kickUser(
      ctx,
      target,
      reason
    );
  });


  // ===================================
  // سیک
  // ===================================

  bot.hears(/^سیک(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);
    const target = resolveTarget(ctx, args);

    if (!(await checkTarget(ctx, target))) return;

    const reason = getReasonFromArgs(args, false);

    await kickUser(
      ctx,
      target,
      reason
    );
  });


  // ===================================
  // سکوت
  // ===================================

  bot.hears(/^سکوت(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);

    const durationArgs =
      getDurationArgs(args);

    const duration =
      parseMuteDuration(
        durationArgs
      );

    // سکوت بدون مدت کاملاً ساکت باشد
    if (!duration) return;

    const target =
      resolveTarget(ctx);

    if (!(await checkTarget(ctx, target))) return;

    const reason =
      getReasonFromArgs(
        args,
        true
      );

    await muteUser(
      ctx,
      target,
      duration,
      reason
    );
  });


  // ===================================
  // حذف سکوت
  // ===================================

  bot.hears(/^حذف\s+سکوت(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);
    const target = resolveTarget(ctx, args);

    if (!(await checkTarget(ctx, target))) return;

    await unmuteUser(
      ctx,
      target
    );
  });


  // ===================================
  // خفه
  // ===================================

  bot.hears(/^خفه(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);

    const durationArgs =
      getDurationArgs(args);

    const duration =
      parseMuteDuration(
        durationArgs
      );

    if (!duration) return;

    const target =
      resolveTarget(ctx);

    if (!(await checkTarget(ctx, target))) return;

    const reason =
      getReasonFromArgs(
        args,
        true
      );

    await khafeUser(
      ctx,
      target,
      duration,
      reason
    );
  });


  // ===================================
  // حذف خفه
  // ===================================

  bot.hears(/^حذف\s+خفه(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);
    const target = resolveTarget(ctx, args);

    if (!(await checkTarget(ctx, target))) return;

    await unkhafeUser(
      ctx,
      target
    );
  });


  // ===================================
  // اخطار
  // ===================================

  bot.hears(/^اخطار(?:\s+(\d+))?(?:\s+(.+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);

    let count = 1;

    if (
      args.length &&
      /^\d+$/.test(args[0])
    ) {
      count = Number(args.shift());
    }

    if (
      !Number.isInteger(count) ||
      count < 1
    ) {
      return;
    }

    const target =
      resolveTarget(ctx);

    if (!(await checkTarget(ctx, target))) return;

    const reason =
      args.join(" ").trim();

    for (let i = 0; i < count; i++) {
      const done =
        await warnUser(
          ctx,
          target,
          reason
        );

      if (!done) break;
    }
  });


  // ===================================
  // حذف اخطار
  // ===================================

  bot.hears(/^حذف\s+اخطار(?:\s+(\d+))?$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const args = getCommandArgs(ctx);

    let count = 1;

    if (
      args.length &&
      /^\d+$/.test(args[0])
    ) {
      count = Number(args[0]);
    }

    if (
      !Number.isInteger(count) ||
      count < 1
    ) {
      return;
    }

    const target =
      resolveTarget(ctx);

    if (!(await checkTarget(ctx, target))) return;

    for (let i = 0; i < count; i++) {
      const done =
        await unwarnUser(
          ctx,
          target
        );

      if (!done) break;
    }
  });


  // ===================================
  // تعداد اخطار
  // ===================================

  bot.hears(/^تعداد\s+اخطار\s+(\d+)$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const value =
      Number(
        ctx.match[1]
      );

    if (
      !Number.isInteger(value) ||
      value < 1
    ) {
      return;
    }

    const group =
      getGroupData(ctx);

    if (!group) return;

    ensureModerationStorage(group);

    group.moderation.warningSettings.maxWarnings =
      value;

    saveModeration(group);

    await replyToCommand(
      ctx,
      `『𓆩 ★ تنظیم شد ★ 𓆪』\n\n` +
      `حداکثر اخطار روی ${value} تنظیم شد.`
    );
  });


  // ===================================
  // تنظیم اخطار
  // ===================================

  bot.hears(/^تنظیم\s+اخطار\s+(بن|سکوت|خفه|هیچ)$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const group =
      getGroupData(ctx);

    if (!group) return;

    ensureModerationStorage(group);

    const value =
      String(ctx.match[1]);

    let punishment = "none";

    if (value === "بن") {
      punishment = "ban";
    }

    if (value === "سکوت") {
      punishment = "mute";
    }

    if (value === "خفه") {
      punishment = "khafe";
    }

    group.moderation.warningSettings.punishment =
      punishment;

    saveModeration(group);

    await replyToCommand(
      ctx,
      `『𓆩 ★ تنظیم اخطار ★ 𓆪』\n\n` +
      `تنبیه اخطار روی «${value}» تنظیم شد.`
    );
  });


  // ===================================
  // لیست سکوت
  // ===================================

  bot.hears(/^لیست\s+سکوت$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    await showModerationList(
      ctx,
      "mutes",
      "『𓆩 ★ لیست سکوت ★ 𓆪』"
    );
  });


  // ===================================
  // لیست خفه
  // ===================================

  bot.hears(/^لیست\s+خفه$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    await showModerationList(
      ctx,
      "khafe",
      "『𓆩 ★ لیست خفه ★ 𓆪』"
    );
  });


  // ===================================
  // لیست بن
  // ===================================

  bot.hears(/^لیست\s+بن$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    await showModerationList(
      ctx,
      "bans",
      "『𓆩 ★ لیست بن ★ 𓆪』"
    );
  });


  // ===================================
  // لیست اخطار
  // ===================================

  bot.hears(/^لیست\s+اخطار$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    await showModerationList(
      ctx,
      "warnings",
      "『𓆩 ★ لیست اخطار ★ 𓆪』"
    );
  });


  // ===================================
  // پاکسازی سکوت
  // ===================================

  bot.hears(/^پاکسازی\s+سکوت$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const group =
      getGroupData(ctx);

    if (!group) return;

    ensureModerationStorage(group);

    const removed =
      cleanExpiredMutes(group);

    saveModeration(group);

    await replyToCommand(
      ctx,
      `『𓆩 ★ پاکسازی سکوت ★ 𓆪』\n\n` +
      `تعداد ${removed} سکوت منقضی پاکسازی شد.`
    );
  });


  // ===================================
  // پاکسازی خفه
  // ===================================

  bot.hears(/^پاکسازی\s+خفه$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const group =
      getGroupData(ctx);

    if (!group) return;

    ensureModerationStorage(group);

    const removed =
      cleanExpiredKhafe(group);

    saveModeration(group);

    await replyToCommand(
      ctx,
      `『𓆩 ★ پاکسازی خفه ★ 𓆪』\n\n` +
      `تعداد ${removed} خفه منقضی پاکسازی شد.`
    );
  });


  // ===================================
  // پاکسازی مدیریت
  // ===================================

  bot.hears(/^پاکسازی\s+(همه|مدیریت)$/i, async ctx => {
    if (!(await checkExecutor(ctx))) return;

    const group =
      getGroupData(ctx);

    if (!group) return;

    ensureModerationStorage(group);

    const mutes =
      cleanExpiredMutes(group);

    const khafe =
      cleanExpiredKhafe(group);

    saveModeration(group);

    await replyToCommand(
      ctx,
      `『𓆩 ★ پاکسازی انجام شد ★ 𓆪』\n\n` +
      `🔇 سکوت: ${mutes}\n` +
      `🔕 خفه: ${khafe}`
    );
  });
}


// =====================================
// گرفتن لیست مدیریت
// =====================================

function getModerationList(
  group,
  type
) {
  if (!group) return [];

  ensureModerationStorage(group);

  if (
    !Array.isArray(
      group.moderation[type]
    )
  ) {
    return [];
  }

  return group.moderation[type];
}


// =====================================
// نمایش لیست مدیریت
// =====================================

async function showModerationList(
  ctx,
  type,
  title,
  page = 0
) {
  const group =
    getGroupData(ctx);

  if (!group) return;

  ensureModerationStorage(group);

  if (type === "mutes") {
    cleanExpiredMutes(group);
  }

  if (type === "khafe") {
    cleanExpiredKhafe(group);
  }

  saveModeration(group);

  const list =
    getModerationList(
      group,
      type
    );

  const total =
    list.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / LIST_PAGE_SIZE
      )
    );

  if (page < 0) page = 0;

  if (page >= totalPages) {
    page = totalPages - 1;
  }

  const start =
    page * LIST_PAGE_SIZE;

  const items =
    list.slice(
      start,
      start + LIST_PAGE_SIZE
    );

  let text =
    `${title}\n\n`;

  if (!items.length) {
    text += "لیست خالی است.";
  } else {
    items.forEach(
      (record, index) => {
        const number =
          start + index + 1;

        const label =
          record.username
            ? `@${String(record.username).replace(/^@/, "")}`
            : getUserName(record);

        text +=
          `${number}. ${label}\n`;

        text +=
          `🆔 ${record.userId}\n`;

        if (record.until) {
          text +=
            `⏳ ${remainingDuration(record.until)}\n`;
        }

        if (
          type === "warnings"
        ) {
          text +=
            `⚠️ اخطار: ${record.count || 0}\n`;
        }

        text += "\n";
      }
    );
  }

  text +=
    `صفحه ${page + 1} از ${totalPages}`;

  const buttons = [];

  if (page > 0) {
    buttons.push({
      text: "‹ قبلی",
      callback_data:
        `modlist:${type}:${page - 1}`
    });
  }

  if (page < totalPages - 1) {
    buttons.push({
      text: "بعدی ›",
      callback_data:
        `modlist:${type}:${page + 1}`
    });
  }

  const keyboard =
    buttons.length
      ? [buttons]
      : [];

  try {
    await ctx.reply(
      text,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard:
            keyboard
        }
      }
    );
  } catch {
    await ctx.reply(text);
  }
}


// =====================================
// اکشن‌های لیست
// =====================================

function registerModerationActions(bot) {
  if (!bot) return;

  bot.action(
    /^modlist:(mutes|khafe|bans|warnings):(\d+)$/,
    async ctx => {
      try {
        if (!(await checkExecutor(ctx))) {
          try {
            await ctx.answerCbQuery();
          } catch {}
          return;
        }

        const type =
          ctx.match[1];

        const page =
          Number(ctx.match[2]) || 0;

        const titles = {
          mutes:
            "『𓆩 ★ لیست سکوت ★ 𓆪』",
          khafe:
            "『𓆩 ★ لیست خفه ★ 𓆪』",
          bans:
            "『𓆩 ★ لیست بن ★ 𓆪』",
          warnings:
            "『𓆩 ★ لیست اخطار ★ 𓆪』"
        };

        const group =
          getGroupData(ctx);

        if (!group) {
          try {
            await ctx.answerCbQuery();
          } catch {}
          return;
        }

        ensureModerationStorage(group);

        if (type === "mutes") {
          cleanExpiredMutes(group);
        }

        if (type === "khafe") {
          cleanExpiredKhafe(group);
        }

        saveModeration(group);

        const list =
          getModerationList(
            group,
            type
          );

        const totalPages =
          Math.max(
            1,
            Math.ceil(
              list.length /
              LIST_PAGE_SIZE
            )
          );

        let currentPage = page;

        if (
          currentPage < 0
        ) {
          currentPage = 0;
        }

        if (
          currentPage >= totalPages
        ) {
          currentPage =
            totalPages - 1;
        }

        const start =
          currentPage *
          LIST_PAGE_SIZE;

        const items =
          list.slice(
            start,
            start + LIST_PAGE_SIZE
          );

        let text =
          `${titles[type]}\n\n`;

        if (!items.length) {
          text +=
            "لیست خالی است.";
        } else {
          items.forEach(
            (record, index) => {
              const number =
                start + index + 1;

              const label =
                record.username
                  ? `@${String(record.username).replace(/^@/, "")}`
                  : getUserName(record);

              text +=
                `${number}. ${label}\n`;

              text +=
                `🆔 ${record.userId}\n`;

              if (record.until) {
                text +=
                  `⏳ ${remainingDuration(record.until)}\n`;
              }

              if (
                type === "warnings"
              ) {
                text +=
                  `⚠️ اخطار: ${record.count || 0}\n`;
              }

              text += "\n";
            }
          );
        }

        text +=
          `صفحه ${currentPage + 1} از ${totalPages}`;

        const buttons = [];

        if (
          currentPage > 0
        ) {
          buttons.push({
            text: "‹ قبلی",
            callback_data:
              `modlist:${type}:${currentPage - 1}`
          });
        }

        if (
          currentPage <
          totalPages - 1
        ) {
          buttons.push({
            text: "بعدی ›",
            callback_data:
              `modlist:${type}:${currentPage + 1}`
          });
        }

        try {
          await ctx.editMessageText(
            text,
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard:
                  buttons.length
                    ? [buttons]
                    : []
              }
            }
          );
        } catch {}

        try {
          await ctx.answerCbQuery();
        } catch {}
      } catch {
        try {
          await ctx.answerCbQuery();
        } catch {}
      }
    }
  );
}


// =====================================
// خروجی فایل
// =====================================

module.exports = {
  registerModeration,
  registerModerationActions,

  isGroupChat,
  getGroupData,

  ensureModerationStorage,
  saveModeration,

  rememberUser,
  rememberUserInGroup,
  learnUserFromMessage,

  getUserName,
  mentionUser,
  getListUserLabel,

  getTargetMessage,
  getReplyTarget,
  getTargetReplyId,

  resolveTarget,

  getMemberRole,
  isOwner,
  isAdmin,

  checkExecutor,
  checkTarget,
  checkBotPermissions,

  parseMuteDuration,
  durationText,
  remainingDuration,

  cleanExpiredMutes,
  cleanExpiredKhafe,

  banUser,
  unbanUser,
  kickUser,

  muteUser,
  unmuteUser,

  khafeUser,
  unkhafeUser,

  warnUser,
  unwarnUser,

  getModerationList,
  showModerationList
};
