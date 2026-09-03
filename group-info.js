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
// ابزار اعداد فارسی
// =====================================

function toPersianNumber(value) {

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
// Escape برای HTML
// =====================================

function escapeHTML(text) {

  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

}


// =====================================
// تاریخ امروز
// =====================================

function getTodayKey() {

  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

}


// =====================================
// ساعت فعلی
// =====================================

function getCurrentTime() {

  const now = new Date();

  const h = String(
    now.getHours()
  ).padStart(2, "0");

  const m = String(
    now.getMinutes()
  ).padStart(2, "0");

  const s = String(
    now.getSeconds()
  ).padStart(2, "0");

  return `${h}:${m}:${s}`;

}


// =====================================
// ایجاد ساختار اطلاعات گروه
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

  if (
    !Object.prototype.hasOwnProperty.call(
      group.info,
      "waitingForRules"
    )
  ) {
    group.info.waitingForRules = null;
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

  if (!group.stats.lastReset) {
    group.stats.lastReset = getTodayKey();
  }

  return group;

}


// =====================================
// ذخیره دیتابیس
// =====================================

function saveGroupInfo() {

  try {

    saveDB();

  } catch (error) {

    try {
      saveDB();
    } catch (_) {}

  }

}


// =====================================
// ریست آمار روزانه
// =====================================

function resetDailyStats(group) {

  if (!group) return;

  ensureGroupInfo(group);

  const today = getTodayKey();

  if (group.stats.lastReset !== today) {

    for (
      const userId of Object.keys(
        group.stats.users
      )
    ) {

      const user =
        group.stats.users[userId];

      user.dailyMessages = 0;
      user.dailyAdds = 0;

      user.daily = {
        messages: 0,
        adds: 0,
        forwarded: 0,
        text: 0,
        sticker: 0,
        animatedSticker: 0,
        gif: 0,
        photo: 0,
        voice: 0,
        music: 0,
        video: 0,
        videoNote: 0,
        document: 0
      };

    }

    group.stats.lastReset = today;

  }

}


// =====================================
// ایجاد کاربر آماری
// =====================================

function ensureStatsUser(group, user) {

  if (!group || !user || !user.id) {
    return null;
  }

  ensureGroupInfo(group);
  resetDailyStats(group);

  const id = String(user.id);

  if (!group.stats.users[id]) {

    group.stats.users[id] = {
      id: user.id,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      username: user.username || "",

      totalMessages: 0,
      dailyMessages: 0,

      totalAdds: 0,
      dailyAdds: 0,

      daily: {
        messages: 0,
        adds: 0,
        forwarded: 0,
        text: 0,
        sticker: 0,
        animatedSticker: 0,
        gif: 0,
        photo: 0,
        voice: 0,
        music: 0,
        video: 0,
        videoNote: 0,
        document: 0
      },

      lastSeen: Date.now()
    };

  } else {

    const saved =
      group.stats.users[id];

    saved.id = user.id;

    if (user.first_name !== undefined) {
      saved.firstName =
        user.first_name || "";
    }

    if (user.last_name !== undefined) {
      saved.lastName =
        user.last_name || "";
    }

    if (user.username !== undefined) {
      saved.username =
        user.username || "";
    }

    if (!saved.daily) {
      saved.daily = {};
    }

    saved.lastSeen = Date.now();

  }

  return group.stats.users[id];

}


// =====================================
// ثبت پیام
// =====================================

function recordMessage(
  group,
  message,
  user
) {

  if (
    !group ||
    !message ||
    !user ||
    !user.id
  ) {
    return;
  }

  ensureGroupInfo(group);
  resetDailyStats(group);

  const statsUser =
    ensureStatsUser(
      group,
      user
    );

  if (!statsUser) return;

  statsUser.totalMessages += 1;
  statsUser.dailyMessages += 1;

  if (!statsUser.daily) {
    statsUser.daily = {};
  }

  statsUser.daily.messages =
    Number(
      statsUser.daily.messages || 0
    ) + 1;

  if (message.forward_origin) {

    statsUser.daily.forwarded =
      Number(
        statsUser.daily.forwarded || 0
      ) + 1;

  }

  if (message.text) {

    statsUser.daily.text =
      Number(
        statsUser.daily.text || 0
      ) + 1;

  }

  if (message.sticker) {

    if (
      message.sticker.is_animated ||
      message.sticker.is_video
    ) {

      statsUser.daily.animatedSticker =
        Number(
          statsUser.daily.animatedSticker || 0
        ) + 1;

    } else {

      statsUser.daily.sticker =
        Number(
          statsUser.daily.sticker || 0
        ) + 1;

    }

  }

  if (message.animation) {

    statsUser.daily.gif =
      Number(
        statsUser.daily.gif || 0
      ) + 1;

  }

  if (message.photo) {

    statsUser.daily.photo =
      Number(
        statsUser.daily.photo || 0
      ) + 1;

  }

  if (message.voice) {

    statsUser.daily.voice =
      Number(
        statsUser.daily.voice || 0
      ) + 1;

  }

  if (message.audio) {

    statsUser.daily.music =
      Number(
        statsUser.daily.music || 0
      ) + 1;

  }

  if (message.video) {

    statsUser.daily.video =
      Number(
        statsUser.daily.video || 0
      ) + 1;

  }

  if (message.video_note) {

    statsUser.daily.videoNote =
      Number(
        statsUser.daily.videoNote || 0
      ) + 1;

  }

  if (message.document) {

    statsUser.daily.document =
      Number(
        statsUser.daily.document || 0
      ) + 1;

  }

  saveGroupInfo();

}


// =====================================
// ثبت اد کردن عضو
// =====================================

function recordMemberAdd(
  group,
  adder
) {

  if (
    !group ||
    !adder ||
    !adder.id
  ) {
    return;
  }

  ensureGroupInfo(group);
  resetDailyStats(group);

  const statsUser =
    ensureStatsUser(
      group,
      adder
    );

  if (!statsUser) return;

  statsUser.totalAdds += 1;
  statsUser.dailyAdds += 1;

  if (!statsUser.daily) {
    statsUser.daily = {};
  }

  statsUser.daily.adds =
    Number(
      statsUser.daily.adds || 0
    ) + 1;

  saveGroupInfo();

}


// =====================================
// لقب کاربر
// =====================================

function getUserNickname(
  group,
  userId
) {

  ensureGroupInfo(group);

  const nickname =
    group.info.nicknames[
      String(userId)
    ];

  if (
    nickname === undefined ||
    nickname === null ||
    String(nickname).trim() === ""
  ) {
    return "بدون لقب";
  }

  return String(nickname);

}


// =====================================
// اصل سراسری
// =====================================

function getGlobalRole(
  group,
  userId
) {

  ensureGroupInfo(group);

  const role =
    group.info.globalRoles[
      String(userId)
    ];

  if (
    role === undefined ||
    role === null ||
    String(role).trim() === ""
  ) {
    return "ندارد";
  }

  return String(role);

}


// =====================================
// نام قابل نمایش
// =====================================

function getUserDisplayName(user) {

  if (!user) return "کاربر";

  const first =
    user.first_name || "";

  const last =
    user.last_name || "";

  const full =
    `${first} ${last}`.trim();

  if (full) {
    return full;
  }

  if (user.username) {
    return `@${user.username}`;
  }

  return String(
    user.id || "کاربر"
  );

}


// =====================================
// نام قابل کلیک
// =====================================

function clickableUser(
  userId,
  name
) {

  return `<a href="tg://user?id=${userId}">${escapeHTML(name)}</a>`;

}


// =====================================
// ساخت اطلاعات کاربر
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
  resetDailyStats(group);

  const statsUser =
    ensureStatsUser(
      group,
      user
    );

  let role =
    "فرد عادی";

  try {

    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        user.id
      );

    if (member.status === "creator") {
      role = "صاحب گروه";
    } else if (
      member.status === "administrator"
    ) {
      role = "مدیر گروه";
    }

  } catch (_) {}

  let photoCount = 0;

  try {

    const photos =
      await ctx.telegram.getUserProfilePhotos(
        user.id,
        0,
        1
      );

    photoCount =
      Number(
        photos.total_count || 0
      );

  } catch (_) {}

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

  const allUsers =
    Object.values(
      group.stats.users || {}
    );

  const sorted =
    [...allUsers].sort(
      (a, b) =>
        Number(b.totalMessages || 0) -
        Number(a.totalMessages || 0)
    );

  const rankIndex =
    sorted.findIndex(
      item =>
        String(item.id) ===
        String(user.id)
    );

  const rank =
    rankIndex === -1
      ? 0
      : rankIndex + 1;

  const todayMessages =
    statsUser
      ? Number(
          statsUser.dailyMessages || 0
        )
      : 0;

  const todayAdds =
    statsUser
      ? Number(
          statsUser.dailyAdds || 0
        )
      : 0;

  const totalAdds =
    statsUser
      ? Number(
          statsUser.totalAdds || 0
        )
      : 0;

  let usernameText =
    "ندارد";

  if (user.username) {
    usernameText =
      `@${escapeHTML(user.username)}`;
  } else {

    usernameText =
      escapeHTML(
        getUserDisplayName(user)
      );

  }

  const displayName =
    clickableUser(
      user.id,
      getUserDisplayName(user)
    );

  return [
    `◂ نام کاربر : 『𓆩 ${displayName} 𓆪』`,
    `◂ آیدی عددی : ${toPersianNumber(user.id)}`,
    `◂ یوزرنیم : ${usernameText}`,
    `◂ تعداد تصاویر پروفایل : ${toPersianNumber(photoCount)} عدد`,
    `◂ لقب کاربر : ${escapeHTML(nickname)}`,
    `◂ اصل سراسری : ${escapeHTML(globalRole)}`,
    `◂ مقام کاربر : ${escapeHTML(role)}`,

    "",
    "─┅━ آمار کاربر ━┅─",
    `◂ پیام های امروز : ${toPersianNumber(todayMessages)} عدد`,
    `◂ رتبه در تعداد پیام : ${toPersianNumber(rank)}`
      + (rank ? "" : " ثبت نشده"),
    `◂ تعداد اد امروز : ${toPersianNumber(todayAdds)} نفر`,
    `◂ تعداد اد کل : ${toPersianNumber(totalAdds)} نفر`
  ].join("\n");

}


