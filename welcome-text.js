// =====================================
// PulseGroupManager
// Smart Welcome Message
// =====================================


// =====================================
// تبدیل کاراکترهای خطرناک HTML
// =====================================

function escapeHtml(text) {

  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


// =====================================
// اسم قابل کلیک کاربر
// =====================================

function getUserMention(user) {

  if (!user || !user.id) {
    return "دوست عزیز";
  }

  const name =
    escapeHtml(
      user.first_name || "دوست عزیز"
    );

  return `<a href="tg://user?id=${user.id}">${name}</a>`;

}


// =====================================
// نام گروه
// =====================================

function getGroupName(chat) {

  if (
    chat &&
    chat.title
  ) {

    return escapeHtml(
      chat.title
    );

  }

  return "گروه ما";

}


// =====================================
// متن پیش‌فرض خوشامدگویی
// =====================================

function getDefaultWelcomeText(
  user,
  chat
) {

  const mention =
    getUserMention(user);

  const groupName =
    getGroupName(chat);


  return `『𓆩 ★ خوش اومدی ★ 𓆪』

سلام ${mention} عزیز 🌹

به گروه «${groupName}» خوش اومدی ❤️

امیدواریم کنارمون لحظات خوبی داشته باشی ✨

『𓆩 از حضورت خوشحالیم 𓆪』`;

}


// =====================================
// تبدیل متن سفارشی
// =====================================

function formatWelcomeText(
  template,
  user,
  chat
) {

  const name =
    escapeHtml(
      user?.first_name || "دوست عزیز"
    );

  const mention =
    getUserMention(user);

  const groupName =
    getGroupName(chat);


  return String(template || "")
    .replace(
      /\{name\}/gi,
      name
    )
    .replace(
      /\{mention\}/gi,
      mention
    )
    .replace(
      /\{group\}/gi,
      groupName
    );

}


// =====================================
// خروجی
// =====================================

module.exports = {

  escapeHtml,
  getUserMention,
  getGroupName,
  getDefaultWelcomeText,
  formatWelcomeText

};
