const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const { hasPermission, dbQuery, renderErrorPage } = require('./util');
const { langError } = require('./lang');

router.get(['/', '/messages', '/index'], async (req, res) => {
  if (!(await hasPermission(req.cookies))) return res.redirect('/login');

  const receiver = req.query.user || req.query.group;
  const group = req.query.group != undefined ? 1 : 0;
  const none = req.query.group == undefined && req.query.user == undefined;

  res.render('messages.ejs', {
    title: 'messages',
    receiver,
    group,
    none,
  });
});

router.get('/login', async (req, res) => {
  if (!(await hasPermission(req.cookies, 1))) return renderErrorPage(res, langError('noPerm'));
  if (await hasPermission(req.cookies)) return res.redirect('/messages');

  res.render('login.ejs', {
    title: 'login',
    login: true,
  });
});

router.get('/register', async (req, res) => {
  if (!(await hasPermission(req.cookies, 1))) return renderErrorPage(res, langError('noPerm'));
  if (await hasPermission(req.cookies)) return res.redirect('/messages');

  res.render('login.ejs', {
    title: 'register',
    login: false,
  });
});

router.get('/profile', async (req, res) => {
  if (!(await hasPermission(req.cookies))) return renderErrorPage(res, langError('noPerm'));

  const userData = await dbQuery('SELECT username, email FROM users WHERE token = ?', [req.cookies.token]);
  if (userData == null) return;

  res.render('profile.ejs', {
    title: 'profile',
    username: userData[0].username,
  });
});

router.get('/friends', async (req, res) => {
  if (!(await hasPermission(req.cookies))) return renderErrorPage(res, langError('noPerm'));

  const userData = await dbQuery('SELECT username, email FROM users WHERE token = ?', [req.cookies.token]);
  if (userData == null) return;

  res.render('friends.ejs', {
    title: 'friends',
    username: userData[0].username,
  });
});

router.get('/error', async (req, res) => {
  const error = req.query.error;
  res.render('error.ejs', {
    title: 'error',
    error,
  });
});

module.exports = router;
