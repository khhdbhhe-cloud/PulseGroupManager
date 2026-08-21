const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");
const http = require("http");

// =====================================================
// CONFIG
// =====================================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN پیدا نشد.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// =====================================================
// RENDER SERVER
// =====================================================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("PulseGroupManager ONLINE");
}).listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

// =====================================================
// DATABASE
// =====================================================

const DB_FILE = path.join(__dirname, "group-data.json");

let db = {
  groups: {}
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");

      if (data.trim()) {
        db = JSON.parse(data);
      }
    }
  } catch (error) {
    console.error("DB LOAD ERROR:", error.message);

    db = {
      groups: {}
    };
  }
}

function saveDB() {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(db, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("DB SAVE ERROR:", error.message);
  }
}

function defaultGroup() {
  return {
    warns: {},
    stats: {},
    panels: {},
    userPermissions: {},

    rules: "",

    welcome: {
      enabled: false,
      text: "خوش اومدی {name}"
    },

    goodbye: {
      enabled: false,
      text: "{name} از گروه خارج شد."
    },

    locks: {
      links: false,
      photos: false,
      videos: false,
      documents: false,
      voice: false,
      gif: false,
      sticker: false,
      forward: false,
      polls: false,
      mentions: false
    },

    settings: {
      antiFlood: false,
      autoWarn: false,
      timezone: "Asia/Tehran"
    }
  };
}

function getGroup(chatId) {
  const id = String(chatId);

  if (!db.groups[id]) {
    db.groups[id] = defaultGroup();
    saveDB();
  }

  return db.groups[id];
}

loadDB();

// =====================================================
// HELPERS
// =====================================================

function isGroup(ctx) {
  return (
    ctx.chat &&
    (
      ctx.chat.type === "group" ||
      ctx.chat.type === "supergroup"
    )
  );
}

function nameOf(user) {
  if (!user) return "کاربر";

  const name = [
    user.first_name,
    user.last_name
  ]
    .filter(Boolean)
    .join(" ");

  return name || user.username || "کاربر";
}

function getReplyUser(ctx) {
  if (
    ctx.message &&
    ctx.message.reply_to_message &&
    ctx.message.reply_to_message.from
  ) {
    return ctx.message.reply_to_message.from;
  }

  return null;
}

function star(value) {
  return value ? "★" : "☆";
}

// =====================================================
// ROLE
// =====================================================

async function getRole(ctx, userId) {
  if (!isGroup(ctx)) {
    return "unknown";
  }

  try {
    const member =
      await ctx.telegram.getChatMember(
        ctx.chat.id,
        userId
      );

    return member.status;
  } catch (error) {
    console.error(
      "getChatMember:",
      error.message
    );

    return "unknown";
  }
}

function isAdminRole(role) {
  return (
    role === "administrator" ||
    role === "creator"
  );
}

async function checkAdmin(ctx) {
  if (!isGroup(ctx)) {
    return {
      ok: false,
      text: "این بخش فقط داخل گروه قابل استفاده است."
    };
  }

  if (!ctx.from) {
    return {
      ok: false,
      text: "کاربر شناسایی نشد."
    };
  }

  const role =
    await getRole(ctx, ctx.from.id);

  if (!isAdminRole(role)) {
    return {
      ok: false,
      text: "فقط مدیران گروه دسترسی دارند."
    };
  }

  return {
    ok: true,
    role
  };
}

// =====================================================
// TARGET CHECK
// =====================================================

async function checkTarget(ctx, target) {
  if (!target) {
    return {
      ok: false,
      text: "کاربر موردنظر پیدا نشد."
    };
  }

  const executorRole =
    await getRole(
      ctx,
      ctx.from.id
    );

  const targetRole =
    await getRole(
      ctx,
      target.id
    );

  if (!isAdminRole(executorRole)) {
    return {
      ok: false,
      text: "فقط مدیران می‌توانند این کار را انجام دهند."
    };
  }

  if (targetRole === "creator") {
    return {
      ok: false,
      text: "مالک گروه قابل مدیریت نیست."
    };
  }

  if (
    targetRole === "administrator" &&
    executorRole !== "creator"
  ) {
    return {
      ok: false,
      text: "مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند."
    };
  }

  return {
    ok: true,
    executorRole,
    targetRole
  };
}

// =====================================================
// USER STATS
// =====================================================

function getUserStats(chatId, userId) {
  const group = getGroup(chatId);
  const id = String(userId);

  if (!group.stats[id]) {
    group.stats[id] = {
      totalMessages: 0,
      todayMessages: 0,
      lastMessage: 0,
      firstSeen: Date.now()
    };
  }

  return group.stats[id];
}

function updateUserStats(ctx) {
  if (!isGroup(ctx) || !ctx.from) return;

  const stats =
    getUserStats(
      ctx.chat.id,
      ctx.from.id
    );

  const now = new Date();
  const last = new Date(
    stats.lastMessage || 0
  );

  if (
    now.toDateString() !==
    last.toDateString()
  ) {
    stats.todayMessages = 0;
  }

  stats.totalMessages++;
  stats.todayMessages++;
  stats.lastMessage = Date.now();

  saveDB();
}

// =====================================================
// PANEL BUTTON
// =====================================================

function panelButton(
  text,
  action,
  ownerId
) {
  return Markup.button.callback(
    text,
    `${action}:${ownerId}`
  );
}

// =====================================================
// MAIN PANEL
// =====================================================

