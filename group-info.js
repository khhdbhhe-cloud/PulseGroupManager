// =====================================
// PulseGroupManager
// GROUP INFO
// آیدی | آمار | قوانین گروه
// =====================================

const {
  getGroup,
  saveDB
} = require("./database");


// =====================================
// تنظیمات
// =====================================

const GROUP_INFO = {};

const STATS_PAGE_SIZE = 25;


// =====================================
// اعداد فارسی
// =====================================

function faNumber(value) {
  const map = {
    "0": "０",
    "1": "１",
    "2": "２",
    "3": "３",
    "4": "４",
    "5": "５",
    "6": "６",
    "7": "７",
    "8": "８",
    "9": "９"
  };

  return String(value ?? 0)
    .split("")
    .map(char => map[char] || char)
    .join("");
}


// =====================================
// نام کاربر
// =====================================

function getUserName(user) {
  if (!user) return "کاربر";

  const first =
    String(user.first_name || "").trim();

  const last =
    String(user.last_name || "").trim();

  const name =
    `${first} ${last}`.trim();

  return name || "کاربر";
}


// =====================================
// نام قابل کلیک کاربر
// =====================================

function getClickableUserName(user) {
  if (!user || !user.id) {
    return "کاربر";
  }

  const name =
    user.username
      ? `@${String(user.username).replace(/^@/, "")}`
      : getUserName(user);

  return `<a href="tg://user?id=${user.id}">${escapeHtml(name)}</a>`;
}


// =====================================
// فرار دادن HTML
// =====================================

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// =====================================
// نام معمولی کاربر
// =====================================

