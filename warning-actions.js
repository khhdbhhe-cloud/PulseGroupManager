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
// جلوگیری از اخطار به مالک و مدیر
// =====================================

async function protectTarget(ctx, target) {

  const role =
    await getTargetRole(
      ctx,
      target.id
    );


  // مالک گروه
  if (role === "owner") {

    await ctx.reply(
`『𓆩 ★ سیستم اخطار ★ 𓆪』

کاربر گرامی،
این کاربر مالک گروه است.

امکان اخطار دادن به مالک وجود ندارد.`,
      {
        reply_parameters: {
          message_id:
            ctx.message.message_id
        }
      }
    );

    return false;

  }


  // مدیر گروه
  if (role === "admin") {

    await ctx.reply(
`『𓆩 ★ سیستم اخطار ★ 𓆪』

کاربر گرامی،
این کاربر مدیر گروه است.

امکان اخطار دادن به مدیر وجود ندارد.`,
      {
        reply_parameters: {
          message_id:
            ctx.message.message_id
        }
      }
    );

    return false;

  }


  return true;

}


// =====================================
// اجرای مجازات
// =====================================

async function applyPunishment(
  ctx,
  target,
  config
) {

  const chatId =
    ctx.chat.id;

  const userId =
    target.id;

  const duration =
    config.duration * 60;


  // ===================================
  // سکوت
  // ===================================

  if (
    config.punishment === "mute"
  ) {

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
          can_add_web_page_previews: false
        },
        use_independent_chat_permissions: true,
        until_date:
          Math.floor(Date.now() / 1000) + duration
      }
    );

    return "سکوت";
  }


  // ===================================
  // محدودیت
  // ===================================

  if (
    config.punishment === "restrict"
  ) {

    await ctx.telegram.restrictChatMember(
      chatId,
      userId,
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
          can_add_web_page_previews: false
        },
        use_independent_chat_permissions: true,
        until_date:
          Math.floor(Date.now() / 1000) + duration
      }
    );

    return "محدودیت";
  }


  // ===================================
  // بن
  // ===================================

  if (
    config.punishment === "ban"
  ) {

    await ctx.telegram.banChatMember(
      chatId,
      userId
    );

    return "بن";
  }


  return "نامشخص";
}


// =====================================
// ثبت دستورات اخطار
// =====================================

function registerWarningActions(bot) {


  // ===================================
  // اخطار
  // ===================================

  bot.hears(
    /^اخطار$/u,
    async ctx => {

      try {

        // فقط مدیران
        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }


        // فقط گروه
        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {

          return;

        }


        // کاربر هدف
        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

برای دادن اخطار، روی پیام کاربر ریپلای کنید و بنویسید:

اخطار`
          );

        }


        // جلوگیری از اخطار دادن به خود ربات
        if (target.is_bot) {

          return ctx.reply(
`『𓆩 سیستم اخطار ★ 𓆪』

به ربات نمی‌توان اخطار داد.`,
            {
              reply_parameters: {
                message_id:
                  ctx.message.message_id
              }
            }
          );

        }


        // =================================
        // جلوگیری از اخطار به مالک و مدیر
        // =================================

        const allowed =
          await protectTarget(
            ctx,
            target
          );

        if (!allowed) {

          return;

        }


        // اضافه کردن اخطار
        const count =
          addWarning(
            ctx.chat.id,
            target.id
          );


        // تنظیمات گروه
        const config =
          getWarningSettings(
            ctx.chat.id
          );


        // =================================
        // هنوز به حد اخطار نرسیده
        // =================================

        if (
          count < config.maxWarnings
        ) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

کاربر:
${target.first_name || "بدون نام"}

آیدی:
${target.id}

تعداد اخطار:
★ ${count} از ${config.maxWarnings}

اخطار با موفقیت ثبت شد.`
          );

        }


        // =================================
        // رسیدن به حد اخطار
        // =================================

        let punishment;

        try {

          punishment =
            await applyPunishment(
              ctx,
              target,
              config
            );

        }

        catch (punishmentError) {

          console.log(
            "PUNISHMENT ERROR:",
            punishmentError.message
          );

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

کاربر:
${target.first_name || "بدون نام"}

به حد ${config.maxWarnings} اخطار رسید.

اما ربات نتوانست مجازات را اجرا کند.

احتمالاً ربات دسترسی لازم برای مدیریت کاربر را ندارد.`
          );

        }


        // بعد از اجرای مجازات
        clearWarnings(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

کاربر:
${target.first_name || "بدون نام"}

به حد مجاز رسید:

★ ${config.maxWarnings} اخطار

مجازات:
★ ${punishment}

مدت:
★ ${config.duration} دقیقه

اخطارهای کاربر از نو شمارش می‌شوند.`
        );

      }

      catch (error) {

        console.log(
          "WARNING ERROR:",
          error.message
        );

      }

    }
  );


  // ===================================
  // حذف یک اخطار
  // ===================================

  bot.hears(
    /^حذف اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

برای حذف اخطار، روی پیام کاربر ریپلای کنید و بنویسید:

حذف اخطار`
          );

        }


        const count =
          removeWarning(
            ctx.chat.id,
            target.id
          );


        await ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

کاربر:
${target.first_name || "بدون نام"}

تعداد اخطار باقی‌مانده:

★ ${count}`
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
    /^پاک کردن اخطار$/u,
    async ctx => {

      try {

        const access =
          await checkAdmin(ctx);

        if (!access.ok) {

          return ctx.reply(
            access.text
          );

        }


        const target =
          getTargetUser(ctx);


        if (!target) {

          return ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

برای پاک کردن تمام اخطارهای یک کاربر:

روی پیام کاربر ریپلای کنید و بنویسید:

پاک کردن اخطار`
          );

        }


        clearWarnings(
          ctx.chat.id,
          target.id
        );


        await ctx.reply(
`『𓆩 سیستم اخطار 𓆪』

تمام اخطارهای کاربر:

${target.first_name || "بدون نام"}

پاک شد.`
        );

      }

      catch (error) {

        console.log(
          "CLEAR WARNING ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// EXPORT
// =====================================

module.exports = {
  registerWarningActions
};
