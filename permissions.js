const { getGroup, saveDB } = require("./database");


const defaultPermissions = {

  ban: false,
  unban: false,

  mute: false,
  unmute: false,

  warn: false,
  removeWarn: false,

  userInfo: false,
  userStats: false,

  locks: false,
  settings: false

};



function getUserPermissions(
  chatId,
  userId
){

  const group =
    getGroup(chatId);


  const id =
    String(userId);


  if(!group.userPermissions[id]){

    group.userPermissions[id] = {
      ...defaultPermissions
    };

    saveDB();

  }


  return group.userPermissions[id];

}



function setPermission(
  chatId,
  userId,
  permission,
  value
){

  const permissions =
    getUserPermissions(
      chatId,
      userId
    );


  if(
    permissions[permission] !== undefined
  ){

    permissions[permission] =
      value;


    saveDB();

  }


  return permissions;

}



function star(value){

  return value
    ? "★"
    : "☆";

}



function permissionText(
  chatId,
  userId
){

  const p =
    getUserPermissions(
      chatId,
      userId
    );


  return (
`دسترسی‌های کاربر:

بن کردن: ${star(p.ban)}
آن‌بن: ${star(p.unban)}

میوت: ${star(p.mute)}
آن‌میوت: ${star(p.unmute)}

اخطار: ${star(p.warn)}
حذف اخطار: ${star(p.removeWarn)}

اطلاعات کاربر: ${star(p.userInfo)}
آمار کاربر: ${star(p.userStats)}

قفل‌های گروه: ${star(p.locks)}
تنظیمات: ${star(p.settings)}`
  );

}



module.exports = {

  defaultPermissions,
  getUserPermissions,
  setPermission,
  permissionText,
  star

};
