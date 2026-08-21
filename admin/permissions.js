const { OWNER_ID } = require("../config/config");

async function isOwner(userId) {
  return String(userId) === String(OWNER_ID);
}

async function isAdmin(ctx) {
  if (!ctx.chat || !ctx.from) return false;

  try {
    const member = await ctx.telegram.getChatMember(
      ctx.chat.id,
      ctx.from.id
    );

    return (
      member.status === "administrator" ||
      member.status === "creator" ||
      await isOwner(ctx.from.id)
    );

  } catch (err) {
    return false;
  }
}

module.exports = {
  isOwner,
  isAdmin
};
