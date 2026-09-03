// =====================================
// PulseGroupManager
// MODERATION.JS
// بن | سیک | اخراج | سکوت | اخطار
// =====================================

const {
  checkBotPermissions,
  isUserAdmin,
  isOwner
} = require('./permissions');

const {
  getGroup,
  saveGroup
} = require('./database');

// =====================================
// ابزارهای عمومی
// =====================================

function getTargetId(ctx) {
  if (!ctx.message || !ctx.message.reply_to_message) {
    return null;
  }

  return (
    ctx.message.reply_to_message.from &&
    ctx.message.reply_to_message.from.id
  );
}

function getTargetName(ctx) {
  if (
    !ctx.message ||
    !ctx.message.reply_to_message ||
    !ctx.message.reply_to_message.from
  ) {
    return 'کاربر';
  }

  const user =
    ctx.message.reply_to_message.from;

  if (user.first_name) {
    return user.first_name;
  }

  if (user.username) {
    return '@' + user.username;
  }

  return 'کاربر';
}

// =====================================
// فقط با ریپلای
// =====================================

function requireReply(ctx) {
  return !!(
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  );
}

// =====================================
// پاسخ به همان پیام هدف
// =====================================

async function replyToTarget(
  ctx,
  text
) {
  if (
    !ctx.message ||
    !ctx.message.reply_to_message
  ) {
    return;
  }

  return ctx.reply(
    text,
    {
      reply_to_message_id:
        ctx.message.reply_to_message.message_id
    }
  );
}

// =====================================
// بررسی امکان مدیریت
// =====================================

async function canModerate(ctx) {
  if (!ctx.chat || ctx.chat.type === 'private') {
    return false;
  }

  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  const group = getGroup(chatId);

  if (!group) {
    return false;
  }

  // مالک همیشه اجازه دارد
  if (isOwner(userId, group)) {
    return true;
  }

  // مدیر گروه
  if (!isUserAdmin(ctx, userId)) {
    return false;
  }

  // دسترسی مدیریتی مدیریت کاربران
  if (
    group.permissions &&
    group.permissions[userId] &&
    group.permissions[userId].moderation === false
  ) {
    return false;
  }

  return true;
}

// =====================================
// بررسی ربات
// =====================================

async function checkModerationBot(ctx) {
  try {
    const permissions =
      await checkBotPermissions(
        ctx,
        [
          'can_restrict_members'
        ]
      );

    return !!permissions;
  } catch (error) {
    console.error(
      'Moderation bot permission error:',
      error
    );

    return false;
  }
}

// =====================================
// BAN — بن
// =====================================

async function handleBan(
  ctx,
  group,
  targetId,
  targetName
) {
  if (!targetId) return;

  const chatId = ctx.chat.id;

  try {
    await ctx.telegram.banChatMember(
      chatId,
      targetId
    );

    return replyToTarget(
      ctx,
      `🚫 کاربر ${targetName} بن شد.`
    );
  } catch (error) {
    console.error(
      'Ban error:',
      error
    );

    return replyToTarget(
      ctx,
      '❌ ربات نتوانست کاربر را بن کند.'
    );
  }
}

// =====================================
// SIK — سیک
// =====================================

async function handleSik(
  ctx,
  group,
  targetId,
  targetName
) {
  if (!targetId) return;

  const chatId = ctx.chat.id;

  try {
    await ctx.telegram.banChatMember(
      chatId,
      targetId
    );

    await ctx.telegram.unbanChatMember(
      chatId,
      targetId,
      {
        only_if_banned: true
      }
    );

    return replyToTarget(
      ctx,
      `🚫 کاربر ${targetName} سیک شد.`
    );
  } catch (error) {
    console.error(
      'Sik error:',
      error
    );

    return replyToTarget(
      ctx,
      '❌ ربات نتوانست کاربر را سیک کند.'
    );
  }
}

// =====================================
// KICK — اخراج
// =====================================

