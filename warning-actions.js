// =====================================
// PulseGroupManager
// Warning Actions
// =====================================

const {
  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings
} = require("./warnings");

const {
  getWarningSettings
} = require("./warning-settings");

const { checkAdmin } = require("./security");


// =====================================
// پیدا کردن کاربر ریپلای‌شده
// =====================================

function getTargetUser(ctx) {

  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {

    return ctx.message.reply_to_message.from;

  }

  return null;

}


// =====================================
// بررسی وضعیت مدیریتی کاربر هدف
// =====================================

async function getTargetRole(ctx, userId) {

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (member.status === "creator") {

      return "owner";

    }

    if (member.status === "administrator") {

      return "admin";

    }

    return "member";

  }

  catch (error) {

    console.log(
      "TARGET ROLE ERROR:",
      error.message
    );

    return "member";

  }

}


// =====================================
// پاسخ ریپلای روی پیام مدیر
// =====================================

function replyToCommand(ctx) {

  return {
    reply_parameters: {
      message_id:
        ctx.message.message_id
    }
  };

}


// =====================================
// جلوگیری از اخطار به مالک و مدیر
// =====================================

async function checkTargetForWarning(
  ctx,
  target
) {

  if (!target) {

    return {
      ok: false,
      text:
        "برای اخطار دادن باید روی پیام کاربر ریپلای کنید."
    };

  }


  const role =
    await getTargetRole(
      ctx,
      target.id
    );


  if (role === "owner") {

    return {
      ok: false,
      text:
        "مالک گروه قابل اخطار نیست."
    };

  }


  if (role === "admin") {

    return {
      ok: false,
      text:
        "مدیر گروه قابل اخطار نیست."
    };

  }


  return {
    ok: true,
    role
  };

}


// =====================================
// نام کاربر
// =====================================

function getUserName(user) {

  if (!user) {

    return "کاربر";

  }


  if (user.first_name) {

    return user.first_name;

  }


  if (user.username) {

    return "@" + user.username;

  }


  return "کاربر";

}


// =====================================
// اجرای مجازات
// =====================================

async function executePunishment(
  ctx,
  target,
  punishment,
  duration
) {

  const chatId =
    ctx.chat.id;

  const userId =
    target.id;


  // ===================================
  // سکوت
  // ===================================

  if (punishment === "mute") {

    await ctx.telegram.restrictChatMember(
      chatId,
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
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_pin_messages: false
        },
        until_date:
          Math.floor(Date.now() / 1000) +
          (Number(duration) * 60)
      }
    );

    return "سکوت";

  }


  // ===================================
  // محدود
  // ===================================

  if (punishment === "restrict") {

    await ctx.telegram.restrictChatMember(
      chatId,
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
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: true,
          can_pin_messages: false
        },
        until_date:
          Math.floor(Date.now() / 1000) +
          (Number(duration) * 60)
      }
    );

    return "محدود";

  }


  // ===================================
  // بن
  // ===================================

  if (punishment === "ban") {

    await ctx.telegram.banChatMember(
      chatId,
      userId
    );

    return "بن";

  }


  return "نامشخص";

}


// =====================================
// ثبت اخطار
// =====================================

async function addWarningToUser(
  ctx,
  target,
  amount
) {

  const chatId =
    ctx.chat.id;

  const userId =
    target.id;


  const settings =
    getWarningSettings(chatId);


  const maxWarnings =
    Number(settings.maxWarnings);


  let currentWarnings =
    getWarnings(
      chatId,
      userId
    );


  if (!Number.isFinite(currentWarnings)) {

    currentWarnings = 0;

  }


  let added = 0;


  for (
    let i = 0;
    i < amount;
    i++
  ) {

    currentWarnings =
      addWarning(
        chatId,
        userId
      );

    added++;

    if (
      currentWarnings >=
      maxWarnings
    ) {

      break;

    }

  }


  const finalWarnings =
    getWarnings(
      chatId,
      userId
    );


  // ===================================
  // رسیدن به حد اخطار
  // ===================================

  if (
    finalWarnings >=
    maxWarnings
  ) {

    try {

      const punishment =
        await executePunishment(
          ctx,
          target,
          settings.punishment,
          settings.duration
        );


      clearWarnings(
        chatId,
        userId
      );


      return {
        ok: true,
        warnings: finalWarnings,
        punishment,
        punished: true,
        added
      };

    }

    catch (error) {

      console.log(
        "PUNISHMENT ERROR:",
        error.message
      );


      return {
        ok: false,
        warnings: finalWarnings,
        punishment: settings.punishment,
        punished: false,
        added,
        error: error.message
      };

    }

  }


  return {
    ok: true,
    warnings: finalWarnings,
    punishment: null,
    punished: false,
    added
  };

}


// =====================================
// ثبت دستورات
// =====================================

