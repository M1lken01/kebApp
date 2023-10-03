const fs = require('fs');
const router = require('express').Router();
const multer = require('multer');
const {
  hasPermission,
  dbQuery,
  generateRandomToken,
  hashPassword,
  renderErrorPage,
  throwError,
  comparePasswords,
  validateEmail,
  validateUsername,
  validateMessage,
  getIdByToken,
} = require('./util');
const { langError } = require('./lang');
const tokenAge = 1209600000; // 14 days (1 day = 86,400,000 milliseconds)

const WebSocket = require('ws');

const broadcast = async (clients, message, chat) => {
  clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (chat.type === 'group') {
        if (objectsAreEqual(chat, client.chat)) client.send(message);
      } else {
        const clientId = await dbQuery('SELECT id FROM Users WHERE token = ?;', [client.token]);
        if (chat.type === client.chat.type && parseInt(chat.id) === clientId[0]?.id) client.send(message);
      }
    }
  });
};

function objectsAreEqual(objA, objB) {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  return true;
}

router.post('/promote', async (req, res) => {
  if (!hasPermission(req.cookies, 5)) return res.json(langError('noPerm', true));
  dbQuery('UPDATE users SET role = ? WHERE user_id = ?;', [req.body.role, req.body.userId]);
  console.log('promoted');
  res.json({ success: true });
});

router.post('/add/:id', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));
    const selfId = await getIdByToken(req.cookies.token);
    const existingFriendship = await dbQuery('SELECT * FROM Friendships WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?);', [
      selfId,
      req.params.id,
      req.params.id,
      selfId,
    ]);
    if (existingFriendship !== null && existingFriendship[0].state === 'pending') {
      // if accept
      return res.json(
        await dbQuery('UPDATE Friendships SET state = "accepted" WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?);', [
          selfId,
          req.params.id,
          req.params.id,
          selfId,
        ]),
      );
    } else {
      // if add
      return res.json(await dbQuery('INSERT INTO Friendships (user_id_1, user_id_2) VALUES (?, ?);', [selfId, req.params.id]));
    }
  } catch (error) {
    return res.json(error);
  }
});

router.post('/del/:id', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));
    const selfId = await getIdByToken(req.cookies.token);
    return res.json(
      await dbQuery(`DELETE FROM Friendships WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_2 = ? AND user_id_1 = ?);`, [
        selfId,
        req.params.id,
        selfId,
        req.params.id,
      ]),
    );
  } catch (error) {
    return res.json(error);
  }
});

router.post('/join/:id', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));
    const selfId = await getIdByToken(req.cookies.token);
    const groupId = req.params.id;
    let participantsArray = JSON.parse((await dbQuery('SELECT participants FROM Groupchats WHERE id = ?;', [groupId]))[0]?.participants);
    if (!Array.isArray(participantsArray)) participantsArray = [participantsArray];
    participantsArray.push(selfId);
    return res.json(await dbQuery('UPDATE Groupchats SET participants = ? WHERE id = ?;', [JSON.stringify(participantsArray), groupId]));
  } catch (error) {
    return res.json(error);
  }
});

router.post('/leave/:id', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));
    const selfId = await getIdByToken(req.cookies.token);
    const groupId = req.params.id;
    let participantsArray = (await dbQuery('SELECT participants FROM Groupchats WHERE id = ?;', [groupId]))[0]?.participants;
    console.log(participantsArray);
    participantsArray.splice(participantsArray.indexOf(selfId), 1);
    console.log(participantsArray);
    return res.json(await dbQuery('UPDATE Groupchats SET participants = ? WHERE id = ?;', [JSON.stringify(participantsArray), groupId]));
  } catch (error) {
    return res.json(error);
  }
});

router.get('/users', async (req, res) => {
  try {
    return !hasPermission(req.cookies)
      ? res.json(langError('noPerm', true))
      : res.json(await dbQuery('SELECT id, username FROM Users LIMIT ?;', [req.query.limit || 128]));
  } catch (error) {
    return res.json(error);
  }
});

router.get('/userdata/:id', async (req, res) => {
  try {
    return !hasPermission(req.cookies)
      ? res.json(langError('noPerm', true))
      : res.json((await dbQuery('SELECT * FROM Users WHERE id = ?;', [req.params.id]))[0]);
  } catch (error) {
    return res.json(error);
  }
});