// =====================================
// ارسال اطلاعات کاربر
// =====================================

async function sendUserInfo(
  ctx,
  group,
  user
) {

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
      photos.total_count > 0 &&
      photos.photos &&
      photos.photos[0] &&
      photos.photos[0][0]
    ) {

      const fileId =
        photos.photos[0][0].file_id;

      await ctx.replyWithPhoto(
        fileId,
        {
          caption: text,
          parse_mode: "HTML",
          reply_to_message_id:
            ctx.message.message_id
        }
      );

      return;

    }

  } catch (_) {}

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
// پایان قسمت ۱
// =====================================// =====================================
// رتبه‌بندی روزانه
// =====================================

function buildDailyRanking(group) {

  ensureGroupInfo(group);
  resetDailyStats(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const active =
    users
      .filter(
        user =>
          Number(
            user.dailyMessages || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.dailyMessages || 0) -
          Number(a.dailyMessages || 0)
      );

  if (!active.length) {

    return [
      "• فعال ترین ها از ساعت 00:00 تا این لحظه :",
      "",
      "◂ هنوز فعالیتی ثبت نشده است."
    ].join("\n");

  }

  const lines = [
    "• فعال ترین ها از ساعت 00:00 تا این لحظه :",
    ""
  ];

  active
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.dailyMessages)} پیام.`
        );

      }
    );

  return lines.join("\n");

}


// =====================================
// رتبه‌بندی کل
// =====================================

function buildTotalRanking(group) {

  ensureGroupInfo(group);
  resetDailyStats(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const active =
    users
      .filter(
        user =>
          Number(
            user.totalMessages || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.totalMessages || 0) -
          Number(a.totalMessages || 0)
      );

  if (!active.length) {

    return [
      "• به طور کلی افرادی که بیشترین فعالیت را دارند :",
      "",
      "◂ هنوز فعالیتی ثبت نشده است."
    ].join("\n");

  }

  const lines = [
    "• به طور کلی افرادی که بیشترین فعالیت را دارند :",
    ""
  ];

  active
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.totalMessages)} پیام.`
        );

      }
    );

  return lines.join("\n");

}