async function handleKick(
  ctx,
  group,
  targetId,
  targetName
) {
  if (!targetId) return;

  const chatId = ctx.chat.id;

  try {
    await ctx.telegram.banChatMember(
      chatId,
      targetId
    );

    await ctx.telegram.unbanChatMember(
      chatId,
      targetId,
      {
        only_if_banned: true
      }
    );

    return replyToTarget(
      ctx,
      `👢 کاربر ${targetName} اخراج شد.`
    );
  } catch (error) {
    console.error(
      'Kick error:',
      error
    );

    return replyToTarget(
      ctx,
      '❌ ربات نتوانست کاربر را اخراج کند.'
    );
  }
}// =====================================
// MUTE — سکوت
// =====================================

async function handleMute(
  ctx,
  group,
  targetId,
  targetName,
  hours = 1
) {
  if (!targetId) return;

  const chatId = ctx.chat.id;

  try {
    hours = Number(hours);

    if (!Number.isFinite(hours) || hours <= 0) {
      hours = 1;
    }

    // محدودیت حداکثر مدت سکوت
    if (hours > 24) {
      hours = 24;
    }

    const until =
      Date.now() +
      hours * 60 * 60 * 1000;

    await ctx.telegram.restrictChatMember(
      chatId,
      targetId,
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
        until_date: Math.floor(
          until / 1000
        )
      }
    );

    if (!group.moderation) {
      group.moderation = {};
    }

    if (
      !Array.isArray(
        group.moderation.mutes
      )
    ) {
      group.moderation.mutes = [];
    }

    // حذف سکوت قبلی همین کاربر
    group.moderation.mutes =
      group.moderation.mutes.filter(
        mute =>
          String(mute.userId) !==
          String(targetId)
      );

    // ثبت سکوت جدید
    group.moderation.mutes.push({
      userId: targetId,
      until: until
    });

    saveGroup(chatId, group);

    return replyToTarget(
      ctx,
      `🔇 کاربر ${targetName} ${hours} ساعت سکوت شد.`
    );
  } catch (error) {
    console.error(
      'Mute error:',
      error
    );

    return replyToTarget(
      ctx,
      '❌ ربات نتوانست کاربر را سکوت کند.'
    );
  }
}

// =====================================
// UNMUTE — رفع سکوت
// =====================================

async function handleUnmute(
  ctx,
  group,
  targetId,
  targetName
) {
  if (!targetId) return;

  const chatId = ctx.chat.id;

  try {
    await ctx.telegram.restrictChatMember(
      chatId,
      targetId,
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
          can_add_web_page_previews: true
        }
      }
    );

    if (!group.moderation) {
      group.moderation = {};
    }

    if (
      !Array.isArray(
        group.moderation.mutes
      )
    ) {
      group.moderation.mutes = [];
    }

    const before =
      group.moderation.mutes.length;

    group.moderation.mutes =
      group.moderation.mutes.filter(
        mute =>
          String(mute.userId) !==
          String(targetId)
      );

    if (
      group.moderation.mutes.length ===
      before
    ) {
      return replyToTarget(
        ctx,
        `ℹ️ کاربر ${targetName} در حال حاضر سکوت نیست.`
      );
    }

    saveGroup(chatId, group);

    return replyToTarget(
      ctx,
      `🔊 سکوت کاربر ${targetName} برداشته شد.`
    );
  } catch (error) {
    console.error(
      'Unmute error:',
      error
    );

    return replyToTarget(
      ctx,
      '❌ ربات نتوانست سکوت کاربر را بردارد.'
    );
  }
}

// =====================================
// بررسی وضعیت سکوت
// =====================================

function isUserMuted(
  group,
  userId
) {
  if (
    !group ||
    !group.moderation ||
    !Array.isArray(
      group.moderation.mutes
    )
  ) {
    return false;
  }

  const now = Date.now();

  const mute =
    group.moderation.mutes.find(
      item =>
        String(item.userId) ===
        String(userId)
    );

  if (!mute) {
    return false;
  }

  if (
    Number(mute.until) <= now
  ) {
    return false;
  }

  return true;
}

// =====================================
// پاک‌سازی سکوت‌های منقضی‌شده
// =====================================