function mainPanel(ownerId) {
  return Markup.inlineKeyboard([

    [
      panelButton(
        "مدیریت کاربران",
        "users",
        ownerId
      )
    ],

    [
      panelButton(
        "دسترسی‌های کاربر",
        "permissions",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل‌های گروه",
        "locks",
        ownerId
      )
    ],

    [
      panelButton(
        "مدیریت پیام‌ها",
        "messages",
        ownerId
      )
    ],

    [
      panelButton(
        "سیستم اخطار",
        "warns",
        ownerId
      )
    ],

    [
      panelButton(
        "ورود و خروج",
        "welcome",
        ownerId
      )
    ],

    [
      panelButton(
        "قوانین",
        "rules",
        ownerId
      )
    ],

    [
      panelButton(
        "آمار گروه",
        "stats",
        ownerId
      )
    ],

    [
      panelButton(
        "تنظیمات",
        "settings",
        ownerId
      )
    ],

    [
      panelButton(
        "راهنما",
        "help",
        ownerId
      )
    ],

    [
      panelButton(
        "بستن پنل",
        "close",
        ownerId
      )
    ]

  ]);
}

function panelText(target) {
  let text =
    "PulseGroupManager\n\n" +
    "پنل مدیریت گروه\n\n" +
    "بخش موردنظر را انتخاب کنید.";

  if (target) {
    text +=
      "\n\nکاربر انتخاب‌شده: " +
      nameOf(target) +
      "\nآیدی: " +
      target.id;
  }

  return text;
}

// =====================================================
// PANEL DATABASE
// =====================================================

function savePanel(
  chatId,
  messageId,
  ownerId,
  targetId = null
) {
  const group =
    getGroup(chatId);

  group.panels[String(messageId)] = {
    ownerId: Number(ownerId),
    targetId: targetId
      ? Number(targetId)
      : null,
    createdAt: Date.now()
  };

  saveDB();
}

function getPanel(
  chatId,
  messageId
) {
  const group =
    getGroup(chatId);

  return (
    group.panels[String(messageId)] ||
    null
  );
}

function deletePanel(
  chatId,
  messageId
) {
  const group =
    getGroup(chatId);

  delete group.panels[
    String(messageId)
  ];

  saveDB();
}

// =====================================================
// PANEL PROTECTION
// =====================================================

async function protectPanel(ctx) {
  if (
    !ctx.callbackQuery ||
    !ctx.callbackQuery.message
  ) {
    return false;
  }

  const messageId =
    ctx.callbackQuery.message.message_id;

  const panel =
    getPanel(
      ctx.chat.id,
      messageId
    );

  if (
    !panel ||
    !ctx.from ||
    Number(panel.ownerId) !==
      Number(ctx.from.id)
  ) {
    try {
      await ctx.answerCbQuery(
        "این پنل برای شما نیست.",
        {
          show_alert: true
        }
      );
    } catch {}

    return false;
  }

  const access =
    await checkAdmin(ctx);

  if (!access.ok) {
    try {
      await ctx.answerCbQuery(
        "دسترسی مدیریت ندارید.",
        {
          show_alert: true
        }
      );
    } catch {}

    return false;
  }

  return true;
}

// =====================================================
// OPEN PANEL
// =====================================================

async function openPanel(ctx) {
  const access =
    await checkAdmin(ctx);

  if (!access.ok) {
    return ctx.reply(access.text);
  }

  const target =
    getReplyUser(ctx);

  const message =
    await ctx.reply(
      panelText(target),
      mainPanel(ctx.from.id)
    );

  savePanel(
    ctx.chat.id,
    message.message_id,
    ctx.from.id,
    target
      ? target.id
      : null
  );

  // اگر پنل با ریپلای باز شده،
  // پیام پنل هم روی همان پیام کاربر ریپلای می‌شود.
  try {
    await ctx.telegram.editMessageReplyMarkup(
      ctx.chat.id,
      message.message_id,
      undefined,
      mainPanel(ctx.from.id).reply_markup
    );
  } catch {}

  console.log(
    "PANEL OPENED:",
    ctx.from.id
  );
}

// =====================================================
// PANEL COMMAND
// =====================================================

bot.hears(
  /^پنل$/u,
  async ctx => {
    await openPanel(ctx);
  }
);

// =====================================================
// UPDATE USER STATS
// =====================================================

bot.on(
  "message",
  async ctx => {
    if (!ctx.message) return;

    // دستورات مدیریتی را برای آمار هم حساب می‌کنیم.
    updateUserStats(ctx);
  }
);// =====================================================
// CLOSE PANEL
// =====================================================

bot.action(
  /^close:(\d+)$/,
  async ctx => {
    if (!(await protectPanel(ctx))) return;

    try {
      await ctx.answerCbQuery();
    } catch {}

    const messageId =
      ctx.callbackQuery.message.message_id;

    deletePanel(
      ctx.chat.id,
      messageId
    );

    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.error(
        "CLOSE PANEL ERROR:",
        error.message
      );

      try {
        await ctx.editMessageText(
          "پنل بسته شد."
        );
      } catch {}
    }
  }
);

// =====================================================
// BACK TO MAIN PANEL
// =====================================================

bot.action(
  /^back:(\d+)$/,
  async ctx => {
    if (!(await protectPanel(ctx))) return;

    try {
      await ctx.answerCbQuery();
    } catch {}

    const panel =
      getPanel(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id
      );

    if (!panel) return;

    let target = null;

    if (panel.targetId) {
      try {
        const member =
          await ctx.telegram.getChatMember(
            ctx.chat.id,
            panel.targetId
          );

        target = member.user;
      } catch {}
    }

    try {
      await ctx.editMessageText(
        panelText(target),
        mainPanel(ctx.from.id)
      );
    } catch (error) {
      console.error(
        "BACK PANEL ERROR:",
        error.message
      );
    }
  }
);

// =====================================================
// USERS PANEL
// =====================================================

