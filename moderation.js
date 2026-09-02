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
// حافظه کاربران شناخته‌شده
// =====================================

const knownUsers = {};


// =====================================
// لیست‌های باز
// =====================================

const openLists = {};


// =====================================
// تنظیمات
// =====================================

const LIST_PAGE_SIZE = 10;


// =====================================
// بررسی گروه
// =====================================

function isGroupChat(ctx) {
  if (!ctx || !ctx.chat) return false;

  return (
    ctx.chat.type === "group" ||
    ctx.chat.type === "supergroup"
  );
}


// =====================================
// دریافت اطلاعات گروه
// =====================================

function getGroupData(ctx) {
  if (!isGroupChat(ctx)) return null;

  try {
    const group = getGroup(ctx.chat.id);

    if (!group) return null;

    return group;
  } catch (err) {
    return null;
  }
}


// =====================================
// آماده‌سازی ذخیره مدیریت
// =====================================

function ensureModerationStorage(group) {
  if (!group) return null;

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
// ذخیره دیتابیس
// =====================================

function saveModeration(group) {
  if (!group) return;

  ensureModerationStorage(group);

  try {
    saveDB();
  } catch (err) {
    try {
      saveDB(group);
    } catch (err2) {
      // عمداً ساکت
    }
  }
}


// =====================================
// ذخیره کاربر
// =====================================

function rememberUser(user) {
  if (!user || !user.id) {
    return null;
  }

  const id = String(user.id);
  const old = knownUsers[id] || {};

  knownUsers[id] = {
    ...old,
    id: user.id,
    first_name:
      user.first_name ||
      old.first_name ||
      "",
    last_name:
      user.last_name ||
      old.last_name ||
      "",
    username:
      user.username ||
      old.username ||
      ""
  };

  return knownUsers[id];
}


// =====================================
// ذخیره کاربر داخل گروه
// =====================================

function rememberUserInGroup(group, user) {
  if (!group || !user || !user.id) {
    return null;
  }

  if (!group.knownUsers) {
    group.knownUsers = {};
  }

  const id = String(user.id);
  const old = group.knownUsers[id] || {};

  group.knownUsers[id] = {
    ...old,
    id: user.id,
    first_name:
      user.first_name ||
      old.first_name ||
      "",
    last_name:
      user.last_name ||
      old.last_name ||
      "",
    username:
      user.username ||
      old.username ||
      ""
  };

  rememberUser(user);

  return group.knownUsers[id];
}


// =====================================
// یادگیری کاربر از پیام
// =====================================

function learnUserFromMessage(ctx) {
  if (!ctx) return;

  if (ctx.from) {
    rememberUser(ctx.from);
  }

  if (
    ctx.message &&
    ctx.message.from
  ) {
    const group = getGroupData(ctx);

    if (group) {
      rememberUserInGroup(
        group,
        ctx.message.from
      );
    }
  }

  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {
    const group = getGroupData(ctx);

    if (group) {
      rememberUserInGroup(
        group,
        ctx.message.reply_to_message.from
      );
    }
  }
}


// =====================================
// بارگذاری کاربران گروه
// =====================================

function loadGroupKnownUsers(group) {
  if (!group || !group.knownUsers) {
    return;
  }

  for (
    const id of Object.keys(group.knownUsers)
  ) {
    const user = group.knownUsers[id];

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

  const first =
    user.first_name || "";

  const last =
    user.last_name || "";

  const full =
    `${first} ${last}`.trim();

  if (full) return full;

  if (user.username) {
    return `@${user.username}`;
  }

  return String(
    user.id || "کاربر"
  );
}


// =====================================
// منشن HTML
// =====================================

function mentionUser(user) {
  if (!user || !user.id) {
    return "کاربر";
  }

  const name =
    getUserName(user)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return (
    `<a href="tg://user?id=${user.id}">` +
    `${name}</a>`
  );
}


// =====================================
// پیام Reply شده
// =====================================

function getTargetMessage(ctx) {
  if (!ctx || !ctx.message) {
    return null;
  }

  return (
    ctx.message.reply_to_message ||
    null
  );
}


// =====================================
// کاربر Reply شده
// =====================================

function getReplyTarget(ctx) {
  const reply =
    getTargetMessage(ctx);

  if (!reply || !reply.from) {
    return null;
  }

  return rememberUser(
    reply.from
  );
}


// =====================================
// شناسه پیام Reply شده
// =====================================

function getTargetReplyId(ctx) {
  const reply =
    getTargetMessage(ctx);

  if (
    !reply ||
    !reply.message_id
  ) {
    return null;
  }

  return reply.message_id;
}


// =====================================
// پاسخ مدیریتی روی پیام فرمان
// =====================================

async function replyToCommand(
  ctx,
  text,
  extra = {}
) {
  if (
    !ctx ||
    !ctx.message ||
    !ctx.message.message_id
  ) {
    return null;
  }

  return ctx.reply(text, {
    ...extra,
    reply_parameters: {
      message_id:
        ctx.message.message_id
    }
  });
}


// =====================================
// پاسخ روی پیام هدف
// =====================================

async function replyToTarget(
  ctx,
  text,
  extra = {}
) {
  const replyId =
    getTargetReplyId(ctx);

  if (!replyId) {
    return null;
  }

  return ctx.reply(text, {
    ...extra,
    reply_parameters: {
      message_id: replyId
    }
  });
}


// =====================================
// نرمال‌سازی نام
// =====================================

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


// =====================================
// جستجوی کاربر با ID
// =====================================

function findKnownUserById(id) {
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

  return (
    knownUsers[clean] ||
    null
  );
}


// =====================================
// جستجوی کاربر با Username
// =====================================

function findKnownUserByUsername(
  username
) {
  if (!username) return null;

  const clean =
    String(username)
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  if (!clean) return null;

  for (
    const id of Object.keys(knownUsers)
  ) {
    const user =
      knownUsers[id];

    if (
      user &&
      user.username &&
      String(
        user.username
      ).toLowerCase() === clean
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// جستجوی کاربر با نام
// =====================================

function findKnownUserByName(
  name
) {
  const wanted =
    normalizeName(name);

  if (!wanted) return null;

  for (
    const id of Object.keys(knownUsers)
  ) {
    const user =
      knownUsers[id];

    if (!user) continue;

    const first =
      normalizeName(
        user.first_name
      );

    const last =
      normalizeName(
        user.last_name
      );

    const full =
      normalizeName(
        `${user.first_name || ""} ${user.last_name || ""}`
      );

    if (
      wanted === full ||
      wanted === first ||
      wanted === last
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// جستجوی کاربر داخل گروه
// =====================================

function findGroupUserById(
  group,
  id
) {
  if (
    !group ||
    !group.knownUsers
  ) {
    return null;
  }

  const clean =
    String(id || "").trim();

  if (!/^-?\d+$/.test(clean)) {
    return null;
  }

  return (
    group.knownUsers[clean] ||
    null
  );
}


function findGroupUserByUsername(
  group,
  username
) {
  if (
    !group ||
    !group.knownUsers
  ) {
    return null;
  }

  const clean =
    String(username || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  if (!clean) return null;

  for (
    const id of Object.keys(
      group.knownUsers
    )
  ) {
    const user =
      group.knownUsers[id];

    if (
      user &&
      user.username &&
      String(
        user.username
      ).toLowerCase() === clean
    ) {
      return user;
    }
  }

  return null;
}


function findGroupUserByName(
  group,
  name
) {
  if (
    !group ||
    !group.knownUsers
  ) {
    return null;
  }

  const wanted =
    normalizeName(name);

  if (!wanted) return null;

  for (
    const id of Object.keys(
      group.knownUsers
    )
  ) {
    const user =
      group.knownUsers[id];

    if (!user) continue;

    const first =
      normalizeName(
        user.first_name
      );

    const last =
      normalizeName(
        user.last_name
      );

    const full =
      normalizeName(
        `${user.first_name || ""} ${user.last_name || ""}`
      );

    if (
      wanted === full ||
      wanted === first ||
      wanted === last
    ) {
      return user;
    }
  }

  return null;
}


// =====================================
// Text Mention
// =====================================

function getTextMentionUser(
  message
) {
  if (!message) return null;

  const entities =
    message.entities ||
    message.caption_entities ||
    [];

  for (
    const entity of entities
  ) {
    if (
      entity &&
      entity.type ===
        "text_mention" &&
      entity.user
    ) {
      return rememberUser(
        entity.user
      );
    }
  }

  return null;
}


// =====================================
// استخراج Username
// =====================================

function getUsernameFromText(
  text
) {
  if (!text) return null;

  const match =
    String(text).match(
      /(^|\s)@([A-Za-z0-9_]{5,32})(?=\s|$|[^\w])/i
    );

  if (!match) return null;

  return `@${match[2]}`;
}


// =====================================
// استخراج ID
// =====================================

function getIdFromText(
  text
) {
  if (!text) return null;

  const match =
    String(text).match(
      /(^|\s)(-?\d{5,20})(?=\s|$)/
    );

  if (!match) return null;

  return match[2];
}


// =====================================
// متن پیام
// =====================================

function getMessageText(
  message
) {
  if (!message) return "";

  return (
    message.text ||
    message.caption ||
    ""
  );
}


// =====================================
// آیا Reply هدف دیگری معرفی می‌کند؟
/*
 * اگر پیام Reply شده دارای
 * @username یا ID یا Text Mention باشد،
 * همان هدف بررسی می‌شود.
 * اگر پیدا نشود، کاربر دیگری حدس زده نمی‌شود.
 */
// =====================================

function hasTargetReferenceInReply(
  ctx
) {
  const reply =
    getTargetMessage(ctx);

  if (!reply) return false;

  if (
    getTextMentionUser(reply)
  ) {
    return true;
  }

  const text =
    getMessageText(reply);

  return !!(
    getUsernameFromText(text) ||
    getIdFromText(text)
  );
}


// =====================================
// حل هدف از محتوای Reply
// =====================================

function resolveTargetFromReplyContent(
  ctx
) {
  const reply =
    getTargetMessage(ctx);

  if (!reply) return null;

  const mention =
    getTextMentionUser(reply);

  if (mention) {
    return mention;
  }

  const text =
    getMessageText(reply);

  const username =
    getUsernameFromText(text);

  if (username) {
    return findKnownUserByUsername(
      username
    );
  }

  const id =
    getIdFromText(text);

  if (id) {
    return findKnownUserById(id);
  }

  return null;
}


// =====================================
// حل کامل هدف
// =====================================

function resolveTarget(
  ctx,
  args = []
) {
  learnUserFromMessage(ctx);

  const group =
    getGroupData(ctx);

  if (group) {
    loadGroupKnownUsers(group);
  }

  // -------------------------------
  // هدف صریح
  // -------------------------------

  if (
    Array.isArray(args) &&
    args.length
  ) {
    const raw =
      args.join(" ").trim();

    if (!raw) {
      return null;
    }

    const byId =
      findKnownUserById(raw) ||
      (
        group
          ? findGroupUserById(
              group,
              raw
            )
          : null
      );

    if (byId) {
      return byId;
    }

    const byUsername =
      findKnownUserByUsername(
        raw
      ) ||
      (
        group
          ? findGroupUserByUsername(
              group,
              raw
            )
          : null
      );

    if (byUsername) {
      return byUsername;
    }

    const byName =
      findKnownUserByName(raw) ||
      (
        group
          ? findGroupUserByName(
              group,
              raw
            )
          : null
      );

    if (byName) {
      return byName;
    }

    return null;
  }

  // -------------------------------
  // Reply
  // -------------------------------

  const reply =
    getTargetMessage(ctx);

  if (!reply) {
    return null;
  }

  if (
    hasTargetReferenceInReply(ctx)
  ) {
    return resolveTargetFromReplyContent(
      ctx
    );
  }

  return getReplyTarget(ctx);
}


// =====================================
// نقش کاربر
// =====================================

async function getMemberRole(
  ctx,
  userId
) {
  if (
    !ctx ||
    !ctx.telegram ||
    !ctx.chat ||
    !userId
  ) {
    return "member";
  }

  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (!member) {
      return "member";
    }

    if (
      member.status === "creator"
    ) {
      return "owner";
    }

    if (
      member.status ===
        "administrator"
    ) {
      return "admin";
    }

    return "member";
  } catch (err) {
    return "member";
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
// کاربر عادی کاملاً ساکت
// =====================================

async function checkExecutor(
  ctx
) {
  if (!isGroupChat(ctx)) {
    return false;
  }

  learnUserFromMessage(ctx);

  if (!ctx.from || !ctx.from.id) {
    return false;
  }

  const allowed =
    await isAdmin(
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

async function checkTarget(
  ctx,
  target
) {
  if (
    target &&
    target.id
  ) {
    const group =
      getGroupData(ctx);

    if (group) {
      rememberUserInGroup(
        group,
        target
      );

      saveModeration(group);
    }

    return true;
  }

  await replyToCommand(
    ctx,
    "『𓆩 ★ خطا ★ 𓆪』\n\nروی پیام کاربر Reply کن یا کاربر شناخته‌شده را با شناسه، نام یا @username مشخص کن."
  );

  return false;
}


// =====================================
// بررسی دسترسی ربات
// =====================================

async function checkBotPermissions(
  ctx
) {
  if (
    !ctx ||
    !ctx.telegram ||
    !ctx.chat
  ) {
    return false;
  }

  try {
    const me =
      await ctx.telegram.getMe();

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

    return (
      member.status ===
        "administrator" ||
      member.status === "creator"
    );
  } catch (err) {
    return false;
  }
}


// =====================================
// پیدا کردن رکورد
// =====================================

function findRecord(
  list,
  userId
) {
  if (!Array.isArray(list)) {
    return null;
  }

  const id =
    String(userId);

  return (
    list.find(item => {
      return (
        item &&
        String(item.userId) === id
      );
    }) || null
  );
}


// =====================================
// مدت سکوت
// 1 تا 10 ساعت
// 10 تا 45 دقیقه
// =====================================

function parseMuteDuration(
  args = []
) {
  if (
    !Array.isArray(args) ||
    !args.length
  ) {
    return null;
  }

  const text =
    args.join(" ")
      .trim()
      .toLowerCase();

  // سکوت 1 تا سکوت 10
  const hourMatch =
    text.match(
      /^(\d{1,2})$/
    );

  if (hourMatch) {
    const hours =
      Number(hourMatch[1]);

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

  // دقیقه
  const minuteMatch =
    text.match(
      /^(\d{1,2})\s*(دقیقه|دقیقه‌ای|دقیقه ای|min|minute|minutes)$/
    );

  if (minuteMatch) {
    const minutes =
      Number(
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

function durationText(
  duration
) {
  if (!duration) {
    return "نامشخص";
  }

  if (
    duration.type === "hours"
  ) {
    return `${duration.value} ساعت`;
  }

  return `${duration.value} دقیقه`;
}


// =====================================
// زمان پایان
// =====================================

function getEndTime(
  minutes
) {
  return (
    Date.now() +
    Number(minutes) * 60 * 1000
  );
}


// =====================================
// زمان باقی‌مانده
// =====================================

function remainingDuration(
  until
) {
  if (!until) {
    return "نامحدود";
  }

  const diff =
    Number(until) -
    Date.now();

  if (diff <= 0) {
    return "پایان‌یافته";
  }

  const minutes =
    Math.ceil(
      diff / 60000
    );

  if (minutes < 60) {
    return `${minutes} دقیقه`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const rest =
    minutes % 60;

  if (rest === 0) {
    return `${hours} ساعت`;
  }

  return (
    `${hours} ساعت و ` +
    `${rest} دقیقه`
  );
}// =====================================
// پاکسازی رکوردهای منقضی
// =====================================

function cleanExpiredMutes(
  group
) {
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
        Number(record.until) <=
          Date.now()
      ) {
        removed++;
        return false;
      }

      return true;
    });

  return removed;
}


function cleanExpiredKhafe(
  group
) {
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
        Number(record.until) <=
          Date.now()
      ) {
        removed++;
        return false;
      }

      return true;
    });

  return removed;
}


// =====================================
// ثبت بن
// =====================================

function saveBanRecord(
  group,
  target,
  executor,
  reason = ""
) {
  ensureModerationStorage(
    group
  );

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) return null;

  const id =
    String(user.id);

  let record =
    findRecord(
      group.moderation.bans,
      id
    );

  if (record) {
    record.first_name =
      user.first_name ||
      record.first_name ||
      "";

    record.last_name =
      user.last_name ||
      record.last_name ||
      "";

    record.username =
      user.username ||
      record.username ||
      "";

    record.reason =
      reason ||
      record.reason ||
      "";

    record.executorId =
      executor &&
      executor.id
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
    reason:
      reason || "",
    executorId:
      executor &&
      executor.id
        ? executor.id
        : null,
    createdAt:
      Date.now(),
    updatedAt:
      Date.now()
  };

  group.moderation.bans.push(
    record
  );

  return record;
}


// =====================================
// ثبت سکوت
// =====================================

function saveMuteRecord(
  group,
  target,
  executor,
  duration,
  reason = ""
) {
  ensureModerationStorage(
    group
  );

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) return null;

  const id =
    String(user.id);

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
      user.first_name ||
      record.first_name ||
      "";

    record.last_name =
      user.last_name ||
      record.last_name ||
      "";

    record.username =
      user.username ||
      record.username ||
      "";

    record.durationType =
      duration.type;

    record.durationValue =
      duration.value;

    record.minutes =
      duration.minutes;

    record.until =
      until;

    record.reason =
      reason ||
      record.reason ||
      "";

    record.executorId =
      executor &&
      executor.id
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
    reason:
      reason || "",
    executorId:
      executor &&
      executor.id
        ? executor.id
        : null,
    createdAt:
      Date.now(),
    updatedAt:
      Date.now()
  };

  group.moderation.mutes.push(
    record
  );

  return record;
}


// =====================================
// ثبت خفه
// =====================================

function saveKhafeRecord(
  group,
  target,
  executor,
  duration,
  reason = ""
) {
  ensureModerationStorage(
    group
  );

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) return null;

  const id =
    String(user.id);

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
      user.first_name ||
      record.first_name ||
      "";

    record.last_name =
      user.last_name ||
      record.last_name ||
      "";

    record.username =
      user.username ||
      record.username ||
      "";

    record.durationType =
      duration.type;

    record.durationValue =
      duration.value;

    record.minutes =
      duration.minutes;

    record.until =
      until;

    record.reason =
      reason ||
      record.reason ||
      "";

    record.executorId =
      executor &&
      executor.id
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
    reason:
      reason || "",
    executorId:
      executor &&
      executor.id
        ? executor.id
        : null,
    createdAt:
      Date.now(),
    updatedAt:
      Date.now()
  };

  group.moderation.khafe.push(
    record
  );

  return record;
}


// =====================================
// ثبت اخطار
// =====================================

function saveWarningRecord(
  group,
  target,
  executor,
  reason = ""
) {
  ensureModerationStorage(
    group
  );

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) return null;

  const id =
    String(user.id);

  let record =
    findRecord(
      group.moderation.warnings,
      id
    );

  if (!record) {
    record = {
      userId: user.id,
      first_name:
        user.first_name || "",
      last_name:
        user.last_name || "",
      username:
        user.username || "",
      count: 0,
      reasons: [],
      createdAt:
        Date.now(),
      updatedAt:
        Date.now()
    };

    group.moderation.warnings.push(
      record
    );
  }

  record.first_name =
    user.first_name ||
    record.first_name ||
    "";

  record.last_name =
    user.last_name ||
    record.last_name ||
    "";

  record.username =
    user.username ||
    record.username ||
    "";

  record.count =
    Number(record.count || 0) + 1;

  if (
    !Array.isArray(
      record.reasons
    )
  ) {
    record.reasons = [];
  }

  record.reasons.push({
    reason:
      reason || "بدون دلیل",
    executorId:
      executor &&
      executor.id
        ? executor.id
        : null,
    createdAt:
      Date.now()
  });

  record.updatedAt =
    Date.now();

  return record;
}


// =====================================
// حذف یک اخطار
// =====================================

function removeWarningRecord(
  group,
  target
) {
  ensureModerationStorage(
    group
  );

  const id =
    String(target.id);

  const record =
    findRecord(
      group.moderation.warnings,
      id
    );

  if (!record) {
    return {
      found: false,
      removed: false,
      count: 0
    };
  }

  record.count =
    Math.max(
      0,
      Number(record.count || 0) - 1
    );

  if (
    Array.isArray(
      record.reasons
    ) &&
    record.reasons.length
  ) {
    record.reasons.pop();
  }

  record.updatedAt =
    Date.now();

  if (
    record.count <= 0
  ) {
    group.moderation.warnings =
      group.moderation.warnings.filter(
        item =>
          String(
            item.userId
          ) !== id
      );

    return {
      found: true,
      removed: true,
      count: 0
    };
  }

  return {
    found: true,
    removed: false,
    count: record.count
  };
}


// =====================================
// پاک کردن کامل اخطار یک کاربر
// =====================================

function clearWarningRecord(
  group,
  target
) {
  ensureModerationStorage(
    group
  );

  const id =
    String(target.id);

  const before =
    group.moderation.warnings.length;

  group.moderation.warnings =
    group.moderation.warnings.filter(
      item =>
        String(
          item.userId
        ) !== id
    );

  return (
    before !==
    group.moderation.warnings.length
  );
}


// =====================================
// ثبت اختیار
// =====================================

function savePermissionRecord(
  group,
  target,
  permissions = {}
) {
  ensureModerationStorage(
    group
  );

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) return null;

  const id =
    String(user.id);

  let record =
    findRecord(
      group.moderation.permissions,
      id
    );

  if (!record) {
    record = {
      userId: user.id,
      first_name:
        user.first_name || "",
      last_name:
        user.last_name || "",
      username:
        user.username || "",
      permissions: {},
      createdAt:
        Date.now(),
      updatedAt:
        Date.now()
    };

    group.moderation.permissions.push(
      record
    );
  }

  record.first_name =
    user.first_name ||
    record.first_name ||
    "";

  record.last_name =
    user.last_name ||
    record.last_name ||
    "";

  record.username =
    user.username ||
    record.username ||
    "";

  record.permissions = {
    ...(record.permissions || {}),
    ...permissions
  };

  record.updatedAt =
    Date.now();

  return record;
}


// =====================================
// ثبت اخراج
// =====================================

function saveKickRecord(
  group,
  target,
  executor,
  reason = ""
) {
  ensureModerationStorage(
    group
  );

  const user =
    rememberUserInGroup(
      group,
      target
    );

  if (!user) return null;

  const record = {
    userId: user.id,
    first_name:
      user.first_name || "",
    last_name:
      user.last_name || "",
    username:
      user.username || "",
    reason:
      reason || "",
    executorId:
      executor &&
      executor.id
        ? executor.id
        : null,
    createdAt:
      Date.now()
  };

  group.moderation.kicks.push(
    record
  );

  return record;
}


// =====================================
// گرفتن لیست
// =====================================

function getModerationList(
  group,
  type
) {
  ensureModerationStorage(
    group
  );

  if (type === "ban") {
    return group.moderation.bans;
  }

  if (type === "mute") {
    cleanExpiredMutes(group);
    return group.moderation.mutes;
  }

  if (type === "khafe") {
    cleanExpiredKhafe(group);
    return group.moderation.khafe;
  }

  if (type === "warning") {
    return group.moderation.warnings;
  }

  if (type === "permission") {
    return group.moderation.permissions;
  }

  if (type === "kick") {
    return group.moderation.kicks;
  }

  return [];
}


// =====================================
// عنوان لیست
// =====================================

function listTitle(type) {
  if (type === "ban") {
    return "لیست بن";
  }

  if (type === "mute") {
    return "لیست سکوت";
  }

  if (type === "khafe") {
    return "لیست خفه";
  }

  if (type === "warning") {
    return "لیست اخطار";
  }

  if (type === "permission") {
    return "لیست اختیار";
  }

  if (type === "kick") {
    return "لیست اخراج";
  }

  return "لیست مدیریت";
}


// =====================================
// صفحه‌بندی
// =====================================

function getPageData(
  list,
  page
) {
  const safePage =
    Number.isInteger(page)
      ? page
      : 0;

  const totalItems =
    Array.isArray(list)
      ? list.length
      : 0;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
        LIST_PAGE_SIZE
      )
    );

  const currentPage =
    Math.min(
      Math.max(
        safePage,
        0
      ),
      totalPages - 1
    );

  const start =
    currentPage *
    LIST_PAGE_SIZE;

  return {
    items:
      Array.isArray(list)
        ? list.slice(
            start,
            start +
              LIST_PAGE_SIZE
          )
        : [],
    page:
      currentPage,
    totalPages,
    totalItems
  };
}


// =====================================
// خط هر کاربر در لیست
// =====================================

function userListLine(
  record,
  number,
  type
) {
  const user = {
    id: record.userId,
    first_name:
      record.first_name || "",
    last_name:
      record.last_name || "",
    username:
      record.username || ""
  };

  let text =
    `${number}. ${mentionUser(user)}\n` +
    `   🆔 ${record.userId}`;

  if (record.username) {
    text +=
      `\n   👤 @${record.username}`;
  }

  if (type === "ban") {
    if (record.reason) {
      text +=
        `\n   📝 ${record.reason}`;
    }
  }

  if (
    type === "mute" ||
    type === "khafe"
  ) {
    if (record.until) {
      text +=
        `\n   ⏳ ${remainingDuration(
          record.until
        )}`;
    }

    if (record.reason) {
      text +=
        `\n   📝 ${record.reason}`;
    }
  }

  if (type === "warning") {
    text +=
      `\n   ⚠️ تعداد اخطار: ${
        record.count || 0
      }`;

    if (
      Array.isArray(
        record.reasons
      ) &&
      record.reasons.length
    ) {
      const last =
        record.reasons[
          record.reasons.length - 1
        ];

      if (
        last &&
        last.reason
      ) {
        text +=
          `\n   📝 ${last.reason}`;
      }
    }
  }

  if (
    type === "permission"
  ) {
    const permissions =
      record.permissions || {};

    const enabled =
      Object.keys(
        permissions
      ).filter(
        key =>
          permissions[key] === true
      ).length;

    text +=
      `\n   ★ اختیار فعال: ${enabled}`;
  }

  return text;
}


// =====================================
// ساخت متن لیست
// =====================================

function buildListText(
  group,
  type,
  page
) {
  const list =
    getModerationList(
      group,
      type
    );

  const data =
    getPageData(
      list,
      page
    );

  let text =
    `『𓆩 ★ ${listTitle(type)} ★ 𓆪』\n\n`;

  if (
    data.totalItems === 0
  ) {
    text +=
      "『𓆩 ☆ لیست خالی است ☆ 𓆪』";

    return {
      text,
      data
    };
  }

  text +=
    `تعداد کل: ${data.totalItems}\n` +
    `صفحه: ${
      data.page + 1
    } از ${
      data.totalPages
    }\n\n`;

  data.items.forEach(
    (record, index) => {
      const number =
        data.page *
          LIST_PAGE_SIZE +
        index +
        1;

      text +=
        userListLine(
          record,
          number,
          type
        ) +
        "\n\n";
    }
  );

  return {
    text: text.trim(),
    data
  };
}


// =====================================
// کلید لیست
// =====================================

function getListKey(
  chatId,
  ownerId,
  type
) {
  return (
    `${chatId}:` +
    `${ownerId}:` +
    `${type}`
  );
}


// =====================================
// ذخیره لیست باز
// =====================================

function saveOpenList(
  ctx,
  type,
  ownerId,
  page
) {
  const key =
    getListKey(
      ctx.chat.id,
      ownerId,
      type
    );

  openLists[key] = {
    chatId:
      ctx.chat.id,
    ownerId,
    type,
    page,
    messageId: null,
    createdAt:
      Date.now()
  };

  return key;
}


// =====================================
// دریافت لیست باز
// =====================================

function getOpenList(
  chatId,
  ownerId,
  type
) {
  const key =
    getListKey(
      chatId,
      ownerId,
      type
    );

  return (
    openLists[key] ||
    null
  );
}


// =====================================
// ساخت دکمه‌های صفحه
// =====================================

function buildPaginationKeyboard(
  type,
  ownerId,
  page,
  totalPages
) {
  const row = [];

  if (page > 0) {
    row.push({
      text: "‹ صفحه قبل",
      callback_data:
        `mlist:${type}:` +
        `${ownerId}:` +
        `${page - 1}`
    });
  }

  if (
    page + 1 <
    totalPages
  ) {
    row.push({
      text: "صفحه بعد ›",
      callback_data:
        `mlist:${type}:` +
        `${ownerId}:` +
        `${page + 1}`
    });
  }

  if (!row.length) {
    return [];
  }

  return [row];
}


// =====================================
// اجرای لیست
// =====================================

async function showModerationList(
  ctx,
  type
) {
  if (
    !isGroupChat(ctx)
  ) {
    return;
  }

  if (
    !(await checkExecutor(ctx))
  ) {
    return;
  }

  const group =
    getGroupData(ctx);

  if (!group) {
    return;
  }

  ensureModerationStorage(
    group
  );

  const ownerId =
    ctx.from.id;

  const result =
    buildListText(
      group,
      type,
      0
    );

  const keyboard =
    buildPaginationKeyboard(
      type,
      ownerId,
      result.data.page,
      result.data.totalPages
    );

  const sent =
    await replyToCommand(
      ctx,
      result.text,
      {
        parse_mode: "HTML",
        ...(keyboard.length
          ? {
              reply_markup: {
                inline_keyboard:
                  keyboard
              }
            }
          : {})
      }
    );

  const key =
    saveOpenList(
      ctx,
      type,
      ownerId,
      result.data.page
    );

  if (
    sent &&
    sent.message_id
  ) {
    openLists[key].messageId =
      sent.message_id;
  }
}


// =====================================
// بررسی مالک لیست
// =====================================

async function checkListOwner(
  ctx,
  ownerId
) {
  if (
    !ctx ||
    !ctx.from ||
    String(ctx.from.id) !==
      String(ownerId)
  ) {
    return false;
  }

  return (
    await isAdmin(
      ctx,
      ctx.from.id
    )
  );
}// =====================================
// تغییر صفحه لیست
// =====================================

async function changeModerationListPage(
  ctx,
  type,
  ownerId,
  page
) {
  if (!ctx || !ctx.chat) {
    return;
  }

  if (
    !(await checkListOwner(
      ctx,
      ownerId
    ))
  ) {
    try {
      await ctx.answerCbQuery();
    } catch (err) {}

    return;
  }

  const group =
    getGroupData(ctx);

  if (!group) {
    try {
      await ctx.answerCbQuery();
    } catch (err) {}

    return;
  }

  ensureModerationStorage(
    group
  );

  const result =
    buildListText(
      group,
      type,
      Number(page)
    );

  const keyboard =
    buildPaginationKeyboard(
      type,
      ownerId,
      result.data.page,
      result.data.totalPages
    );

  try {
    await ctx.editMessageText(
      result.text,
      {
        parse_mode: "HTML",
        ...(keyboard.length
          ? {
              reply_markup: {
                inline_keyboard:
                  keyboard
              }
            }
          : {})
      }
    );

    const key =
      getListKey(
        ctx.chat.id,
        ownerId,
        type
      );

    if (openLists[key]) {
      openLists[key].page =
        result.data.page;
    }

    await ctx.answerCbQuery();
  } catch (err) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}
  }
}


