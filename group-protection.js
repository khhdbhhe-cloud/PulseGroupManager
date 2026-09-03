// =====================================
// PulseGroupManager
// GROUP PROTECTION
// قفل لینک | قفل لینک مدیران
// قفل گروه | ضد خیانت
// =====================================

const {
  getGroup,
  getPermissions,
  saveDB
} = require("./database");

// =====================================
// تنظیمات اصلی
// =====================================

const LINK_ACTIONS = {
  delete: "حذف پیام",
  warn: "اخطار",
  mute: "سکوت",
  ban: "بن"
};

const ANTI_BETRAYAL_MINUTES = [
  3, 4, 5, 6, 7, 8, 9, 10
];

const DEFAULT_LINK_ACTION = "delete";

const DEFAULT_ANTI_BETRAYAL_LIMIT = 3;

const DEFAULT_ANTI_BETRAYAL_MINUTES = 3;

const DEFAULT_ANTI_BETRAYAL_ACTION = "demote";

// =====================================
// تشخیص گروه
// =====================================

function isGroup(ctx) {
  if (!ctx || !ctx.chat) {
    return false;
  }

  return (
    ctx.chat.type === "group" ||
    ctx.chat.type === "supergroup"
  );
}

// =====================================
// تشخیص نقش کاربر
// =====================================

async function getRole(ctx, userId) {
  try {
    if (!isGroup(ctx)) {
      return "member";
    }

    const member =
      await ctx.telegram.getChatMember(
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

  } catch (error) {
    console.log(
      "GROUP PROTECTION ROLE ERROR:",
      error.message
    );

    return "member";
  }
}

// =====================================
// آماده‌سازی تنظیمات
// =====================================

function ensureProtectionSettings(chatId) {

  const group = getGroup(chatId);

  if (
    !group.protection ||
    typeof group.protection !== "object" ||
    Array.isArray(group.protection)
  ) {
    group.protection = {};
  }

  const defaults = {

    linkLock: false,

    adminLinkLock: false,

    groupLock: false,

    linkAction: DEFAULT_LINK_ACTION,

    antiBetrayal: false,

    antiBetrayalLimit:
      DEFAULT_ANTI_BETRAYAL_LIMIT,

    antiBetrayalMinutes:
      DEFAULT_ANTI_BETRAYAL_MINUTES,

    antiBetrayalAction:
      DEFAULT_ANTI_BETRAYAL_ACTION,

    antiBetrayalBans: {}

  };

  let changed = false;

  for (
    const key of Object.keys(defaults)
  ) {

    if (
      typeof group.protection[key] ===
      "undefined"
    ) {

      group.protection[key] =
        defaults[key];

      changed = true;
    }
  }

  if (
    !LINK_ACTIONS[
      group.protection.linkAction
    ]
  ) {

    group.protection.linkAction =
      DEFAULT_LINK_ACTION;

    changed = true;
  }

  if (
    !Number.isInteger(
      Number(
        group.protection
          .antiBetrayalLimit
      )
    ) ||
    Number(
      group.protection
        .antiBetrayalLimit
    ) < 1
  ) {

    group.protection
      .antiBetrayalLimit =
        DEFAULT_ANTI_BETRAYAL_LIMIT;

    changed = true;
  }

  if (
    !ANTI_BETRAYAL_MINUTES.includes(
      Number(
        group.protection
          .antiBetrayalMinutes
      )
    )
  ) {

    group.protection
      .antiBetrayalMinutes =
        DEFAULT_ANTI_BETRAYAL_MINUTES;

    changed = true;
  }

  if (
    !group.protection
      .antiBetrayalBans ||
    typeof group.protection
      .antiBetrayalBans !== "object" ||
    Array.isArray(
      group.protection
        .antiBetrayalBans
    )
  ) {

    group.protection
      .antiBetrayalBans = {};

    changed = true;
  }

  if (changed) {
    saveDB();
  }

  return group;
}

// =====================================
// دریافت تنظیم
// =====================================

function getProtectionValue(
  chatId,
  key
) {

  const group =
    ensureProtectionSettings(
      chatId
    );

  return group.protection[key];
}

// =====================================
// تغییر تنظیم
// =====================================

function setProtectionValue(
  chatId,
  key,
  value
) {

  const group =
    ensureProtectionSettings(
      chatId
    );

  group.protection[key] = value;

  saveDB();

  return group.protection[key];
}

// =====================================
// تشخیص مالک
// =====================================

async function isOwner(ctx) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  return role === "owner";
}

// =====================================
// دسترسی مدیریت قفل لینک
// =====================================

