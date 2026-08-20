// ================================
// PulseGroupManager
// تنظیمات دسترسی مدیران
// ================================

const PERMISSIONS = {
  BAN: "ban",
  MUTE: "mute",
  WARN: "warn",
  LOCKS: "locks",
  CLEAN: "clean",
  RULES: "rules",
  SETTINGS: "settings",
  USERS: "users",
  WELCOME: "welcome",
  ANTI_SPAM: "anti_spam"
};

// ستاره فعال و غیرفعال
const ACTIVE = "✯";
const INACTIVE = "☆";

// نام فارسی دسترسی‌ها
const PERMISSION_NAMES = {
  ban: "بن کردن",
  mute: "میوت کردن",
  warn: "اخطار دادن",
  locks: "مدیریت قفل‌ها",
  clean: "پاکسازی پیام‌ها",
  rules: "مدیریت قوانین",
  settings: "تنظیمات",
  users: "مدیریت کاربران",
  welcome: "ورود و خروج",
  anti_spam: "ضداسپم"
};

// ساخت متن یک دسترسی
function permissionText(permission, enabled) {
  const star = enabled ? ACTIVE : INACTIVE;
  return `${star} ${PERMISSION_NAMES[permission]}`;
}

// دسترسی‌های پیش‌فرض یک مدیر
function defaultPermissions() {
  return {
    ban: true,
    mute: true,
    warn: true,
    locks: false,
    clean: false,
    rules: false,
    settings: false,
    users: true,
    welcome: false,
    anti_spam: false
  };
}

// ساخت پنل دسترسی‌های یک مدیر
function managerPermissionsText(managerName, permissions) {
  return (
    "『𓆩 دسترسی‌های مدیر 𓆪』\n\n" +
    `👤 ${managerName}\n\n` +
    `${permissionText("ban", permissions.ban)}\n` +
    `${permissionText("mute", permissions.mute)}\n` +
    `${permissionText("warn", permissions.warn)}\n` +
    `${permissionText("locks", permissions.locks)}\n` +
    `${permissionText("clean", permissions.clean)}\n` +
    `${permissionText("rules", permissions.rules)}\n` +
    `${permissionText("settings", permissions.settings)}\n` +
    `${permissionText("users", permissions.users)}\n` +
    `${permissionText("welcome", permissions.welcome)}\n` +
    `${permissionText("anti_spam", permissions.anti_spam)}`
  );
}

module.exports = {
  PERMISSIONS,
  ACTIVE,
  INACTIVE,
  PERMISSION_NAMES,
  permissionText,
  defaultPermissions,
  managerPermissionsText
};