function getDisplayName(user) {
  if (!user) return "کاربر";

  if (user.username) {
    return `@${String(user.username).replace(/^@/, "")}`;
  }

  return getUserName(user);
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
// ساختار اطلاعات گروه
// =====================================

function ensureGroupInfo(group) {
  if (!group) return null;

  if (!group.groupInfo) {
    group.groupInfo = {};
  }

  if (!group.groupInfo.users) {
    group.groupInfo.users = {};
  }

  if (!group.groupInfo.rules) {
    group.groupInfo.rules = "";
  }

  if (!group.groupInfo.stats) {
    group.groupInfo.stats = {};
  }

  const stats = group.groupInfo.stats;

  if (!stats.users) {
    stats.users = {};
  }

  if (!stats.daily) {
    stats.daily = {};
  }

  if (!stats.totalMessages) {
    stats.totalMessages = 0;
  }

  if (!stats.totalAdds) {
    stats.totalAdds = 0;
  }

  if (!stats.totalLeaves) {
    stats.totalLeaves = 0;
  }

  if (!stats.totalKicks) {
    stats.totalKicks = 0;
  }

  return group;
}


// =====================================
// ساختار کاربر آماری
// =====================================

function ensureStatsUser(group, user) {
  ensureGroupInfo(group);

  if (!user || !user.id) {
    return null;
  }

  const id = String(user.id);

  if (!group.groupInfo.stats.users[id]) {
    group.groupInfo.stats.users[id] = {
      id: user.id,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",

      totalMessages: 0,
      totalAdds: 0,
      totalAds: 0
    };
  }

  const data =
    group.groupInfo.stats.users[id];

  data.id = user.id;
  data.first_name = user.first_name || data.first_name || "";
  data.last_name = user.last_name || data.last_name || "";
  data.username = user.username || data.username || "";

  if (typeof data.totalMessages !== "number") {
    data.totalMessages = Number(data.totalMessages || 0);
  }

  if (typeof data.totalAdds !== "number") {
    data.totalAdds = Number(data.totalAdds || 0);
  }

  if (typeof data.totalAds !== "number") {
    data.totalAds = Number(data.totalAds || 0);
  }

  return data;
}


// =====================================
// ساختار آمار روز
// =====================================

function ensureDailyStats(group, dateKey) {
  ensureGroupInfo(group);

  if (!group.groupInfo.stats.daily[dateKey]) {
    group.groupInfo.stats.daily[dateKey] = {
      messages: 0,

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
      document: 0,

      adds: 0,
      linkAdds: 0,
      manualAdds: 0,
      leaves: 0,
      kicks: 0,

      users: {},
      adders: {}
    };
  }

  return group.groupInfo.stats.daily[dateKey];
}


// =====================================
// ساختار آمار روزانه کاربر
// =====================================

function ensureDailyUser(daily, user) {
  if (!user || !user.id) {
    return null;
  }

  const id = String(user.id);

  if (!daily.users[id]) {
    daily.users[id] = {
      id: user.id,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      messages: 0
    };
  }

  const data = daily.users[id];

  data.id = user.id;
  data.first_name =
    user.first_name || data.first_name || "";
  data.last_name =
    user.last_name || data.last_name || "";
  data.username =
    user.username || data.username || "";

  if (typeof data.messages !== "number") {
    data.messages = Number(data.messages || 0);
  }

  return data;
}


// =====================================
// ساختار اد کننده
// =====================================

function ensureAdder(daily, user) {
  if (!user || !user.id) {
    return null;
  }

  const id = String(user.id);

  if (!daily.adders[id]) {
    daily.adders[id] = {
      id: user.id,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      adds: 0
    };
  }

  const data = daily.adders[id];

  data.id = user.id;
  data.first_name =
    user.first_name || data.first_name || "";
  data.last_name =
    user.last_name || data.last_name || "";
  data.username =
    user.username || data.username || "";

  if (typeof data.adds !== "number") {
    data.adds = Number(data.adds || 0);
  }

  return data;
}


// =====================================
// تاریخ روز
// =====================================

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month =
    String(date.getMonth() + 1).padStart(2, "0");
  const day =
    String(date.getDate()).padStart(2, "0");

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
// نام روز هفته
// =====================================

function getPersianWeekDay(date = new Date()) {
  const days = [
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه"
  ];

  return days[date.getDay()];
}


// =====================================
// تاریخ شمسی
// =====================================

function getPersianDate(date = new Date()) {
  try {
    return new Intl.DateTimeFormat(
      "fa-IR-u-ca-persian",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).format(date);
  } catch {
    return "";
  }
    }// =====================================
// تشخیص نوع پیام
// =====================================

function getMessageType(message) {
  if (!message) return "other";

  if (message.forward_date || message.forward_origin) {
    return "forwarded";
  }

  if (message.text) {
    return "text";
  }

  if (message.sticker) {
    if (message.sticker.is_animated) {
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
    return "music";
  }

  if (message.video) {
    return "video";
  }

  if (message.video_note) {
    return "videoNote";
  }

  if (message.document) {
    return "document";
  }

  return "other";
}


// =====================================
// ثبت پیام
// =====================================

function recordMessage(group, message) {
  if (!group || !message || !message.from) {
    return;
  }

  const user = message.from;

  if (user.is_bot) {
    return;
  }

  ensureGroupInfo(group);

  const dateKey = getDateKey();
  const daily =
    ensureDailyStats(group, dateKey);

  const userStats =
    ensureStatsUser(group, user);

  const dailyUser =
    ensureDailyUser(daily, user);

  if (!userStats || !dailyUser) {
    return;
  }

  const type =
    getMessageType(message);

  daily.messages++;
  dailyUser.messages++;
  userStats.totalMessages++;
  group.groupInfo.stats.totalMessages++;

  if (type === "forwarded") {
    daily.forwarded++;
  }

  if (type === "text") {
    daily.text++;
  }

  if (type === "sticker") {
    daily.sticker++;
  }

  if (type === "animatedSticker") {
    daily.animatedSticker++;
  }

  if (type === "gif") {
    daily.gif++;
  }

  if (type === "photo") {
    daily.photo++;
  }

  if (type === "voice") {
    daily.voice++;
  }

  if (type === "music") {
    daily.music++;
  }

  if (type === "video") {
    daily.video++;
  }

  if (type === "videoNote") {
    daily.videoNote++;
  }

  if (type === "document") {
    daily.document++;
  }

  saveGroupInfo();
}


// =====================================
// ثبت ورود اعضای جدید
// =====================================

function recordNewMembers(group, message) {
  if (
    !group ||
    !message ||
    !Array.isArray(message.new_chat_members)
  ) {
    return;
  }

  const members =
    message.new_chat_members;

  if (!members.length) {
    return;
  }

  const dateKey = getDateKey();

  const daily =
    ensureDailyStats(group, dateKey);

  const adder =
    message.from &&
    !message.from.is_bot
      ? ensureAdder(daily, message.from)
      : null;

  for (const member of members) {
    if (!member || member.is_bot) {
      continue;
    }

    daily.adds++;
    daily.linkAdds++;

    group.groupInfo.stats.totalAdds++;

    if (adder) {
      adder.adds++;

      const adderStats =
        ensureStatsUser(
          group,
          message.from
        );

      if (adderStats) {
        adderStats.totalAdds++;
        adderStats.totalAds++;
      }
    }
  }

  saveGroupInfo();
}


// =====================================
// ثبت خروج عضو
// =====================================

function recordLeave(group, message) {
  if (
    !group ||
    !message ||
    !message.left_chat_member
  ) {
    return;
  }

  const dateKey = getDateKey();

  const daily =
    ensureDailyStats(group, dateKey);

  daily.leaves++;
  group.groupInfo.stats.totalLeaves++;

  saveGroupInfo();
}


// =====================================
// مرتب‌سازی کاربران
// =====================================

function sortUsersByMessages(users) {
  return Object.values(users || {})
    .filter(user => {
      return Number(user.totalMessages || 0) > 0;
    })
    .sort((a, b) => {
      return (
        Number(b.totalMessages || 0) -
        Number(a.totalMessages || 0)
      );
    });
}


// =====================================
// مرتب‌سازی کاربران روزانه
// =====================================

function sortDailyUsers(daily) {
  return Object.values(
    (daily && daily.users) || {}
  )
    .filter(user => {
      return Number(user.messages || 0) > 0;
    })
    .sort((a, b) => {
      return (
        Number(b.messages || 0) -
        Number(a.messages || 0)
      );
    });
}


// =====================================
// مرتب‌سازی اد کننده‌ها
// =====================================

function sortAdders(adders) {
  return Object.values(adders || {})
    .filter(user => {
      return Number(user.adds || 0) > 0;
    })
    .sort((a, b) => {
      return (
        Number(b.adds || 0) -
        Number(a.adds || 0)
      );
    });
}


// =====================================
// تبدیل داده ذخیره‌شده به User
// =====================================

function statsToUser(data) {
  if (!data) return null;

  return {
    id: data.id,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    username: data.username || ""
  };
}


// =====================================
// دریافت مقام کاربر
// =====================================

async function getMemberRole(ctx, userId) {
  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    if (member.status === "creator") {
      return "صاحب گروه";
    }

    if (member.status === "administrator") {
      return "مدیر گروه";
    }

    return "فرد عادی";
  } catch {
    return "فرد عادی";
  }
}


// =====================================
// بررسی مدیر یا مالک
// =====================================

async function isAdminOrOwner(ctx) {
  if (!ctx.chat || !ctx.from) {
    return false;
  }

  if (
    ctx.chat.type !== "group" &&
    ctx.chat.type !== "supergroup"
  ) {
    return false;
  }

  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

    return (
      member.status === "creator" ||
      member.status === "administrator"
    );
  } catch {
    return false;
  }
}


