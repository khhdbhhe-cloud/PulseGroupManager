// =====================================
// PulseGroupManager - Security System
// =====================================


// =====================================
// دریافت نقش کاربر در گروه
// =====================================

async function getRole(ctx, userId) {

  try {

    if (
      !ctx ||
      !ctx.chat ||
      !userId
    ) {

      return "member";

    }


    const chatType =
      ctx.chat.type;


    if (
      chatType !== "group" &&
      chatType !== "supergroup"
    ) {

      return "member";

    }


    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );


    if (
      member.status === "creator"
    ) {

      return "creator";

    }


    if (
      member.status === "administrator"
    ) {

      return "administrator";

    }


    if (
      member.status === "restricted"
    ) {

      return "restricted";

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


    return "member";

  }

  catch (error) {

    console.log(
      "GET ROLE ERROR:",
      error.message
    );

    return "member";

  }

}


// =====================================
// بررسی مدیر یا مالک
// =====================================

async function checkAdmin(ctx) {

  try {

    // فقط داخل گروه
    if (
      !ctx ||
      !ctx.chat ||
      (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      )
    ) {

      return {
        ok: false,
        text:
          "این دستور فقط داخل گروه قابل استفاده است."
      };

    }


    // بررسی وجود فرستنده
    if (
      !ctx.from ||
      !ctx.from.id
    ) {

      return {
        ok: false,
        text:
          "امکان شناسایی کاربر وجود ندارد."
      };

    }


    const role =
      await getRole(
        ctx,
        ctx.from.id
      );


    // مالک
    if (
      role === "creator"
    ) {

      return {
        ok: true,
        role: "creator"
      };

    }


    // مدیر
    if (
      role === "administrator"
    ) {

      return {
        ok: true,
        role: "administrator"
      };

    }


    // کاربر عادی
    return {
      ok: false,
      role,
      text:
        "فقط مدیران گروه می‌توانند از این دستور استفاده کنند."
    };

  }

  catch (error) {

    console.log(
      "CHECK ADMIN ERROR:",
      error.message
    );

    return {
      ok: false,
      text:
        "خطایی هنگام بررسی دسترسی رخ داد."
    };

  }

}


// =====================================
// بررسی مالک گروه
// =====================================

async function checkOwner(ctx) {

  try {

    if (
      !ctx ||
      !ctx.chat ||
      (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      )
    ) {

      return {
        ok: false,
        text:
          "این دستور فقط داخل گروه قابل استفاده است."
      };

    }


    if (
      !ctx.from ||
      !ctx.from.id
    ) {

      return {
        ok: false,
        text:
          "امکان شناسایی کاربر وجود ندارد."
      };

    }


    const role =
      await getRole(
        ctx,
        ctx.from.id
      );


    if (
      role !== "creator"
    ) {

      return {
        ok: false,
        role,
        text:
          "فقط مالک گروه می‌تواند این تنظیمات را تغییر دهد."
      };

    }


    return {
      ok: true,
      role: "creator"
    };

  }

  catch (error) {

    console.log(
      "CHECK OWNER ERROR:",
      error.message
    );

    return {
      ok: false,
      text:
        "خطایی هنگام بررسی مالک گروه رخ داد."
    };

  }

}


// =====================================
// بررسی مدیر بودن یک کاربر مشخص
// =====================================

async function isAdmin(
  ctx,
  userId
) {

  const role =
    await getRole(
      ctx,
      userId
    );


  return (
    role === "creator" ||
    role === "administrator"
  );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  getRole,
  checkAdmin,
  checkOwner,
  isAdmin

};