function usersPanel(ownerId) {
  return Markup.inlineKeyboard([

    [
      panelButton(
        "بن",
        "banHelp",
        ownerId
      ),

      panelButton(
        "آن‌بن",
        "unbanHelp",
        ownerId
      )
    ],

    [
      panelButton(
        "میوت",
        "muteHelp",
        ownerId
      ),

      panelButton(
        "آن‌میوت",
        "unmuteHelp",
        ownerId
      )
    ],

    [
      panelButton(
        "اخطار",
        "warnHelp",
        ownerId
      ),

      panelButton(
        "اطلاعات",
        "infoHelp",
        ownerId
      )
    ],

    [
      panelButton(
        "آمار کاربر",
        "userStatsHelp",
        ownerId
      )
    ],

    [
      panelButton(
        "بازگشت",
        "back",
        ownerId
      ),

      panelButton(
        "بستن",
        "close",
        ownerId
      )
    ]

  ]);
}

// =====================================================
// USERS BUTTON
// =====================================================

bot.action(
  /^users:(\d+)$/,
  async ctx => {
    if (!(await protectPanel(ctx))) return;

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "مدیریت کاربران\n\n" +
      "برای انجام عملیات روی کاربر، " +
      "پیام همان کاربر را ریپلای کنید.",
      usersPanel(ctx.from.id)
    );
  }
);

// =====================================================
// TARGET PERMISSION
// =====================================================

async function checkTarget(
  ctx,
  target
) {
  if (!target) {
    return {
      ok: false,
      text: "کاربر موردنظر پیدا نشد."
    };
  }

  const executorRole =
    await getRole(
      ctx,
      ctx.from.id
    );

  const targetRole =
    await getRole(
      ctx,
      target.id
    );

  if (!isAdminRole(executorRole)) {
    return {
      ok: false,
      text:
        "فقط مدیران می‌توانند این کار را انجام دهند."
    };
  }

  if (targetRole === "creator") {
    return {
      ok: false,
      text:
        "مالک گروه قابل مدیریت نیست."
    };
  }

  if (
    targetRole === "administrator" &&
    executorRole !== "creator"
  ) {
    return {
      ok: false,
      text:
        "مدیر عادی نمی‌تواند مدیر دیگری را مدیریت کند."
    };
  }

  return {
    ok: true,
    executorRole,
    targetRole
  };
}

// =====================================================
// BAN
// =====================================================

bot.action(
  /^banHelp:(\d+)$/,
  async ctx => {
    if (!(await protectPanel(ctx))) return;

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "بن کاربر\n\n" +
      "برای انجام بن، روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "بن",
      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

bot.hears(
  /^بن$/u,
  async ctx => {
    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و بن بنویسید."
      );
    }

    const permission =
      await checkTarget(
        ctx,
        target
      );

    if (!permission.ok) {
      return ctx.reply(
        permission.text
      );
    }

    try {
      await ctx.telegram.banChatMember(
        ctx.chat.id,
        target.id
      );

      await ctx.reply(
        "کاربر بن شد.\n\n" +
        "نام: " +
        nameOf(target) +
        "\n" +
        "آیدی: " +
        target.id
      );
    } catch (error) {
      console.error(
        "BAN ERROR:",
        error.message
      );

      await ctx.reply(
        "بن انجام نشد. دسترسی Ban Users ربات را بررسی کنید."
      );
    }
  }
);

// =====================================================
// UNBAN
// =====================================================

bot.action(
  /^unbanHelp:(\d+)$/,
  async ctx => {
    if (!(await protectPanel(ctx))) return;

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "آن‌بن کاربر\n\n" +
      "روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "آن‌بن",
      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

bot.hears(
  /^آن‌بن$/u,
  async ctx => {
    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و آن‌بن بنویسید."
      );
    }

    const permission =
      await checkTarget(
        ctx,
        target
      );

    if (!permission.ok) {
      return ctx.reply(
        permission.text
      );
    }

    try {
      await ctx.telegram.unbanChatMember(
        ctx.chat.id,
        target.id,
        {
          only_if_banned: true
        }
      );

      await ctx.reply(
        "کاربر آن‌بن شد.\n\n" +
        "نام: " +
        nameOf(target) +
        "\n" +
        "آیدی: " +
        target.id
      );
    } catch (error) {
      console.error(
        "UNBAN ERROR:",
        error.message
      );

      await ctx.reply(
        "آن‌بن انجام نشد."
      );
    }
  }
);

// =====================================================
// MUTE HELP
// =====================================================

function mutePanel(ownerId) {
  return Markup.inlineKeyboard([

    [
      panelButton(
        "۱ ساعت",
        "mutetime1",
        ownerId
      ),

      panelButton(
        "۲ ساعت",
        "mutetime2",
        ownerId
      )
    ],

    [
      panelButton(
        "۳ ساعت",
        "mutetime3",
        ownerId
      ),

      panelButton(
        "۴ ساعت",
        "mutetime4",
        ownerId
      )
    ],

    [
      panelButton(
        "۶ ساعت",
        "mutetime6",
        ownerId
      ),

      panelButton(
        "۱۲ ساعت",
        "mutetime12",
        ownerId
      )
    ],

    [
      panelButton(
        "۲۴ ساعت",
        "mutetime24",
        ownerId
      )
    ],

    [
      panelButton(
        "بازگشت",
        "users",
        ownerId
      ),

      panelButton(
        "بستن",
        "close",
        ownerId
      )
    ]

  ]);
}

// =====================================================
// MUTE BUTTON
// =====================================================

bot.action(
  /^muteHelp:(\d+)$/,
  async ctx => {
    if (!(await protectPanel(ctx))) return;

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "میوت کاربر\n\n" +
      "مدت میوت را انتخاب کنید.\n\n" +
      "سپس روی پیام کاربر ریپلای کنید و بنویسید:\n" +
      "میوت",
      mutePanel(ctx.from.id)
    );
  }
);