// =====================================
// بررسی مالک
// =====================================

async function isOwner(ctx) {
  if (!ctx.chat || !ctx.from) {
    return false;
  }

  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        ctx.from.id
      );

    return member.status === "creator";
  } catch {
    return false;
  }
}


// =====================================
// بررسی Reply
// =====================================

function getReplyMessage(ctx) {
  if (!ctx.message) {
    return null;
  }

  return ctx.message.reply_to_message || null;
}


// =====================================
// دریافت کاربر Reply
// =====================================

function getReplyUser(ctx) {
  const reply =
    getReplyMessage(ctx);

  if (!reply || !reply.from) {
    return null;
  }

  return reply.from;
}


// =====================================
// استخراج متن دستور
// =====================================

function getCommandText(ctx) {
  return String(
    ctx.message &&
    ctx.message.text
      ? ctx.message.text
      : ""
  ).trim();
}


// =====================================
// ذخیره کاربر در اطلاعات گروه
// =====================================

function rememberInfoUser(group, user) {
  if (!group || !user || !user.id) {
    return;
  }

  ensureGroupInfo(group);

  const id = String(user.id);

  if (!group.groupInfo.users[id]) {
    group.groupInfo.users[id] = {};
  }

  const data =
    group.groupInfo.users[id];

  data.id = user.id;
  data.first_name =
    user.first_name || data.first_name || "";
  data.last_name =
    user.last_name || data.last_name || "";
  data.username =
    user.username || data.username || "";

  if (typeof data.nickname !== "string") {
    data.nickname = "";
  }

  if (typeof data.globalRole !== "string") {
    data.globalRole = "";
  }
}


// =====================================
// گرفتن لقب
// =====================================

function getNickname(group, userId) {
  ensureGroupInfo(group);

  const data =
    group.groupInfo.users[String(userId)];

  if (
    data &&
    data.nickname &&
    String(data.nickname).trim()
  ) {
    return String(data.nickname).trim();
  }

  return "بدون لقب";
}


// =====================================
// گرفتن اصل سراسری
// =====================================

function getGlobalRole(group, userId) {
  ensureGroupInfo(group);

  const data =
    group.groupInfo.users[String(userId)];

  if (
    data &&
    data.globalRole &&
    String(data.globalRole).trim()
  ) {
    return String(data.globalRole).trim();
  }

  return "ندارد";
}// =====================================
// گرفتن تعداد عکس پروفایل
// =====================================

async function getProfilePhotoCount(ctx, userId) {
  try {
    const result =
      await ctx.telegram.getUserProfilePhotos(
        userId,
        0,
        100
      );

    return Number(
      result.total_count || 0
    );
  } catch {
    return 0;
  }
}


// =====================================
// گرفتن عکس پروفایل
// =====================================

async function getProfilePhoto(ctx, userId) {
  try {
    const result =
      await ctx.telegram.getUserProfilePhotos(
        userId,
        0,
        1
      );

    if (
      !result ||
      !result.photos ||
      !result.photos.length
    ) {
      return null;
    }

    const photos =
      result.photos[0];

    if (!photos || !photos.length) {
      return null;
    }

    return photos[photos.length - 1].file_id;
  } catch {
    return null;
  }
}


// =====================================
// رتبه کل پیام
// =====================================

function getTotalMessageRank(group, userId) {
  ensureGroupInfo(group);

  const users =
    sortUsersByMessages(
      group.groupInfo.stats.users
    );

  const index =
    users.findIndex(
      user =>
        String(user.id) ===
        String(userId)
    );

  return index === -1
    ? 0
    : index + 1;
}


// =====================================
// ساخت متن آیدی
// =====================================