async function canManageLinkLock(
  ctx
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  if (role === "owner") {
    return true;
  }

  if (role === "admin") {

    const permissions =
      getPermissions(
        ctx.chat.id,
        ctx.from.id
      );

    return Boolean(
      permissions &&
      (
        permissions.links === true ||
        permissions.linkLock === true
      )
    );
  }

  return false;
}

// =====================================
// دسترسی مدیریت قفل گروه
// =====================================

async function canManageGroupLock(
  ctx
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  if (role === "owner") {
    return true;
  }

  if (role === "admin") {

    const permissions =
      getPermissions(
        ctx.chat.id,
        ctx.from.id
      );

    return Boolean(
      permissions &&
      (
        permissions.groupLock === true ||
        permissions.group === true
      )
    );
  }

  return false;
}

// =====================================
// مدیریت ضد خیانت فقط مالک
// =====================================

async function canManageAntiBetrayal(
  ctx
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  return role === "owner";
}

// =====================================
// نام نمایشی کاربر
// =====================================

function getUserDisplayName(user) {

  if (!user) {
    return "کاربر";
  }

  if (user.username) {
    return `@${user.username}`;
  }

  const firstName =
    typeof user.first_name === "string"
      ? user.first_name.trim()
      : "";

  const lastName =
    typeof user.last_name === "string"
      ? user.last_name.trim()
      : "";

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  if (fullName) {
    return fullName;
  }

  return "کاربر";
}

// =====================================
// نام قابل کلیک کاربر
// =====================================

function getUserMention(user) {

  if (!user || !user.id) {
    return "کاربر";
  }

  const name =
    getUserDisplayName(user)
      .replace(/[\[\]]/g, "");

  return `[${name}](tg://user?id=${user.id})`;
}

// =====================================
// پاسخ به پیام دستور
// =====================================

async function replyToCommand(
  ctx,
  text
) {

  try {

    if (
      !ctx ||
      !ctx.message ||
      !ctx.message.message_id
    ) {
      return;
    }

    await ctx.reply(
      text,
      {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id:
            ctx.message.message_id
        }
      }
    );

  } catch (error) {

    console.log(
      "GROUP PROTECTION REPLY ERROR:",
      error.message
    );
  }
}

// =====================================
// بررسی مدیر یا مالک بودن فرستنده
// =====================================

async function isAdminOrOwner(
  ctx
) {

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  return (
    role === "owner" ||
    role === "admin"
  );
}

// =====================================
// تشخیص لینک در متن
// =====================================

function containsLink(text) {

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    return false;
  }

  const value =
    text.trim();

  const patterns = [

    /https?:\/\/[^\s]+/i,

    /www\.[^\s]+/i,

    /t\.me\/[^\s]+/i,

    /telegram\.me\/[^\s]+/i,

    /telegram\.dog\/[^\s]+/i,

    /instagram\.com\/[^\s]+/i,

    /instagr\.am\/[^\s]+/i,

    /discord\.gg\/[^\s]+/i,

    /discord\.com\/[^\s]+/i,

    /wa\.me\/[^\s]+/i,

    /chat\.whatsapp\.com\/[^\s]+/i,

    /bit\.ly\/[^\s]+/i,

    /tinyurl\.com\/[^\s]+/i,

    /t\.co\/[^\s]+/i,

    /vk\.com\/[^\s]+/i,

    /facebook\.com\/[^\s]+/i,

    /fb\.com\/[^\s]+/i,

    /youtube\.com\/[^\s]+/i,

    /youtu\.be\/[^\s]+/i

  ];

  return patterns.some(
    pattern =>
      pattern.test(value)
  );
}

// =====================================
// تشخیص لینک داخل Entity
// =====================================

function hasUrlEntity(
  message
) {

  if (!message) {
    return false;
  }

  const entities = [
    ...(Array.isArray(message.entities)
      ? message.entities
      : []),

    ...(Array.isArray(
      message.caption_entities
    )
      ? message.caption_entities
      : [])
  ];

  return entities.some(
    entity =>
      entity &&
      (
        entity.type === "url" ||
        entity.type === "text_link"
      )
  );
}

// =====================================
// تشخیص لینک کامل پیام
// =====================================

function messageContainsLink(
  message
) {

  if (!message) {
    return false;
  }

  if (
    typeof message.text === "string" &&
    containsLink(message.text)
  ) {
    return true;
  }

  if (
    typeof message.caption === "string" &&
    containsLink(message.caption)
  ) {
    return true;
  }

  return hasUrlEntity(message);
}// =====================================
// تشخیص لینک در انواع پیام
// =====================================