router.get('/groupdata/:id', async (req, res) => {
  try {
    return !hasPermission(req.cookies)
      ? res.json(langError('noPerm', true))
      : res.json((await dbQuery('SELECT * FROM Groupchats WHERE id = ?;', [req.params.id]))[0]);
  } catch (error) {
    return res.json(error);
  }
});

router.get('/shortuser', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));

    const userData = await dbQuery('SELECT id, username, email, picture FROM Users WHERE token = ?;', [req.cookies.token]);

    return res.json(userData[0]);
  } catch (error) {
    return res.json(error);
  }
});

router.get('/id', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));
    return res.json(await getIdByToken(req.cookies.token));
  } catch (error) {
    return res.json(error);
  }
});

const storage = multer.diskStorage({
  destination: './src/public/imgs/user/',
  filename: async function (req, file, cb) {
    const userId = (await dbQuery('SELECT id FROM users WHERE token = ?;', [req.cookies.token]))[0]?.id;
    const filename = userId + '.png';
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(new Error('Only image files are allowed.'), false);
    cb(null, true);
  },
});

router.post('/update/picture', upload.single('pfp'), async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));
    const token = req.body.token || req.cookies.token;
    await dbQuery('UPDATE Users SET picture = ? WHERE token = ?;', [!parseInt(req.body.remove), token]);
    return res.redirect('/profile');
  } catch (error) {
    return res.json(error);
  }
});

router.post('/update/password', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.send('no permission');
    const token = req.body.token || req.cookies.token;
    const hashedPassword = await hashPassword(req.body.password);
    await dbQuery('UPDATE Users SET password_hash = ? WHERE token = ?;', [hashedPassword, token]);
    return res.redirect('/profile');
  } catch (error) {
    return res.json(error);
  }
});

router.post('/update/email', async (req, res) => {
  try {
    if (!hasPermission(req.cookies, 4)) return res.send('no permission');

    // todo: add exists check n stuff

    const token = req.body.token || req.cookies.token;
    const email = req.body.email;
    await dbQuery('UPDATE Users SET email = ? WHERE token = ?;', [email, token]);
    return res.redirect('/profile');
  } catch (error) {
    return res.json(error);
  }
});

router.post('/update/token', async (req, res) => {
  try {
    if (!hasPermission(req.cookies, 4)) return res.send('no permission');
    const oldToken = req.body.token || req.cookies.token;
    const newToken = await generateRandomToken();
    await dbQuery('UPDATE Users SET token = ? WHERE token = ?;', [newToken, oldToken]);
    res.cookie('token', newToken, {
      maxAge: tokenAge,
    });
    return res.redirect('/profile');
  } catch (error) {
    return res.json(error);
  }
});

router.get('/contacts/requests', async (req, res) => {
  try {
    if (!hasPermission(req.cookies, 4)) return res.json(langError('noPerm', true));

    const limit = req.query.limit || 64;
    const selfId = await getIdByToken(req.cookies.token);

    const friendRequests = await dbQuery(
      `
      SELECT
      Users.id,
      Users.username,
      Users.picture,
      Friendships.user_id_1 AS user_id_1,
      Friendships.user_id_2 AS user_id_2,
      CASE
        WHEN Friendships.user_id_1 = ? THEN 'requestSent'
        ELSE 'requestReceived'
      END AS requestStatus
    FROM Users
    INNER JOIN Friendships ON (Users.id = Friendships.user_id_1 OR Users.id = Friendships.user_id_2)
    WHERE (Friendships.user_id_1 = ? OR Friendships.user_id_2 = ?) AND Friendships.state = 'pending'
    LIMIT ?;
    `,
      [selfId, selfId, selfId, limit],
    );

    return res.json(friendRequests);
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during get contacts ' + error);
  }
});

