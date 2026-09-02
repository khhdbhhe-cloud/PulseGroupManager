// =====================================
// PulseGroupManager
// GROUP INFO
// آیدی | قوانین | آمار گروه
// =====================================

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// تنظیمات اولیه اطلاعات گروه
// =====================================

function ensureGroupInfo(group) {

  if (!group) return null;

  if (!group.info) {
    group.info = {};
  }

  if (typeof group.info.rules !== "string") {
    group.info.rules = "";
  }

  if (!group.info.nicknames) {
    group.info.nicknames = {};
  }

  if (!group.info.globalRoles) {
    group.info.globalRoles = {};
  }

  if (!group.info.waitingForRules) {
    group.info.waitingForRules = {};
  }

  if (!group.stats) {
    group.stats = {};
  }

  if (!group.stats.users) {
    group.stats.users = {};
  }

  return group;
}


// =====================================
// ذخیره دیتابیس
// =====================================

function saveGroupInfo() {

  try {
    saveDB();
  } catch {

    try {
      saveDB();
    } catch {}
  }
}


// =====================================
// تاریخ امروز
// =====================================

function getDateKey() {

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// =====================================
// ساعت فعلی
// =====================================

function getCurrentTime() {

  return new Date().toLocaleTimeString(
    "fa-IR",
    {
      hour12: false
    }
  );
}


// =====================================
// تبدیل عدد به فارسی
// =====================================

function toPersianNumber(value) {

  if (
    value === undefined ||
    value === null
  ) {
    return "۰";
  }

  return String(value)
    .replace(/0/g, "۰")
    .replace(/1/g, "۱")
    .replace(/2/g, "۲")
    .replace(/3/g, "۳")
    .replace(/4/g, "۴")
    .replace(/5/g, "۵")
    .replace(/6/g, "۶")
    .replace(/7/g, "۷")
    .replace(/8/g, "۸")
    .replace(/9/g, "۹");
}


// =====================================
// محافظت از متن برای HTML
// =====================================

function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// =====================================
// نام کامل کاربر
// =====================================

function getUserFullName(user) {

  if (!user) {
    return "کاربر";
  }

  const name = [
    user.first_name || user.firstName || "",
    user.last_name || user.lastName || ""
  ]
    .join(" ")
    .trim();

  return name || "کاربر";
}


// =====================================
// نام نمایشی کاربر
// =====================================

function getDisplayName(user) {

  if (!user) {
    return "کاربر";
  }

  if (user.username) {
    return `@${user.username}`;
  }

  return getUserFullName(user);
}


// =====================================
// نام قابل کلیک کاربر
// =====================================

function getClickableName(user) {

  if (!user || !user.id) {
    return escapeHtml(
      getDisplayName(user)
    );
  }

  const name =
    escapeHtml(
      getDisplayName(user)
    );

  return (
    `<a href="tg://user?id=${user.id}">${name}</a>`
  );
}


// =====================================
// ساخت کاربر آماری
// =====================================

function ensureStatsUser(group, user) {

  if (!group || !user) {
    return null;
  }

  ensureGroupInfo(group);

  const userId =
    String(user.id);

  if (!group.stats.users[userId]) {

    group.stats.users[userId] = {

      id: user.id,

      firstName:
        user.first_name || "",

      lastName:
        user.last_name || "",

      username:
        user.username || "",

      totalMessages: 0,
      totalAdds: 0,

      dailyMessages: 0,
      dailyAdds: 0,

      text: 0,
      sticker: 0,
      animatedSticker: 0,
      gif: 0,
      photo: 0,
      voice: 0,
      audio: 0,
      video: 0,
      videoNote: 0,
      document: 0,
      forwarded: 0,

      lastDate:
        getDateKey()
    };
  }

  const statsUser =
    group.stats.users[userId];

  statsUser.id =
    user.id;

  statsUser.firstName =
    user.first_name !== undefined
      ? user.first_name || ""
      : statsUser.firstName || "";

  statsUser.lastName =
    user.last_name !== undefined
      ? user.last_name || ""
      : statsUser.lastName || "";

  statsUser.username =
    user.username !== undefined
      ? user.username || ""
      : statsUser.username || "";

  return statsUser;
}


// =====================================
// صفر کردن آمار روز جدید
// =====================================

function resetDailyStats(statsUser) {

  if (!statsUser) {
    return;
  }

  const today =
    getDateKey();

  if (
    statsUser.lastDate !== today
  ) {

    statsUser.dailyMessages = 0;
    statsUser.dailyAdds = 0;

    statsUser.lastDate = today;
  }
}


// =====================================
// تشخیص نوع پیام
// =====================================

function getMessageType(message) {

  if (!message) {
    return "text";
  }

  if (message.sticker) {

    if (
      message.sticker.is_animated ||
      message.sticker.is_video
    ) {
      return "animatedSticker";
    }

    return "sticker";
  }

  if (message.animation) {
    return "gif";
  }

  if (message.photo) {
    return "photo";
  }

  if (message.voice) {
    return "voice";
  }

  if (message.audio) {
    return "audio";
  }

  if (message.video_note) {
    return "videoNote";
  }

  if (message.video) {
    return "video";
  }

  if (message.document) {
    return "document";
  }

  return "text";
}


// =====================================
// ثبت پیام کاربر
// =====================================

function recordMessage(
  group,
  message,
  user
) {

  if (
    !group ||
    !message ||
    !user
  ) {
    return;
  }

  if (user.is_bot) {
    return;
  }

  const statsUser =
    ensureStatsUser(
      group,
      user
    );

  if (!statsUser) {
    return;
  }

  resetDailyStats(
    statsUser
  );

  const type =
    getMessageType(message);

  statsUser.totalMessages += 1;
  statsUser.dailyMessages += 1;

  if (
    statsUser[type] !== undefined
  ) {
    statsUser[type] += 1;
  }

  if (
    message.forward_origin ||
    message.forward_from ||
    message.forward_from_chat
  ) {
    statsUser.forwarded += 1;
  }

  saveGroupInfo();
}


// =====================================
// ثبت اضافه کردن عضو
// =====================================

function recordMemberAdd(
  group,
  adder
) {

  if (
    !group ||
    !adder ||
    adder.is_bot
  ) {
    return;
  }

  const statsUser =
    ensureStatsUser(
      group,
      adder
    );

  if (!statsUser) {
    return;
  }

  resetDailyStats(
    statsUser
  );

  statsUser.totalAdds += 1;
  statsUser.dailyAdds += 1;

  saveGroupInfo();
}


// =====================================
// گرفتن نقش واقعی کاربر
// =====================================

async function getTelegramRole(
  ctx,
  userId
) {

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (
      member.status === "creator"
    ) {
      return "صاحب گروه";
    }

    if (
      member.status === "administrator"
    ) {
      return "مدیر گروه";
    }

    return "فرد عادی";

  } catch {

    return "فرد عادی";
  }
}


