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

  if (!group.info.rules) {
    group.info.rules = "";
  }

  if (!group.info.nicknames) {
    group.info.nicknames = {};
  }

  if (!group.info.globalRoles) {
    group.info.globalRoles = {};
  }

  if (!group.stats) {
    group.stats = {};
  }

  if (!group.stats.users) {
    group.stats.users = {};
  }

  if (!group.stats.daily) {
    group.stats.daily = {};
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

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// =====================================
// ساعت فعلی
// =====================================

function getCurrentTime() {

  return new Date().toLocaleTimeString("fa-IR", {
    hour12: false
  });
}


// =====================================
// ساخت کاربر آماری
// =====================================

function ensureStatsUser(group, user) {

  if (!group || !user) return null;

  ensureGroupInfo(group);

  const userId = String(user.id);

  if (!group.stats.users[userId]) {

    group.stats.users[userId] = {
      id: user.id,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      username: user.username || "",

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

      lastDate: getDateKey()
    };
  }

  const statsUser = group.stats.users[userId];

  statsUser.id = user.id;

  if (user.first_name !== undefined) {
    statsUser.firstName = user.first_name || "";
  }

  if (user.last_name !== undefined) {
    statsUser.lastName = user.last_name || "";
  }

  if (user.username !== undefined) {
    statsUser.username = user.username || "";
  }

  return statsUser;
}


// =====================================
// صفر کردن آمار روز جدید
// =====================================

function resetDailyStats(statsUser) {

  if (!statsUser) return;

  const today = getDateKey();

  if (statsUser.lastDate !== today) {

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

function recordMessage(group, message, user) {

  if (!group || !message || !user) {
    return;
  }

  if (user.is_bot) {
    return;
  }

  const statsUser = ensureStatsUser(group, user);

  if (!statsUser) {
    return;
  }

  resetDailyStats(statsUser);

  const type = getMessageType(message);

  statsUser.totalMessages += 1;
  statsUser.dailyMessages += 1;

  if (statsUser[type] !== undefined) {
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

function recordMemberAdd(group, adder) {

  if (!group || !adder || adder.is_bot) {
    return;
  }

  const statsUser = ensureStatsUser(group, adder);

  if (!statsUser) {
    return;
  }

  resetDailyStats(statsUser);

  statsUser.totalAdds += 1;
  statsUser.dailyAdds += 1;

  saveGroupInfo();
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

  const fullName = [
    user.first_name || "",
    user.last_name || ""
  ]
    .join(" ")
    .trim();

  return fullName || "کاربر";
}


// =====================================
// نام قابل کلیک کاربر
// =====================================

function getClickableName(user, fallbackName) {

  const name =
    fallbackName ||
    getDisplayName(user);

  const userId =
    user && user.id
      ? user.id
      : null;

  if (!userId) {
    return name;
  }

  return `[${name}](tg://user?id=${userId})`;
}


// =====================================
// نقش تلگرام
// =====================================

async function getTelegramRole(ctx, userId) {

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
// لقب کاربر
// =====================================

function getUserNickname(group, userId) {

  ensureGroupInfo(group);

  const nickname =
    group.info.nicknames[String(userId)];

  return nickname || "بدون لقب";
}


// =====================================
// اصل سراسری کاربر
// =====================================

function getGlobalRole(group, userId) {

  ensureGroupInfo(group);

  const role =
    group.info.globalRoles[String(userId)];

  return role || "ندارد";
}


// =====================================
// گرفتن تعداد عکس پروفایل
// =====================================

async function getProfilePhotoCount(ctx, userId) {

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
// تبدیل عدد به فارسی
// =====================================

function toPersianNumber(value) {

  if (value === undefined || value === null) {
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
// فرمت نام کاربر برای نمایش
// =====================================

function getUserFullName(user) {

  if (!user) {
    return "کاربر";
  }

  const name = [
    user.first_name || "",
    user.last_name || ""
  ]
    .join(" ")
    .trim();

  return name || "کاربر";
}// =====================================
// ساخت متن اطلاعات کاربر
// =====================================

async function buildUserInfo(ctx, group, user) {

  if (!user) {
    return "اطلاعات کاربر یافت نشد.";
  }

  ensureGroupInfo(group);

  const nickname =
    getUserNickname(group, user.id);

  const globalRole =
    getGlobalRole(group, user.id);

  const telegramRole =
    await getTelegramRole(ctx, user.id);

  const photoCount =
    await getProfilePhotoCount(ctx, user.id);

  const statsUser =
    ensureStatsUser(group, user);

  resetDailyStats(statsUser);

  const todayMessages =
    statsUser.dailyMessages || 0;

  const totalMessages =
    statsUser.totalMessages || 0;

  const todayAdds =
    statsUser.dailyAdds || 0;

  const totalAdds =
    statsUser.totalAdds || 0;

  const allUsers =
    Object.values(group.stats.users || {});

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

  let userName;

  if (user.username) {
    userName = `@${user.username}`;
  } else {
    userName = getUserFullName(user);
  }

  const clickableName =
    `[${userName}](tg://user?id=${user.id})`;

  return (
`◂ نام کاربر : 『𓆩 ${clickableName} 𓆪』
◂ آیدی عددی : ${user.id}
◂ یوزرنیم : ${user.username ? "@" + user.username : "ندارد"}
◂ تعداد تصاویر پروفایل : ${toPersianNumber(photoCount)} عدد
◂ لقب کاربر : ${nickname}
◂ اصل سراسری : ${globalRole}
◂ مقام کاربر : ${telegramRole}

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

async function sendUserInfo(ctx, group, user) {

  if (!ctx || !group || !user) {
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
          parse_mode: "Markdown"
        }
      );

      return;
    }

  } catch {}

  await ctx.reply(
    text,
    {
      parse_mode: "Markdown"
    }
  );
}


// =====================================
// ساخت آمار روزانه
// =====================================

function buildDailyRanking(group) {

  ensureGroupInfo(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const today =
    getDateKey();

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
    .forEach((user, index) => {

      const name =
        user.username
          ? `@${user.username}`
          : (
              `${user.firstName || ""} ${user.lastName || ""}`
            ).trim() || "کاربر";

      const clickable =
        `[${name}](tg://user?id=${user.id})`;

      text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyMessages || 0)} پیام.

`;
    });

  return text.trim();
}


// =====================================
// ساخت آمار کل
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
    .forEach((user, index) => {

      const name =
        user.username
          ? `@${user.username}`
          : (
              `${user.firstName || ""} ${user.lastName || ""}`
            ).trim() || "کاربر";

      const clickable =
        `[${name}](tg://user?id=${user.id})`;

      text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalMessages || 0)} پیام.

`;
    });

  return text.trim();
}


// =====================================
// ساخت آمار اد روزانه
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
    .forEach((user, index) => {

      const name =
        user.username
          ? `@${user.username}`
          : (
              `${user.firstName || ""} ${user.lastName || ""}`
            ).trim() || "کاربر";

      const clickable =
        `[${name}](tg://user?id=${user.id})`;

      text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyAdds || 0)} اد.

`;
    });

  return text.trim();
}


// =====================================
// ساخت آمار اد کل
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
    .forEach((user, index) => {

      const name =
        user.username
          ? `@${user.username}`
          : (
              `${user.firstName || ""} ${user.lastName || ""}`
            ).trim() || "کاربر";

      const clickable =
        `[${name}](tg://user?id=${user.id})`;

      text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalAdds || 0)} اد.

`;
    });

  return text.trim();
                    }// =====================================
// ساخت آمار مدیران
// =====================================

async function buildAdminRanking(ctx, group, daily = true) {

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
          ensureStatsUser(group, user);

        resetDailyStats(statsUser);

        const count =
          daily
            ? (statsUser.dailyMessages || 0)
            : (statsUser.totalMessages || 0);

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
    .forEach((user, index) => {

      const name =
        user.username
          ? `@${user.username}`
          : (
              `${user.firstName || ""} ${user.lastName || ""}`
            ).trim() || "کاربر";

      const clickable =
        `[${name}](tg://user?id=${user.id})`;

      text +=
`◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.count)} پیام.
( ${user.role} )

`;
    });

  return text.trim();
}


// =====================================
// ساخت آمار فعالیت گروه
// =====================================

async function buildActivityStats(ctx, group) {

  ensureGroupInfo(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const today =
    getDateKey();

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

    total += user.dailyMessages || 0;
    forwarded += user.forwarded || 0;
    textCount += user.text || 0;
    sticker += user.sticker || 0;
    animatedSticker += user.animatedSticker || 0;
    gif += user.gif || 0;
    photo += user.photo || 0;
    voice += user.voice || 0;
    audio += user.audio || 0;
    video += user.video || 0;
    videoNote += user.videoNote || 0;
    document += user.document || 0;

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
      .forEach((user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() || "کاربر";

        const clickable =
          `[${name}](tg://user?id=${user.id})`;

        output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyMessages || 0)} پیام.`;
      });

    output += "\n";
  }

  output +=
`\n─━ بهترین عضو کننده های امروز ━─\n`;

  if (!addersToday.length) {

    output +=
`\n◂ اطلاعاتی مرتبط با اد کننده های امروز یافت نشد !\n`;

  } else {

    addersToday
      .slice(0, 10)
      .forEach((user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() || "کاربر";

        const clickable =
          `[${name}](tg://user?id=${user.id})`;

        output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.dailyAdds || 0)} اد.`;
      });

    output += "\n";
  }

  output +=
`\n─┅━ ورودی و خروجی عضو ━┅─

◂ ورودی عضو امروز : ${toPersianNumber(addersToday.reduce(
    (sum, user) =>
      sum + (user.dailyAdds || 0),
    0
  ))}

◂ ورودی عضو کل : ${toPersianNumber(totalAdders.reduce(
    (sum, user) =>
      sum + (user.totalAdds || 0),
    0
  ))}

─┅━ فعال ترین های کل ━┅─
`;

  if (!totalActive.length) {

    output +=
`\n◂ اطلاعاتی ثبت نشده است.\n`;

  } else {

    totalActive
      .slice(0, 10)
      .forEach((user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() || "کاربر";

        const clickable =
          `[${name}](tg://user?id=${user.id})`;

        output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalMessages || 0)} پیام.`;
      });

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
      .forEach((user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : (
                `${user.firstName || ""} ${user.lastName || ""}`
              ).trim() || "کاربر";

        const clickable =
          `[${name}](tg://user?id=${user.id})`;

        output +=
`\n◂ رتبه ${toPersianNumber(index + 1)} : ${clickable} با ${toPersianNumber(user.totalAdds || 0)} اد.`;
      });
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
          text: "『𓆩 آمار اد روزانه 𓆪』",
          callback_data: "ginfo_stats_daily_adds"
        }
      ],

      [
        {
          text: "『𓆩 آمار کل 𓆪』",
          callback_data: "ginfo_stats_total"
        }
      ],

      [
        {
          text: "『𓆩 آمار فعالیت ها 𓆪』",
          callback_data: "ginfo_stats_activity"
        }
      ],

      [
        {
          text: "『𓆩 آمار روزانه 𓆪』",
          callback_data: "ginfo_stats_daily"
        }
      ],

      [
        {
          text: "『𓆩 آمار های دیگر 𓆪』",
          callback_data: "ginfo_stats_other"
        }
      ],

      [
        {
          text: "『𓆩 آمار اد کل 𓆪』",
          callback_data: "ginfo_stats_total_adds"
        }
      ],

      [
        {
          text: "『𓆩 آمار روزانه مدیران 𓆪』",
          callback_data: "ginfo_stats_daily_admins"
        }
      ],

      [
        {
          text: "『𓆩 آمار کل مدیران 𓆪』",
          callback_data: "ginfo_stats_total_admins"
        }
      ],

      [
        {
          text: "『𓆩 برگشت 𓆪』",
          callback_data: "ginfo_stats_back"
        },
        {
          text: "『𓆩 بستن 𓆪』",
          callback_data: "ginfo_stats_close"
        }
      ]

    ]
  };
}


