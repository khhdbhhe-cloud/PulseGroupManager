// =====================================
// PulseGroupManager
// MODERATION
// بن | سیک | اخراج | سکوت | خفه | اخطار
// لیست‌ها | پاکسازی | Reply
// =====================================

const { getGroup, saveDB } = require("./database");

const knownUsers = {};
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

  if (!Array.isArray(group.moderation.kicks)) {
    group.moderation.kicks = [];
  }

  if (!Array.isArray(group.moderation.permissions)) {
    group.moderation.permissions = [];
  }

  if (!group.moderation.warningSettings) {
    group.moderation.warningSettings = {
      maxWarnings: 3,
      punishment: "none"
    };
  }

  if (
    !Number.isInteger(
      Number(
        group.moderation.warningSettings.maxWarnings
      )
    ) ||
    Number(
      group.moderation.warningSettings.maxWarnings
    ) < 1
  ) {
    group.moderation.warningSettings.maxWarnings = 3;
  }

  return group;
}

// =====================================
// ذخیره مدیریت
// =====================================

function saveModeration(group) {
  if (!group) return;

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
  if (!user || !user.id) {
    return null;
  }

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
  if (!group || !user || !user.id) {
    return null;
  }

  if (
    !group.users ||
    typeof group.users !== "object"
  ) {
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
  if (!ctx || !ctx.from) {
    return null;
  }

  const group = getGroupData(ctx);

  rememberUser(ctx.from);

  if (group) {
    rememberUserInGroup(
      group,
      ctx.from
    );
  }

  return ctx.from;
}

// =====================================
// بارگذاری کاربران شناخته‌شده گروه
// =====================================

function loadGroupKnownUsers(group) {
  if (!group) return;

  if (
    !group.users ||
    typeof group.users !== "object"
  ) {
    group.users = {};
  }

  for (
    const id of Object.keys(group.users)
  ) {
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
  if (!user) {
    return "کاربر";
  }

  const first =
    String(user.first_name || "").trim();

  const last =
    String(user.last_name || "").trim();

  const name =
    `${first} ${last}`.trim();

  return name || "کاربر";
}

// =====================================
// نمایش کاربر
// =====================================

function mentionUser(user) {
  if (!user || !user.id) {
    return "کاربر";
  }

  return (
    `<a href="tg://user?id=${user.id}">` +
    `${getUserName(user)}` +
    `</a>`
  );
}

// =====================================
// نام مناسب برای لیست
// یوزرنیم → @username
// بدون یوزرنیم → اسم اصلی
// =====================================

function getListUserLabel(user) {
  if (!user) {
    return "کاربر";
  }

  if (user.username) {
    return (
      "@" +
      String(user.username)
        .replace(/^@/, "")
    );
  }

  return getUserName(user);
}

// =====================================
// پیام مورد Reply
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
// کاربر مورد Reply
// =====================================

function getReplyTarget(ctx) {
  const message =
    getTargetMessage(ctx);

  if (
    !message ||
    !message.from ||
    !message.from.id
  ) {
    return null;
  }

  const user = message.from;

  rememberUser(user);

  const group =
    getGroupData(ctx);

  if (group) {
    rememberUserInGroup(
      group,
      user
    );
  }

  return user;
}

// =====================================
// شناسه پیام مورد Reply
// =====================================

function getTargetReplyId(ctx) {
  const message =
    getTargetMessage(ctx);

  if (
    !message ||
    !message.message_id
  ) {
    return null;
  }

  return message.message_id;
}

// =====================================
// نرمال‌سازی اعداد
// =====================================

function normalizeDigits(value) {
  return String(value || "")
    .replace(
      /[۰-۹]/g,
      digit =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
        )
    )
    .replace(
      /[٠-٩]/g,
      digit =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
        )
    );
}

// =====================================
// اعداد فارسی
// =====================================

const persianNumbers = {
  "صفر": 0,
  "یک": 1,
  "یه": 1,
  "اول": 1,
  "دو": 2,
  "سه": 3,
  "چهار": 4,
  "پنج": 5,
  "شش": 6,
  "شیش": 6,
  "هفت": 7,
  "هشت": 8,
  "نه": 9,
  "ده": 10,
  "یازده": 11,
  "دوازده": 12,
  "سیزده": 13,
  "چهارده": 14,
  "پانزده": 15,
  "پونزده": 15,
  "شانزده": 16,
  "هفده": 17,
  "هجده": 18,
  "نوزده": 19,
  "بیست": 20,
  "سی": 30,
  "چهل": 40
};