async function buildUserInfo(group, ctx, user) {
  ensureGroupInfo(group);

  rememberInfoUser(group, user);

  const stats =
    ensureStatsUser(group, user);

  const photoCount =
    await getProfilePhotoCount(
      ctx,
      user.id
    );

  const role =
    await getMemberRole(
      ctx,
      user.id
    );

  const today =
    ensureDailyStats(
      group,
      getDateKey()
    );

  const dailyUser =
    today.users[String(user.id)];

  const messagesToday =
    Number(
      dailyUser &&
      dailyUser.messages
        ? dailyUser.messages
        : 0
    );

  const rank =
    getTotalMessageRank(
      group,
      user.id
    );

  const adsToday =
    Number(
      today.adders &&
      today.adders[String(user.id)]
        ? today.adders[String(user.id)].adds
        : 0
    );

  const adsTotal =
    Number(
      stats &&
      stats.totalAdds
        ? stats.totalAdds
        : 0
    );

  return (
    `◂ نام کاربر : 『𓆩 ${escapeHtml(
      getUserName(user)
    )} 𓆪』\n` +

    `◂ آیدی عددی : ${escapeHtml(
      String(user.id)
    )}\n` +

    `◂ یوزرنیم : ${
      user.username
        ? escapeHtml(
            `@${String(user.username).replace(/^@/, "")}`
          )
        : "ندارد"
    }\n` +

    `◂ تعداد تصاویر پروفایل : ${faNumber(
      photoCount
    )} عدد\n` +

    `◂ لقب کاربر : ${escapeHtml(
      getNickname(group, user.id)
    )}\n` +

    `◂ اصل سراسری : ${escapeHtml(
      getGlobalRole(group, user.id)
    )}\n` +

    `◂ مقام کاربر : ${escapeHtml(
      role
    )}\n\n` +

    `─┅━ آمار کاربر ━┅─\n` +

    `◂ پیام های امروز : ${faNumber(
      messagesToday
    )} عدد\n` +

    `◂ رتبه در تعداد پیام : ${
      rank
        ? faNumber(rank)
        : "یافت نشد"
    }\n` +

    `◂ تعداد اد امروز : ${faNumber(
      adsToday
    )} نفر\n` +

    `◂ تعداد اد کل : ${faNumber(
      adsTotal
    )} نفر`
  );
}


// =====================================
// ارسال آیدی با عکس
// =====================================

async function sendUserInfo(ctx, group, user) {
  const text =
    await buildUserInfo(
      group,
      ctx,
      user
    );

  const photo =
    await getProfilePhoto(
      ctx,
      user.id
    );

  const replyOptions = {
    parse_mode: "HTML",
    reply_to_message_id:
      ctx.message.message_id
  };

  if (photo) {
    try {
      await ctx.telegram.sendPhoto(
        ctx.chat.id,
        photo,
        {
          caption: text,
          parse_mode: "HTML",
          reply_to_message_id:
            ctx.message.message_id
        }
      );

      return;
    } catch {}
  }

  await ctx.telegram.sendMessage(
    ctx.chat.id,
    text,
    replyOptions
  );
}


// =====================================
// متن آمار فعالیت
// =====================================

function buildActivityStats(group) {
  ensureGroupInfo(group);

  const date =
    new Date();

  const dateKey =
    getDateKey(date);

  const daily =
    ensureDailyStats(
      group,
      dateKey
    );

  const users =
    sortDailyUsers(daily);

  const top =
    users.slice(0, 3);

  const adders =
    sortAdders(
      daily.adders
    ).slice(0, 3);

  const totalUsers =
    sortUsersByMessages(
      group.groupInfo.stats.users
    ).slice(0, 3);

  const totalAdders =
    Object.values(
      group.groupInfo.stats.users || {}
    )
      .filter(user => {
        return Number(
          user.totalAdds || 0
        ) > 0;
      })
      .sort((a, b) => {
        return (
          Number(b.totalAdds || 0) -
          Number(a.totalAdds || 0)
        );
      })
      .slice(0, 3);

  let text =
    `◄ آمار فعالیت گروه از 00:00 تا این لحظه :\n\n` +

    `• تاریخ : ${escapeHtml(
      getPersianWeekDay(date)
    )} , ${escapeHtml(
      getPersianDate(date)
    )}\n` +

    `• ساعت : ${escapeHtml(
      getCurrentTime()
    )}\n\n` +

    `─┅━ پیام های امروز ━┅─\n\n` +

    `◂ کل پیام ها : ${faNumber(
      daily.messages
    )}\n` +

    `◂ پیام فرواردی : ${faNumber(
      daily.forwarded
    )}\n` +

    `◂ متن : ${faNumber(
      daily.text
    )}\n` +

    `◂ استیکر : ${faNumber(
      daily.sticker
    )}\n` +

    `◂ استیکر متحرک : ${faNumber(
      daily.animatedSticker
    )}\n` +

    `◂ گیف : ${faNumber(
      daily.gif
    )}\n` +

    `◂ عکس : ${faNumber(
      daily.photo
    )}\n` +

    `◂ ویس : ${faNumber(
      daily.voice
    )}\n` +

    `◂ موزیک : ${faNumber(
      daily.music
    )}\n` +

    `◂ فیلم : ${faNumber(
      daily.video
    )}\n` +

    `◂ فیلم سلفی : ${faNumber(
      daily.videoNote
    )}\n` +

    `◂ فایل : ${faNumber(
      daily.document
    )}\n\n` +

    `─┅━ فعال ترین های امروز ━┅─\n\n`;

  if (!top.length) {
    text +=
      `◂ اطلاعاتی یافت نشد.\n\n`;
  } else {
    top.forEach((user, index) => {
      const medal =
        ["🥇", "🥈", "🥉"][index];

      text +=
        `◂ نفر ${index + 1} ${medal} :\n` +
        `( ${faNumber(
          user.messages
        )} پیام | ${getClickableUserName(
          statsToUser(user)
        )} )\n`;
    });

    text += "\n";
  }

  text +=
    `─━ بهترین عضو کننده های امروز ━─\n\n`;

  if (!adders.length) {
    text +=
      `◂ اطلاعاتی یافت نشد.\n\n`;
  } else {
    adders.forEach((user, index) => {
      const medal =
        ["🥇", "🥈", "🥉"][index];

      text +=
        `◂ نفر ${index + 1} ${medal} :\n` +
        `( ${faNumber(
          user.adds
        )} اد | ${getClickableUserName(
          statsToUser(user)
        )} )\n`;
    });

    text += "\n";
  }

  text +=
    `─┅━ ورودی و خروجی عضو ━┅─\n\n` +

    `◂ اعضای وارد شده با لینک : ${faNumber(
      daily.linkAdds
    )}\n` +

    `◂ اعضای اد شده : ${faNumber(
      daily.manualAdds
    )}\n` +

    `◂ اعضای لفت داده : ${faNumber(
      daily.leaves
    )}\n` +

    `◂ اعضای اخراج شده : ${faNumber(
      daily.kicks
    )}\n` +

    `◂ کل اعضای وارد شده : ${faNumber(
      group.groupInfo.stats.totalAdds
    )}\n` +

    `◂ کل اعضای خارج شده : ${faNumber(
      group.groupInfo.stats.totalLeaves +
      group.groupInfo.stats.totalKicks
    )}\n\n` +

    `─┅━ فعال ترین های کل ━┅─\n\n`;

  if (!totalUsers.length) {
    text +=
      `◂ اطلاعاتی یافت نشد.\n\n`;
  } else {
    totalUsers.forEach((user, index) => {
      const medal =
        ["🥇", "🥈", "🥉"][index];

      text +=
        `◂ نفر ${index + 1} ${medal} :\n` +
        `( ${faNumber(
          user.totalMessages
        )} پیام | ${getClickableUserName(
          statsToUser(user)
        )} )\n`;
    });

    text += "\n";
  }

  text +=
    `─━ بهترین عضو کننده های کل ━─\n\n`;

  if (!totalAdders.length) {
    text +=
      `◂ اطلاعاتی یافت نشد.\n`;
  } else {
    totalAdders.forEach((user, index) => {
      const medal =
        ["🥇", "🥈", "🥉"][index];

      text +=
        `◂ نفر ${index + 1} ${medal} :\n` +
        `( ${faNumber(
          user.totalAdds
        )} اد | ${getClickableUserName(
          statsToUser(user)
        )} )\n`;
    });
  }

  return text;
          }// =====================================
