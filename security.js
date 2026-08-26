// =====================================
// PulseGroupManager
// SECURITY SYSTEM - FINAL
// =====================================


// =====================================
// بررسی اینکه داخل گروه هستیم
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
// دریافت نقش کاربر در گروه
// =====================================

async function getRole(ctx, userId) {

  try {

    if (
      !isGroup(ctx) ||
      !userId
    ) {

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


    switch (member.status) {

      // -------------------------------
      // مالک گروه
      // -------------------------------

      case "creator":

        return "creator";


      // -------------------------------
      // مدیر گروه
      // -------------------------------

      case "administrator":

        return "administrator";


      // -------------------------------
      // کاربر محدود
      // -------------------------------

      case "restricted":

        return "restricted";


      // -------------------------------
      // کاربر خارج شده
      // -------------------------------

      case "left":

        return "left";


      // -------------------------------
      // کاربر بن شده
      // -------------------------------

      case "kicked":

        return "kicked";


      // -------------------------------
      // کاربر عادی
      // -------------------------------

      case "member":

        return "member";


      // -------------------------------
      // حالت ناشناخته
      // -------------------------------

      default:

        return "member";

    }

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
//
// creator       = مالک
// administrator = مدیر
// member        = کاربر عادی
//
// کاربر عادی هیچ دسترسی مدیریتی ندارد.
// =====================================

async function checkAdmin(ctx) {

  try {

    // ---------------------------------
    // فقط گروه
    // ---------------------------------

    if (!isGroup(ctx)) {

      return {

        ok: false,

        role: "member",

        text:
          "این دستور فقط داخل گروه قابل استفاده است."

      };

    }


    // ---------------------------------
    // بررسی فرستنده
    // ---------------------------------

    if (
      !ctx.from ||
      !ctx.from.id
    ) {

      return {

        ok: false,

        role: "member",

        text:
          "امکان شناسایی کاربر وجود ندارد."

      };

    }


    // ---------------------------------
    // دریافت نقش
    // ---------------------------------

    const role =
      await getRole(
        ctx,
        ctx.from.id
      );


    // ---------------------------------
    // مالک
    // ---------------------------------

    if (role === "creator") {

      return {

        ok: true,

        role: "creator"

      };

    }


    // ---------------------------------
    // مدیر
    // ---------------------------------

    if (role === "administrator") {

      return {

        ok: true,

        role: "administrator"

      };

    }


    // ---------------------------------
    // کاربر عادی
    // ---------------------------------

    return {

      ok: false,

      role,

      text:
        "⛔ فقط مدیران و مالک گروه می‌توانند از این قابلیت استفاده کنند."

    };

  }

  catch (error) {

    console.log(
      "CHECK ADMIN ERROR:",
      error.message
    );


    // در صورت خطا:
    // دسترسی داده نمی‌شود.

    return {

      ok: false,

      role: "member",

      text:
        "⛔ امکان بررسی دسترسی شما وجود ندارد."

    };

  }

}


// =====================================
// بررسی فقط مالک
// =====================================

async function checkOwner(ctx) {

  try {

    // ---------------------------------
    // فقط گروه
    // ---------------------------------

    if (!isGroup(ctx)) {

      return {

        ok: false,

        role: "member",

        text:
          "این دستور فقط داخل گروه قابل استفاده است."

      };

    }


    // ---------------------------------
    // بررسی فرستنده
    // ---------------------------------

    if (
      !ctx.from ||
      !ctx.from.id
    ) {

      return {

        ok: false,

        role: "member",

        text:
          "امکان شناسایی کاربر وجود ندارد."

      };

    }


    // ---------------------------------
    // نقش کاربر
    // ---------------------------------

    const role =
      await getRole(
        ctx,
        ctx.from.id
      );


    // ---------------------------------
    // فقط مالک
    // ---------------------------------

    if (role !== "creator") {

      return {

        ok: false,

        role,

        text:
          "⛔ فقط مالک گروه می‌تواند این تنظیمات را تغییر دهد."

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

      role: "member",

      text:
        "⛔ امکان بررسی مالک گروه وجود ندارد."

    };

  }

}


// =====================================
// بررسی یک کاربر مشخص
// =====================================

async function isAdmin(
  ctx,
  userId
) {

  try {

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

  catch (error) {

    console.log(
      "IS ADMIN ERROR:",
      error.message
    );

    return false;

  }

}


// =====================================
// بررسی مالک یک کاربر مشخص
// =====================================

async function isOwner(
  ctx,
  userId
) {

  try {

    const role =
      await getRole(
        ctx,
        userId
      );


    return role === "creator";

  }

  catch (error) {

    console.log(
      "IS OWNER ERROR:",
      error.message
    );

    return false;

  }

}


// =====================================
// بررسی دسترسی مدیریتی بر اساس نقش
// =====================================

function hasAdminAccess(role) {

  return (
    role === "creator" ||
    role === "administrator"
  );

}


// =====================================
// بررسی دسترسی مالک
// =====================================

function hasOwnerAccess(role) {

  return role === "creator";

}


// =====================================
// خروجی
// =====================================

module.exports = {

  isGroup,

  getRole,

  checkAdmin,

  checkOwner,

  isAdmin,

  isOwner,

  hasAdminAccess,

  hasOwnerAccess

};