// =====================================
// گرفتن لقب
// =====================================

function getUserNickname(
  group,
  userId
) {

  ensureGroupInfo(group);

  return (
    group.info.nicknames[
      String(userId)
    ] ||
    "بدون لقب"
  );
}


// =====================================
// گرفتن اصل سراسری
// =====================================

function getGlobalRole(
  group,
  userId
) {

  ensureGroupInfo(group);

  return (
    group.info.globalRoles[
      String(userId)
    ] ||
    "ندارد"
  );
}


// =====================================
// تعداد تصاویر پروفایل
// =====================================

async function getProfilePhotoCount(
  ctx,
  userId
) {

  try {

    const result =
      await ctx.telegram.getUserProfilePhotos(
        userId,
        0,
        1
      );

    return Number(
      result.total_count || 0
    );

  } catch {

    return 0;
  }
}


// =====================================
// پایان قسمت ۱
// =====================================
// =====================================
// ساخت متن اطلاعات کاربر
// =====================================

async function buildUserInfo(
  ctx,
  group,
  user
) {

  if (!user) {
    return "اطلاعات کاربر یافت نشد.";
  }

  ensureGroupInfo(group);

  const nickname =
    getUserNickname(
      group,
      user.id
    );

  const globalRole =
    getGlobalRole(
      group,
      user.id
    );

  const telegramRole =
    await getTelegramRole(
      ctx,
      user.id
    );

  const photoCount =
    await getProfilePhotoCount(
      ctx,
      user.id
    );

  const statsUser =
    ensureStatsUser(
      group,
      user
    );

  resetDailyStats(
    statsUser
  );

  const todayMessages =
    statsUser.dailyMessages || 0;

  const totalMessages =
    statsUser.totalMessages || 0;

  const todayAdds =
    statsUser.dailyAdds || 0;

  const totalAdds =
    statsUser.totalAdds || 0;

  const allUsers =
    Object.values(
      group.stats.users || {}
    );

  const sortedUsers =
    allUsers
      .slice()
      .sort(
        (a, b) =>
          (b.totalMessages || 0) -
          (a.totalMessages || 0)
      );

  const rankIndex =
    sortedUsers.findIndex(
      item =>
        String(item.id) ===
        String(user.id)
    );

  const rank =
    rankIndex === -1
      ? 0
      : rankIndex + 1;

  const clickableName =
    getClickableName(user);

  return (
`◂ نام کاربر : 『𓆩 ${clickableName} 𓆪』
◂ آیدی عددی : ${toPersianNumber(user.id)}
◂ یوزرنیم : ${
    user.username
      ? escapeHtml("@" + user.username)
      : "ندارد"
  }
◂ تعداد تصاویر پروفایل : ${toPersianNumber(photoCount)} عدد
◂ لقب کاربر : ${escapeHtml(nickname)}
◂ اصل سراسری : ${escapeHtml(globalRole)}
◂ مقام کاربر : ${escapeHtml(telegramRole)}

─┅━ آمار کاربر ━┅─
◂ پیام های امروز : ${toPersianNumber(todayMessages)} عدد
◂ رتبه در تعداد پیام : ${toPersianNumber(rank)}
◂ تعداد اد امروز : ${toPersianNumber(todayAdds)} نفر
◂ تعداد اد کل : ${toPersianNumber(totalAdds)} نفر

◂ تعداد پیام کل : ${toPersianNumber(totalMessages)} عدد`
  );
}