function messageHasLink(message) {

  if (!message) {
    return false;
  }

  if (messageContainsLink(message)) {
    return true;
  }

  if (
    message.entities &&
    Array.isArray(message.entities)
  ) {
    if (
      message.entities.some(
        entity =>
          entity.type === "url" ||
          entity.type === "text_link"
      )
    ) {
      return true;
    }
  }

  if (
    message.caption_entities &&
    Array.isArray(message.caption_entities)
  ) {
    if (
      message.caption_entities.some(
        entity =>
          entity.type === "url" ||
          entity.type === "text_link"
      )
    ) {
      return true;
    }
  }

  return false;
}

// =====================================
// حذف پیام
// =====================================

async function deleteMessage(
  ctx
) {

  try {

    if (
      !ctx ||
      !ctx.message ||
      !ctx.message.message_id
    ) {
      return false;
    }

    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      ctx.message.message_id
    );

    return true;

  } catch (error) {

    console.log(
      "GROUP PROTECTION DELETE ERROR:",
      error.message
    );

    return false;
  }
}

// =====================================
// سکوت کاربر
// =====================================

async function muteUser(
  ctx,
  userId,
  durationMinutes = 60
) {

  try {

    const untilDate =
      Math.floor(
        Date.now() / 1000
      ) +
      (
        Number(durationMinutes) *
        60
      );

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      userId,
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

    return true;

  } catch (error) {

    console.log(
      "GROUP PROTECTION MUTE ERROR:",
      error.message
    );

    return false;
  }
}

// =====================================
// بن کاربر
// =====================================

async function banUser(
  ctx,
  userId
) {

  try {

    await ctx.telegram.banChatMember(
      ctx.chat.id,
      userId
    );

    return true;

  } catch (error) {

    console.log(
      "GROUP PROTECTION BAN ERROR:",
      error.message
    );

    return false;
  }
}

// =====================================
// دِموت مدیر
// =====================================

async function demoteAdmin(
  ctx,
  userId
) {

  try {

    await ctx.telegram.promoteChatMember(
      ctx.chat.id,
      userId,
      {
        can_manage_chat: false,
        can_delete_messages: false,
        can_manage_video_chats: false,
        can_restrict_members: false,
        can_promote_members: false,
        can_change_info: false,
        can_invite_users: false,
        can_post_messages: false,
        can_edit_messages: false,
        can_pin_messages: false,
        can_manage_topics: false
      }
    );

    return true;

  } catch (error) {

    console.log(
      "GROUP PROTECTION DEMOTE ERROR:",
      error.message
    );

    return false;
  }
}

// =====================================
// ثبت اخطار
// =====================================

function addWarning(
  chatId,
  userId
) {

  const group =
    getGroup(chatId);

  if (
    !group.protection ||
    typeof group.protection !==
      "object"
  ) {
    ensureProtectionSettings(
      chatId
    );
  }

  if (
    !group.protection.warnings ||
    typeof group.protection.warnings !==
      "object"
  ) {
    group.protection.warnings = {};
  }

  const id =
    String(userId);

  group.protection.warnings[id] =
    Number(
      group.protection.warnings[id] || 0
    ) + 1;

  saveDB();

  return group.protection.warnings[id];
}

// =====================================
// اعمال مجازات لینک
// =====================================

async function applyLinkAction(
  ctx,
  user
) {

  const action =
    getProtectionValue(
      ctx.chat.id,
      "linkAction"
    );

  const userId =
    user.id;

  if (action === "warn") {

    const count =
      addWarning(
        ctx.chat.id,
        userId
      );

    return {
      action,
      success: true,
      count
    };
  }

  if (action === "mute") {

    const success =
      await muteUser(
        ctx,
        userId,
        60
      );

    return {
      action,
      success
    };
  }

  if (action === "ban") {

    const success =
      await banUser(
        ctx,
        userId
      );

    return {
      action,
      success
    };
  }

  return {
    action: "delete",
    success: true
  };
}

// =====================================
// پیام نتیجه لینک
// =====================================

