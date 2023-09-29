const socket = new WebSocket('ws://localhost:3000/?' + document.URL.split('?')[1]);

socket.addEventListener('open', (event) => {
  console.log('WebSocket connection established.');
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  fetch('/api/id')
    .then((res) => res.json())
    .then((selfUserId) => {
      const uid = document.URL.split('?user=')[1];
      const isSelf = selfUserId.toString() == message.senderId.toString() ? 'self' : '';
      let senderId = message.senderId;
      let username = uid === undefined && senderId !== lastId ? idNameCache.find((item) => item.id === senderId).username : null; // give username if group chat and new message group
      if (senderId !== lastId) lastId = senderId;
      console.log({ sender: isSelf, content: message.content, username });
      appendMessage({ sender: isSelf, content: message.content, username });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

socket.addEventListener('close', (event) => {
  console.log('WebSocket connection closed.');
});

socket.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});

let idNameCache = {};
let offset = 0;
let lastId = 0;

const messagesContainer = document.getElementById('messages-container');

function loadMoreMessages() {
  if (messagesContainer.scrollTop < 10) loadMessages();
}

//messagesContainer.addEventListener('scroll', loadMoreMessages);

async function loadReceiver() {
  const uid = document.URL.split('?user=')[1];
  const gid = document.URL.split('?group=')[1];
  if (uid == undefined && gid == undefined) return;
  const name = document.getElementById('name');
  try {
    let response;
    if (uid !== undefined) response = await fetch('/api/userdata/' + uid);
    else if (gid !== undefined) response = await fetch('/api/groupdata/' + gid);
    if (response) {
      const data = await response.json();
      name.innerHTML = data.username || data.title || '';
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadMessages() {
  console.log(offset);
  const uid = document.URL.split('?user=')[1];
  const gid = document.URL.split('?group=')[1];

  if (uid === undefined && gid === undefined) return;
  const queryParams = uid ? `user=${uid}` : `group=${gid}`;

  try {
    const data = await (await fetch(`/api/messages?${queryParams}&offset=${offset}`)).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    if (offset === 0) document.getElementById('messages').innerHTML = '';

    const selfUserId = await fetch('/api/id').then((res) => res.json());
    data.reverse().forEach((element) => {
      const isSelf = selfUserId.toString() == element.sender_id.toString() ? 'self' : '';

      let username = uid === undefined && element.sender_id !== lastId ? idNameCache.find((item) => item.id === element.sender_id).username : null; // give username if group chat and new message group
      if (element.sender_id !== lastId) lastId = element.sender_id;

      appendMessage({ sender: isSelf, content: element.content, username });
    });

    if (offset === 0) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    offset++;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadContacts() {
  try {
    //const data = await (await fetch('/api/contacts')).json();
    const data = await (await fetch('/api/contacts/all?filter=null')).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    data.forEach((element) => {
      appendContact(element);
      //if (!element.title) idNameCache[element.id] = element.username;
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadUsers() {
  try {
    const data = await (await fetch('/api/users')).json();
    console.log(data);
    idNameCache = data;
  } catch (error) {
    console.error('Error:', error);
  }
}

/*function appendMessage(message) {
  document.getElementById('messages').innerHTML += `<div class="message-container ${message.sender}"><div class="message">${message.content}</div></div>`;
}*/

function appendMessage(message) {
  const messages = document.getElementById('messages');
  const messageContainer = document.createElement('div');

  messageContainer.classList.add('message-container');
  if (message.sender) messageContainer.classList.add(message.sender);

  const messageMid = document.createElement('div');
  messageMid.classList.add('message-mid');

  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.textContent = message.content;

  if (message.username) {
    const userElement = document.createElement('p');
    userElement.classList.add('username');
    userElement.textContent = message.username;
    messageMid.appendChild(userElement);
  }

  messageMid.appendChild(messageElement);
  messageContainer.appendChild(messageMid);

  //messages.insertAdjacentElement('afterbegin', messageContainer);
  messages.appendChild(messageContainer);
  document.getElementById('messages-container').scrollTop = messages.scrollHeight;
}

function appendContact(contact) {
  const type = contact.title == undefined || contact.title == null ? 'user' : 'group';
  const contactContainer = document.createElement('li');

  const link = document.createElement('a');
  link.href = `/messages?${type}=${contact.id}`;

  const profilePic = document.createElement('img');
  profilePic.src = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  profilePic.alt = 'pfp';

  const name = document.createElement('p');
  //name.textContent = contact.username || contact.title + ' <span class="badge">group</span>';
  name.innerHTML = contact.username || contact.title + ' <span class="badge">group</span>';

  // important: ^ this prolly voulnarible

  if (contact.id === 1 && !contact.title) {
    name.innerHTML = contact.username + ' <span class="badge bg-red">admin</span>';
  }

  link.appendChild(profilePic);
  link.appendChild(name);

  contactContainer.appendChild(link);

  const contactsList = document.querySelector('.contacts > ul');
  contactsList.appendChild(contactContainer);
}

function showContacts() {
  document.getElementsByClassName('mobile-hide')[0].classList.remove('mobile-hide');
}

function toggleSidebar(show = true) {
  document.getElementsByClassName('mobile-hide')[0].classList.remove('mobile-hide');
  document.querySelector(show ? 'main' : 'nav').classList.add('mobile-hide');
}

function parseCookies(cookieString) {
  return cookieString.split('; ').reduce((cookieObject, cookie) => {
    const [name, value] = cookie.split('=');
    cookieObject[name] = decodeURIComponent(value);
    return cookieObject;
  }, {});
}

function init() {
  if (!document.URL.includes('?')) toggleSidebar();

  loadReceiver();
  loadUsers();
  loadContacts();
  loadMessages();
}

window.addEventListener('load', init);