// آمار روزانه
// =====================================

function buildDailyStats(group) {
  ensureGroupInfo(group);

  const daily =
    ensureDailyStats(
      group,
      getDateKey()
    );

  const users =
    sortDailyUsers(daily);

  let text =
    `• فعال ترین ها از ساعت 00:00 تا این لحظه :\n\n`;

  if (!users.length) {
    text +=
      `◂ اطلاعاتی یافت نشد.`;
    return text;
  }

  users.forEach((user, index) => {
    text +=
      `◂ رتبه ${index + 1} : ` +
      `${getClickableUserName(
        statsToUser(user)
      )} با ` +
      `${faNumber(user.messages)} پیام.\n`;
  });

  return text;
}


// =====================================
// آمار کل
// =====================================

function buildTotalStats(group) {
  ensureGroupInfo(group);

  const users =
    sortUsersByMessages(
      group.groupInfo.stats.users
    );

  let text =
    `• به طور کلی افرادی که بیشترین فعالیت را دارند :\n\n`;

  if (!users.length) {
    text +=
      `◂ اطلاعاتی یافت نشد.`;
    return text;
  }

  users.forEach((user, index) => {
    text +=
      `◂ رتبه ${index + 1} : ` +
      `${getClickableUserName(
        statsToUser(user)
      )} با ` +
      `${faNumber(
        user.totalMessages
      )} پیام.\n`;
  });

  return text;
}


// =====================================
// آمار اد روزانه
// =====================================

function buildDailyAdds(group) {
  ensureGroupInfo(group);

  const daily =
    ensureDailyStats(
      group,
      getDateKey()
    );

  const adders =
    sortAdders(
      daily.adders
    );

  if (!adders.length) {
    return (
      `• اطلاعاتی مرتبط با اد کننده های امروز یافت نشد !`
    );
  }

  let text =
    `• اد کننده های امروز :\n\n`;

  adders.forEach((user, index) => {
    text +=
      `◂ رتبه ${index + 1} : ` +
      `${getClickableUserName(
        statsToUser(user)
      )} با ` +
      `${faNumber(user.adds)} اد.\n`;
  });

  return text;
}


// =====================================
// آمار اد کل
// =====================================

function buildTotalAdds(group) {
  ensureGroupInfo(group);

  const users =
    Object.values(
      group.groupInfo.stats.users || {}
    )
      .filter(user => {
        return Number(
          user.totalAdds || 0
        ) > 0;
      })
      .sort((a, b) => {
        return (
          Number(b.totalAdds || 0) -
          Number(a.totalAdds || 0)
        );
      });

  if (!users.length) {
    return (
      `• اطلاعاتی مرتبط با اد کننده ها یافت نشد !`
    );
  }

  let text =
    `• به طور کلی افرادی که بیشترین اد ها را انجام دادند :\n\n`;

  users.forEach((user, index) => {
    text +=
      `◂ رتبه ${index + 1} : ` +
      `${getClickableUserName(
        statsToUser(user)
      )} با ` +
      `${faNumber(
        user.totalAdds
      )} اد.\n`;
  });

  return text;
}


// =====================================
// دریافت مدیران فعلی گروه
// =====================================