function cleanExpiredMutes(
  group
) {
  if (
    !group ||
    !group.moderation ||
    !Array.isArray(
      group.moderation.mutes
    )
  ) {
    return;
  }

  const now = Date.now();

  group.moderation.mutes =
    group.moderation.mutes.filter(
      mute =>
        Number(mute.until) > now
    );
}

// =====================================
// آماده‌سازی سیستم اخطار
// =====================================

function ensureWarningSystem(
  group
) {
  if (!group.moderation) {
    group.moderation = {};
  }

  if (
    !Array.isArray(
      group.moderation.warnings
    )
  ) {
    group.moderation.warnings = [];
  }

  if (
    !group.moderation.maxWarnings
  ) {
    group.moderation.maxWarnings = 3;
  }

  if (
    !group.moderation.warningPunishment
  ) {
    group.moderation.warningPunishment =
      'mute';
  }

  if (
    !group.moderation.warningMuteDuration
  ) {
    group.moderation.warningMuteDuration =
      1;
  }
}// =====================================
// WARN — اخطار
// =====================================

async function handleWarn(
  ctx,
  group,
  targetId,
  targetName,
  amount = 1
) {
  if (!targetId) return;

  const chatId = ctx.chat.id;

  try {
    ensureWarningSystem(group);

    amount = Number(amount);

    if (
      !Number.isFinite(amount) ||
      amount < 1
    ) {
      amount = 1;
    }

    amount = Math.floor(amount);

    const existing =
      group.moderation.warnings.find(
        warning =>
          String(warning.userId) ===
          String(targetId)
      );

    if (existing) {
      existing.count =
        Number(existing.count || 0) +
        amount;

      existing.updatedAt = Date.now();
    } else {
      group.moderation.warnings.push({
        userId: targetId,
        count: amount,
        updatedAt: Date.now()
      });
    }

    const warning =
      group.moderation.warnings.find(
        item =>
          String(item.userId) ===
          String(targetId)
      );

    const max =
      Number(
        group.moderation.maxWarnings
      ) || 3;

    // هنوز به حد اخطار نرسیده
    if (warning.count < max) {
      saveGroup(chatId, group);

      return replyToTarget(
        ctx,
        `⚠️ به کاربر ${targetName} اخطار داده شد.\n\n` +
        `📊 تعداد اخطار: ${warning.count} از ${max}`
      );
    }

    // =================================
    // رسیدن به حداکثر اخطار
    // =================================

    const punishment =
      group.moderation.warningPunishment ||
      'mute';

    // =================================
    // مجازات: بن
    // =================================

    if (punishment === 'ban') {
      try {
        await ctx.telegram.banChatMember(
          chatId,
          targetId
        );

        warning.count = 0;
        warning.updatedAt = Date.now();

        saveGroup(chatId, group);

        return replyToTarget(
          ctx,
          `🚫 کاربر ${targetName} به دلیل رسیدن به ${max} اخطار بن شد.`
        );
      } catch (error) {
        console.error(
          'Warning ban error:',
          error
        );

        saveGroup(chatId, group);

        return replyToTarget(
          ctx,
          `⚠️ تعداد اخطار ${targetName} به ${max} رسید، اما ربات نتوانست او را بن کند.`
        );
      }
    }

    // =================================
    // مجازات: سکوت
    // =================================

    if (punishment === 'mute') {
      const duration =
        Number(
          group.moderation
            .warningMuteDuration
        ) || 1;

      const until =
        Date.now() +
        duration * 60 * 60 * 1000;

      try {
        await ctx.telegram.restrictChatMember(
          chatId,
          targetId,
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
            until_date: Math.floor(
              until / 1000
            )
          }
        );

        if (
          !Array.isArray(
            group.moderation.mutes
          )
        ) {
          group.moderation.mutes = [];
        }

        // سکوت قبلی حذف شود
        group.moderation.mutes =
          group.moderation.mutes.filter(
            mute =>
              String(mute.userId) !==
              String(targetId)
          );

        // سکوت جدید ثبت شود
        group.moderation.mutes.push({
          userId: targetId,
          until: until
        });

        warning.count = 0;
        warning.updatedAt = Date.now();

        saveGroup(chatId, group);

        return replyToTarget(
          ctx,
          `🔇 کاربر ${targetName} به دلیل رسیدن به ${max} اخطار، ${duration} ساعت سکوت شد.`
        );
      } catch (error) {
        console.error(
          'Warning mute error:',
          error
        );

        saveGroup(chatId, group);

        return replyToTarget(
          ctx,
          `⚠️ تعداد اخطار ${targetName} به ${max} رسید، اما ربات نتوانست او را سکوت کند.`
        );
      }
    }

    // =================================
    // مجازات پیش‌فرض
    // =================================

    warning.count = 0;
    warning.updatedAt = Date.now();

    saveGroup(chatId, group);

    return replyToTarget(
      ctx,
      `⚠️ تعداد اخطار ${targetName} به ${max} رسید.`
    );

  } catch (error) {
    console.error(
      'Warn error:',
      error
    );

    return replyToTarget(
      ctx,
      '❌ خطایی هنگام ثبت اخطار رخ داد.'
    );
  }
}