// =====================================
// اد کننده‌های روزانه
// =====================================

function buildDailyAdds(group) {

  ensureGroupInfo(group);
  resetDailyStats(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const active =
    users
      .filter(
        user =>
          Number(
            user.dailyAdds || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.dailyAdds || 0) -
          Number(a.dailyAdds || 0)
      );

  if (!active.length) {

    return [
      "• اطلاعاتی مرتبط با اد کننده های امروز یافت نشد !"
    ].join("\n");

  }

  const lines = [
    "• اد کننده های امروز :",
    ""
  ];

  active
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.dailyAdds)} اد.`
        );

      }
    );

  return lines.join("\n");

}


// =====================================
// اد کننده‌های کل
// =====================================

function buildTotalAdds(group) {

  ensureGroupInfo(group);
  resetDailyStats(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const active =
    users
      .filter(
        user =>
          Number(
            user.totalAdds || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.totalAdds || 0) -
          Number(a.totalAdds || 0)
      );

  if (!active.length) {

    return [
      "• به طور کلی افرادی که بیشترین اد ها را انجام دادند :",
      "",
      "◂ هنوز اطلاعاتی ثبت نشده است."
    ].join("\n");

  }

  const lines = [
    "• به طور کلی افرادی که بیشترین اد ها را انجام دادند :",
    ""
  ];

  active
    .slice(0, 20)
    .forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.totalAdds)} اد.`
        );

      }
    );

  return lines.join("\n");

}