// =====================================
// بن
// =====================================

async function banUser(
  ctx,
  target,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (!group || !target) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
    );

    return false;
  }

  try {
    await ctx.telegram.banChatMember(
      ctx.chat.id,
      target.id
    );
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات نتوانست کاربر را بن کند."
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

  await replyToTarget(
    ctx,
    `『𓆩 ★ بن شد ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}`
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

  if (!group || !target) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
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
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nحذف بن انجام نشد."
    );

    return false;
  }

  group.moderation.bans =
    group.moderation.bans.filter(
      record =>
        String(record.userId) !==
        String(target.id)
    );

  saveModeration(group);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف بن شد ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}`
  );

  return true;
}


// =====================================
// اخراج
// =====================================

async function kickUser(
  ctx,
  target,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (!group || !target) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
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
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nاخراج کاربر انجام نشد."
    );

    return false;
  }

  saveKickRecord(
    group,
    target,
    ctx.from,
    reason
  );

  saveModeration(group);

  await replyToTarget(
    ctx,
    `『𓆩 ★ اخراج شد ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}`
  );

  return true;
}


// =====================================
// سکوت
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
    !duration
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
    );

    return false;
  }

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
        until_date:
          Math.floor(
            getEndTime(
              duration.minutes
            ) / 1000
          )
      }
    );
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nسکوت کاربر انجام نشد."
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

  await replyToTarget(
    ctx,
    `『𓆩 ★ سکوت شد ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}\n` +
      `⏳ مدت: ${durationText(
        duration
      )}`
  );

  return true;
}


// =====================================
// حذف سکوت
// =====================================

async function unmuteUser(
  ctx,
  target
) {
  const group =
    getGroupData(ctx);

  if (!group || !target) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
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
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nحذف سکوت انجام نشد."
    );

    return false;
  }

  group.moderation.mutes =
    group.moderation.mutes.filter(
      record =>
        String(record.userId) !==
        String(target.id)
    );

  saveModeration(group);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف سکوت ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}`
  );

  return true;
}


