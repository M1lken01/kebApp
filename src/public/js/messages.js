const socketMessage = new WebSocket('ws://localhost:3000/?' + document.URL.split('?')[1]);

socketMessage.addEventListener('open', (event) => {
  console.log('WebSocket messages connection established.');
});

socketMessage.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  fetch('/api/id')
    .then((res) => res.json())
    .then((selfUserId) => {
      const chatPartnerId = document.URL.split('?user=')[1];
      const isSelf = selfUserId.toString() === message.senderId.toString() ? 'self' : '';
      let senderId = message.senderId;
      let username = chatPartnerId === undefined && senderId !== lastId ? idNameCache.find((item) => item.id === senderId).username : null; // give username if group chat and new message group
      if (senderId !== lastId) lastId = senderId;
      console.log({ sender: isSelf, content: message.content, username });
      appendMessage({ sender: isSelf, content: message.content, username });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

socketMessage.addEventListener('close', (event) => {
  console.log('WebSocket messages connection closed.');
});

socketMessage.addEventListener('error', (error) => {
  console.error('WebSocket messages error:', error);
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
  const userUrlId = document.URL.split('?user=')[1];
  const groupUrlId = document.URL.split('?group=')[1];
  if (userUrlId === undefined && groupUrlId === undefined) return;
  const chatName = document.getElementById('name');
  try {
    let response;
    if (userUrlId !== undefined) response = await fetch('/api/userdata/' + userUrlId);
    else if (groupUrlId !== undefined) response = await fetch('/api/groupdata/' + groupUrlId);
    if (response) {
      const data = await response.json();
      chatName.innerHTML = data.username || data.title || '';
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadMessages() {
  console.log(offset);
  const userUrlId = document.URL.split('?user=')[1];
  const groupUrlId = document.URL.split('?group=')[1];

  if (userUrlId === undefined && groupUrlId === undefined) return;
  const queryParams = userUrlId ? `user=${userUrlId}` : `group=${groupUrlId}`;

  try {
    const data = await (await fetch(`/api/messages?${queryParams}&offset=${offset}`)).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    if (offset === 0) document.getElementById('messages').innerHTML = '';

    const selfUserId = await fetch('/api/id').then((res) => res.json());
    data.reverse().forEach((message) => {
      const isSelf = selfUserId.toString() === message.sender_id.toString() ? 'self' : '';

      let username = userUrlId === undefined && message.sender_id !== lastId ? idNameCache.find((item) => item.id === message.sender_id).username : null; // give username if group chat and new message group
      if (message.sender_id !== lastId) lastId = message.sender_id;

      appendMessage({ sender: isSelf, content: message.content, username });
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
    data.forEach((contact) => {
      appendContact(contact);
      //if (!contact.title) idNameCache[contact.id] = contact.username;
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
  const type = contact.title === undefined || contact.title === null ? 'user' : 'group';
  const contactContainer = document.createElement('li');

  const link = document.createElement('a');
  link.href = `/messages?${type}=${contact.id}`;

  const profilePic = document.createElement('img');
  profilePic.src = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  profilePic.alt = 'pfp';

  const name = document.createElement('p');
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

function init() {
  if (!document.URL.includes('?')) toggleSidebar();

  loadReceiver();
  loadUsers();
  loadContacts();
  loadMessages();
}

window.addEventListener('load', init);