function buildLinkActionMessage(
  user,
  result
) {

  const mention =
    getUserMention(user);

  if (
    !result ||
    result.action === "delete"
  ) {

    return (
      `کاربر گرامی ${mention}، ` +
      `به دلیل لینک‌های نامناسب در گروه ` +
      `پیام شما حذف شد.`
    );
  }

  if (result.action === "warn") {

    return (
      `کاربر گرامی ${mention}، ` +
      `به دلیل ارسال لینک در گروه ` +
      `برای شما اخطار ثبت شد.\n\n` +
      `تعداد اخطار: ${result.count}`
    );
  }

  if (result.action === "mute") {

    return (
      `کاربر گرامی ${mention}، ` +
      `به دلیل ارسال لینک در گروه ` +
      `شما به مدت ۶۰ دقیقه سکوت شدید.`
    );
  }

  if (result.action === "ban") {

    return (
      `کاربر گرامی ${mention}، ` +
      `به دلیل ارسال لینک در گروه ` +
      `از گروه بن شدید.`
    );
  }

  return (
    `کاربر گرامی ${mention}، ` +
    `پیام شما به دلیل ارسال لینک حذف شد.`
  );
}

// =====================================
// اطلاع‌رسانی لینک
// =====================================

async function notifyLinkAction(
  ctx,
  user,
  result
) {

  try {

    const text =
      buildLinkActionMessage(
        user,
        result
      );

    await ctx.telegram.sendMessage(
      ctx.chat.id,
      text,
      {
        parse_mode: "Markdown"
      }
    );

  } catch (error) {

    console.log(
      "GROUP PROTECTION LINK NOTICE ERROR:",
      error.message
    );
  }
}

// =====================================
// پردازش لینک کاربر
// =====================================

async function handleLinkMessage(
  ctx
) {

  if (!isGroup(ctx)) {
    return false;
  }

  if (!ctx.message) {
    return false;
  }

  if (
    !messageHasLink(
      ctx.message
    )
  ) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  // مالک همیشه مجاز است
  if (role === "owner") {
    return false;
  }

  // مدیر فقط در صورت روشن بودن
  // قفل لینک مدیران مشمول قفل می‌شود
  if (role === "admin") {

    const adminLinkLock =
      Boolean(
        getProtectionValue(
          ctx.chat.id,
          "adminLinkLock"
        )
      );

    if (!adminLinkLock) {
      return false;
    }
  }

  // اگر قفل لینک خاموش است
  // کاربران عادی آزاد هستند
  if (
    role === "member" &&
    !getProtectionValue(
      ctx.chat.id,
      "linkLock"
    )
  ) {
    return false;
  }

  // حذف فوری پیام
  await deleteMessage(ctx);

  // اعمال مجازات
  const result =
    await applyLinkAction(
      ctx,
      ctx.from
    );

  // اطلاع‌رسانی
  await notifyLinkAction(
    ctx,
    ctx.from,
    result
  );

  return true;
}// =====================================
// تشخیص بن‌های مدیران
// =====================================

function recordAdminBan(
  chatId,
  adminId,
  targetId
) {

  const group =
    ensureProtectionSettings(
      chatId
    );

  const now =
    Date.now();

  const adminKey =
    String(adminId);

  if (
    !group.protection
      .antiBetrayalBans[adminKey]
  ) {

    group.protection
      .antiBetrayalBans[adminKey] = [];
  }

  group.protection
    .antiBetrayalBans[adminKey]
    .push({
      targetId: String(targetId),
      time: now
    });

  const minutes =
    Number(
      group.protection
        .antiBetrayalMinutes
    );

  const limitTime =
    now -
    (
      minutes *
      60 *
      1000
    );

  group.protection
    .antiBetrayalBans[adminKey] =
    group.protection
      .antiBetrayalBans[adminKey]
      .filter(
        item =>
          item &&
          Number(item.time) >=
            limitTime
      );

  saveDB();

  return group.protection
    .antiBetrayalBans[adminKey]
    .length;
}

// =====================================
// بررسی رسیدن مدیر به حد خیانت
// =====================================

async function checkAntiBetrayal(
  ctx,
  adminId
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const enabled =
    Boolean(
      getProtectionValue(
        ctx.chat.id,
        "antiBetrayal"
      )
    );

  if (!enabled) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      adminId
    );

  // مالک هیچ‌وقت مشمول ضد خیانت نیست
  if (role === "owner") {
    return false;
  }

  if (role !== "admin") {
    return false;
  }

  const group =
    ensureProtectionSettings(
      ctx.chat.id
    );

  const adminKey =
    String(adminId);

  const records =
    group.protection
      .antiBetrayalBans[
        adminKey
      ] || [];

  const minutes =
    Number(
      group.protection
        .antiBetrayalMinutes
    );

  const limitTime =
    Date.now() -
    (
      minutes *
      60 *
      1000
    );

  const recent =
    records.filter(
      item =>
        item &&
        Number(item.time) >=
          limitTime
    );

  group.protection
    .antiBetrayalBans[adminKey] =
      recent;

  saveDB();

  const limit =
    Number(
      group.protection
        .antiBetrayalLimit
    );

  if (
    recent.length < limit
  ) {
    return false;
  }

  // جلوگیری از اجرای دوباره
  // تا زمانی که رکوردهای قدیمی پاک شوند
  group.protection
    .antiBetrayalBans[adminKey] = [];

  saveDB();

  return true;
}