// =====================================
// ارسال اطلاعات کاربر
// =====================================

async function sendUserInfo(
  ctx,
  group,
  user
) {

  if (
    !ctx ||
    !group ||
    !user
  ) {
    return;
  }

  const text =
    await buildUserInfo(
      ctx,
      group,
      user
    );

  try {

    const photos =
      await ctx.telegram.getUserProfilePhotos(
        user.id,
        0,
        1
      );

    if (
      photos &&
      photos.total_count > 0 &&
      photos.photos &&
      photos.photos[0]
    ) {

      const photo =
        photos.photos[0][
          photos.photos[0].length - 1
        ];

      await ctx.replyWithPhoto(
        photo.file_id,
        {
          caption: text,
          parse_mode: "HTML",
          reply_to_message_id:
            ctx.message.message_id
        }
      );

      return;
    }

  } catch {}

  await ctx.reply(
    text,
    {
      parse_mode: "HTML",
      reply_to_message_id:
        ctx.message.message_id
    }
  );
}


// =====================================
// ساخت رتبه بندی روزانه
// =====================================

function buildDailyRanking(group) {

  ensureGroupInfo(group);

  const today =
    getDateKey();

  const users =
    Object.values(
      group.stats.users || {}
    );

  const activeUsers =
    users
      .filter(user => {

        resetDailyStats(user);

        return (
          user.lastDate === today &&
          (user.dailyMessages || 0) > 0
        );
      })
      .sort(
        (a, b) =>
          (b.dailyMessages || 0) -
          (a.dailyMessages || 0)
      );

  if (!activeUsers.length) {

    return (
`• فعال ترین ها از ساعت 00:00 تا این لحظه :

◂ هنوز فعالیتی برای امروز ثبت نشده است.`
    );
  }

  let text =
`• فعال ترین ها از ساعت 00:00 تا این لحظه :

`;

  activeUsers
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() ||
              "کاربر";

        const clickable =
          `<a href="tg://user?id=${user.id}">${
            escapeHtml(name)
          }</a>`;

        text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyMessages || 0)} پیام.

`;
      }
    );

  return text.trim();
}


// =====================================
// ساخت رتبه بندی کل
// =====================================

function buildTotalRanking(group) {

  ensureGroupInfo(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const activeUsers =
    users
      .filter(
        user =>
          (user.totalMessages || 0) > 0
      )
      .sort(
        (a, b) =>
          (b.totalMessages || 0) -
          (a.totalMessages || 0)
      );

  if (!activeUsers.length) {

    return (
`• به طور کلی افرادی که بیشترین فعالیت را دارند :

◂ هنوز آماری ثبت نشده است.`
    );
  }

  let text =
`• به طور کلی افرادی که بیشترین فعالیت را دارند :

`;

  activeUsers
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() ||
              "کاربر";

        const clickable =
          `<a href="tg://user?id=${user.id}">${
            escapeHtml(name)
          }</a>`;

        text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalMessages || 0)} پیام.

`;
      }
    );

  return text.trim();
}


// =====================================
// آمار اد روزانه
// =====================================

function buildDailyAdds(group) {

  ensureGroupInfo(group);

  const today =
    getDateKey();

  const users =
    Object.values(
      group.stats.users || {}
    );

  const adders =
    users
      .filter(user => {

        resetDailyStats(user);

        return (
          user.lastDate === today &&
          (user.dailyAdds || 0) > 0
        );
      })
      .sort(
        (a, b) =>
          (b.dailyAdds || 0) -
          (a.dailyAdds || 0)
      );

  if (!adders.length) {

    return (
`• اطلاعاتی مرتبط با اد کننده های امروز یافت نشد !`
    );
  }

  let text =
`• اد کننده های امروز از ساعت 00:00 تا این لحظه :

`;

  adders
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() ||
              "کاربر";

        const clickable =
          `<a href="tg://user?id=${user.id}">${
            escapeHtml(name)
          }</a>`;

        text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyAdds || 0)} اد.

