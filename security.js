async function getRole(ctx, userId) {

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    return member.status;

  } catch(error) {

    console.log(
      "ROLE ERROR:",
      error.message
    );

    return "unknown";
  }

}


function isAdmin(role) {

  return (
    role === "administrator" ||
    role === "creator"
  );

}


async function checkAdmin(ctx) {

  if (
    !ctx.chat ||
    (
      ctx.chat.type !== "group" &&
      ctx.chat.type !== "supergroup"
    )
  ) {

    return {
      ok:false,
      text:"این دستور فقط داخل گروه کار می‌کند."
    };

  }


  const role =
    await getRole(
      ctx,
      ctx.from.id
    );


  if (!isAdmin(role)) {

    return {
      ok:false,
      text:"فقط مدیران گروه می‌توانند استفاده کنند."
    };

  }


  return {
    ok:true,
    role
  };

}



async function checkTarget(ctx,target) {


  if(!target){

    return {
      ok:false,
      text:"کاربر پیدا نشد."
    };

  }


  const adminRole =
    await getRole(
      ctx,
      ctx.from.id
    );


  const targetRole =
    await getRole(
      ctx,
      target.id
    );


  if(!isAdmin(adminRole)){

    return {
      ok:false,
      text:"شما دسترسی مدیریت ندارید."
    };

  }


  if(targetRole === "creator"){

    return {
      ok:false,
      text:"مالک گروه قابل مدیریت نیست."
    };

  }


  if(
    targetRole === "administrator" &&
    adminRole !== "creator"
  ){

    return {
      ok:false,
      text:"مدیر عادی نمی‌تواند مدیر دیگر را مدیریت کند."
    };

  }


  return {
    ok:true,
    adminRole,
    targetRole
  };

}



module.exports = {

  getRole,
  isAdmin,
  checkAdmin,
  checkTarget

};