// =====================================================
// MUTE FUNCTION
// =====================================================

async function muteTarget(
  ctx,
  hours
) {
  if (!isGroup(ctx)) return;

  const target =
    getReplyUser(ctx);

  if (!target) {
    return ctx.reply(
      "روی پیام کاربر ریپلای کنید."
    );
  }

  const permission =
    await checkTarget(
      ctx,
      target
    );

  if (!permission.ok) {
    return ctx.reply(
      permission.text
    );
  }

  try {
    const until =
      Math.floor(
        Date.now() / 1000
      ) +
      hours * 60 * 60;

    await ctx.telegram.restrictChatMember(
      ctx.chat.id,
      target.id,
      {
        until_date: until,

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
        }
      }
    );

    await ctx.reply(
      "کاربر میوت شد.\n\n" +
      "نام: " +
      nameOf(target) +
      "\n" +
      "آیدی: " +
      target.id +
      "\n" +
      "مدت: " +
      hours +
      " ساعت"
    );

  } catch (error) {
    console.error(
      "MUTE ERROR:",
      error.message
    );

    await ctx.reply(
      "میوت انجام نشد. دسترسی Restrict Members ربات را بررسی کنید."
    );
  }
}

// =====================================================
// MUTE COMMAND
// =====================================================

bot.hears(
  /^میوت$/u,
  async ctx => {
    await muteTarget(
      ctx,
      1
    );
  }
);// =====================================================
// MUTE TIME ACTIONS
// =====================================================

for (const hours of [
  1,
  2,
  3,
  4,
  6,
  12,
  24
]) {
  bot.action(
    new RegExp(
      `^mutetime${hours}:(\\d+)$`
    ),
    async ctx => {

      if (!(await protectPanel(ctx))) {
        return;
      }

      try {
        await ctx.answerCbQuery();
      } catch {}

      const messageId =
        ctx.callbackQuery.message.message_id;

      const panel =
        getPanel(
          ctx.chat.id,
          messageId
        );

      if (
        !panel ||
        !panel.targetId
      ) {
        return ctx.answerCbQuery(
          "ابتدا پنل را با ریپلای روی کاربر باز کنید.",
          {
            show_alert: true
          }
        );
      }

      const targetId =
        panel.targetId;

      const permission =
        await checkTarget(
          ctx,
          {
            id: targetId
          }
        );

      if (!permission.ok) {
        return ctx.answerCbQuery(
          permission.text,
          {
            show_alert: true
          }
        );
      }

      try {

        const until =
          Math.floor(
            Date.now() / 1000
          ) +
          hours * 60 * 60;

        await ctx.telegram.restrictChatMember(
          ctx.chat.id,
          targetId,
          {
            until_date: until,

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
            }
          }
        );

        await ctx.answerCbQuery(
          "میوت انجام شد."
        );

        await ctx.editMessageText(
          "میوت انجام شد.\n\n" +
          "آیدی کاربر: " +
          targetId +
          "\n" +
          "مدت: " +
          hours +
          " ساعت",
          Markup.inlineKeyboard([
            [
              panelButton(
                "مدیریت کاربران",
                "users",
                ctx.from.id
              )
            ],
            [
              panelButton(
                "بازگشت",
                "back",
                ctx.from.id
              ),

              panelButton(
                "بستن",
                "close",
                ctx.from.id
              )
            ]
          ])
        );

      } catch (error) {

        console.error(
          "MUTE TIME ERROR:",
          error.message
        );

        await ctx.answerCbQuery(
          "میوت انجام نشد.",
          {
            show_alert: true
          }
        );
      }
    }
  );
}

// =====================================================
// UNMUTE
// =====================================================

bot.action(
  /^unmuteHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "آن‌میوت کاربر\n\n" +
      "برای خارج کردن کاربر از میوت، " +
      "روی پیام او ریپلای کنید و بنویسید:\n\n" +
      "آن‌میوت",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// UNMUTE COMMAND
// =====================================================

bot.hears(
  /^آن‌میوت$/u,
  async ctx => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و آن‌میوت بنویسید."
      );
    }

    const permission =
      await checkTarget(
        ctx,
        target
      );

    if (!permission.ok) {
      return ctx.reply(
        permission.text
      );
    }

    try {

      await ctx.telegram.restrictChatMember(
        ctx.chat.id,
        target.id,
        {
          permissions: {
            can_send_messages: true,
            can_send_audios: true,
            can_send_documents: true,
            can_send_photos: true,
            can_send_videos: true,
            can_send_video_notes: true,
            can_send_voice_notes: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true
          }
        }
      );

      await ctx.reply(
        "کاربر آن‌میوت شد.\n\n" +
        "نام: " +
        nameOf(target) +
        "\n" +
        "آیدی: " +
        target.id
      );

    } catch (error) {

      console.error(
        "UNMUTE ERROR:",
        error.message
      );

      await ctx.reply(
        "آن‌میوت انجام نشد."
      );
    }
  }
);

// =====================================================
// WARN HELP
// =====================================================

bot.action(
  /^warnHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "اخطار کاربر\n\n" +
      "روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "اخطار",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// WARN COMMAND
// =====================================================

bot.hears(
  /^اخطار$/u,
  async ctx => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و اخطار بنویسید."
      );
    }

    const permission =
      await checkTarget(
        ctx,
        target
      );

    if (!permission.ok) {
      return ctx.reply(
        permission.text
      );
    }

    const group =
      getGroup(ctx.chat.id);

    const id =
      String(target.id);

    if (
      typeof group.warns[id] !==
      "number"
    ) {
      group.warns[id] = 0;
    }

    group.warns[id]++;

    saveDB();

    await ctx.reply(
      "اخطار ثبت شد.\n\n" +
      "نام: " +
      nameOf(target) +
      "\n" +
      "آیدی: " +
      target.id +
      "\n" +
      "تعداد اخطار: " +
      group.warns[id]
    );
  }
);

