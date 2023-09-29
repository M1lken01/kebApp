const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
const app = express();
const { createServer } = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((error) => {
  if (error) throw error;
  console.log(`Successfully connected to the database: ${process.env.DB_NAME}`);
});
global.db = db;

// express settings
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(cookieParser());
app.use(session({ secret: process.env.API_SESSION, resave: false, saveUninitialized: false }));

// logging
app.use((req, res, next) => {
  if (req.ip == '127.0.0.1' && process.env.DEBUG == 'false') return next();
  const data = [
    new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').replace(/-/g, '.'),
    req.method.toUpperCase().padEnd(4),
    req.ip.padStart(15),
    req.url.padEnd(32),
    req.headers['user-agent'],
  ];
  console.log(data.join(' | '));
  next();
});

// routes
app.use('/', require('./src/routes/index'));
app.use('/api/', require('./src/routes/api'));

// http server
const server = createServer(app);
server.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(`Server running on: http://localhost:${process.env.PORT}`);
});

// websocket server
const webSocketServer = new WebSocket.Server({ server });
webSocketServer.on('connection', (webSocket, req) => {
  console.info('Total connected clients:', webSocketServer.clients.size);

  const params = req.url.split('?')[1].split('&')[0];
  const chat = { type: params.split('=')[0], id: params.split('=')[1] };
  webSocket.chat = chat;
  webSocket.token = req.headers.cookie.split('token=')[1].split(';')[0];

  app.locals.clients = webSocketServer.clients;
});