// =====================================
// ثبت بن انجام‌شده توسط مدیر
// =====================================

async function processAdminBan(
  ctx,
  adminId,
  targetId
) {

  if (!isGroup(ctx)) {
    return false;
  }

  if (
    !adminId ||
    !targetId
  ) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      adminId
    );

  if (role !== "admin") {
    return false;
  }

  const enabled =
    Boolean(
      getProtectionValue(
        ctx.chat.id,
        "antiBetrayal"
      )
    );

  if (!enabled) {
    return false;
  }

  recordAdminBan(
    ctx.chat.id,
    adminId,
    targetId
  );

  const triggered =
    await checkAntiBetrayal(
      ctx,
      adminId
    );

  if (!triggered) {
    return false;
  }

  const demoted =
    await demoteAdmin(
      ctx,
      adminId
    );

  return {
    triggered: true,
    demoted
  };
}

// =====================================
// گزارش ضد خیانت
// =====================================

async function sendAntiBetrayalNotice(
  ctx,
  adminUser,
  result
) {

  try {

    const mention =
      getUserMention(
        adminUser
      );

    if (
      result &&
      result.demoted
    ) {

      await ctx.telegram.sendMessage(
        ctx.chat.id,

        `『🛡️』 سیستم ضد خیانت فعال شد\n\n` +
        `مدیر ${mention} به دلیل انجام ` +
        `اقدامات مدیریتی غیرعادی از مدیریت ` +
        `گروه خارج شد.`,

        {
          parse_mode: "Markdown"
        }
      );

      return;
    }

    await ctx.telegram.sendMessage(
      ctx.chat.id,

      `『🛡️』 سیستم ضد خیانت فعال شد\n\n` +
      `مدیر ${mention} به حد تعیین‌شده ` +
      `اقدامات مدیریتی غیرعادی رسید، ` +
      `اما ربات نتوانست دسترسی مدیریتی ` +
      `او را حذف کند.`,

      {
        parse_mode: "Markdown"
      }
    );

  } catch (error) {

    console.log(
      "ANTI BETRAYAL NOTICE ERROR:",
      error.message
    );
  }
}

// =====================================
// پردازش رویداد بن مدیر
// =====================================

async function handleBanEvent(
  ctx
) {

  if (!isGroup(ctx)) {
    return;
  }

  if (
    !ctx.chat ||
    !ctx.chat.id
  ) {
    return;
  }

  if (
    !ctx.from ||
    !ctx.from.id
  ) {
    return;
  }

  const adminId =
    ctx.from.id;

  const targetId =
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message
      .from
      ? ctx.message.reply_to_message
          .from.id
      : null;

  if (!targetId) {
    return;
  }

  const result =
    await processAdminBan(
      ctx,
      adminId,
      targetId
    );

  if (
    result &&
    result.triggered
  ) {

    await sendAntiBetrayalNotice(
      ctx,
      ctx.from,
      result
    );
  }
}

// =====================================
// پیام وضعیت ضد خیانت
// =====================================

function getAntiBetrayalSettings(
  chatId
) {

  const group =
    ensureProtectionSettings(
      chatId
    );

  return {
    enabled:
      Boolean(
        group.protection
          .antiBetrayal
      ),

    limit:
      Number(
        group.protection
          .antiBetrayalLimit
      ),

    minutes:
      Number(
        group.protection
          .antiBetrayalMinutes
      ),

    action:
      group.protection
        .antiBetrayalAction,

    minuteOptions:
      [...ANTI_BETRAYAL_MINUTES]
  };
}

// =====================================
// تنظیم تعداد بن ضد خیانت
// =====================================

async function setAntiBetrayalLimit(
  ctx,
  limit
) {

  if (
    !(await canManageAntiBetrayal(ctx))
  ) {
    return false;
  }

  const value =
    Number(limit);

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 100
  ) {
    return false;
  }

  setProtectionValue(
    ctx.chat.id,
    "antiBetrayalLimit",
    value
  );

  return value;
}

// =====================================
// تنظیم بازه ضد خیانت
// =====================================