router.get('/contacts/all', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));

    const limit = req.query.limit || 64;
    const filter = req.query.filter;
    const selfId = await getIdByToken(req.cookies.token);

    let contacts = [];
    const userQuery = 'SELECT id, username, picture, created_on, permission FROM Users WHERE id NOT LIKE ?';
    const groupQuery = 'SELECT id, title, participants, picture, created_on FROM Groupchats';
    let userArgs = [`${userQuery} LIMIT ?;`, [selfId, limit]];
    let groupArgs = [`${groupQuery} LIMIT ?;`, [limit]];
    if (filter != 'null') {
      userArgs = [`${userQuery} AND username LIKE ? LIMIT ?;`, [`%${filter}%`, selfId, limit]];
      groupArgs = [`${groupQuery} WHERE title LIKE ? LIMIT ?;`, [`%${filter}%`, limit]];
    }
    const users = await dbQuery(userArgs[0], userArgs[1]);
    const groups = await dbQuery(groupArgs[0], groupArgs[1]);
    if (Array.isArray(users) && users.length > 0) contacts.push(...users);
    if (Array.isArray(groups) && groups.length > 0) contacts.push(...groups);

    return res.json(contacts);
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during get contacts ' + error);
  }
});

router.get('/contacts/new', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));

    const limit = req.query.limit || 64;
    const selfId = await getIdByToken(req.cookies.token);

    const contacts1 = await dbQuery(
      `
      SELECT id, username, picture, permission
      FROM Users
      WHERE id NOT IN (
        SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(participants, '$[*].id'))
        FROM Groupchats
        WHERE JSON_UNQUOTE(JSON_EXTRACT(participants, '$[*].id')) IS NOT NULL
      )
      AND id NOT IN (
        SELECT user_id_1 FROM Friendships WHERE user_id_2 = ?
        UNION ALL
        SELECT user_id_2 FROM Friendships WHERE user_id_1 = ?
      )
      AND id != ?
      LIMIT ?;
    `,
      [selfId, selfId, selfId, limit],
    );

    const groups = await dbQuery(
      `
      SELECT id, title, picture, participants, created_on
      FROM Groupchats
      WHERE NOT JSON_CONTAINS(participants, CAST(? AS JSON))
      LIMIT ?;`,
      [selfId, limit],
    );
    const friends = await dbQuery(
      `
      SELECT Users.id, Users.username, Users.picture, Users.permission
      FROM Users
      WHERE id NOT IN (
        SELECT user_id_1 FROM Friendships WHERE user_id_2 = ?
        UNION ALL
        SELECT user_id_2 FROM Friendships WHERE user_id_1 = ?
      )
      AND id != ?
      LIMIT ?;`,
      [selfId, selfId, selfId, limit],
    );

    let contacts = [];
    if (Array.isArray(friends) && friends.length > 0) contacts.push(...friends);
    if (Array.isArray(groups) && groups.length > 0) contacts.push(...groups);

    res.json(contacts);
  } catch (error) {
    return res.json(error);
  }
});

router.get('/contacts', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));

    const limit = req.query.limit || 64;
    const selfId = await getIdByToken(req.cookies.token);

    const groups = await dbQuery(
      `SELECT id, title, picture, participants, created_on
       FROM Groupchats
       WHERE JSON_CONTAINS(participants, CAST(? AS JSON))
       LIMIT ?;`,
      [selfId, limit],
    );
    const friends = await dbQuery(
      `SELECT Users.id, Users.username, Users.picture, Users.permission
       FROM Users
       INNER JOIN Friendships ON (Users.id = Friendships.user_id_1 OR Users.id = Friendships.user_id_2)
       WHERE (Friendships.user_id_1 = ? OR Friendships.user_id_2 = ?) AND Friendships.state = 'accepted' AND Users.id != ?
       LIMIT ?;`,
      [selfId, selfId, selfId, limit],
    );

    let contacts = [];
    if (Array.isArray(friends) && friends.length > 0) contacts.push(...friends);
    if (Array.isArray(groups) && groups.length > 0) contacts.push(...groups);

    return res.json(contacts);
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during get contacts ' + error);
  }
});

router.get('/messages', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));

    const limit = parseInt(req.query.limit) || 1024;
    const offset = parseInt(req.query.offset) || 0;
    const chatGroupId = parseInt(req.query.group);
    const chatUserId = parseInt(req.query.user);

    const selfId = await getIdByToken(req.cookies.token);
    let messages;
    if (!chatUserId && chatGroupId) {
      const participants = (await dbQuery('SELECT participants FROM Groupchats WHERE id = ?;', [chatGroupId]))[0]?.participants.join(', ');
      messages = await dbQuery(
        `SELECT * FROM Messages WHERE (sender_id IN (${participants}) AND group_id = ?) OR (sender_id = ? AND group_id = ?) ORDER BY created_on DESC LIMIT ?, ?;`,
        [chatGroupId, selfId, chatGroupId, offset, limit],
      );
      return res.json(messages);
    } else if (!chatGroupId && chatUserId) {
      messages = await dbQuery(
        'SELECT * FROM Messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_on desc LIMIT ?, ?;',
        [selfId, chatUserId, chatUserId, selfId, offset, limit],
      );

      //if (offset * limit > messages.length) return res.json(null);
    } else {
      return res.json(null);
    }
    return res.json(messages);
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during get message ' + error);
  }
});