// =====================================
// دریافت تعداد اخطار کاربر
// =====================================

function getWarningCount(
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
    return 0;
  }

  const warning =
    group.moderation.warnings.find(
      item =>
        String(item.userId) ===
        String(userId)
    );

  if (!warning) {
    return 0;
  }

  return Number(
    warning.count || 0
  );
}

// =====================================
// پاک کردن اخطارهای کاربر
// =====================================

function clearWarnings(
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
    return;
  }

  group.moderation.warnings =
    group.moderation.warnings.filter(
      warning =>
        String(warning.userId) !==
        String(userId)
    );
}

// =====================================
// تنظیم تعداد اخطار
// =====================================

function setMaxWarnings(
  group,
  amount
) {
  if (!group.moderation) {
    group.moderation = {};
  }

  amount = Number(amount);

  if (
    !Number.isFinite(amount) ||
    amount < 1
  ) {
    amount = 3;
  }

  group.moderation.maxWarnings =
    Math.floor(amount);
}

// =====================================
// تنظیم مجازات اخطار
// =====================================

function setWarningPunishment(
  group,
  punishment
) {
  if (!group.moderation) {
    group.moderation = {};
  }

  const allowed = [
    'mute',
    'ban'
  ];

  if (
    !allowed.includes(punishment)
  ) {
    punishment = 'mute';
  }

  group.moderation.warningPunishment =
    punishment;
}

// =====================================
// تنظیم مدت سکوت اخطار
// =====================================

function setWarningMuteDuration(
  group,
  hours
) {
  if (!group.moderation) {
    group.moderation = {};
  }

  hours = Number(hours);

  if (
    !Number.isFinite(hours) ||
    hours <= 0
  ) {
    hours = 1;
  }

  group.moderation.warningMuteDuration =
    Math.floor(hours);
  }// =====================================
// PARSE MODERATION COMMAND
// تشخیص فرمان‌های فارسی
// =====================================

function parseModerationCommand(text) {
  if (!text) {
    return null;
  }

  const value =
    String(text).trim();

  // بن
  if (/^بن$/i.test(value)) {
    return {
      command: 'ban'
    };
  }

  // سیک
  if (/^سیک$/i.test(value)) {
    return {
      command: 'sik'
    };
  }

  // اخراج
  if (/^اخراج$/i.test(value)) {
    return {
      command: 'kick'
    };
  }

  // سکوت
  if (/^سکوت$/i.test(value)) {
    return {
      command: 'mute',
      amount: 1
    };
  }

  // سکوت با تعداد ساعت
  const muteMatch =
    value.match(/^سکوت\s+(\d+)$/i);

  if (muteMatch) {
    return {
      command: 'mute',
      amount: Number(muteMatch[1])
    };
  }

  // رفع سکوت
  if (
    /^رفع\s+سکوت$/i.test(value) ||
    /^بازکردن\s+سکوت$/i.test(value)
  ) {
    return {
      command: 'unmute'
    };
  }

  // اخطار
  if (/^اخطار$/i.test(value)) {
    return {
      command: 'warn',
      amount: 1
    };
  }

  // اخطار با تعداد
  const warnMatch =
    value.match(/^اخطار\s+(\d+)$/i);

  if (warnMatch) {
    return {
      command: 'warn',
      amount: Number(warnMatch[1])
    };
  }

  return null;
}