function registerWarningActions(bot) {


  // ===================================
  // اخطار
  // مثال:
  // اخطار
  // اخطار 2
  // ===================================

  bot.hears(
    /^اخطار(?:\s+([۰-۹٠-٩0-9]+))?$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return ctx.reply(
            access.text,
            replyToCommand(ctx)
          );

        }


        const target =
          getTargetUser(ctx);


        const targetCheck =
          await checkTargetForWarning(
            ctx,
            target
          );


        if (!targetCheck.ok) {

          return ctx.reply(
            targetCheck.text,
            replyToCommand(ctx)
          );

        }


        let amount = 1;


        if (ctx.match[1]) {

          amount =
            Number(
              String(ctx.match[1])
                .replace(
                  /[۰-۹]/g,
                  char =>
                    "۰۱۲۳۴۵۶۷۸۹".indexOf(char)
                )
                .replace(
                  /[٠-٩]/g,
                  char =>
                    "٠١٢٣٤٥٦٧٨٩".indexOf(char)
                )
            );

        }


        if (
          !Number.isInteger(amount) ||
          amount < 1 ||
          amount > 20
        ) {

          return ctx.reply(
`『𓆩 ★ اخطار ★ 𓆪』

تعداد اخطار باید بین ۱ تا ۲۰ باشد.`,
            replyToCommand(ctx)
          );

        }


        const result =
          await addWarningToUser(
            ctx,
            target,
            amount
          );


        const userName =
          getUserName(target);


        if (!result.ok) {

          return ctx.reply(
`『𓆩 ★ اخطار ★ 𓆪』

${userName} به اخطار ${result.warnings} رسید.

اما اجرای مجازات انجام نشد.

مجازات:
★ ${result.punishment}`,
            replyToCommand(ctx)
          );

        }


        if (result.punished) {

          return ctx.reply(
`『𓆩 ★ اخطار ★ 𓆪』

کاربر: ${userName}

★ تعداد اخطار: ${result.warnings}
★ حد اخطار: ${getWarningSettings(ctx.chat.id).maxWarnings}

مجازات اجرا شد:

★ ${result.punishment}`,
            replyToCommand(ctx)
          );

        }


        return ctx.reply(
`『𓆩 ★ اخطار ★ 𓆪』

کاربر: ${userName}

★ اخطار فعلی: ${result.warnings}
★ حد اخطار: ${getWarningSettings(ctx.chat.id).maxWarnings}

اخطار با موفقیت ثبت شد.`,
          replyToCommand(ctx)
        );

      }

      catch (error) {

        console.log(
          "ADD WARNING ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // حذف یک اخطار
  // ===================================

  bot.hears(
    /^حذف\s+اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return ctx.reply(
            access.text,
            replyToCommand(ctx)
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
            "برای حذف اخطار باید روی پیام کاربر ریپلای کنید.",
            replyToCommand(ctx)
          );

        }


        const role =
          await getTargetRole(
            ctx,
            target.id
          );


        if (
          role === "owner" ||
          role === "admin"
        ) {

          return ctx.reply(
            "این کاربر قابل مدیریت نیست.",
            replyToCommand(ctx)
          );

        }


        const current =
          getWarnings(
            ctx.chat.id,
            target.id
          );


        if (current <= 0) {

          return ctx.reply(
            "این کاربر اخطاری ندارد.",
            replyToCommand(ctx)
          );

        }


        const remaining =
          removeWarning(
            ctx.chat.id,
            target.id
          );


        return ctx.reply(
`『𓆩 ★ حذف اخطار ★ 𓆪』

کاربر: ${getUserName(target)}

★ اخطار باقی‌مانده: ${remaining}`,
          replyToCommand(ctx)
        );

      }

      catch (error) {

        console.log(
          "REMOVE WARNING ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // پاک کردن تمام اخطارها
  // ===================================

  bot.hears(
    /^پاک\s+کردن\s+اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return ctx.reply(
            access.text,
            replyToCommand(ctx)
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
            "برای پاک کردن اخطار باید روی پیام کاربر ریپلای کنید.",
            replyToCommand(ctx)
          );

        }


        const role =
          await getTargetRole(
            ctx,
            target.id
          );


        if (
          role === "owner" ||
          role === "admin"
        ) {

          return ctx.reply(
            "این کاربر قابل مدیریت نیست.",
            replyToCommand(ctx)
          );

        }


        clearWarnings(
          ctx.chat.id,
          target.id
        );


        return ctx.reply(
`『𓆩 ★ اخطار ★ 𓆪』

تمام اخطارهای ${getUserName(target)} پاک شد. ★`,
          replyToCommand(ctx)
        );

      }

      catch (error) {

        console.log(
          "CLEAR WARNINGS ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // وضعیت اخطار کاربر
  // ===================================

  bot.hears(
    /^وضعیت\s+اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);


        if (!access.ok) {

          return ctx.reply(
            access.text,
            replyToCommand(ctx)
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
            "برای دیدن وضعیت اخطار باید روی پیام کاربر ریپلای کنید.",
            replyToCommand(ctx)
          );

        }


        const warnings =
          getWarnings(
            ctx.chat.id,
            target.id
          );


        const settings =
          getWarningSettings(
            ctx.chat.id
          );


        return ctx.reply(
`『𓆩 ★ وضعیت اخطار ★ 𓆪』

کاربر: ${getUserName(target)}

★ اخطار فعلی: ${warnings}
★ حد اخطار: ${settings.maxWarnings}
★ مجازات: ${settings.punishment}
★ مدت: ${settings.duration} دقیقه`,
          replyToCommand(ctx)
        );

      }

      catch (error) {

        console.log(
          "WARNING STATUS ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getTargetUser,
  getTargetRole,
  executePunishment,
  addWarningToUser,
  registerWarningActions

};