async function getCurrentAdmins(ctx) {
  try {
    const admins =
      await ctx.telegram.getChatAdministrators(
        ctx.chat.id
      );

    return Array.isArray(admins)
      ? admins
      : [];
  } catch {
    return [];
  }
}


// =====================================
// آمار روزانه مدیران
// =====================================

async function buildDailyAdmins(ctx, group) {
  ensureGroupInfo(group);

  const daily =
    ensureDailyStats(
      group,
      getDateKey()
    );

  const admins =
    await getCurrentAdmins(ctx);

  const adminIds =
    new Set(
      admins.map(
        item => String(
          item.user.id
        )
      )
    );

  const users =
    sortDailyUsers(daily)
      .filter(user =>
        adminIds.has(
          String(user.id)
        )
      );

  let text =
    `• فعال ترین مدیران از 00:00 تا این لحظه :\n\n`;

  if (!users.length) {
    return (
      text +
      `◂ اطلاعاتی یافت نشد.`
    );
  }

  for (
    let index = 0;
    index < users.length;
    index++
  ) {
    const user =
      users[index];

    const member =
      admins.find(
        item =>
          String(item.user.id) ===
          String(user.id)
      );

    let role =
      "مدیر گروه";

    if (
      member &&
      member.status === "creator"
    ) {
      role = "صاحب گروه";
    }

    text +=
      `◂ رتبه ${index + 1} : ` +
      `${getClickableUserName(
        statsToUser(user)
      )} با ` +
      `${faNumber(
        user.messages
      )} پیام.\n` +

      `(${escapeHtml(
        role
      )})\n\n`;
  }

  return text.trim();
}


// =====================================
// آمار کل مدیران
// =====================================

async function buildTotalAdmins(ctx, group) {
  ensureGroupInfo(group);

  const admins =
    await getCurrentAdmins(ctx);

  const adminIds =
    new Set(
      admins.map(
        item => String(
          item.user.id
        )
      )
    );

  const users =
    sortUsersByMessages(
      group.groupInfo.stats.users
    )
      .filter(user =>
        adminIds.has(
          String(user.id)
        )
      );

  let text =
    `• به طور کلی مدیرانی که بیشترین فعالیت را دارند :\n\n`;

  if (!users.length) {
    return (
      text +
      `◂ اطلاعاتی یافت نشد.`
    );
  }

  for (
    let index = 0;
    index < users.length;
    index++
  ) {
    const user =
      users[index];

    const member =
      admins.find(
        item =>
          String(item.user.id) ===
          String(user.id)
      );

    let role =
      "مدیر گروه";

    if (
      member &&
      member.status === "creator"
    ) {
      role = "صاحب گروه";
    }

    text +=
      `◂ رتبه ${index + 1} : ` +
      `${getClickableUserName(
        statsToUser(user)
      )} با ` +
      `${faNumber(
        user.totalMessages
      )} پیام.\n` +

      `(${escapeHtml(
        role
      )})\n\n`;
  }

  return text.trim();
}


// =====================================
// آمار های دیگر
// =====================================

function buildOtherStats(group) {
  ensureGroupInfo(group);

  const daily =
    ensureDailyStats(
      group,
      getDateKey()
    );

  const users =
    Object.values(
      group.groupInfo.stats.users || {}
    );

  const activeUsers =
    users.filter(user => {
      return Number(
        user.totalMessages || 0
      ) > 0;
    }).length;

  return (
    `• آمار های دیگر\n\n` +

    `◂ کاربران فعال : ${faNumber(
      activeUsers
    )}\n` +

    `◂ کل پیام های ثبت شده : ${faNumber(
      group.groupInfo.stats.totalMessages
    )}\n` +

    `◂ کل اعضای وارد شده : ${faNumber(
      group.groupInfo.stats.totalAdds
    )}\n` +

    `◂ کل اعضای خارج شده : ${faNumber(
      group.groupInfo.stats.totalLeaves +
      group.groupInfo.stats.totalKicks
    )}\n\n` +

    `◂ پیام های امروز : ${faNumber(
      daily.messages
    )}`
  );
              }// =====================================
// کیبورد پنل آمار
// =====================================

function statsKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "『𓆩 آمار اد روزانه 𓆪』",
          callback_data: "ginfo_stats_daily_adds"
        },
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
        },
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
// نمایش پنل آمار
// =====================================

async function showStatsPanel(ctx) {
  if (!(await isAdminOrOwner(ctx))) {
    return;
  }

  const group =
    getGroup(ctx.chat.id);

  if (!group) {
    return;
  }

  ensureGroupInfo(group);

  await ctx.telegram.sendMessage(
    ctx.chat.id,
    `『𓆩 📊 آمار گروه 𓆪』\n\n` +
    `یکی از بخش‌های آمار را انتخاب کنید.`,
    {
      reply_to_message_id:
        ctx.message.message_id,

      reply_markup:
        statsKeyboard()
    }
  );
}


// =====================================
// بررسی صاحب پنل
// =====================================

function isStatsPanelOwner(query) {
  if (
    !query ||
    !query.message ||
    !query.from
  ) {
    return false;
  }

  const message =
    query.message;

  const ownerId =
    message.reply_to_message &&
    message.reply_to_message.from
      ? message.reply_to_message.from.id
      : null;

  return (
    ownerId &&
    String(ownerId) ===
    String(query.from.id)
  );
}


// =====================================
// ساخت پیام آمار با دکمه‌های پایین
// =====================================