`;
      }
    );

  return text.trim();
}


// =====================================
// آمار اد کل
// =====================================

function buildTotalAdds(group) {

  ensureGroupInfo(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const adders =
    users
      .filter(
        user =>
          (user.totalAdds || 0) > 0
      )
      .sort(
        (a, b) =>
          (b.totalAdds || 0) -
          (a.totalAdds || 0)
      );

  if (!adders.length) {

    return (
`• به طور کلی افرادی که بیشترین اد ها را انجام دادند :

◂ هنوز اطلاعاتی ثبت نشده است.`
    );
  }

  let text =
`• به طور کلی افرادی که بیشترین اد ها را انجام دادند :

`;

  adders
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() ||
              "کاربر";

        const clickable =
          `<a href="tg://user?id=${user.id}">${
            escapeHtml(name)
          }</a>`;

        text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalAdds || 0)} اد.

`;
      }
    );

  return text.trim();
}


// =====================================
// پایان قسمت ۲
// =====================================
// =====================================
// ساخت آمار مدیران
// =====================================

async function buildAdminRanking(
  ctx,
  group,
  daily = true
) {

  ensureGroupInfo(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const admins = [];

  for (const user of users) {

    try {

      const member =
        await ctx.telegram.getChatMember(
          ctx.chat.id,
          user.id
        );

      if (
        member.status === "creator" ||
        member.status === "administrator"
      ) {

        const statsUser =
          ensureStatsUser(
            group,
            user
          );

        resetDailyStats(
          statsUser
        );

        const count =
          daily
            ? (
                statsUser.dailyMessages || 0
              )
            : (
                statsUser.totalMessages || 0
              );

        if (count > 0) {

          admins.push({
            ...statsUser,
            role:
              member.status === "creator"
                ? "صاحب گروه"
                : "مدیر گروه",
            count
          });
        }
      }

    } catch {}
  }

  admins.sort(
    (a, b) =>
      (b.count || 0) -
      (a.count || 0)
  );

  if (!admins.length) {

    if (daily) {

      return (
`• فعال ترین مدیران از 00:00 تا این لحظه :

◂ هنوز فعالیتی از مدیران ثبت نشده است.`
      );
    }

    return (
`• به طور کلی مدیرانی که بیشترین فعالیت را دارند :

◂ هنوز فعالیتی از مدیران ثبت نشده است.`
    );
  }

  let text;

  if (daily) {

    text =
`• فعال ترین مدیران از 00:00 تا این لحظه :

`;

  } else {

    text =
`• به طور کلی مدیرانی که بیشترین فعالیت را دارند :

`;
  }

  admins
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() ||
              "کاربر";

        const clickable =
          `<a href="tg://user?id=${user.id}">${
            escapeHtml(name)
          }</a>`;

        text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.count)} پیام.
( ${escapeHtml(user.role)} )

`;
      }
    );

  return text.trim();
}


// =====================================
// ساخت آمار فعالیت گروه
// =====================================

async function buildActivityStats(
  ctx,
  group
) {

  ensureGroupInfo(group);

  const today =
    getDateKey();

  const users =
    Object.values(
      group.stats.users || {}
    );

  let total = 0;
  let forwarded = 0;
  let textCount = 0;
  let sticker = 0;
  let animatedSticker = 0;
  let gif = 0;
  let photo = 0;
  let voice = 0;
  let audio = 0;
  let video = 0;
  let videoNote = 0;
  let document = 0;

  const activeToday = [];
  const totalActive = [];
  const addersToday = [];
  const totalAdders = [];

  for (const user of users) {

    resetDailyStats(user);

    if (
      user.lastDate === today
    ) {

      total +=
        user.dailyMessages || 0;

      forwarded +=
        user.forwarded || 0;

      textCount +=
        user.text || 0;

      sticker +=
        user.sticker || 0;

      animatedSticker +=
        user.animatedSticker || 0;

      gif +=
        user.gif || 0;

      photo +=
        user.photo || 0;

      voice +=
        user.voice || 0;

      audio +=
        user.audio || 0;

      video +=
        user.video || 0;

      videoNote +=
        user.videoNote || 0;

      document +=
        user.document || 0;
    }

    if (
      user.lastDate === today &&
      (user.dailyMessages || 0) > 0
    ) {

      activeToday.push(user);
    }

    if (
      (user.totalMessages || 0) > 0
    ) {

      totalActive.push(user);
    }

    if (
      user.lastDate === today &&
      (user.dailyAdds || 0) > 0
    ) {

      addersToday.push(user);
    }

    if (
      (user.totalAdds || 0) > 0
    ) {

      totalAdders.push(user);
    }
  }

  activeToday.sort(
    (a, b) =>
      (b.dailyMessages || 0) -
      (a.dailyMessages || 0)
  );

  totalActive.sort(
    (a, b) =>
      (b.totalMessages || 0) -
      (a.totalMessages || 0)
  );

  addersToday.sort(
    (a, b) =>
      (b.dailyAdds || 0) -
      (a.dailyAdds || 0)
  );

  totalAdders.sort(
    (a, b) =>
      (b.totalAdds || 0) -
      (a.totalAdds || 0)
  );

  const now =
    new Date();

  const dateText =
    now.toLocaleDateString(
      "fa-IR"
    );

  const timeText =
    now.toLocaleTimeString(
      "fa-IR",
      {
        hour12: false
      }
    );

  let output =
`◄ آمار فعالیت گروه از 00:00 تا این لحظه :

