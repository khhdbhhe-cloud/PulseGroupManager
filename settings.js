  // ===================================
  // قوانین
  // ===================================

  bot.action(
    /^set_rules:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      await ctx.editMessageText(

`『𓆩 تنظیمات قوانین 𓆪』

مدیریت قوانین گروه

★ تنظیم قوانین گروه
★ نمایش قوانین
★ ویرایش قوانین
★ حذف قوانین

قوانین گروه از این بخش قابل مدیریت است.`,

        backToSettings(
          ctx.from.id
        )

      );

    }
  );


  // ===================================
  // لقب و پاسخ ربات
  // ===================================

  bot.action(
    /^set_bot_reply:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      const group =
        getGroup(ctx.chat.id);

      const config =
        ensureBotReplySettings(group);

      const status =
        config.enabled
          ? "★ فعال"
          : "☆ غیرفعال";

      const mode =
        config.random
          ? "★ تصادفی"
          : "☆ ثابت";

      await ctx.editMessageText(

`『𓆩 لقب و پاسخ ربات 𓆪』

وضعیت پاسخ ربات:

${status}

حالت پاسخ:

${mode}

تعداد پاسخ‌های ثبت‌شده:

★ ${config.replies.length}

تعداد لقب‌های ثبت‌شده:

★ ${Object.keys(config.nicknames).length}

ربات می‌تواند هنگام دریافت «ربات»
با پاسخ‌های مختلف جواب بدهد.

همچنین برای کاربران می‌توان لقب اختصاصی تعیین کرد.

مثال پاسخ:

جانم، هستم {nickname} 🌹

یا:

جانم، زیبای گپ اینجاست 😎`,

        Markup.inlineKeyboard([

          [
            settingButton(
              config.enabled
                ? "☆ خاموش کردن پاسخ"
                : "★ روشن کردن پاسخ",
              "bot_reply_toggle",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مدیریت پاسخ‌ها",
              "bot_reply_list",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "مدیریت لقب‌ها",
              "bot_reply_nicknames",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "حالت پاسخ",
              "bot_reply_mode",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "settings_home",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // روشن / خاموش کردن پاسخ ربات
  // ===================================

  bot.action(
    /^bot_reply_toggle:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      const group =
        getGroup(ctx.chat.id);

      const config =
        ensureBotReplySettings(group);

      config.enabled =
        !config.enabled;

      saveDB();

      await ctx.answerCbQuery(
        config.enabled
          ? "★ پاسخ ربات فعال شد."
          : "☆ پاسخ ربات غیرفعال شد."
      );

      await ctx.editMessageText(

`『𓆩 پاسخ ربات 𓆪』

وضعیت:

${config.enabled
  ? "★ فعال"
  : "☆ غیرفعال"}

${config.enabled
  ? "ربات به دستور «ربات» پاسخ می‌دهد."
  : "پاسخ‌گویی ربات به دستور «ربات» خاموش است."}`,

        Markup.inlineKeyboard([

          [
            settingButton(
              "بازگشت",
              "set_bot_reply",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بستن",
              "settings_close",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // حالت پاسخ
  // ===================================

  bot.action(
    /^bot_reply_mode:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      const group =
        getGroup(ctx.chat.id);

      const config =
        ensureBotReplySettings(group);

      await ctx.editMessageText(

`『𓆩 حالت پاسخ ربات 𓆪』

حالت فعلی:

${config.random
  ? "★ تصادفی"
  : "★ ثابت"}

در حالت تصادفی، ربات از بین پاسخ‌های ثبت‌شده
یک پاسخ را انتخاب می‌کند.`,

        Markup.inlineKeyboard([

          [
            settingButton(
              "★ تصادفی",
              "bot_reply_random",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "☆ ثابت",
              "bot_reply_fixed",
              ctx.from.id
            )
          ],

          [
            settingButton(
              "بازگشت",
              "set_bot_reply",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // حالت تصادفی
  // ===================================

  bot.action(
    /^bot_reply_random:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      const group =
        getGroup(ctx.chat.id);

      const config =
        ensureBotReplySettings(group);

      config.random = true;

      saveDB();

      await ctx.answerCbQuery(
        "★ حالت تصادفی فعال شد."
      );

      await ctx.editMessageText(

`『𓆩 حالت پاسخ 𓆪』

★ حالت تصادفی فعال است.

ربات از بین پاسخ‌های موجود،
به‌صورت تصادفی پاسخ انتخاب می‌کند.`,

        Markup.inlineKeyboard([

          [
            settingButton(
              "بازگشت",
              "set_bot_reply",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // حالت ثابت
  // ===================================

  bot.action(
    /^bot_reply_fixed:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      const group =
        getGroup(ctx.chat.id);

      const config =
        ensureBotReplySettings(group);

      config.random = false;

      saveDB();

      await ctx.answerCbQuery(
        "★ حالت ثابت فعال شد."
      );

      await ctx.editMessageText(

`『𓆩 حالت پاسخ 𓆪』

★ حالت ثابت فعال است.

پاسخ‌ها در حالت ثابت
به ترتیب ثبت‌شده استفاده می‌شوند.`,

        Markup.inlineKeyboard([

          [
            settingButton(
              "بازگشت",
              "set_bot_reply",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // لیست پاسخ‌های ربات
  // ===================================

  bot.action(
    /^bot_reply_list:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      const replies =
        getBotReplies(ctx.chat.id);

      let text =
`『𓆩 پاسخ‌های ربات 𓆪』

تعداد پاسخ‌ها:

★ ${replies.length}

`;

      if (!replies.length) {

        text +=
          "☆ هنوز پاسخی ثبت نشده است.";

      } else {

        replies
          .slice(0, 30)
          .forEach(
            (reply, index) => {

              text +=
                `${index + 1}. ${reply}\n`;

            }
          );

        if (replies.length > 30) {

          text +=
            `\n... و ${replies.length - 30} پاسخ دیگر`;

        }

      }

      await ctx.editMessageText(

        text,

        Markup.inlineKeyboard([

          [
            settingButton(
              "بازگشت",
              "set_bot_reply",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // لیست لقب‌ها
  // ===================================

  bot.action(
    /^bot_reply_nicknames:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      const group =
        getGroup(ctx.chat.id);

      const config =
        ensureBotReplySettings(group);

      const nicknames =
        config.nicknames;

      const ids =
        Object.keys(nicknames);

      let text =
`『𓆩 لقب‌های ربات 𓆪』

تعداد لقب‌های ثبت‌شده:

★ ${ids.length}

`;

      if (!ids.length) {

        text +=
          "☆ هنوز لقبی ثبت نشده است.";

      } else {

        ids
          .slice(0, 30)
          .forEach(
            (id, index) => {

              text +=
                `${index + 1}. ${nicknames[id]}\n`;

            }
          );

      }

      text +=
        `\nبرای تعیین لقب اختصاصی، می‌توان از قابلیت مدیریت کاربر استفاده کرد.`;

      await ctx.editMessageText(

        text,

        Markup.inlineKeyboard([

          [
            settingButton(
              "بازگشت",
              "set_bot_reply",
              ctx.from.id
            )
          ]

        ])

      );

    }
  );


  // ===================================
  // بستن تنظیمات
  // ===================================

  bot.action(
    /^settings_close:(\d+)$/,
    async ctx => {

      if (
        !(await protectSettings(ctx))
      ) return;

      await ctx.answerCbQuery();

      try {

        await ctx.deleteMessage();

      }

      catch (error) {

        console.log(
          "SETTINGS CLOSE ERROR:",
          error.message
        );

      }

    }
  );

}


// =====================================
// خروجی‌های فایل
// =====================================

module.exports = {

  registerSettings,

  settingsPanel,
  settingsText,

  protectSettings,
  protectOwner,

  ensureBotReplySettings,

  getUserNickname,
  setUserNickname,
  removeUserNickname,

  getBotReplies,
  addBotReply,
  removeBotReply,

  setBotReplyEnabled,
  getRandomBotReply,

  formatBotReply

};