// =====================================================
// USER INFO HELP
// =====================================================

bot.action(
  /^infoHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "اطلاعات کاربر\n\n" +
      "برای نمایش اطلاعات، " +
      "روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "اطلاعات",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// USER INFO COMMAND
// =====================================================

bot.hears(
  /^اطلاعات$/u,
  async ctx => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و اطلاعات بنویسید."
      );
    }

    const role =
      await getRole(
        ctx,
        target.id
      );

    let roleText =
      "کاربر";

    if (role === "creator") {
      roleText =
        "مالک گروه";
    } else if (
      role === "administrator"
    ) {
      roleText =
        "مدیر گروه";
    }

    const group =
      getGroup(ctx.chat.id);

    const id =
      String(target.id);

    const warns =
      group.warns[id] || 0;

    const stats =
      getUserStats(
        ctx.chat.id,
        target.id
      );

    await ctx.reply(
      "اطلاعات کاربر\n\n" +
      "نام: " +
      nameOf(target) +
      "\n" +
      "آیدی: " +
      target.id +
      "\n" +
      "وضعیت: " +
      roleText +
      "\n" +
      "اخطارها: " +
      warns +
      "\n" +
      "پیام‌های امروز: " +
      stats.todayMessages +
      "\n" +
      "کل پیام‌ها: " +
      stats.totalMessages
    );
  }
);

// =====================================================
// USER STATS HELP
// =====================================================

bot.action(
  /^userStatsHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "آمار کاربر\n\n" +
      "روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "آمار",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// USER STATS COMMAND
// =====================================================

bot.hears(
  /^آمار$/u,
  async ctx => {

    if (!isGroup(ctx)) return;

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و آمار بنویسید."
      );
    }

    const stats =
      getUserStats(
        ctx.chat.id,
        target.id
      );

    const group =
      getGroup(ctx.chat.id);

    const warns =
      group.warns[String(target.id)] || 0;

    await ctx.reply(
      "آمار کاربر\n\n" +
      "نام: " +
      nameOf(target) +
      "\n" +
      "آیدی: " +
      target.id +
      "\n" +
      "پیام‌های امروز: " +
      stats.todayMessages +
      "\n" +
      "کل پیام‌ها: " +
      stats.totalMessages +
      "\n" +
      "اخطارها: " +
      warns
    );
  }
);

// =====================================================
// PERMISSION NAMES
// =====================================================

const permissionNames = [
  ["ban", "بن"],
  ["mute", "میوت"],
  ["delete", "حذف پیام"],
  ["kick", "حذف کاربر"],
  ["warn", "اخطار"],
  ["pin", "پین"],
  ["links", "مدیریت لینک"],
  ["locks", "قفل‌ها"],
  ["welcome", "خوشامد"],
  ["settings", "تنظیمات"],
  ["stats", "آمار"]
];

// =====================================================
// GET USER PERMISSIONS
// =====================================================

function getPermissions(
  chatId,
  userId
) {
  const group =
    getGroup(chatId);

  const id =
    String(userId);

  if (!group.userPermissions[id]) {

    group.userPermissions[id] = {};

    for (
      const [key]
      of permissionNames
    ) {
      group.userPermissions[id][key] =
        false;
    }

    saveDB();
  }

  return group.userPermissions[id];
          }// =====================================================
// PERMISSIONS PANEL
// =====================================================

function permissionsPanel(
  ownerId,
  chatId,
  targetId
) {
  const permissions =
    getPermissions(
      chatId,
      targetId
    );

  const rows = [];

  for (
    let i = 0;
    i < permissionNames.length;
    i += 2
  ) {
    const a =
      permissionNames[i];

    const b =
      permissionNames[i + 1];

    const row = [
      Markup.button.callback(
        `${a[1]} ${star(permissions[a[0]])}`,
        `perm:${ownerId}:${targetId}:${a[0]}`
      )
    ];

    if (b) {
      row.push(
        Markup.button.callback(
          `${b[1]} ${star(permissions[b[0]])}`,
          `perm:${ownerId}:${targetId}:${b[0]}`
        )
      );
    }

    rows.push(row);
  }

  rows.push([
    Markup.button.callback(
      "بازگشت",
      `back:${ownerId}`
    ),

    Markup.button.callback(
      "بستن",
      `close:${ownerId}`
    )
  ]);

  return Markup.inlineKeyboard(rows);
}

// =====================================================
// OPEN USER PERMISSIONS
// =====================================================

bot.action(
  /^permissions:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const messageId =
      ctx.callbackQuery.message.message_id;

    const panel =
      getPanel(
        ctx.chat.id,
        messageId
      );

    if (
      !panel ||
      !panel.targetId
    ) {
      return ctx.answerCbQuery(
        "ابتدا پنل را با ریپلای روی کاربر باز کنید.",
        {
          show_alert: true
        }
      );
    }

    const targetId =
      panel.targetId;

    await ctx.editMessageText(
      "دسترسی‌های کاربر\n\n" +
      "★ = دسترسی دارد\n" +
      "☆ = دسترسی ندارد\n\n" +
      "آیدی کاربر: " +
      targetId,

      permissionsPanel(
        ctx.from.id,
        ctx.chat.id,
        targetId
      )
    );
  }
);

// =====================================================
// TOGGLE USER PERMISSION
// =====================================================