• تاریخ : ${dateText}
• ساعت : ${timeText}

─┅━ پیام های امروز ━┅─

◂ کل پیام ها : ${toPersianNumber(total)}
◂ پیام فرواردی : ${toPersianNumber(forwarded)}
◂ متن : ${toPersianNumber(textCount)}
◂ استیکر : ${toPersianNumber(sticker)}
◂ استیکر متحرک : ${toPersianNumber(animatedSticker)}
◂ گیف : ${toPersianNumber(gif)}
◂ عکس : ${toPersianNumber(photo)}
◂ ویس : ${toPersianNumber(voice)}
◂ موزیک : ${toPersianNumber(audio)}
◂ فیلم : ${toPersianNumber(video)}
◂ فیلم سلفی : ${toPersianNumber(videoNote)}
◂ فایل : ${toPersianNumber(document)}

─┅━ فعال ترین های امروز ┅─
`;

  if (!activeToday.length) {

    output +=
`\n◂ اطلاعاتی ثبت نشده است.\n`;

  } else {

    activeToday
      .slice(0, 10)
      .forEach(
        (user, index) => {

          const name =
            user.username
              ? `@${user.username}`
              : (
                  `${user.firstName || ""} ${user.lastName || ""}`
                ).trim() ||
                "کاربر";

          const clickable =
            `<a href="tg://user?id=${user.id}">${
              escapeHtml(name)
            }</a>`;

          output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyMessages || 0)} پیام.`;
        }
      );

    output += "\n";
  }

  output +=
`\n─━ بهترین عضو کننده های امروز ━─
`;

  if (!addersToday.length) {

    output +=
`\n◂ اطلاعاتی مرتبط با اد کننده های امروز یافت نشد !\n`;

  } else {

    addersToday
      .slice(0, 10)
      .forEach(
        (user, index) => {

          const name =
            user.username
              ? `@${user.username}`
              : (
                  `${user.firstName || ""} ${user.lastName || ""}`
                ).trim() ||
                "کاربر";

          const clickable =
            `<a href="tg://user?id=${user.id}">${
              escapeHtml(name)
            }</a>`;

          output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyAdds || 0)} اد.`;
        }
      );

    output += "\n";
  }

  output +=
`\n─┅━ ورودی و خروجی عضو ━┅─

◂ ورودی عضو امروز : ${toPersianNumber(
    addersToday.reduce(
      (sum, user) =>
        sum +
        (user.dailyAdds || 0),
      0
    )
  )}

◂ ورودی عضو کل : ${toPersianNumber(
    totalAdders.reduce(
      (sum, user) =>
        sum +
        (user.totalAdds || 0),
      0
    )
  )}

─┅━ فعال ترین های کل ━┅─
`;

  if (!totalActive.length) {

    output +=
`\n◂ اطلاعاتی ثبت نشده است.\n`;

  } else {

    totalActive
      .slice(0, 10)
      .forEach(
        (user, index) => {

          const name =
            user.username
              ? `@${user.username}`
              : (
                  `${user.firstName || ""} ${user.lastName || ""}`
                ).trim() ||
                "کاربر";

          const clickable =
            `<a href="tg://user?id=${user.id}">${
              escapeHtml(name)
            }</a>`;

          output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalMessages || 0)} پیام.`;
        }
      );

    output += "\n";
  }

  output +=
