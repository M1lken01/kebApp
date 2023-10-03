const socket = new WebSocket('ws://' + document.URL.split('://')[1]);
let docQuery;

socket.addEventListener('open', (event) => {
  console.log('WebSocket connection established on: ' + socket.url);
});

socket.addEventListener('close', (event) => {
  console.log('WebSocket connection closed.');
});

socket.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});

const themeElem = document.getElementById('theme');
const colorThemeElem = document.getElementById('color-theme');
const notImplemented = () => alert('Feature not implemented yet');

function setTheme(themeName) {
  themeElem.href = `./css/${themeName}_theme.css`;
  setCookie('theme', themeName, 365);
}

function setColorTheme(themeName) {
  document.getElementById('color-theme').href = `./css/${themeName}_color_theme.css`;
}

function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].split('=');
    if (cookie[0] === name) return cookie[1];
  }
  return null;
}

function setCookie(name, value, days) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; samesite=Strict; path=/`;
}

function loadTheme() {
  const selectedTheme = getCookie('theme');
  if (selectedTheme) setTheme(selectedTheme);
  else setTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function parseCookies(cookieString) {
  return cookieString.split('; ').reduce((cookieObject, cookie) => {
    const [name, value] = cookie.split('=');
    cookieObject[name] = decodeURIComponent(value);
    return cookieObject;
  }, {});
}

function parseQuery(url) {
  const queryString = url.split('?')[1];
  if (!queryString) return {};
  const params = {};
  queryString.split('&').forEach((keyValue) => {
    const [key, value] = keyValue.split('=');
    params[key] = decodeURIComponent(value);
  });
  return params;
}

function init() {
  loadTheme();
  docQuery = parseQuery(document.URL);
}

window.addEventListener('load', init);
