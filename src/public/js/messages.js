socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  fetch('/api/id')
    .then((res) => res.json())
    .then((selfUserId) => {
      let senderId = message.senderId;
      let username = docQuery.user === undefined && senderId !== lastId ? idNameCache.find((item) => item.id === senderId).username : null; // give username if group chat and new message group
      if (senderId !== lastId) lastId = senderId;
      appendMessage({ sender: selfUserId.toString() === senderId.toString() ? 'self' : '', content: message.content, username });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
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
  if (docQuery.user === undefined && docQuery.group === undefined) return;
  const chatName = document.getElementById('name');
  try {
    let response;
    if (docQuery.user !== undefined) response = await fetch('/api/userdata/' + docQuery.user);
    else if (docQuery.group !== undefined) response = await fetch('/api/groupdata/' + docQuery.group);
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
  if (docQuery.user === undefined && docQuery.group === undefined) return;
  const queryParams = docQuery.user ? `user=${docQuery.user}` : `group=${docQuery.group}`;
  try {
    const data = await (await fetch(`/api/messages?${queryParams}&offset=${offset}`)).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    if (offset === 0) document.getElementById('messages').innerHTML = '';

    const selfUserId = await fetch('/api/id').then((res) => res.json());
    data.reverse().forEach((message) => {
      const isSelf = selfUserId.toString() === message.sender_id.toString() ? 'self' : '';

      let username = docQuery.user === undefined && message.sender_id !== lastId ? idNameCache.find((item) => item.id === message.sender_id).username : null; // give username if group chat and new message group
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

function appendMessage(message, reverse = false) {
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

  // important: ^ this probably vulnerable

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