async function setAntiBetrayalMinutes(
  ctx,
  minutes
) {

  if (
    !(await canManageAntiBetrayal(ctx))
  ) {
    return false;
  }

  const value =
    Number(minutes);

  if (
    !ANTI_BETRAYAL_MINUTES.includes(
      value
    )
  ) {
    return false;
  }

  setProtectionValue(
    ctx.chat.id,
    "antiBetrayalMinutes",
    value
  );

  return value;
      }// =====================================
// تغییر وضعیت قفل لینک
// =====================================

async function toggleLinkLock(
  ctx,
  enabled
) {

  if (
    !(await canManageLinkLock(ctx))
  ) {
    return false;
  }

  setProtectionValue(
    ctx.chat.id,
    "linkLock",
    Boolean(enabled)
  );

  await replyToCommand(
    ctx,

    enabled
      ? "『🔒』 𒌍قفل لینک فعال شد"
      : "『🔓』 𒌍قفل لینک باز شد"
  );

  return true;
}

// =====================================
// تغییر وضعیت قفل لینک مدیران
// =====================================

async function toggleAdminLinkLock(
  ctx,
  enabled
) {

  if (
    !(await canManageLinkLock(ctx))
  ) {
    return false;
  }

  setProtectionValue(
    ctx.chat.id,
    "adminLinkLock",
    Boolean(enabled)
  );

  await replyToCommand(
    ctx,

    enabled
      ? "『🔒』 𒌍قفل لینک مدیران فعال شد"
      : "『🔓』 𒌍قفل لینک مدیران باز شد"
  );

  return true;
}

// =====================================
// تغییر وضعیت قفل گروه
// =====================================