// =====================================
// تبدیل کلمه عددی
// =====================================

function numberFromWord(value) {
  const text =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    Object.prototype.hasOwnProperty.call(
      persianNumbers,
      text
    )
  ) {
    return persianNumbers[text];
  }

  const number =
    Number(
      normalizeDigits(text)
    );

  return Number.isFinite(number)
    ? number
    : null;
}

// =====================================
// پیدا کردن کاربر با ID
// =====================================

function findKnownUserById(id) {
  if (!id) {
    return null;
  }

  return (
    knownUsers[String(id)] ||
    null
  );
}

// =====================================
// پیدا کردن کاربر با Username
// =====================================

function findKnownUserByUsername(
  username
) {
  if (!username) {
    return null;
  }

  const wanted =
    String(username)
      .replace(/^@/, "")
      .toLowerCase();

  for (
    const id of Object.keys(knownUsers)
  ) {
    const user =
      knownUsers[id];

    if (
      user &&
      user.username &&
      String(user.username)
        .toLowerCase() === wanted
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
  const wanted =
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (!wanted) {
    return null;
  }

  for (
    const id of Object.keys(knownUsers)
  ) {
    const user =
      knownUsers[id];

    if (!user) {
      continue;
    }

    const fullName =
      `${user.first_name || ""} ` +
      `${user.last_name || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (
      fullName === wanted ||
      String(
        user.first_name || ""
      ).toLowerCase() === wanted ||
      String(
        user.last_name || ""
      ).toLowerCase() === wanted
    ) {
      return user;
    }
  }

  return null;
}

// =====================================
// پیدا کردن کاربر گروه با ID
// =====================================

function findGroupUserById(
  group,
  id
) {
  if (
    !group ||
    !group.users ||
    !id
  ) {
    return null;
  }

  return (
    group.users[String(id)] ||
    null
  );
}

// =====================================
// پیدا کردن کاربر گروه با Username
// =====================================

function findGroupUserByUsername(
  group,
  username
) {
  if (
    !group ||
    !group.users ||
    !username
  ) {
    return null;
  }

  const wanted =
    String(username)
      .replace(/^@/, "")
      .toLowerCase();

  for (
    const id of Object.keys(group.users)
  ) {
    const user =
      group.users[id];

    if (
      user &&
      user.username &&
      String(user.username)
        .toLowerCase() === wanted
    ) {
      return user;
    }
  }

  return null;
}

// =====================================
// پیدا کردن کاربر گروه با نام
// =====================================

function findGroupUserByName(
  group,
  name
) {
  if (
    !group ||
    !group.users ||
    !name
  ) {
    return null;
  }

  const wanted =
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (!wanted) {
    return null;
  }

  for (
    const id of Object.keys(group.users)
  ) {
    const user =
      group.users[id];

    if (!user) {
      continue;
    }

    const fullName =
      `${user.first_name || ""} ` +
      `${user.last_name || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (
      fullName === wanted ||
      String(
        user.first_name || ""
      ).toLowerCase() === wanted ||
      String(
        user.last_name || ""
      ).toLowerCase() === wanted
    ) {
      return user;
    }
  }

  return null;
}

// =====================================
// پیدا کردن Text Mention
// =====================================

function getTextMentionUser(message) {
  if (
    !message ||
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
      return entity.user;
    }
  }

  return null;
}

// =====================================
// متن پیام
// =====================================

function getMessageText(message) {
  if (!message) {
    return "";
  }

  return String(
    message.text ||
    message.caption ||
    ""
  ).trim();
}

// =====================================
// گرفتن Username از متن
// =====================================

function getUsernameFromText(text) {
  const match =
    String(text || "").match(
      /@([a-zA-Z0-9_]{5,32})/
    );

  return match
    ? match[1]
    : null;
}

// =====================================
// گرفتن ID از متن
// =====================================

function getIdFromText(text) {
  const match =
    normalizeDigits(text).match(
      /\b\d{5,20}\b/
    );

  return match
    ? match[0]
    : null;
}

// =====================================
// پیدا کردن هدف از محتوای Reply
// =====================================

function resolveTargetFromReplyContent(ctx) {
  const message =
    getTargetMessage(ctx);

  if (!message) {
    return null;
  }

  // اگر خود پیام از طرف کاربر باشد
  if (
    message.from &&
    message.from.id
  ) {
    return getReplyTarget(ctx);
  }

  // اگر Text Mention باشد
  const mentioned =
    getTextMentionUser(message);

  if (
    mentioned &&
    mentioned.id
  ) {
    const group =
      getGroupData(ctx);

    rememberUser(mentioned);

    if (group) {
      rememberUserInGroup(
        group,
        mentioned
      );
    }

    return mentioned;
  }

  const text =
    getMessageText(message);

  const group =
    getGroupData(ctx);

  // @username
  const username =
    getUsernameFromText(text);

  if (username) {
    return (
      findGroupUserByUsername(
        group,
        username
      ) ||
      findKnownUserByUsername(
        username
      ) ||
      null
    );
  }

  // ID
  const id =
    getIdFromText(text);

  if (id) {
    return (
      findGroupUserById(
        group,
        id
      ) ||
      findKnownUserById(id) ||
      null
    );
  }

  // نام
  return (
    findGroupUserByName(
      group,
      text
    ) ||
    findKnownUserByName(text) ||
    null
  );
}

// =====================================
// پیدا کردن هدف
// فقط از Reply
// =====================================

function resolveTarget(ctx) {
  if (!ctx) {
    return null;
  }

  learnUserFromMessage(ctx);

  const group =
    getGroupData(ctx);

  if (group) {
    loadGroupKnownUsers(group);
  }

  return resolveTargetFromReplyContent(
    ctx
  );
}

// =====================================
// نقش کاربر در گروه
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
      member.status === "administrator"
    ) {
      return "admin";
    }
  } catch {}

  return "member";
}