// =====================================
// HANDLER اصلی مدیریت
// =====================================

async function handleModeration(
  ctx
) {
  try {
    if (
      !ctx ||
      !ctx.message ||
      !ctx.chat
    ) {
      return;
    }

    // فقط گروه
    if (
      ctx.chat.type !== 'group' &&
      ctx.chat.type !== 'supergroup'
    ) {
      return;
    }

    const text =
      ctx.message.text;

    if (!text) {
      return;
    }

    const parsed =
      parseModerationCommand(text);

    if (!parsed) {
      return;
    }

    // تمام فرمان‌های مدیریت فقط با ریپلای
    if (!requireReply(ctx)) {
      return;
    }

    const chatId =
      ctx.chat.id;

    const targetId =
      getTargetId(ctx);

    const targetName =
      getTargetName(ctx);

    if (!targetId) {
      return;
    }

    const group =
      getGroup(chatId);

    if (!group) {
      return;
    }

    // مدیر اجراکننده
    const executorId =
      ctx.from &&
      ctx.from.id;

    if (!executorId) {
      return;
    }

    // بررسی دسترسی مدیر
    const allowed =
      await canModerate(ctx);

    if (!allowed) {
      // کاربر عادی کاملاً ساکت
      return;
    }

    // ربات باید دسترسی مدیریت اعضا داشته باشد
    const botAllowed =
      await checkModerationBot(ctx);

    if (!botAllowed) {
      return replyToTarget(
        ctx,
        '❌ ربات دسترسی لازم برای مدیریت اعضا را ندارد.'
      );
    }

    // =================================
    // جلوگیری از مدیریت مالک
    // =================================

    try {
      const targetMember =
        await ctx.telegram.getChatMember(
          chatId,
          targetId
        );

      if (
        targetMember &&
        (
          targetMember.status ===
            'creator' ||
          targetMember.status ===
            'administrator'
        )
      ) {
        return replyToTarget(
          ctx,
          '❌ امکان اجرای این عملیات روی مدیران گروه وجود ندارد.'
        );
      }
    } catch (error) {
      console.error(
        'Target member check error:',
        error
      );
    }

    // =================================
    // اجرای فرمان
    // =================================

    switch (parsed.command) {
      case 'ban':
        return handleBan(
          ctx,
          group,
          targetId,
          targetName
        );

      case 'sik':
        return handleSik(
          ctx,
          group,
          targetId,
          targetName
        );

      case 'kick':
        return handleKick(
          ctx,
          group,
          targetId,
          targetName
        );

      case 'mute':
        return handleMute(
          ctx,
          group,
          targetId,
          targetName,
          parsed.amount
        );

      case 'unmute':
        return handleUnmute(
          ctx,
          group,
          targetId,
          targetName
        );

      case 'warn':
        return handleWarn(
          ctx,
          group,
          targetId,
          targetName,
          parsed.amount
        );

      default:
        return;
    }

  } catch (error) {
    console.error(
      'Moderation handler error:',
      error
    );
  }
}

// =====================================
// CLEANUP
// =====================================

function cleanupModeration(
  group
) {
  if (!group) {
    return;
  }

  if (!group.moderation) {
    group.moderation = {};
  }

  cleanExpiredMutes(group);
}

// =====================================
// SAVE CHANGES
// =====================================

function saveChanges(
  chatId,
  group
) {
  try {
    cleanupModeration(group);
    saveGroup(chatId, group);
    return true;
  } catch (error) {
    console.error(
      'Moderation save error:',
      error
    );

    return false;
  }
}

// =====================================
// EXPORTS
// =====================================

module.exports = {
  handleBan,
  handleSik,
  handleKick,

  handleMute,
  handleUnmute,

  handleWarn,

  getWarningCount,
  clearWarnings,

  setMaxWarnings,
  setWarningPunishment,
  setWarningMuteDuration,

  isUserMuted,
  cleanExpiredMutes,

  parseModerationCommand,
  handleModeration,

  saveChanges
};

// =====================================
// END OF MODERATION.JS
// =====================================