async function editStatsMessage(
  ctx,
  text,
  keyboard = statsKeyboard()
) {
  try {
    await ctx.editMessageText(
      text,
      {
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
  } catch {
    try {
      await ctx.answerCbQuery();
    } catch {}
  }
}


// =====================================
// بازگشت به پنل
// =====================================

async function statsBack(ctx) {
  await editStatsMessage(
    ctx,
    `『𓆩 📊 آمار گروه 𓆪』\n\n` +
    `یکی از بخش‌های آمار را انتخاب کنید.`,
    statsKeyboard()
  );
}


// =====================================
// بستن پنل
// =====================================

async function statsClose(ctx) {
  try {
    await ctx.deleteMessage();
  } catch {
    try {
      await ctx.editMessageText(
        `『𓆩 پنل آمار بسته شد 𓆪』`
      );
    } catch {}
  }
}


// =====================================
// نمایش نتیجه یک بخش آمار
// =====================================

async function showStatsResult(
  ctx,
  text
) {
  const keyboard = {
    inline_keyboard: [
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

  await editStatsMessage(
    ctx,
    text,
    keyboard
  );
}


// =====================================
// ثبت دستورها
// =====================================

function registerGroupInfo(bot) {
  if (!bot) return;

  // ادامه در قسمت ۶
}// =====================================
// ادامه registerGroupInfo
// =====================================

  // -----------------------------------
  // ثبت آمار تمام پیام‌ها
  // -----------------------------------

  bot.use(async (ctx, next) => {
    try {
      if (
        ctx.chat &&
        (
          ctx.chat.type === "group" ||
          ctx.chat.type === "supergroup"
        ) &&
        ctx.message
      ) {
        const group =
          getGroup(ctx.chat.id);

        if (group) {
          ensureGroupInfo(group);

          if (ctx.message.from) {
            rememberInfoUser(
              group,
              ctx.message.from
            );
          }

          if (ctx.message.new_chat_members) {
            recordNewMembers(
              group,
              ctx.message
            );
          }

          if (ctx.message.left_chat_member) {
            recordLeave(
              group,
              ctx.message
            );
          }

          if (
            ctx.message.text &&
            !ctx.message.new_chat_members &&
            !ctx.message.left_chat_member
          ) {
            recordMessage(
              group,
              ctx.message
            );
          }
        }
      }
    } catch {}

    return next();
  });


  // -----------------------------------
  // آیدی
  // -----------------------------------

  bot.hears(/^آیدی$/i, async ctx => {
    if (!(await isAdminOrOwner(ctx))) {
      return;
    }

    const target =
      getReplyUser(ctx);

    // آیدی فقط با Reply
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
  });


  // -----------------------------------
  // قوانین گروه - نمایش
  // -----------------------------------

  bot.hears(
    /^(قوانین|قوانین گروه)$/i,
    async ctx => {
      if (!ctx.chat) {
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

      const rules =
        String(
          group.groupInfo.rules || ""
        ).trim();

      const text = rules
        ? `『𓆩 قوانین گروه 𓆪』\n\n${escapeHtml(
            rules
          )}`
        : `『𓆩 قوانین گروه 𓆪』\n\n` +
          `قوانین گروه هنوز تنظیم نشده است.`;

      // نمایش قوانین هم حتماً با Reply
      await ctx.telegram.sendMessage(
        ctx.chat.id,
        text,
        {
          parse_mode: "HTML",
          reply_to_message_id:
            ctx.message.message_id
        }
      );
    }
  );


  // -----------------------------------
  // تنظیم قوانین
  // فقط مالک + Reply
  // -----------------------------------

  bot.hears(
    /^تنظیم قوانین$/i,
    async ctx => {
      if (!(await isOwner(ctx))) {
        return;
      }

      const reply =
        getReplyMessage(ctx);

      if (!reply) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      const prompt =
        await ctx.telegram.sendMessage(
          ctx.chat.id,
          `قوانین را ارسال کنید.`,
          {
            reply_to_message_id:
              ctx.message.message_id
          }
        );

      GROUP_INFO[
        String(ctx.chat.id)
      ] = {
        type: "waiting_rules",
        ownerId: ctx.from.id,
        promptMessageId:
          prompt.message_id
      };
    }
  );


  // -----------------------------------
  // دریافت متن قوانین
  // فقط مالک همان گروه
  // -----------------------------------

  bot.on("message", async ctx => {
    try {
      if (!ctx.chat) return;

      if (
        ctx.chat.type !== "group" &&
        ctx.chat.type !== "supergroup"
      ) {
        return;
      }

      const state =
        GROUP_INFO[
          String(ctx.chat.id)
        ];

      if (
        !state ||
        state.type !== "waiting_rules"
      ) {
        return;
      }

      if (
        !ctx.from ||
        String(ctx.from.id) !==
        String(state.ownerId)
      ) {
        return;
      }

      if (
        !ctx.message ||
        !ctx.message.text
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
        String(
          ctx.message.text
        ).trim();

      if (!rules) {
        return;
      }

      group.groupInfo.rules =
        rules;

      saveGroupInfo();

      delete GROUP_INFO[
        String(ctx.chat.id)
      ];

      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `قوانین گروه ذخیره شد.`,
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );
    } catch {}
  });


  // -----------------------------------
  // حذف قوانین
  // فقط مالک + Reply
  // -----------------------------------

  bot.hears(
    /^حذف قوانین$/i,
    async ctx => {
      if (!(await isOwner(ctx))) {
        return;
      }

      const reply =
        getReplyMessage(ctx);

      if (!reply) {
        return;
      }

      const group =
        getGroup(ctx.chat.id);

      if (!group) {
        return;
      }

      ensureGroupInfo(group);

      group.groupInfo.rules =
        "";

      saveGroupInfo();

      await ctx.telegram.sendMessage(
        ctx.chat.id,
        `قوانین گروه حذف شد.`,
        {
          reply_to_message_id:
            ctx.message.message_id
        }
      );
    }
  );


  // -----------------------------------
  // آمار
  // فقط مدیر و مالک + Reply
  // -----------------------------------

  bot.hears(/^آمار$/i, async ctx => {
    if (!(await isAdminOrOwner(ctx))) {
      return;
    }

    const reply =
      getReplyMessage(ctx);

    if (!reply) {
      return;
    }

    await showStatsPanel(ctx);
  });


  // -----------------------------------
  // ادامه Callback ها در قسمت ۷
  // -----------------------------------
// =====================================
// ادامه Callback های آمار
// =====================================

  bot.action(
    /^ginfo_stats_/,
    async ctx => {
      try {
        if (!ctx.chat) {
          return;
        }

        // فقط مدیر / مالک
        const allowed =
          await isAdminOrOwner({
            chat: ctx.chat,
            from: ctx.from,
            telegram: ctx.telegram
          });

        if (!allowed) {
          try {
            await ctx.answerCbQuery();
          } catch {}
          return;
        }

        const data =
          String(
            ctx.callbackQuery &&
            ctx.callbackQuery.data
              ? ctx.callbackQuery.data
              : ""
          );

        if (!data) {
          return;
        }

        const group =
          getGroup(ctx.chat.id);

        if (!group) {
          try {
            await ctx.answerCbQuery();
          } catch {}
          return;
        }

        ensureGroupInfo(group);

        // -------------------------------
        // برگشت
        // -------------------------------

        if (
          data === "ginfo_stats_back"
        ) {
          await ctx.answerCbQuery();

          await statsBack(ctx);

          return;
        }


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
        // آمار فعالیت ها
        // -------------------------------

        if (
          data === "ginfo_stats_activity"
        ) {
          await ctx.answerCbQuery(
            "آمار فعالیت ها"
          );

          await showStatsResult(
            ctx,
            buildActivityStats(group)
          );

          return;
        }


        // -------------------------------
        // آمار روزانه
        // -------------------------------

        if (
          data === "ginfo_stats_daily"
        ) {
          await ctx.answerCbQuery(
            "آمار روزانه"
          );

          await showStatsResult(
            ctx,
            buildDailyStats(group)
          );

          return;
        }


        // -------------------------------
        // آمار کل
        // -------------------------------

        if (
          data === "ginfo_stats_total"
        ) {
          await ctx.answerCbQuery(
            "آمار کل"
          );

          await showStatsResult(
            ctx,
            buildTotalStats(group)
          );

          return;
        }


        // -------------------------------
        // آمار اد روزانه
        // -------------------------------

        if (
          data === "ginfo_stats_daily_adds"
        ) {
          await ctx.answerCbQuery(
            "آمار اد روزانه"
          );

          await showStatsResult(
            ctx,
            buildDailyAdds(group)
          );

          return;
        }


        // -------------------------------
        // آمار اد کل
        // -------------------------------

        if (
          data === "ginfo_stats_total_adds"
        ) {
          await ctx.answerCbQuery(
            "آمار اد کل"
          );

          await showStatsResult(
            ctx,
            buildTotalAdds(group)
          );

          return;
        }


        // -------------------------------
        // آمار های دیگر
        // -------------------------------

        if (
          data === "ginfo_stats_other"
        ) {
          await ctx.answerCbQuery(
            "آمار های دیگر"
          );

          await showStatsResult(
            ctx,
            buildOtherStats(group)
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
          await ctx.answerCbQuery(
            "آمار روزانه مدیران"
          );

          const text =
            await buildDailyAdmins(
              ctx,
              group
            );

          await showStatsResult(
            ctx,
            text
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
          await ctx.answerCbQuery(
            "آمار کل مدیران"
          );

          const text =
            await buildTotalAdmins(
              ctx,
              group
            );

          await showStatsResult(
            ctx,
            text
          );

          return;
        }

        try {
          await ctx.answerCbQuery();
        } catch {}

      } catch {
        try {
          await ctx.answerCbQuery();
        } catch {}
      }
    }
  );


// =====================================
// ثبت اکشن‌های آمار
// =====================================

  bot.action(
    "ginfo_stats_close",
    async ctx => {
      if (
        !(await isAdminOrOwner({
          chat: ctx.chat,
          from: ctx.from,
          telegram: ctx.telegram
        }))
      ) {
        try {
          await ctx.answerCbQuery();
        } catch {}
        return;
      }

      await ctx.answerCbQuery();

      await statsClose(ctx);
    }
  );


// =====================================
// خروجی‌ها
// =====================================

}


module.exports = {
  registerGroupInfo,

  ensureGroupInfo,
  ensureStatsUser,

  buildUserInfo,
  buildActivityStats,
  buildDailyStats,
  buildTotalStats,
  buildDailyAdds,
  buildTotalAdds,
  buildOtherStats,
  buildDailyAdmins,
  buildTotalAdmins
};