// =====================================
// بررسی مالک
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
// بررسی ادمین
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
// بررسی اجراکننده فرمان
// =====================================

async function checkExecutor(ctx) {
  if (
    !isGroupChat(ctx)
  ) {
    return false;
  }

  if (
    !ctx.from ||
    !ctx.from.id
  ) {
    return false;
  }

  learnUserFromMessage(ctx);

  return await isAdmin(
    ctx,
    ctx.from.id
  );
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

  // بدون Reply کاملاً ساکت
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
    const me =
      await ctx.telegram.getMe();

    if (
      !me ||
      !me.id
    ) {
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

    if (
      member.status === "creator"
    ) {
      return true;
    }

    return (
      member.status ===
        "administrator" &&
      member.can_restrict_members === true
    );
  } catch {
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

  return (
    list.find(
      item =>
        item &&
        String(item.userId) ===
          String(userId)
    ) ||
    null
  );
}

// =====================================
// پردازش مدت سکوت
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
    normalizeDigits(
      args.join(" ").trim().toLowerCase()
    ).replace(
      /\s+/g,
      " "
    );

  // -----------------------------
  // فقط عدد = ساعت
  // مثال: سکوت 1
  // -----------------------------

  let match =
    text.match(
      /^(\d{1,2})$/
    );

  if (match) {
    const hours =
      Number(match[1]);

    if (
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

  // -----------------------------
  // ساعت
  // مثال: یک ساعت
  // مثال: 2 ساعت
  // -----------------------------

  match =
    text.match(
      /^(.+?)\s*(ساعت|ساعته|ساعتە)$/
    );

  if (match) {
    const hours =
      numberFromWord(
        match[1]
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
  }

  // -----------------------------
  // دقیقه
  // مثال: 15 دقیقه
  // مثال: پونزده دقیقه
  // -----------------------------

  match =
    text.match(
      /^(.+?)\s*(دقیقه|دقیقه‌ای|دقیقه ای|min|minute|minutes)$/i
    );

  if (match) {
    const minutes =
      numberFromWord(
        match[1]
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
    Number(minutes) *
      60 *
      1000
  );
}

// =====================================
// مدت باقی‌مانده
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
}

// =====================================
// پاکسازی سکوت‌های منقضی
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

  const before =
    group.moderation.mutes.length;

  group.moderation.mutes =
    group.moderation.mutes.filter(
  
