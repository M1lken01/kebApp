let idNameCache = {};
let messagesOffset = 0;
let lastMessageSenderId = 0;

const messagesContainer = document.getElementById('messages-container');

const throttledLoad = throttle(() => loadMessages(true), 1000);

function loadMoreMessages() {
  //if (messagesContainer.scrollTop < 10) throttledLoad();
}

messagesContainer.addEventListener('scroll', loadMoreMessages);

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

async function loadMessages(reverse = false) {
  console.log(messagesOffset);
  if (docQuery.user === undefined && docQuery.group === undefined) return;
  const queryParams = docQuery.user ? `user=${docQuery.user}` : `group=${docQuery.group}`;
  try {
    const messagesData = await (await fetch(`/api/messages?${queryParams}&offset=${messagesOffset}`)).json();
    console.log(messagesData);
    if (!messagesData || messagesData.length === 0) return;
    if (messagesOffset === 0) document.getElementById('messages').innerHTML = '';

    const selfId = await fetch('/api/id').then((res) => res.json());
    messagesData.reverse().forEach((message) => {
      appendMessage(createMessage(message, selfId));
    });

    if (messagesOffset === 0) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    messagesOffset++;
  } catch (error) {
    console.error('Error:', error);
  }
}

function createMessage(message, selfId) {
  const isGroupAndIsNew = !message.receiver_id && message.sender_id !== lastMessageSenderId;
  if (message.sender_id != lastMessageSenderId) lastMessageSenderId = message.sender_id;
  return {
    self: selfId.toString() === message.sender_id.toString(),
    content: message.content,
    username: isGroupAndIsNew ? idNameCache.find((item) => item.id === message.sender_id).username : null,
  };
}

async function loadContacts() {
  try {
    const contactsData = await (await fetch('/api/contacts/all?filter=null')).json();
    if (!contactsData || contactsData.length === 0) return;
    contactsData.forEach((contact) => {
      appendContact(contact);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadUsers() {
  try {
    idNameCache = await (await fetch('/api/users')).json();
  } catch (error) {
    console.error('Error:', error);
  }
}

function appendMessage(message) {
  const messages = document.getElementById('messages');
  const messageContainer = document.createElement('div');

  messageContainer.classList.add('message-container');
  if (message.self) messageContainer.classList.add('self');

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
  name.innerHTML = sanitizeHtml(contact.username || contact.title);

  // important: ^ this is vulnerable

  name.innerHTML += createBadgeHtml(contact);

  /*if (contact.id === 1 && !contact.title) {
    name.innerHTML = contact.username + ' <span class="badge bg-red" style="background-color:red">admin</span>';
  }*/

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

async function messageListener() {
  socket.addEventListener('message', async (event) => {
    appendMessage(createMessage(JSON.parse(event.data), await (await fetch('/api/id')).json()));
  });
}

function init() {
  if (Object.keys(docQuery).length === 0 && docQuery.constructor === Object) toggleSidebar();

  loadReceiver();
  loadUsers();
  loadContacts();
  loadMessages();
  messageListener();
}

window.addEventListener('load', init);