bot.action(
  /^perm:(\d+):(\d+):([a-z]+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    const ownerId =
      Number(ctx.match[1]);

    const targetId =
      Number(ctx.match[2]);

    const key =
      ctx.match[3];

    const permissions =
      getPermissions(
        ctx.chat.id,
        targetId
      );

    if (
      typeof permissions[key] ===
      "undefined"
    ) {
      return ctx.answerCbQuery(
        "این دسترسی وجود ندارد.",
        {
          show_alert: true
        }
      );
    }

    permissions[key] =
      !permissions[key];

    saveDB();

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "دسترسی‌های کاربر\n\n" +
      "★ = دسترسی دارد\n" +
      "☆ = دسترسی ندارد\n\n" +
      "آیدی کاربر: " +
      targetId,

      permissionsPanel(
        ownerId,
        ctx.chat.id,
        targetId
      )
    );
  }
);

// =====================================================
// BAN HELP
// =====================================================

bot.action(
  /^banHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "بن کاربر\n\n" +
      "روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "بن",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),
          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// BAN COMMAND
// =====================================================

bot.hears(
  /^بن$/u,
  async ctx => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و بن بنویسید."
      );
    }

    const permission =
      await checkTarget(
        ctx,
        target
      );

    if (!permission.ok) {
      return ctx.reply(
        permission.text
      );
    }

    try {

      await ctx.telegram.banChatMember(
        ctx.chat.id,
        target.id
      );

      await ctx.reply(
        "کاربر بن شد.\n\n" +
        "نام: " +
        nameOf(target) +
        "\n" +
        "آیدی: " +
        target.id
      );

    } catch (error) {

      console.error(
        "BAN ERROR:",
        error.message
      );

      await ctx.reply(
        "بن انجام نشد. دسترسی Ban Users ربات را بررسی کنید."
      );
    }
  }
);

// =====================================================
// UNBAN HELP
// =====================================================

bot.action(
  /^unbanHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "آن‌بن کاربر\n\n" +
      "روی پیام کاربر ریپلای کنید و بنویسید:\n\n" +
      "آن‌بن",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),
          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// UNBAN COMMAND
// =====================================================

bot.hears(
  /^آن‌بن$/u,
  async ctx => {

    if (!isGroup(ctx)) {
      return;
    }

    const target =
      getReplyUser(ctx);

    if (!target) {
      return ctx.reply(
        "روی پیام کاربر ریپلای کنید و آن‌بن بنویسید."
      );
    }

    const permission =
      await checkTarget(
        ctx,
        target
      );

    if (!permission.ok) {
      return ctx.reply(
        permission.text
      );
    }

    try {

      await ctx.telegram.unbanChatMember(
        ctx.chat.id,
        target.id,
        {
          only_if_banned: true
        }
      );

      await ctx.reply(
        "کاربر آن‌بن شد.\n\n" +
        "نام: " +
        nameOf(target) +
        "\n" +
        "آیدی: " +
        target.id
      );

    } catch (error) {

      console.error(
        "UNBAN ERROR:",
        error.message
      );

      await ctx.reply(
        "آن‌بن انجام نشد."
      );
    }
  }
);

// =====================================================
// DELETE MESSAGE HELP
// =====================================================

