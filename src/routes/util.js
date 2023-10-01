const crypto = require('crypto');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const tokenLength = 64;

async function dbQuery(query, parsing = []) {
  return new Promise((resolve, reject) => {
    db.query(query, parsing, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results.length > 0 ? results : null);
      }
    });
  });
}

function renderErrorPage(res, errorMessage) {
  res.redirect('/error?error=' + errorMessage);
}

function throwError(res, errorMessage) {
  res.send(`<script>
    alert("${errorMessage}");
    window.history.back();
    location.reload();</script>`);
}

async function hasPermission(cookies, requiredPermission = 2) {
  const token = cookies?.token;
  if (!token) return requiredPermission <= 1;
  const user = await dbQuery(`SELECT permission FROM Users WHERE token = ?;`, [token]);
  return requiredPermission <= ['banned', 'guest', 'member', 'vip', 'moderator', 'admin'].indexOf(user == null ? 'guest' : user[0].permission);
}

async function generateRandomToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(tokenLength, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer.toString('hex'));
      }
    });
  });
}

function validateUsername(username) {
  // Username should consist of only letters, numbers, underscores, and be between 3 and 20 characters long
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
}

function validateMessage(message) {
  return !(!message || message.trim() === '' || message.length < 1 || message.length > 512);
}

const hashPassword = async (password) => bcrypt.hash(password, saltRounds);

const comparePasswords = async (inputPassword, storedHashedPassword) => bcrypt.compare(inputPassword, storedHashedPassword);

async function expireReferrals() {
  try {
    return await dbQuery('SELECT * FROM Referrals WHERE CURDATE() > expires_on;');
  } catch (error) {
    console.error('Error expiring referrals:', error);
    throw error;
  }
}

module.exports = {
  dbQuery,
  hasPermission,
  generateRandomToken,
  validateUsername,
  validateEmail,
  validateMessage,
  hashPassword,
  comparePasswords,
  renderErrorPage,
  throwError,
  expireReferrals,
};