// =====================================
// خفه
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
    !duration
  ) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
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
        until_date:
          Math.floor(
            getEndTime(
              duration.minutes
            ) / 1000
          )
      }
    );
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nخفه کردن کاربر انجام نشد."
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

  await replyToTarget(
    ctx,
    `『𓆩 ★ خفه شد ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}\n` +
      `⏳ مدت: ${durationText(
        duration
      )}`
  );

  return true;
}


// =====================================
// حذف خفه
// =====================================

async function unkhafeUser(
  ctx,
  target
) {
  const group =
    getGroupData(ctx);

  if (!group || !target) {
    return false;
  }

  if (
    !(await checkBotPermissions(ctx))
  ) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nربات دسترسی مدیریت اعضا را ندارد."
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
  } catch (err) {
    await replyToCommand(
      ctx,
      "『𓆩 ★ خطا ★ 𓆪』\n\nحذف خفه انجام نشد."
    );

    return false;
  }

  group.moderation.khafe =
    group.moderation.khafe.filter(
      record =>
        String(record.userId) !==
        String(target.id)
    );

  saveModeration(group);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف خفه ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}`
  );

  return true;
}


// =====================================
// اخطار
// =====================================

async function warnUser(
  ctx,
  target,
  reason = ""
) {
  const group =
    getGroupData(ctx);

  if (!group || !target) {
    return false;
  }

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

  saveModeration(group);

  await replyToTarget(
    ctx,
    `『𓆩 ★ اخطار ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}\n` +
      `⚠️ تعداد اخطار: ${
        record.count
      }` +
      (
        reason
          ? `\n📝 دلیل: ${reason}`
          : ""
      )
  );

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

  if (!group || !target) {
    return false;
  }

  const result =
    removeWarningRecord(
      group,
      target
    );

  if (!result.found) {
    await replyToTarget(
      ctx,
      `『𓆩 ☆ اخطاری برای این کاربر ثبت نشده ☆ 𓆪』\n\n` +
        `${mentionUser(target)}`
    );

    return false;
  }

  saveModeration(group);

  await replyToTarget(
    ctx,
    `『𓆩 ★ حذف اخطار ★ 𓆪』\n\n` +
      `${mentionUser(target)}\n` +
      `🆔 ${target.id}\n` +
      `⚠️ اخطار باقی‌مانده: ${
        result.count
      }`
  );

  return true;
      }// =====================================
// پاکسازی کامل یک لیست
// =====================================

async function clearModerationList(
  ctx,
  type
) {
  if (
    !(await checkExecutor(ctx))
  ) {
    return;
  }

  const group =
    getGroupData(ctx);

  if (!group) {
    return;
  }

  ensureModerationStorage(
    group
  );

  let oldCount = 0;
  let title = "";

  if (type === "ban") {
    oldCount =
      group.moderation.bans.length;
    title = "بن";
    group.moderation.bans = [];
  }

  if (type === "mute") {
    oldCount =
      group.moderation.mutes.length;
    title = "سکوت";
    group.moderation.mutes = [];
  }

  if (type === "khafe") {
    oldCount =
      group.moderation.khafe.length;
    title = "خفه";
    group.moderation.khafe = [];
  }

  if (type === "warning") {
    oldCount =
      group.moderation.warnings.length;
    title = "اخطار";
    group.moderation.warnings = [];
  }

  if (type === "permission") {
    oldCount =
      group.moderation.permissions.length;
    title = "اختیار";
    group.moderation.permissions = [];
  }

  if (type === "kick") {
    oldCount =
      group.moderation.kicks.length;
    title = "اخراج";
    group.moderation.kicks = [];
  }

  saveModeration(group);

  await replyToCommand(
    ctx,
    `『𓆩 ★ پاکسازی ${title} ★ 𓆪』\n\n` +
      `تعداد رکوردهای پاک‌شده: ${oldCount}\n\n` +
      `『𓆩 ★ لیست ${title} پاک شد ★ 𓆪』`
  );
}


// =====================================
// فرمان‌های مدیریتی
// =====================================

function getCommandText(ctx) {
  if (
    !ctx ||
    !ctx.message
  ) {
    return "";
  }

  return String(
    ctx.message.text || ""
  ).trim();
}


function getCommandArgs(ctx) {
  const text =
    getCommandText(ctx);

  if (!text) return [];

  const parts =
    text.split(/\s+/);

  return parts.slice(1);
}


function getReasonFromArgs(
  args,
  durationUsed
) {
  if (
    !Array.isArray(args)
  ) {
    return "";
  }

  let start = 0;

  if (durationUsed) {
    if (
      args.length >= 1 &&
      /^\d{1,2}$/.test(
        args[0]
      )
    ) {
      start = 1;
    } else if (
      args.length >= 2 &&
      /^\d{1,2}$/.test(
        args[0]
      ) &&
      /دقیقه|minute|min/i.test(
        args[1]
      )
    ) {
      start = 2;
    }
  }

  return args
    .slice(start)
    .join(" ")
    .trim();
}


// =====================================
// ثبت فرمان‌ها
// =====================================

function registerModeration(
  bot
) {
  if (!bot) return;

  // -----------------------------------
  // بن
  // -----------------------------------

  bot.hears(
    /^بن(?:\s+(.+))?$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const args =
        getCommandArgs(ctx);

      const target =
        resolveTarget(
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

      const reason =
        args.length
          ? args.join(" ")
          : "";

      await banUser(
        ctx,
        target,
        reason
      );
    }
  );


  // -----------------------------------
  // حذف بن
  // -----------------------------------

  bot.hears(
    /^حذف\s*بن$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      await unbanUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // اخراج
  // -----------------------------------

  bot.hears(
    /^اخراج(?:\s+(.+))?$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const args =
        getCommandArgs(ctx);

      const target =
        resolveTarget(
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

      const reason =
        args.length
          ? args.join(" ")
          : "";

      await kickUser(
        ctx,
        target,
        reason
      );
    }
  );


  // -----------------------------------
  // سکوت
  // -----------------------------------

  bot.hears(
    /^سکوت(?:\s+(.+))?$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const args =
        getCommandArgs(ctx);

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      const durationArgs =
        args.filter(
          item =>
            /^\d{1,2}$/.test(item) ||
            /دقیقه|minute|min/i.test(
              item
            )
        );

      const duration =
        parseMuteDuration(
          durationArgs
        );

      if (!duration) {
        await replyToCommand(
          ctx,
          "『𓆩 ★ مدت سکوت ★ 𓆪』\n\n" +
            "ساعت: ۱ تا ۱۰\n" +
            "دقیقه: ۱۰ تا ۴۵\n\n" +
            "مثال:\n" +
            "سکوت 1\n" +
            "سکوت 5\n" +
            "سکوت 10\n" +
            "سکوت 15 دقیقه\n" +
            "سکوت 30 دقیقه\n" +
            "سکوت 45 دقیقه"
        );

        return;
      }

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
    }
  );


  // -----------------------------------
  // حذف سکوت
  // -----------------------------------

  bot.hears(
    /^حذف\s*سکوت$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      await unmuteUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // خفه
  // -----------------------------------

  bot.hears(
    /^خفه(?:\s+(.+))?$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const args =
        getCommandArgs(ctx);

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      const durationArgs =
        args.filter(
          item =>
            /^\d{1,2}$/.test(item) ||
            /دقیقه|minute|min/i.test(
              item
            )
        );

      const duration =
        parseMuteDuration(
          durationArgs
        );

      if (!duration) {
        await replyToCommand(
          ctx,
          "『𓆩 ★ مدت خفه ★ 𓆪』\n\n" +
            "ساعت: ۱ تا ۱۰\n" +
            "دقیقه: ۱۰ تا ۴۵"
        );

        return;
      }

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
    }
  );


  // -----------------------------------
  // حذف خفه
  // -----------------------------------

  bot.hears(
    /^حذف\s*خفه$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      await unkhafeUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // اخطار
  // -----------------------------------

  bot.hears(
    /^اخطار(?:\s+(.+))?$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const args =
        getCommandArgs(ctx);

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      const reason =
        args.join(" ");

      await warnUser(
        ctx,
        target,
        reason
      );
    }
  );


  // -----------------------------------
  // حذف اخطار
  // -----------------------------------

  bot.hears(
    /^حذف\s*اخطار$/i,
    async ctx => {
      if (
        !(await checkExecutor(ctx))
      ) {
        return;
      }

      const target =
        resolveTarget(ctx);

      if (
        !(await checkTarget(
          ctx,
          target
        ))
      ) {
        return;
      }

      await unwarnUser(
        ctx,
        target
      );
    }
  );


  // -----------------------------------
  // لیست‌ها
  // -----------------------------------

  bot.hears(
    /^لیست\s+بن$/i,
    ctx =>
      showModerationList(
        ctx,
        "ban"
      )
  );


  bot.hears(
    /^لیست\s+سکوت$/i,
    ctx =>
      showModerationList(
        ctx,
        "mute"
      )
  );


  bot.hears(
    /^لیست\s+خفه$/i,
    ctx =>
      showModerationList(
        ctx,
        "khafe"
      )
  );


  bot.hears(
    /^لیست\s+اخطار$/i,
    ctx =>
      showModerationList(
        ctx,
        "warning"
      )
  );


  bot.hears(
    /^لیست\s+اختیار$/i,
    ctx =>
      showModerationList(
        ctx,
        "permission"
      )
  );


  bot.hears(
    /^لیست\s+اخراج$/i,
    ctx =>
      showModerationList(
        ctx,
        "kick"
      )
  );


  // -----------------------------------
  // پاکسازی‌ها
  // -----------------------------------

  bot.hears(
    /^پاکسازی\s+بن$/i,
    ctx =>
      clearModerationList(
        ctx,
        "ban"
      )
  );


  bot.hears(
    /^پاکسازی\s+سکوت$/i,
    ctx =>
      clearModerationList(
        ctx,
        "mute"
      )
  );


  bot.hears(
    /^پاکسازی\s+خفه$/i,
    ctx =>
      clearModerationList(
        ctx,
        "khafe"
      )
  );


  bot.hears(
    /^پاکسازی\s+اخطار$/i,
    ctx =>
      clearModerationList(
        ctx,
        "warning"
      )
  );


  bot.hears(
    /^پاکسازی\s+اختیار$/i,
    ctx =>
      clearModerationList(
        ctx,
        "permission"
      )
  );


  bot.hears(
    /^پاکسازی\s+اخراج$/i,
    ctx =>
      clearModerationList(
        ctx,
        "kick"
      )
  );


  // -----------------------------------
  // صفحه‌بندی
  // -----------------------------------

  bot.action(
    /^mlist:(ban|mute|khafe|warning|permission|kick):(\d+):(\d+)$/,
    async ctx => {
      const type =
        ctx.match[1];

      const ownerId =
        ctx.match[2];

      const page =
        Number(ctx.match[3]);

      await changeModerationListPage(
        ctx,
        type,
        ownerId,
        page
      );
    }
  );
}


// =====================================
// ثبت اکشن‌های صفحه‌بندی جداگانه
// =====================================

function registerModerationActions(
  bot
) {
  if (!bot) return;

  bot.action(
    /^mlist:(ban|mute|khafe|warning|permission|kick):(\d+):(\d+)$/,
    async ctx => {
      const type =
        ctx.match[1];

      const ownerId =
        ctx.match[2];

      const page =
        Number(ctx.match[3]);

      await changeModerationListPage(
        ctx,
        type,
        ownerId,
        page
      );
    }
  );
}


// =====================================
// خروجی‌ها
// =====================================

module.exports = {
  registerModeration,
  registerModerationActions,

  banUser,
  unbanUser,

  kickUser,

  muteUser,
  unmuteUser,

  khafeUser,
  unkhafeUser,

  warnUser,
  unwarnUser,

  showModerationList,
  clearModerationList,

  resolveTarget,
  getReplyTarget,

  rememberUser,
  rememberUserInGroup,

  parseMuteDuration,
  durationText,

  ensureModerationStorage,
  getModerationList
};