// =====================================
// متن پنل آمار
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
// بررسی مالک پنل آمار
// =====================================

function isStatsPanelOwner(ctx) {

  if (!ctx || !ctx.callbackQuery) {
    return false;
  }

  const message =
    ctx.callbackQuery.message;

  if (!message) {
    return false;
  }

  return true;
}


// =====================================
// ارسال پنل آمار
// =====================================

async function showStatsPanel(ctx) {

  await ctx.reply(
    statsPanelText(),
    {
      reply_markup:
        statsKeyboard()
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
       }// =====================================
// ثبت تمام قابلیت های اطلاعات گروه
// =====================================

function registerGroupInfo(bot) {

  if (!bot) return;


  // ===================================
  // ثبت آمار پیام ها
  // ===================================

  bot.use(async (ctx, next) => {

    try {

      if (
        ctx.chat &&
        (
          ctx.chat.type === "group" ||
          ctx.chat.type === "supergroup"
        ) &&
        ctx.from &&
        !ctx.from.is_bot &&
        ctx.message
      ) {

        const group =
          getGroup(ctx.chat.id);

        if (group) {

          ensureGroupInfo(group);

          const message =
            ctx.message;

          const isJoin =
            message.new_chat_members &&
            message.new_chat_members.length > 0;

          const isLeave =
            message.left_chat_member;

          if (!isJoin && !isLeave) {

            recordMessage(
              group,
              message,
              ctx.from
            );
          }

          // -------------------------------
          // ثبت افرادی که عضو جدید اضافه کردند
          // -------------------------------

          if (isJoin) {

            recordMemberAdd(
              group,
              ctx.from
            );

            for (
              const newUser
              of message.new_chat_members
            ) {

              if (!newUser.is_bot) {

                ensureStatsUser(
                  group,
                  newUser
                );
              }
            }

            saveGroupInfo();
          }
        }
      }

    } catch {}

    return next();
  });


  // ===================================
  // دستور آیدی
  // فقط مدیر و مالک + Reply
  // ===================================

  bot.hears(
    /^آیدی$/i,
    async ctx => {

      if (
        !ctx.chat ||
        !ctx.from ||
        !ctx.message
      ) {
        return;
      }

      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {
        return;
      }

      const replied =
        ctx.message.reply_to_message;

      // بدون ریپلای = سکوت کامل
      if (!replied) {
        return;
      }

      let member;

      try {

        member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

      } catch {
        return;
      }

      if (
        member.status !== "creator" &&
        member.status !== "administrator"
      ) {
        return;
      }

      const target =
        replied.from;

      if (!target) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      await sendUserInfo(
        ctx,
        group,
        target
      );
    }
  );


  // ===================================
  // دستور قوانین
  // همه کاربران + فقط Reply
  // ===================================

  bot.hears(
    /^(قوانین|قوانین گروه)$/i,
    async ctx => {

      if (
        !ctx.chat ||
        !ctx.message
      ) {
        return;
      }

      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {
        return;
      }

      const replied =
        ctx.message.reply_to_message;

      // بدون ریپلای = سکوت
      if (!replied) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      if (
        !group.info.rules ||
        !String(group.info.rules).trim()
      ) {

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
        group.info.rules,
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );
    }
  );


  // ===================================
  // تنظیم قوانین
  // فقط مالک + Reply
  // ===================================

  bot.hears(
    /^تنظیم قوانین$/i,
    async ctx => {

      if (
        !ctx.chat ||
        !ctx.from ||
        !ctx.message
      ) {
        return;
      }

      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {
        return;
      }

      const replied =
        ctx.message.reply_to_message;

      // بدون ریپلای = سکوت
      if (!replied) {
        return;
      }

      let member;

      try {

        member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

      } catch {
        return;
      }

      // فقط صاحب گروه
      if (member.status !== "creator") {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      // علامت انتظار برای دریافت قوانین
      if (!group.info.waitingForRules) {
        group.info.waitingForRules = {};
      }

      group.info.waitingForRules[
        String(ctx.from.id)
      ] = true;

      saveGroupInfo();

      await ctx.reply(
        "قوانین را ارسال کنید.",
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );
    }
  );


  // ===================================
  // دریافت متن قوانین جدید
  // ===================================

  bot.on(
    "text",
    async ctx => {

      try {

        if (
          !ctx.chat ||
          !ctx.from ||
          !ctx.message
        ) {
          return;
        }

        if (
          ctx.chat.type !== "group" &&
          ctx.chat.type !== "supergroup"
        ) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return;
        }

        ensureGroupInfo(group);

        const waiting =
          group.info.waitingForRules &&
          group.info.waitingForRules[
            String(ctx.from.id)
          ];

        if (!waiting) {
          return;
        }

        let member;

        try {

          member =
            await ctx.telegram.getChatMember(
              ctx.chat.id,
              ctx.from.id
            );

        } catch {
          return;
        }

        if (member.status !== "creator") {

          delete group.info.waitingForRules[
            String(ctx.from.id)
          ];

          saveGroupInfo();

          return;
        }

        const text =
          ctx.message.text;

        if (
          !text ||
          !text.trim()
        ) {
          return;
        }

        group.info.rules =
          text.trim();

        delete group.info.waitingForRules[
          String(ctx.from.id)
        ];

        saveGroupInfo();

        await ctx.reply(
          "قوانین گروه ذخیره شد.",
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      } catch {}
    }
  );


  // ===================================
  // حذف قوانین
  // فقط مالک + Reply
  // ===================================

  bot.hears(
    /^حذف قوانین$/i,
    async ctx => {

      if (
        !ctx.chat ||
        !ctx.from ||
        !ctx.message
      ) {
        return;
      }

      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {
        return;
      }

      const replied =
        ctx.message.reply_to_message;

      if (!replied) {
        return;
      }

      let member;

      try {

        member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

      } catch {
        return;
      }

      if (member.status !== "creator") {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      group.info.rules = "";

      if (group.info.waitingForRules) {

        delete group.info.waitingForRules[
          String(ctx.from.id)
        ];
      }

      saveGroupInfo();

      await ctx.reply(
        "قوانین گروه حذف شد.",
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );
    }
  );


  // ===================================
  // دستور آمار
  // فقط مدیر و مالک + Reply
  // ===================================

  bot.hears(
    /^آمار$/i,
    async ctx => {

      if (
        !ctx.chat ||
        !ctx.from ||
        !ctx.message
      ) {
        return;
      }

      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {
        return;
      }

      const replied =
        ctx.message.reply_to_message;

      // بدون ریپلای = سکوت
      if (!replied) {
        return;
      }

      let member;

      try {

        member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

      } catch {
        return;
      }

      if (
        member.status !== "creator" &&
        member.status !== "administrator"
      ) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      await showStatsPanel(ctx);
    }
  );


  // ===================================
  // دکمه های پنل آمار
  // ===================================

  bot.action(
    /^ginfo_stats_/,
    async ctx => {

      try {

        if (
          !ctx.callbackQuery ||
          !ctx.callbackQuery.message
        ) {
          return;
        }

        const chatId =
          ctx.callbackQuery.message.chat.id;

        const userId =
          ctx.from.id;

        let member;

        try {

          member =
            await ctx.telegram.getChatMember(
              chatId,
              userId
            );

        } catch {

          await ctx.answerCbQuery();
          return;
        }

        if (
          member.status !== "creator" &&
          member.status !== "administrator"
        ) {

          await ctx.answerCbQuery();
          return;
        }

        const data =
          ctx.callbackQuery.data;

        const group =
          getGroup(chatId);

        if (!group) {

          await ctx.answerCbQuery();
          return;
        }

        ensureGroupInfo(group);

        // -------------------------------
        // بستن
        // -------------------------------

        if (
          data === "ginfo_stats_close"
        ) {

          await ctx.answerCbQuery();

          await statsClose(ctx);

          return;
        }

        // -------------------------------
        // برگشت
        // -------------------------------

        if (
          data === "ginfo_stats_back"
        ) {

          await ctx.answerCbQuery();

          await ctx.editMessageText(
            statsPanelText(),
            {
              reply_markup:
                statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار روزانه اد
        // -------------------------------

        if (
          data === "ginfo_stats_daily_adds"
        ) {

          await ctx.answerCbQuery();

          await ctx.editMessageText(
            buildDailyAdds(group),
            {
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار کل
        // -------------------------------

        if (
          data === "ginfo_stats_total"
        ) {

          await ctx.answerCbQuery();

          await ctx.editMessageText(
            buildTotalRanking(group),
            {
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار فعالیت ها
        // -------------------------------

        if (
          data === "ginfo_stats_activity"
        ) {

          await ctx.answerCbQuery();

          const text =
            await buildActivityStats(
              ctx,
              group
            );

          await ctx.editMessageText(
            text,
            {
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار روزانه
        // -------------------------------

        if (
          data === "ginfo_stats_daily"
        ) {

          await ctx.answerCbQuery();

          await ctx.editMessageText(
            buildDailyRanking(group),
            {
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار اد کل
        // -------------------------------

        if (
          data === "ginfo_stats_total_adds"
        ) {

          await ctx.answerCbQuery();

          await ctx.editMessageText(
            buildTotalAdds(group),
            {
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار روزانه مدیران
        // -------------------------------

        if (
          data ===
          "ginfo_stats_daily_admins"
        ) {

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
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار کل مدیران
        // -------------------------------

        if (
          data ===
          "ginfo_stats_total_admins"
        ) {

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
              parse_mode: "Markdown",
              reply_markup: statsKeyboard()
            }
          );

          return;
        }

        // -------------------------------
        // آمار های دیگر
        // -------------------------------

        if (
          data === "ginfo_stats_other"
        ) {

          await ctx.answerCbQuery();

          const users =
            Object.values(
              group.stats.users || {}
            );

          const totalUsers =
            users.length;

          const totalAdds =
            users.reduce(
              (sum, user) =>
                sum +
                (user.totalAdds || 0),
              0
            );

          const totalMessages =
            users.reduce(
              (sum, user) =>
                sum +
                (user.totalMessages || 0),
              0
            );

          const text =
`─┅━ آمار های دیگر ━┅─

◂ کاربران ثبت شده : ${toPersianNumber(totalUsers)} نفر
◂ مجموع پیام های ثبت شده : ${toPersianNumber(totalMessages)} عدد
◂ مجموع اد های ثبت شده : ${toPersianNumber(totalAdds)} نفر`;

          await ctx.editMessageText(
            text,
            {
              reply_markup:
                statsKeyboard()
            }
          );

          return;
        }

        await ctx.answerCbQuery();

      } catch {

        try {
          await ctx.answerCbQuery();
        } catch {}
      }
    }
  );
}


// =====================================
// اطمینان از وجود اطلاعات گروه
// =====================================

function initGroupInfo(group) {

  return ensureGroupInfo(group);
}


// =====================================
// خروجی فایل
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