bot.action(
  /^deleteHelp:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "حذف پیام\n\n" +
      "روی پیام موردنظر ریپلای کنید و بنویسید:\n\n" +
      "حذف",

      Markup.inlineKeyboard([
        [
          panelButton(
            "مدیریت کاربران",
            "users",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),
          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// DELETE MESSAGE COMMAND
// =====================================================

bot.hears(
  /^حذف$/u,
  async ctx => {

    if (!isGroup(ctx)) {
      return;
    }

    const access =
      await checkAdmin(ctx);

    if (!access.ok) {
      return ctx.reply(
        access.text
      );
    }

    const reply =
      ctx.message &&
      ctx.message.reply_to_message;

    if (!reply) {
      return ctx.reply(
        "روی پیام موردنظر ریپلای کنید و حذف بنویسید."
      );
    }

    try {

      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        reply.message_id
      );

      await ctx.deleteMessage();

    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error.message
      );

      await ctx.reply(
        "حذف پیام انجام نشد."
      );
    }
  }
);

// =====================================================
// HELP PANEL
// =====================================================

bot.action(
  /^help:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "راهنمای PulseGroupManager\n\n" +
      "پنل فقط برای مدیر صاحب آن باز است.\n\n" +
      "مدیریت کاربر:\n" +
      "پیام کاربر را ریپلای کنید و عملیات موردنظر را انجام دهید.\n\n" +
      "دسترسی‌ها:\n" +
      "★ یعنی دسترسی فعال است.\n" +
      "☆ یعنی دسترسی غیرفعال است.\n\n" +
      "پنل کاربر:\n" +
      "روی پیام کاربر ریپلای کنید و «پنل» بزنید.",

      Markup.inlineKeyboard([
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),
          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// SETTINGS PANEL
// =====================================================

function settingsPanel(ownerId) {
  return Markup.inlineKeyboard([

    [
      panelButton(
        "تنظیمات گروه",
        "groupSettings",
        ownerId
      )
    ],

    [
      panelButton(
        "خوشامد",
        "welcomeSettings",
        ownerId
      ),

      panelButton(
        "قوانین",
        "rules",
        ownerId
      )
    ],

    [
      panelButton(
        "ورود و خروج",
        "welcome",
        ownerId
      )
    ],

    [
      panelButton(
        "بازگشت",
        "back",
        ownerId
      ),

      panelButton(
        "بستن",
        "close",
        ownerId
      )
    ]

  ]);
}

// =====================================================
// SETTINGS
// =====================================================

bot.action(
  /^settings:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات\n\n" +
      "تنظیمات اصلی ربات و گروه را از این بخش مدیریت کنید.",

      settingsPanel(
        ctx.from.id
      )
    );
  }
);// =====================================================
// GROUP SETTINGS
// =====================================================

function groupSettingsPanel(ownerId, chatId) {

  const group =
    getGroup(chatId);

  return Markup.inlineKeyboard([

    [
      panelButton(
        `ضدفلود ${star(group.settings.antiFlood)}`,
        "toggleAntiFlood",
        ownerId
      )
    ],

    [
      panelButton(
        `اخطار خودکار ${star(group.settings.autoWarn)}`,
        "toggleAutoWarn",
        ownerId
      )
    ],

    [
      panelButton(
        "قفل‌های گروه",
        "locks",
        ownerId
      )
    ],

    [
      panelButton(
        "ورود و خروج",
        "welcome",
        ownerId
      )
    ],

    [
      panelButton(
        "بازگشت",
        "settings",
        ownerId
      ),

      panelButton(
        "بستن",
        "close",
        ownerId
      )
    ]

  ]);
}

// =====================================================
// GROUP SETTINGS ACTION
// =====================================================

bot.action(
  /^groupSettings:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات گروه\n\n" +
      "★ = فعال\n" +
      "☆ = غیرفعال",

      groupSettingsPanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// ANTI FLOOD
// =====================================================

bot.action(
  /^toggleAntiFlood:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    group.settings.antiFlood =
      !group.settings.antiFlood;

    saveDB();

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات گروه\n\n" +
      "★ = فعال\n" +
      "☆ = غیرفعال",

      groupSettingsPanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// AUTO WARN
// =====================================================

bot.action(
  /^toggleAutoWarn:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    group.settings.autoWarn =
      !group.settings.autoWarn;

    saveDB();

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات گروه\n\n" +
      "★ = فعال\n" +
      "☆ = غیرفعال",

      groupSettingsPanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// LOCKS PANEL
// =====================================================

const lockNames = [
  ["links", "لینک"],
  ["photos", "عکس"],
  ["videos", "ویدیو"],
  ["documents", "فایل"],
  ["voice", "ویس"],
  ["gif", "گیف"],
  ["sticker", "استیکر"],
  ["forward", "فوروارد"],
  ["polls", "نظرسنجی"],
  ["mentions", "منشن"]
];

function locksPanel(
  ownerId,
  chatId
) {

  const group =
    getGroup(chatId);

  const rows = [];

  for (
    let i = 0;
    i < lockNames.length;
    i += 2
  ) {

    const a =
      lockNames[i];

    const b =
      lockNames[i + 1];

    const row = [
      Markup.button.callback(
        `${a[1]} ${star(group.locks[a[0]])}`,
        `toggleLock:${ownerId}:${a[0]}`
      )
    ];

    if (b) {
      row.push(
        Markup.button.callback(
          `${b[1]} ${star(group.locks[b[0]])}`,
          `toggleLock:${ownerId}:${b[0]}`
        )
      );
    }

    rows.push(row);
  }

  rows.push([
    Markup.button.callback(
      "بازگشت",
      `back:${ownerId}`
    ),

    Markup.button.callback(
      "بستن",
      `close:${ownerId}`
    )
  ]);

  return Markup.inlineKeyboard(rows);
}

// =====================================================
// LOCKS ACTION
// =====================================================

bot.action(
  /^locks:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "قفل‌های گروه\n\n" +
      "★ = قفل فعال است\n" +
      "☆ = قفل غیرفعال است",

      locksPanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// TOGGLE LOCK
// =====================================================

bot.action(
  /^toggleLock:(\d+):([a-z]+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    const ownerId =
      Number(ctx.match[1]);

    const key =
      ctx.match[2];

    const group =
      getGroup(ctx.chat.id);

    if (
      typeof group.locks[key] ===
      "undefined"
    ) {
      return ctx.answerCbQuery(
        "قفل پیدا نشد.",
        {
          show_alert: true
        }
      );
    }

    group.locks[key] =
      !group.locks[key];

    saveDB();

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "قفل‌های گروه\n\n" +
      "★ = قفل فعال است\n" +
      "☆ = قفل غیرفعال است",

      locksPanel(
        ownerId,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// WELCOME SETTINGS
// =====================================================

function welcomePanel(
  ownerId,
  chatId
) {

  const group =
    getGroup(chatId);

  return Markup.inlineKeyboard([

    [
      panelButton(
        `خوشامد ${star(group.welcome.enabled)}`,
        "toggleWelcome",
        ownerId
      )
    ],

    [
      panelButton(
        `خروج ${star(group.goodbye.enabled)}`,
        "toggleGoodbye",
        ownerId
      )
    ],

    [
      panelButton(
        "بازگشت",
        "settings",
        ownerId
      ),

      panelButton(
        "بستن",
        "close",
        ownerId
      )
    ]

  ]);
}

// =====================================================
// WELCOME ACTION
// =====================================================

bot.action(
  /^welcomeSettings:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات ورود و خروج\n\n" +
      "★ = فعال\n" +
      "☆ = غیرفعال",

      welcomePanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// TOGGLE WELCOME
// =====================================================

bot.action(
  /^toggleWelcome:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    group.welcome.enabled =
      !group.welcome.enabled;

    saveDB();

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات ورود و خروج\n\n" +
      "★ = فعال\n" +
      "☆ = غیرفعال",

      welcomePanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// TOGGLE GOODBYE
// =====================================================

bot.action(
  /^toggleGoodbye:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    group.goodbye.enabled =
      !group.goodbye.enabled;

    saveDB();

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "تنظیمات ورود و خروج\n\n" +
      "★ = فعال\n" +
      "☆ = غیرفعال",

      welcomePanel(
        ctx.from.id,
        ctx.chat.id
      )
    );
  }
);

// =====================================================
// RULES PANEL
// =====================================================

bot.action(
  /^rules:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    const rules =
      group.rules ||
      "هنوز قانونی برای گروه ثبت نشده است.";

    await ctx.editMessageText(
      "قوانین گروه\n\n" +
      rules,

      Markup.inlineKeyboard([
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// WELCOME PANEL
// =====================================================

bot.action(
  /^welcome:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "ورود و خروج\n\n" +
      "تنظیمات خوشامد و پیام خروج از بخش تنظیمات قابل کنترل است.",

      Markup.inlineKeyboard([
        [
          panelButton(
            "تنظیمات ورود و خروج",
            "welcomeSettings",
            ctx.from.id
          )
        ],
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);// =====================================================
// GROUP STATS
// =====================================================

bot.action(
  /^stats:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    const group =
      getGroup(ctx.chat.id);

    const users =
      Object.keys(group.stats).length;

    let totalMessages = 0;

    for (
      const id of Object.keys(group.stats)
    ) {
      totalMessages +=
        group.stats[id].totalMessages || 0;
    }

    await ctx.editMessageText(
      "آمار گروه\n\n" +
      "تعداد کاربران ثبت‌شده: " +
      users +
      "\n" +
      "مجموع پیام‌های ثبت‌شده: " +
      totalMessages,

      Markup.inlineKeyboard([
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// MESSAGE MANAGEMENT
// =====================================================

bot.action(
  /^messages:(\d+)$/,
  async ctx => {

    if (!(await protectPanel(ctx))) {
      return;
    }

    try {
      await ctx.answerCbQuery();
    } catch {}

    await ctx.editMessageText(
      "مدیریت پیام‌ها\n\n" +
      "برای حذف یک پیام، روی آن ریپلای کنید و بنویسید:\n\n" +
      "حذف",

      Markup.inlineKeyboard([
        [
          panelButton(
            "بازگشت",
            "back",
            ctx.from.id
          ),

          panelButton(
            "بستن",
            "close",
            ctx.from.id
          )
        ]
      ])
    );
  }
);

// =====================================================
// JOIN / LEAVE EVENTS
// =====================================================

bot.on(
  "new_chat_members",
  async ctx => {

    if (!isGroup(ctx)) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    if (!group.welcome.enabled) {
      return;
    }

    for (
      const user of ctx.message.new_chat_members
    ) {

      const text =
        group.welcome.text
          .replace(
            /\{name\}/g,
            nameOf(user)
          );

      try {
        await ctx.reply(text);
      } catch (error) {
        console.error(
          "WELCOME ERROR:",
          error.message
        );
      }
    }
  }
);

bot.on(
  "left_chat_member",
  async ctx => {

    if (!isGroup(ctx)) {
      return;
    }

    const group =
      getGroup(ctx.chat.id);

    if (!group.goodbye.enabled) {
      return;
    }

    const user =
      ctx.message.left_chat_member;

    const text =
      group.goodbye.text
        .replace(
          /\{name\}/g,
          nameOf(user)
        );

    try {
      await ctx.reply(text);
    } catch (error) {
      console.error(
        "GOODBYE ERROR:",
        error.message
      );
    }
  }
);

// =====================================================
// USER MESSAGE STATS
// =====================================================

bot.on(
  "message",
  async ctx => {

    if (!isGroup(ctx)) {
      return;
    }

    if (
      !ctx.from ||
      ctx.from.is_bot
    ) {
      return;
    }

    updateUserStats(ctx);

    saveDB();
  }
);

// =====================================================
// SIMPLE HELP COMMAND
// =====================================================

bot.hears(
  /^راهنما$/u,
  async ctx => {

    const access =
      await checkAdmin(ctx);

    if (!access.ok) {
      return ctx.reply(
        access.text
      );
    }

    await ctx.reply(
      "راهنمای PulseGroupManager\n\n" +
      "پنل\n" +
      "باز کردن پنل مدیریت\n\n" +

      "برای مدیریت کاربر:\n" +
      "روی پیام کاربر ریپلای کنید.\n\n" +

      "بن\n" +
      "آن‌بن\n" +
      "میوت\n" +
      "آن‌میوت\n" +
      "اخطار\n" +
      "اطلاعات\n" +
      "آمار\n" +
      "حذف\n\n" +

      "داخل پنل نیز می‌توانید:\n" +
      "مدیریت کاربران\n" +
      "دسترسی‌های کاربر\n" +
      "قفل‌های گروه\n" +
      "تنظیمات\n" +
      "خوشامد\n" +
      "قوانین\n" +
      "آمار گروه\n" +
      "را مدیریت کنید."
    );
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

bot.catch(
  (error, ctx) => {

    console.error(
      "❌ BOT ERROR:",
      error.message
    );

    try {

      if (ctx && ctx.callbackQuery) {
        ctx.answerCbQuery(
          "خطایی رخ داد.",
          {
            show_alert: true
          }
        ).catch(() => {});
      }

    } catch {}
  }
);

// =====================================================
// START BOT
// =====================================================

bot.launch()
  .then(() => {

    console.log(
      "================================="
    );

    console.log(
      "🤖 PulseGroupManager STARTED"
    );

    console.log(
      "📌 Mode: GROUP MANAGER"
    );

    console.log(
      "📌 Panel Owner Protection: ON"
    );

    console.log(
      "📌 User Permissions: ON"
    );

    console.log(
      "📌 Mute Timers: ON"
    );

    console.log(
      "📌 Database: ON"
    );

    console.log(
      "================================="
    );

  })
  .catch(error => {

    console.error(
      "❌ BOT LAUNCH ERROR:",
      error.message
    );

  });

// =====================================================
// GRACEFUL STOP
// =====================================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