// =====================================
// رتبه‌بندی مدیران
// =====================================

async function buildAdminRanking(
  ctx,
  group,
  daily
) {

  ensureGroupInfo(group);
  resetDailyStats(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  const admins = [];

  for (
    const user of users
  ) {

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

        admins.push({
          user,
          member
        });

      }

    } catch (_) {}

  }

  admins.sort(
    (a, b) => {

      const av =
        daily
          ? Number(
              a.user.dailyMessages || 0
            )
          : Number(
              a.user.totalMessages || 0
            );

      const bv =
        daily
          ? Number(
              b.user.dailyMessages || 0
            )
          : Number(
              b.user.totalMessages || 0
            );

      return bv - av;

    }
  );

  const title =
    daily
      ? "• فعال ترین مدیران از 00:00 تا این لحظه :"
      : "• به طور کلی مدیرانی که بیشترین فعالیت را دارند :";

  if (!admins.length) {

    return [
      title,
      "",
      "◂ اطلاعاتی از فعالیت مدیران یافت نشد."
    ].join("\n");

  }

  const lines = [
    title,
    ""
  ];

  admins
    .slice(0, 20)
    .forEach(
      item => {

        const user =
          item.user;

        const member =
          item.member;

        const value =
          daily
            ? Number(
                user.dailyMessages || 0
              )
            : Number(
                user.totalMessages || 0
              );

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        const role =
          member.status === "creator"
            ? "صاحب گروه"
            : "مدیر گروه";

        lines.push(
          `◂ ${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(value)} پیام.`
        );

        lines.push(
          `( ${escapeHTML(role)} )`
        );

        lines.push("");

      }
    );

  return lines.join("\n").trim();

}


// =====================================
// آمار فعالیت گروه
// =====================================