async function applyGroupLock(
  ctx,
  locked
) {

  if (
    !(await canManageGroupLock(ctx))
  ) {
    return false;
  }

  try {

    if (locked) {

      await ctx.telegram.setChatPermissions(
        ctx.chat.id,
        {
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
      );

      setProtectionValue(
        ctx.chat.id,
        "groupLock",
        true
      );

      await replyToCommand(
        ctx,
        "『🔒』 𒌍قفل گروه فعال شد"
      );

      return true;
    }

    await ctx.telegram.setChatPermissions(
      ctx.chat.id,
      {
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
        can_change_info: true,
        can_invite_users: true,
        can_pin_messages: true,
        can_manage_topics: true
      }
    );

    setProtectionValue(
      ctx.chat.id,
      "groupLock",
      false
    );

    await replyToCommand(
      ctx,
      "『🔓』 𒌍قفل گروه باز شد"
    );

    return true;

  } catch (error) {

    console.log(
      "GROUP LOCK ERROR:",
      error.message
    );

    return false;
  }
}

// =====================================
// فعال / غیرفعال کردن ضد خیانت
// فقط مالک
// =====================================

async function toggleAntiBetrayal(
  ctx,
  enabled
) {

  if (
    !(await canManageAntiBetrayal(ctx))
  ) {
    return false;
  }

  setProtectionValue(
    ctx.chat.id,
    "antiBetrayal",
    Boolean(enabled)
  );

  if (!enabled) {

    const group =
      ensureProtectionSettings(
        ctx.chat.id
      );

    group.protection
      .antiBetrayalBans = {};

    saveDB();
  }

  await replyToCommand(
    ctx,

    enabled
      ? "『🛡️』 سیستم ضد خیانت فعال شد"
      : "『🛡️』 سیستم ضد خیانت غیرفعال شد"
  );

  return true;
}

// =====================================
// وضعیت ضد خیانت
// =====================================

async function sendAntiBetrayalStatus(
  ctx
) {

  if (
    !(await canManageAntiBetrayal(ctx))
  ) {
    return false;
  }

  const settings =
    getAntiBetrayalSettings(
      ctx.chat.id
    );

  const state =
    settings.enabled
      ? "★ فعال"
      : "☆ غیرفعال";

  await replyToCommand(
    ctx,

    `『🛡️』 وضعیت ضد خیانت\n\n` +
    `وضعیت: ${state}\n` +
    `حد بن: ${settings.limit}\n` +
    `بازه زمانی: ${settings.minutes} دقیقه\n` +
    `اقدام: حذف دسترسی مدیریت`
  );

  return true;
}

// =====================================
// دسترسی قفل گروه برای مدیر
// فقط با ریپلای
// =====================================

async function grantGroupLockPermission(
  ctx
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  if (
    role !== "owner"
  ) {
    return false;
  }

  if (
    !ctx.message.reply_to_message ||
    !ctx.message.reply_to_message.from
  ) {
    return false;
  }

  const target =
    ctx.message.reply_to_message.from;

  const targetRole =
    await getRole(
      ctx,
      target.id
    );

  if (
    targetRole !== "admin"
  ) {
    return false;
  }

  const permissions =
    getPermissions(
      ctx.chat.id,
      target.id
    );

  permissions.groupLock = true;

  setProtectionValue(
    ctx.chat.id,
    "groupLockPermission_" + target.id,
    true
  );

  saveDB();

  await replyToCommand(
    ctx,
    `『★』 دسترسی قفل گروه برای ${getUserMention(target)} فعال شد.`
  );

  return true;
}

// =====================================
// حذف دسترسی قفل گروه
// فقط با ریپلای
// =====================================

async function revokeGroupLockPermission(
  ctx
) {

  if (!isGroup(ctx)) {
    return false;
  }

  const role =
    await getRole(
      ctx,
      ctx.from.id
    );

  if (
    role !== "owner"
  ) {
    return false;
  }

  if (
    !ctx.message.reply_to_message ||
    !ctx.message.reply_to_message.from
  ) {
    return false;
  }

  const target =
    ctx.message.reply_to_message.from;

  const permissions =
    getPermissions(
      ctx.chat.id,
      target.id
    );

  permissions.groupLock = false;

  setProtectionValue(
    ctx.chat.id,
    "groupLockPermission_" + target.id,
    false
  );

  saveDB();

  await replyToCommand(
    ctx,
    `『☆』 دسترسی قفل گروه برای ${getUserMention(target)} حذف شد.`
  );

  return true;
}

// =====================================
// فرمان‌های متنی
// =====================================

function registerProtectionCommands(
  bot
) {

  bot.hears(
    /^قفل لینک$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await toggleLinkLock(
        ctx,
        true
      );
    }
  );

  bot.hears(
    /^باز(?: کردن|کردن)? لینک$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await toggleLinkLock(
        ctx,
        false
      );
    }
  );

  bot.hears(
    /^قفل لینک مدیران$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await toggleAdminLinkLock(
        ctx,
        true
      );
    }
  );

  bot.hears(
    /^باز(?: کردن|کردن)? لینک مدیران$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await toggleAdminLinkLock(
        ctx,
        false
      );
    }
  );

  bot.hears(
    /^قفل گروه$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await applyGroupLock(
        ctx,
        true
      );
    }
  );

  bot.hears(
    /^باز(?: کردن|کردن)? گروه$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await applyGroupLock(
        ctx,
        false
      );
    }
  );

  bot.hears(
    /^دسترسی قفل گروه$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await grantGroupLockPermission(
        ctx
      );
    }
  );

  bot.hears(
    /^حذف دسترسی قفل گروه$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await revokeGroupLockPermission(
        ctx
      );
    }
  );

  bot.hears(
    /^قفل ضد خیانت$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await toggleAntiBetrayal(
        ctx,
        true
      );
    }
  );

  bot.hears(
    /^باز(?: کردن|کردن)? ضد خیانت$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await toggleAntiBetrayal(
        ctx,
        false
      );
    }
  );

  bot.hears(
    /^تنظیم ضد خیانت (\d+) بن$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      const value =
        Number(
          ctx.match[1]
        );

      const result =
        await setAntiBetrayalLimit(
          ctx,
          value
        );

      if (
        result === false
      ) {
        return;
      }

      await replyToCommand(
        ctx,
        `『🛡️』 حد ضد خیانت روی ${result} بن تنظیم شد.`
      );
    }
  );

  bot.hears(
    /^تنظیم زمان ضد خیانت (\d+) دقیقه$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      const value =
        Number(
          ctx.match[1]
        );

      const result =
        await setAntiBetrayalMinutes(
          ctx,
          value
        );

      if (
        result === false
      ) {
        return;
      }

      await replyToCommand(
        ctx,
        `『🛡️』 زمان ضد خیانت روی ${result} دقیقه تنظیم شد.`
      );
    }
  );

  bot.hears(
    /^وضعیت ضد خیانت$/i,
    async ctx => {

      if (!isGroup(ctx)) return;

      await sendAntiBetrayalStatus(
        ctx
      );
    }
  );
}

// =====================================
// کنترل پیام‌های دارای لینک
// =====================================

function registerLinkProtection(
  bot
) {

  bot.on(
    "message",
    async ctx => {

      try {

        if (!ctx.message) {
          return;
        }

        if (
          !isGroup(ctx)
        ) {
          return;
        }

        // پیام‌های مدیریتی خود ربات
        // نباید دوباره بررسی شوند
        if (
          ctx.from &&
          ctx.from.is_bot
        ) {
          return;
        }

        await handleLinkMessage(
          ctx
        );

      } catch (error) {

        console.log(
          "LINK PROTECTION ERROR:",
          error.message
        );
      }
    }
  );
}

