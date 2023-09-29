const translate = {
  common: {},
  error: {
    noPerm: 'No Permission.',
    noUser: "User doesn't exists.",
    userBanned: 'User is banned.',
    missingData: 'Missing Data.',
    wrongPassword: 'Incorrect password.',
    commonError: 'An error occurred',
    inUse: 'already in use.',
    expiredRef: 'Referral expired',
    noRef: 'Referral not found',
    invalidUser: 'Invalid username or email.',
    invalidMsg: 'Invalid message.',
  },
};

function langCommon(item, json = false) {
  const text = translate.common[item];
  return json ? { error: text } : text;
}

function langError(item, json = false) {
  const text = translate.error[item];
  return json ? { error: text } : text;
}

module.exports = {
  langCommon,
  langError,
};