function buildActivityStats(
  ctx,
  group
) {

  ensureGroupInfo(group);
  resetDailyStats(group);

  const users =
    Object.values(
      group.stats.users || {}
    );

  let totalMessages = 0;
  let forwarded = 0;
  let text = 0;
  let sticker = 0;
  let animatedSticker = 0;
  let gif = 0;
  let photo = 0;
  let voice = 0;
  let music = 0;
  let video = 0;
  let videoNote = 0;
  let document = 0;

  let dailyAdds = 0;
  let totalAdds = 0;

  for (
    const user of users
  ) {

    const daily =
      user.daily || {};

    totalMessages +=
      Number(
        user.dailyMessages || 0
      );

    forwarded +=
      Number(
        daily.forwarded || 0
      );

    text +=
      Number(
        daily.text || 0
      );

    sticker +=
      Number(
        daily.sticker || 0
      );

    animatedSticker +=
      Number(
        daily.animatedSticker || 0
      );

    gif +=
      Number(
        daily.gif || 0
      );

    photo +=
      Number(
        daily.photo || 0
      );

    voice +=
      Number(
        daily.voice || 0
      );

    music +=
      Number(
        daily.music || 0
      );

    video +=
      Number(
        daily.video || 0
      );

    videoNote +=
      Number(
        daily.videoNote || 0
      );

    document +=
      Number(
        daily.document || 0
      );

    dailyAdds +=
      Number(
        user.dailyAdds || 0
      );

    totalAdds +=
      Number(
        user.totalAdds || 0
      );

  }

  const activeToday =
    [...users]
      .filter(
        user =>
          Number(
            user.dailyMessages || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.dailyMessages || 0) -
          Number(a.dailyMessages || 0)
      )
      .slice(0, 10);

  const activeTotal =
    [...users]
      .filter(
        user =>
          Number(
            user.totalMessages || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.totalMessages || 0) -
          Number(a.totalMessages || 0)
      )
      .slice(0, 10);

  const addersToday =
    [...users]
      .filter(
        user =>
          Number(
            user.dailyAdds || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.dailyAdds || 0) -
          Number(a.dailyAdds || 0)
      )
      .slice(0, 10);

  const addersTotal =
    [...users]
      .filter(
        user =>
          Number(
            user.totalAdds || 0
          ) > 0
      )
      .sort(
        (a, b) =>
          Number(b.totalAdds || 0) -
          Number(a.totalAdds || 0)
      )
      .slice(0, 10);

  const lines = [];

  lines.push(
    "◄ آمار فعالیت گروه از 00:00 تا این لحظه :"
  );

  lines.push("");

  lines.push(
    `• تاریخ : ${getTodayKey()}`
  );

  lines.push(
    `• ساعت : ${getCurrentTime()}`
  );

  lines.push("");

  lines.push(
    "─┅━ پیام های امروز ━┅─"
  );

  lines.push("");

  lines.push(
    `◂ کل پیام ها : ${toPersianNumber(totalMessages)}`
  );

  lines.push(
    `◂ پیام فرواردی : ${toPersianNumber(forwarded)}`
  );

  lines.push(
    `◂ متن : ${toPersianNumber(text)}`
  );

  lines.push(
    `◂ استیکر : ${toPersianNumber(sticker)}`
  );

  lines.push(
    `◂ استیکر متحرک : ${toPersianNumber(animatedSticker)}`
  );

  lines.push(
    `◂ گیف : ${toPersianNumber(gif)}`
  );

  lines.push(
    `◂ عکس : ${toPersianNumber(photo)}`
  );

  lines.push(
    `◂ ویس : ${toPersianNumber(voice)}`
  );

  lines.push(
    `◂ موزیک : ${toPersianNumber(music)}`
  );

  lines.push(
    `◂ فیلم : ${toPersianNumber(video)}`
  );

  lines.push(
    `◂ فیلم سلفی : ${toPersianNumber(videoNote)}`
  );

  lines.push(
    `◂ فایل : ${toPersianNumber(document)}`
  );

  lines.push("");

  lines.push(
    "─┅━ فعال ترین های امروز ━┅─"
  );

  lines.push("");

  if (!activeToday.length) {

    lines.push(
      "◂ اطلاعاتی ثبت نشده است."
    );

  } else {

    activeToday.forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.dailyMessages)} پیام.`
        );

      }
    );

  }

  lines.push("");

  lines.push(
    "─━ بهترین عضو کننده های امروز ━─"
  );

  lines.push("");

  if (!addersToday.length) {

    lines.push(
      "◂ اطلاعاتی ثبت نشده است."
    );

  } else {

    addersToday.forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.dailyAdds)} اد.`
        );

      }
    );

  }

  lines.push("");

  lines.push(
    "─┅━ ورودی و خروجی عضو ━┅─"
  );

  lines.push("");

  lines.push(
    `◂ اد امروز : ${toPersianNumber(dailyAdds)} نفر`
  );

  lines.push(
    `◂ اد کل : ${toPersianNumber(totalAdds)} نفر`
  );

  lines.push("");

  lines.push(
    "─┅━ فعال ترین های کل ━┅─"
  );

  lines.push("");

  if (!activeTotal.length) {

    lines.push(
      "◂ اطلاعاتی ثبت نشده است."
    );

  } else {

    activeTotal.forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.totalMessages)} پیام.`
        );

      }
    );

  }

  lines.push("");

  lines.push(
    "─━ بهترین عضو کننده های کل ━─"
  );

  lines.push("");

  if (!addersTotal.length) {

    lines.push(
      "◂ اطلاعاتی ثبت نشده است."
    );

  } else {

    addersTotal.forEach(
      (user, index) => {

        const name =
          user.username
            ? `@${user.username}`
            : getUserDisplayName(user);

        lines.push(
          `◂ رتبه ${toPersianNumber(index + 1)} : `
          + `${clickableUser(user.id, name)} `
          + `با ${toPersianNumber(user.totalAdds)} اد.`
        );

      }
    );

  }

  return lines.join("\n");

}


// =====================================
// پایان قسمت ۲
// =====================================// =====================================
// کیبورد آمار
// =====================================

function statsKeyboard() {

  const {
    Markup
  } = require("telegraf");

  return Markup.inlineKeyboard([

    [
      Markup.button.callback(
        "『𓆩 آمار اد روزانه 𓆪』",
        "ginfo_stats_daily_adds"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار کل 𓆪』",
        "ginfo_stats_total"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار فعالیت ها 𓆪』",
        "ginfo_stats_activity"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار روزانه 𓆪』",
        "ginfo_stats_daily"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار های دیگر 𓆪』",
        "ginfo_stats_other"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار اد کل 𓆪』",
        "ginfo_stats_total_adds"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار روزانه مدیران 𓆪』",
        "ginfo_stats_daily_admins"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 آمار کل مدیران 𓆪』",
        "ginfo_stats_total_admins"
      )
    ],

    [
      Markup.button.callback(
        "『𓆩 برگشت 𓆪』",
        "ginfo_stats_back"
      ),

      Markup.button.callback(
        "『𓆩 بستن 𓆪』",
        "ginfo_stats_close"
      )
    ]

  ]);

}


// =====================================
// متن پنل آمار
// =====================================

function statsPanelText() {

  return [
    "╔══════════════════╗",
    "       『𓆩 آمار گروه 𓆪』",
    "╚══════════════════╝",
    "",
    "◂ بخش مورد نظر خود را انتخاب کنید."
  ].join("\n");

}


// =====================================
// نمایش پنل آمار
// =====================================

async function showStatsPanel(ctx) {

  await ctx.reply(
    statsPanelText(),
    {
      reply_markup:
        statsKeyboard().reply_markup
    }
  );

}


// =====================================
// بستن پنل
// =====================================

async function statsClose(ctx) {

  try {

    await ctx.deleteMessage();

  } catch (_) {}

}


// =====================================
// راه‌اندازی اصلی
// =====================================

function registerGroupInfo(bot) {

  // =====================================
  // ثبت آمار پیام‌ها و اعضای جدید
  // =====================================

  bot.use(
    async (ctx, next) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {

          return next();

        }

        if (!ctx.from) {
          return next();
        }

        const group =
          getGroup(ctx.chat.id);

        if (group) {

          ensureGroupInfo(group);
          resetDailyStats(group);

          // -----------------------------
          // عضو جدید
          // -----------------------------

          if (
            ctx.message &&
            ctx.message.new_chat_members
          ) {

            for (
              const member of
              ctx.message.new_chat_members
            ) {

              if (!member.is_bot) {

                ensureStatsUser(
                  group,
                  member
                );

                recordMemberAdd(
                  group,
                  ctx.from
                );

              }

            }

            saveGroupInfo();

          }

          // -----------------------------
          // پیام معمولی
          // -----------------------------

          else if (ctx.message) {

            recordMessage(
              group,
              ctx.message,
              ctx.from
            );

          }

        }

      } catch (error) {

        console.error(
          "GROUP INFO STATS ERROR:",
          error.message
        );

      }

      return next();

    }
  );


  // =====================================
  // آیدی
  // فقط Owner / Admin
  // حتماً Reply
  // =====================================

  bot.hears(
    /^آیدی$/i,
    async (ctx) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return;
        }

        if (
          !ctx.message.reply_to_message
        ) {
          return;
        }

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

        const isOwner =
          member.status === "creator";

        const isAdmin =
          member.status === "administrator";

        if (
          !isOwner &&
          !isAdmin
        ) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return;
        }

        ensureGroupInfo(group);

        const reply =
          ctx.message.reply_to_message;

        if (!reply.from) {
          return;
        }

        await sendUserInfo(
          ctx,
          group,
          reply.from
        );

      } catch (error) {

        console.error(
          "USER INFO ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // قوانین
  // هر کاربر می‌تواند ببیند
  // Reply روی پیام خودش
  // =====================================

  bot.hears(
    /^(قوانین|قوانین گروه)$/i,
    async (ctx) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return;
        }

        ensureGroupInfo(group);

        const rules =
          group.info.rules;

        const text =
          rules &&
          String(rules).trim()
            ? String(rules)
            : "قوانین گروه هنوز تنظیم نشده است.";

        await ctx.reply(
          text,
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
  // بدون نیاز به Reply
  // =====================================

  bot.hears(
    /^تنظیم قوانین$/i,
    async (ctx) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return;
        }

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

        // فقط Owner
        if (
          member.status !== "creator"
        ) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return;
        }

        ensureGroupInfo(group);

        // فعال کردن انتظار متن قوانین
        group.info.waitingForRules =
          ctx.from.id;

        saveGroupInfo();

        // ربات روی همان پیام فرمان Reply می‌کند
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

  bot.on(
    "text",
    async (ctx, next) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return next();
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return next();
        }

        ensureGroupInfo(group);

        const waiting =
          group.info.waitingForRules;

        // هیچکس منتظر ارسال قوانین نیست
        if (!waiting) {
          return next();
        }

        // فقط همان صاحب گروه
        if (
          !ctx.from ||
          String(ctx.from.id) !==
          String(waiting)
        ) {
          return next();
        }

        const text =
          ctx.message.text;

        if (
          !text ||
          !text.trim()
        ) {
          return next();
        }

        // فرمان‌ها را به عنوان قوانین ذخیره نکن
        if (
          /^(تنظیم قوانین|حذف قوانین|قوانین|قوانین گروه)$/i.test(
            text.trim()
          )
        ) {
          return next();
        }

        // ذخیره قوانین
        group.info.rules =
          text.trim();

        // پایان حالت انتظار
        group.info.waitingForRules =
          null;

        saveGroupInfo();

        // ربات روی پیام متن قوانین Reply می‌کند
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

    }
  );


// =====================================
// پایان قسمت ۳
// =====================================  // =====================================
  // حذف قوانین
  // فقط صاحب گروه
  // با Reply
  // =====================================

  bot.hears(
    /^حذف قوانین$/i,
    async (ctx) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return;
        }

        // بدون Reply = سکوت
        if (
          !ctx.message.reply_to_message
        ) {
          return;
        }

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

        // فقط Owner
        if (
          member.status !== "creator"
        ) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return;
        }

        ensureGroupInfo(group);

        group.info.rules =
          "";

        group.info.waitingForRules =
          null;

        saveGroupInfo();

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
  // حتماً Reply
  // =====================================

  bot.hears(
    /^آمار$/i,
    async (ctx) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {
          return;
        }

        // بدون Reply = سکوت
        if (
          !ctx.message.reply_to_message
        ) {
          return;
        }

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

        const isOwner =
          member.status === "creator";

        const isAdmin =
          member.status === "administrator";

        // کاربر عادی = سکوت
        if (
          !isOwner &&
          !isAdmin
        ) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          return;
        }

        ensureGroupInfo(group);
        resetDailyStats(group);

        saveGroupInfo();

        await showStatsPanel(ctx);

      } catch (error) {

        console.error(
          "GROUP STATS ERROR:",
          error.message
        );

      }

    }
  );


  // =====================================
  // کنترل کامل دکمه‌های آمار
  // =====================================

  bot.action(
    /^ginfo_stats_/,
    async (ctx) => {

      try {

        if (
          !ctx.chat ||
          (
            ctx.chat.type !== "group" &&
            ctx.chat.type !== "supergroup"
          )
        ) {

          await ctx.answerCbQuery();

          return;

        }

        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            ctx.from.id
          );

        const isOwner =
          member.status === "creator";

        const isAdmin =
          member.status === "administrator";

        // فقط Owner / Admin
        if (
          !isOwner &&
          !isAdmin
        ) {

          await ctx.answerCbQuery();

          return;

        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {

          await ctx.answerCbQuery();

          return;

        }

        ensureGroupInfo(group);
        resetDailyStats(group);

        const action =
          ctx.callbackQuery.data;


        // =====================================
        // بستن
        // =====================================

        if (
          action ===
          "ginfo_stats_close"
        ) {

          await ctx.answerCbQuery();

          await statsClose(ctx);

          return;

        }


        // =====================================
        // برگشت
        // =====================================

        if (
          action ===
          "ginfo_stats_back"
        ) {

          await ctx.answerCbQuery();

          await ctx.editMessageText(
            statsPanelText(),
            {
              reply_markup:
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار اد روزانه
        // =====================================

        if (
          action ===
          "ginfo_stats_daily_adds"
        ) {

          await ctx.answerCbQuery();

          const text =
            buildDailyAdds(group);

          await ctx.editMessageText(
            text,
            {
              parse_mode: "HTML",
              reply_markup:
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار کل
        // =====================================

        if (
          action ===
          "ginfo_stats_total"
        ) {

          await ctx.answerCbQuery();

          const text =
            buildTotalRanking(group);

          await ctx.editMessageText(
            text,
            {
              parse_mode: "HTML",
              reply_markup:
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار فعالیت‌ها
        // =====================================

        if (
          action ===
          "ginfo_stats_activity"
        ) {

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
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار روزانه
        // =====================================

        if (
          action ===
          "ginfo_stats_daily"
        ) {

          await ctx.answerCbQuery();

          const text =
            buildDailyRanking(
              group
            );

          await ctx.editMessageText(
            text,
            {
              parse_mode: "HTML",
              reply_markup:
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار های دیگر
        // =====================================

        if (
          action ===
          "ginfo_stats_other"
        ) {

          await ctx.answerCbQuery();

          const users =
            Object.values(
              group.stats.users || {}
            );

          let totalMessages = 0;
          let totalAdds = 0;

          for (
            const user of users
          ) {

            totalMessages +=
              Number(
                user.totalMessages || 0
              );

            totalAdds +=
              Number(
                user.totalAdds || 0
              );

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
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار اد کل
        // =====================================

        if (
          action ===
          "ginfo_stats_total_adds"
        ) {

          await ctx.answerCbQuery();

          const text =
            buildTotalAdds(group);

          await ctx.editMessageText(
            text,
            {
              parse_mode: "HTML",
              reply_markup:
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار روزانه مدیران
        // =====================================

        if (
          action ===
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
              parse_mode: "HTML",
              reply_markup:
                statsKeyboard()
                  .reply_markup
            }
          );

          return;

        }


        // =====================================
        // آمار کل مدیران
        // =====================================

        if (
          action ===
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
              parse_mode: "HTML",
              reply_markup:
                statsKeyboard()
                  .reply_markup
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

    }
  );

}


// =====================================
// راه‌اندازی اطلاعات گروه
// =====================================

function initGroupInfo(chatId) {

  const group =
    getGroup(chatId);

  if (!group) {
    return null;
  }

  ensureGroupInfo(group);
  resetDailyStats(group);

  saveGroupInfo();

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


// =====================================
// پایان group-info.js
// =====================================