`\n─━ بهترین عضو کننده های کل ━─
`;

  if (!totalAdders.length) {

    output +=
`\n◂ اطلاعاتی ثبت نشده است.`;

  } else {

    totalAdders
      .slice(0, 10)
      .forEach(
        (user, index) => {

          const name =
            user.username
              ? `@${user.username}`
              : (
                  `${user.firstName || ""} ${user.lastName || ""}`
                ).trim() ||
                "کاربر";

          const clickable =
            `<a href="tg://user?id=${user.id}">${
              escapeHtml(name)
            }</a>`;

          output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalAdds || 0)} اد.`;
        }
      );
  }

  return output.trim();
}


// =====================================
// کیبورد پنل آمار
// =====================================

function statsKeyboard() {

  return {
    inline_keyboard: [

      [
        {
          text:
            "『𓆩 آمار اد روزانه 𓆪』",
          callback_data:
            "ginfo_stats_daily_adds"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار کل 𓆪』",
          callback_data:
            "ginfo_stats_total"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار فعالیت ها 𓆪』",
          callback_data:
            "ginfo_stats_activity"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار روزانه 𓆪』",
          callback_data:
            "ginfo_stats_daily"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار های دیگر 𓆪』",
          callback_data:
            "ginfo_stats_other"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار اد کل 𓆪』",
          callback_data:
            "ginfo_stats_total_adds"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار روزانه مدیران 𓆪』",
          callback_data:
            "ginfo_stats_daily_admins"
        }
      ],

      [
        {
          text:
            "『𓆩 آمار کل مدیران 𓆪』",
          callback_data:
            "ginfo_stats_total_admins"
        }
      ],

      [
        {
          text:
            "『𓆩 برگشت 𓆪』",
          callback_data:
            "ginfo_stats_back"
        },
        {
          text:
            "『𓆩 بستن 𓆪』",
          callback_data:
            "ginfo_stats_close"
        }
      ]
    ]
  };
}


// =====================================
// متن اصلی پنل آمار
// =====================================

function statsPanelText() {

  return (
`╔══════════════════╗
       『𓆩 آمار گروه 𓆪』
╚══════════════════╝

◂ بخش مورد نظر خود را انتخاب کنید.`
  );
}


// =====================================
// ارسال پنل آمار
// =====================================

async function showStatsPanel(ctx) {

  await ctx.reply(
    statsPanelText(),
    {
      reply_markup:
        statsKeyboard(),

      reply_to_message_id:
        ctx.message &&
        ctx.message.message_id
    }
  );
}


// =====================================
// بستن پنل آمار
// =====================================

async function statsClose(ctx) {

  try {

    await ctx.editMessageText(
      "پنل آمار بسته شد."
    );

  } catch {

    try {
      await ctx.deleteMessage();
    } catch {}
  }
}


// =====================================
// پایان قسمت ۳
// =====================================
// =====================================
// PulseGroupManager
// GROUP INFO - PART 4 / 4
// Handlers + Register + Export
// =====================================

function registerGroupInfo(bot) {

  // =====================================
  // ثبت آمار پیام‌ها
  // =====================================

  bot.use(async (ctx, next) => {

    try {

      if (
        ctx.chat &&
        ctx.chat.type !== "private" &&
        ctx.from &&
        !ctx.from.is_bot &&
        ctx.message
      ) {

        const group = getGroup(ctx.chat.id);

        if (group) {
          ensureGroupInfo(group);

          // پیام‌های معمولی
          if (!ctx.message.new_chat_members) {
            recordMessage(group, ctx.from, ctx.message);
            saveGroupInfo(ctx.chat.id, group);
          }

          // ورود اعضای جدید
          if (ctx.message.new_chat_members) {

            for (const member of ctx.message.new_chat_members) {

              if (!member.is_bot) {
                ensureStatsUser(group, member);

                recordMemberAdd(
                  group,
                  ctx.from,
                  member
                );
              }
            }

            saveGroupInfo(ctx.chat.id, group);
          }
        }
      }

    } catch (error) {
      console.error("GROUP INFO STATS ERROR:", error.message);
    }

    return next();
  });


  // =====================================
  // دستور آیدی
  // =====================================

  bot.hears(/^آیدی$/i, async (ctx) => {

    try {

      if (!ctx.chat || ctx.chat.type === "private") return;
      if (!ctx.from) return;

      const reply = ctx.message.reply_to_message;

      // بدون ریپلای = سکوت
      if (!reply || !reply.from) return;

      const group = getGroup(ctx.chat.id);

      if (!group) return;

      const member = await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

      const isOwner =
        member.status === "creator";

      const isAdmin =
        member.status === "administrator";

      // کاربر عادی = سکوت
      if (!isOwner && !isAdmin) return;

      await sendUserInfo(
        ctx,
        reply.from
      );

    } catch (error) {

      console.error(
        "GROUP INFO ID ERROR:",
        error.message
      );

    }

  });


  // =====================================
  // قوانین
  // =====================================

  bot.hears(
    /^(قوانین|قوانین گروه)$/i,
    async (ctx) => {

      try {

        if (!ctx.chat || ctx.chat.type === "private") return;

        // قوانین هم فقط با Reply
        if (!ctx.message.reply_to_message) return;

        const group = getGroup(ctx.chat.id);

        if (!group) return;

        ensureGroupInfo(group);

        const rules = group.groupInfo.rules;

        if (!rules || !rules.trim()) {

          await ctx.reply(
            "قوانین گروه هنوز تنظیم نشده است.",
            {
              reply_to_message_id:
                ctx.message.message_id
            }
          );

          return;
        }

        await ctx.reply(
          rules,
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      } catch (error) {

        console.error(
          "GROUP RULES ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // تنظیم قوانین
  // فقط صاحب گروه
  // =====================================

  bot.hears(
    /^تنظیم قوانین$/i,
    async (ctx) => {

      try {

        if (!ctx.chat || ctx.chat.type === "private") return;

        // حتماً Reply
        if (!ctx.message.reply_to_message) return;

        const member = await ctx.telegram.getChatMember(
          ctx.chat.id,
          ctx.from.id
        );

        // فقط Owner
        if (member.status !== "creator") return;

        const group = getGroup(ctx.chat.id);

        if (!group) return;

        ensureGroupInfo(group);

        group.groupInfo.waitingForRules =
          ctx.from.id;

        saveGroupInfo(
          ctx.chat.id,
          group
        );

        await ctx.reply(
          "قوانین را ارسال کنید.",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      } catch (error) {

        console.error(
          "SET GROUP RULES ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // دریافت متن قوانین
  // =====================================

  bot.on("text", async (ctx, next) => {

    try {

      if (!ctx.chat || ctx.chat.type === "private") {
        return next();
      }

      const group = getGroup(ctx.chat.id);

      if (!group) return next();

      ensureGroupInfo(group);

      const waitingUser =
        group.groupInfo.waitingForRules;

      // در انتظار دریافت قوانین نیست
      if (!waitingUser) return next();

      // فقط همان Owner
      if (
        !ctx.from ||
        ctx.from.id !== waitingUser
      ) {
        return next();
      }

      // خود فرمان‌ها را به عنوان قوانین ذخیره نکن
      const text = ctx.message.text;

      if (
        /^(تنظیم قوانین|حذف قوانین|قوانین|قوانین گروه)$/i.test(
          text.trim()
        )
      ) {
        return next();
      }

      group.groupInfo.rules = text.trim();

      group.groupInfo.waitingForRules = null;

      saveGroupInfo(
        ctx.chat.id,
        group
      );

      await ctx.reply(
        "قوانین گروه ذخیره شد.",
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );

      return;

    } catch (error) {

      console.error(
        "SAVE GROUP RULES ERROR:",
        error.message
      );

      return next();
    }

  });


  // =====================================
  // حذف قوانین
  // فقط صاحب گروه
  // =====================================

  bot.hears(
    /^حذف قوانین$/i,
    async (ctx) => {

      try {

        if (!ctx.chat || ctx.chat.type === "private") return;

        if (!ctx.message.reply_to_message) return;

        const member = await ctx.telegram.getChatMember(
          ctx.chat.id,
          ctx.from.id
        );

        // فقط Owner
        if (member.status !== "creator") return;

        const group = getGroup(ctx.chat.id);

        if (!group) return;

        ensureGroupInfo(group);

        group.groupInfo.rules = "";

        group.groupInfo.waitingForRules = null;

        saveGroupInfo(
          ctx.chat.id,
          group
        );

        await ctx.reply(
          "قوانین گروه حذف شد.",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      } catch (error) {

        console.error(
          "DELETE GROUP RULES ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // دستور آمار
  // فقط Owner / Admin
  // =====================================

  bot.hears(/^آمار$/i, async (ctx) => {

    try {

      if (!ctx.chat || ctx.chat.type === "private") return;

      // بدون Reply = سکوت
      if (!ctx.message.reply_to_message) return;

      const member = await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

      const isOwner =
        member.status === "creator";

      const isAdmin =
        member.status === "administrator";

      // کاربر عادی = سکوت
      if (!isOwner && !isAdmin) return;

      const group = getGroup(ctx.chat.id);

      if (!group) return;

      ensureGroupInfo(group);

      saveGroupInfo(
        ctx.chat.id,
        group
      );

      await showStatsPanel(ctx);

    } catch (error) {

      console.error(
        "GROUP STATS ERROR:",
        error.message
      );

    }

  });


  // =====================================
  // کنترل کامل دکمه‌های آمار
  // =====================================

  bot.action(/^ginfo_stats_/, async (ctx) => {

    try {

      if (!ctx.chat || ctx.chat.type === "private") {
        await ctx.answerCbQuery();
        return;
      }

      const member = await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

      const isOwner =
        member.status === "creator";

      const isAdmin =
        member.status === "administrator";

      // فقط Owner / Admin
      if (!isOwner && !isAdmin) {
        await ctx.answerCbQuery();
        return;
      }

      const group = getGroup(ctx.chat.id);

      if (!group) {
        await ctx.answerCbQuery();
        return;
      }

      ensureGroupInfo(group);

      const action =
        ctx.callbackQuery.data;

      // =====================================
      // بستن
      // =====================================

      if (action === "ginfo_stats_close") {

        await ctx.answerCbQuery();

        try {

          await ctx.deleteMessage();

        } catch (error) {

          console.error(
            "STATS CLOSE ERROR:",
            error.message
          );

        }

        return;
      }


      // =====================================
      // برگشت
      // =====================================

      if (action === "ginfo_stats_back") {

        await ctx.answerCbQuery();

        await ctx.editMessageText(
          statsPanelText(),
          {
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار اد روزانه
      // =====================================

      if (action === "ginfo_stats_daily_adds") {

        await ctx.answerCbQuery();

        const text =
          buildDailyAdds(group);

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار کل
      // =====================================

      if (action === "ginfo_stats_total") {

        await ctx.answerCbQuery();

        const text =
          buildTotalRanking(group);

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار فعالیت‌ها
      // =====================================

      if (action === "ginfo_stats_activity") {

        await ctx.answerCbQuery();

        const text =
          buildActivityStats(
            ctx,
            group
          );

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار روزانه
      // =====================================

      if (action === "ginfo_stats_daily") {

        await ctx.answerCbQuery();

        const text =
          buildDailyRanking(group);

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار های دیگر
      // =====================================

      if (action === "ginfo_stats_other") {

        await ctx.answerCbQuery();

        const info =
          group.groupInfo;

        const users =
          Object.values(info.users || {});

        let totalMessages = 0;
        let totalAdds = 0;

        for (const user of users) {

          totalMessages +=
            Number(user.totalMessages || 0);

          totalAdds +=
            Number(user.totalAdds || 0);
        }

        const text = [
          "• آمار های دیگر گروه",
          "",
          `◂ تعداد کاربران ثبت شده : ${toPersianNumber(users.length)} نفر`,
          `◂ کل پیام های ثبت شده : ${toPersianNumber(totalMessages)} پیام`,
          `◂ کل اد های ثبت شده : ${toPersianNumber(totalAdds)} نفر`
        ].join("\n");

        await ctx.editMessageText(
          text,
          {
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار اد کل
      // =====================================

      if (action === "ginfo_stats_total_adds") {

        await ctx.answerCbQuery();

        const text =
          buildTotalAdds(group);

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار روزانه مدیران
      // =====================================

      if (action === "ginfo_stats_daily_admins") {

        await ctx.answerCbQuery();

        const text =
          await buildAdminRanking(
            ctx,
            group,
            true
          );

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      // =====================================
      // آمار کل مدیران
      // =====================================

      if (action === "ginfo_stats_total_admins") {

        await ctx.answerCbQuery();

        const text =
          await buildAdminRanking(
            ctx,
            group,
            false
          );

        await ctx.editMessageText(
          text,
          {
            parse_mode: "HTML",
            reply_markup:
              statsKeyboard().reply_markup
          }
        );

        return;
      }


      await ctx.answerCbQuery();

    } catch (error) {

      console.error(
        "GROUP STATS BUTTON ERROR:",
        error.message
      );

      try {
        await ctx.answerCbQuery(
          "خطایی رخ داد."
        );
      } catch (_) {}

    }

  });

}


// =====================================
// راه‌اندازی اطلاعات گروه
// =====================================

function initGroupInfo(chatId) {

  const group = getGroup(chatId);

  if (!group) return null;

  ensureGroupInfo(group);

  resetDailyStats(group);

  saveGroupInfo(
    chatId,
    group
  );

  return group;
}


// =====================================
// EXPORT
// =====================================

module.exports = {
  registerGroupInfo,

  ensureGroupInfo,
  initGroupInfo,

  ensureStatsUser,
  recordMessage,
  recordMemberAdd,

  buildUserInfo,
  sendUserInfo,

  buildDailyRanking,
  buildTotalRanking,

  buildDailyAdds,
  buildTotalAdds,

  buildAdminRanking,
  buildActivityStats,

  statsKeyboard,
  statsPanelText
};