// =====================================
// ثبت ضد خیانت
// =====================================

function registerAntiBetrayal(
  bot
) {

  /*
   * این بخش برای اتصال به سیستم بن پروژه
   * آماده شده است.
   *
   * اگر فایل moderation.js هنگام اجرای بن
   * تابع processAdminBan را فراخوانی کند،
   * شمارنده ضد خیانت دقیق خواهد بود.
   */

  bot.on(
    "chat_member",
    async ctx => {

      try {

        if (!isGroup(ctx)) {
          return;
        }

        const update =
          ctx.chatMember;

        if (!update) {
          return;
        }

        const oldStatus =
          update.old_chat_member &&
          update.old_chat_member.status;

        const newStatus =
          update.new_chat_member &&
          update.new_chat_member.status;

        /*
         * اینجا فقط تغییرات مدیریتی بررسی می‌شود.
         * بن‌های انجام‌شده توسط moderation.js
         * باید از processAdminBan استفاده کنند.
         */

        if (
          oldStatus === "administrator" &&
          newStatus === "member"
        ) {
          return;
        }

      } catch (error) {

        console.log(
          "ANTI BETRAYAL EVENT ERROR:",
          error.message
        );
      }
    }
  );
}

// =====================================
// دکمه‌های پنل
// =====================================

function registerProtectionPanel(
  bot
) {

  // قفل لینک
  bot.action(
    /^lock_link:(\d+)$/,
    async ctx => {

      const ownerId =
        Number(
          ctx.match[1]
        );

      if (
        ctx.from.id !== ownerId
      ) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      const current =
        Boolean(
          getProtectionValue(
            ctx.chat.id,
            "linkLock"
          )
        );

      if (
        !(await canManageLinkLock(ctx))
      ) {
        return;
      }

      setProtectionValue(
        ctx.chat.id,
        "linkLock",
        !current
      );

      try {

        await ctx.editMessageText(
          `『قفل لینک』\n\n` +
          `${!current ? "★ فعال" : "☆ غیرفعال"}`
        );

      } catch (error) {

        console.log(
          "PANEL LINK LOCK ERROR:",
          error.message
        );
      }
    }
  );

  // قفل گروه
  bot.action(
    /^lock_group:(\d+)$/,
    async ctx => {

      const ownerId =
        Number(
          ctx.match[1]
        );

      if (
        ctx.from.id !== ownerId
      ) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      await applyGroupLock(
        ctx,
        !Boolean(
          getProtectionValue(
            ctx.chat.id,
            "groupLock"
          )
        )
      );
    }
  );

  // ضد خیانت
  bot.action(
    /^lock_anti_treason:(\d+)$/,
    async ctx => {

      const ownerId =
        Number(
          ctx.match[1]
        );

      if (
        ctx.from.id !== ownerId
      ) {
        return;
      }

      if (
        !(await canManageAntiBetrayal(ctx))
      ) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      const current =
        Boolean(
          getProtectionValue(
            ctx.chat.id,
            "antiBetrayal"
          )
        );

      setProtectionValue(
        ctx.chat.id,
        "antiBetrayal",
        !current
      );

      try {

        await ctx.editMessageText(
          `『ضد خیانت』\n\n` +
          `${!current ? "★ فعال" : "☆ غیرفعال"}`
        );

      } catch (error) {

        console.log(
          "PANEL ANTI BETRAYAL ERROR:",
          error.message
        );
      }
    }
  );
}

// =====================================
// ثبت کامل سیستم
// =====================================

function registerGroupProtection(
  bot
) {

  registerProtectionCommands(
    bot
  );

  registerLinkProtection(
    bot
  );

  registerAntiBetrayal(
    bot
  );

  registerProtectionPanel(
    bot
  );

  console.log(
    "GROUP PROTECTION: registered."
  );
}

// =====================================
// API
// =====================================

module.exports = {
  registerGroupProtection,

  registerProtectionCommands,
  registerLinkProtection,
  registerAntiBetrayal,
  registerProtectionPanel,

  handleLinkMessage,
  applyLinkAction,

  toggleLinkLock,
  toggleAdminLinkLock,
  applyGroupLock,

  toggleAntiBetrayal,
  setAntiBetrayalLimit,
  setAntiBetrayalMinutes,
  getAntiBetrayalSettings,

  grantGroupLockPermission,
  revokeGroupLockPermission,

  recordAdminBan,
  processAdminBan,
  checkAntiBetrayal
};