router.post('/message', async (req, res) => {
  try {
    if (!hasPermission(req.cookies)) return res.json(langError('noPerm', true));

    const content = req.body.content;
    const receiverId = req.body.receiver;
    const group = req.body.group;

    if (!validateMessage(content)) return throwError(res, langError('invalidMsg'));
    if (!content || (!receiverId && !groupId)) return renderErrorPage(res, langError('missingData'));

    const selfId = await getIdByToken(req.cookies.token);

    const type = group === 0 ? 'user' : 'group';
    const receiver = group === 0 ? 'receiver' : 'group';
    await dbQuery(`INSERT INTO Messages (sender_id, ${receiver}_id, content) VALUES (?, ?, ?);`, [selfId, receiverId, content]);
    console.log(`[${selfId}->${receiverId}(${type})]:"${content}"`);
    broadcast(req.app.locals.clients, JSON.stringify({ senderId: selfId, content }), { type, id: receiverId });
    return res.redirect(`/messages?${type}=${receiverId}`);
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during send message ' + error);
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!hasPermission(req.cookies, 1)) return res.json(langError('noPerm', true));

    const user = req.body.username;
    const password = req.body.password;

    if (!user || !password) return throwError(res, langError('missingData'));

    const userData = await dbQuery('SELECT username, email, id, password_hash, token FROM Users WHERE username = ? OR email = ?;', [user, user]);
    if (userData == null) return throwError(res, langError('noUser'));
    if (userData[0].role == 'banned') return throwError(res, langError('userBanned'));
    if (!(await comparePasswords(password, userData[0].password_hash))) return throwError(res, langError('wrongPassword'));

    res.cookie('token', userData[0].token, {
      maxAge: tokenAge,
    });

    return res.redirect('/');
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during login');
  }
});

router.post('/register', async (req, res) => {
  try {
    if (!hasPermission(req.cookies, 1)) return res.json(langError('noPerm', true));

    const referral = req.body.referral;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const token = await generateRandomToken();
    const hashedPassword = await hashPassword(password);

    if (!referral || !username || !email || !password) return throwError(res, langError('missingData'));
    if (!validateEmail(email) || !validateUsername(username)) return throwError(res, langError('invalidUser'));

    const referralData = await dbQuery('SELECT id, expired FROM Referrals WHERE secret = ?;', [referral]);
    if (referralData == null) return throwError(res, langError('noRef'));
    if (referralData[0].expired == true) return throwError(res, langError('expiredRef'));

    const userExists = await dbQuery('SELECT username, email FROM Users WHERE username = ? OR email = ?;', [username, email]);
    if (userExists != null) return throwError(res, (userExists[0].username === username ? 'Username ' : 'Email ') + langError('inUse'));

    await dbQuery('INSERT INTO Users (username, email, password_hash, token) VALUES (?, ?, ?, ?);', [username, email, hashedPassword, token]);
    await dbQuery('UPDATE Referrals SET expired = true WHERE id = ?;', [referralData[0].id]);

    res.cookie('token', token, {
      maxAge: tokenAge,
    });

    const publicGroupId = 1;
    let participantsArray = JSON.parse((await dbQuery('SELECT participants FROM Groupchats WHERE id = ?;', [publicGroupId]))[0].participants);
    if (!Array.isArray(participantsArray)) participantsArray = [participantsArray];
    participantsArray.push((await dbQuery('SELECT id FROM Users WHERE token = ?;', [token]))[0].id);
    await dbQuery('UPDATE Groupchats SET participants = ? WHERE id = ?;', [JSON.stringify(participantsArray), publicGroupId]); // add to public group

    console.log('Registration successful');
    return res.redirect('/login');
  } catch (error) {
    return renderErrorPage(res, langError('commonError') + ' during registration. ' + error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.redirect('/login');
});

module.exports = router;
