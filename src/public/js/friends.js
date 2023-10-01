const filterElem = document.getElementById('filter');
const filterButtonElem = document.getElementById('filter-button');
const contactsContainer = document.querySelector('.people .all ul');
const requestsContainer = document.querySelector('.people .requests ul');
const knownContainer = document.querySelector('.people .known ul');

async function loadContacts(filter = null) {
  try {
    const data = await (await fetch('/api/contacts/new?filter=' + filter)).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    contactsContainer.innerHTML = '';
    data.forEach((contact) => {
      appendContact(contact);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadRequests() {
  try {
    const data = await (await fetch('/api/contacts/requests')).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    requestsContainer.innerHTML = '';
    data.forEach((element) => {
      if (element.requestStatus === 'requestReceived' && element.id === element.user_id_1) appendRequest(element);
      if (element.requestStatus === 'requestSent' && element.id === element.user_id_2) appendRequest(element, true);
      console.log(element);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadKnown() {
  try {
    const data = await (await fetch('/api/contacts/?filter=null')).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    knownContainer.innerHTML = '';
    data.forEach((contact) => {
      appendKnown(contact);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

function appendContact(contact) {
  if ((document.getElementById(`accept-${contact.id}`) || document.getElementById(`cancel-${contact.id}`)) && contact.username) return;
  let type = 'user';
  let typeText = 'Add friend';
  let suffix = '';
  let endpoint = 'add';
  if (!contact.username) {
    type = 'group';
    typeText = 'Join group';
    suffix = ' <span class="badge">group</span>';
    endpoint = 'join';
  }
  let profilePic = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  contactsContainer.innerHTML += `<li><div><img src=".${profilePic}" alt="pfp" /><p>${
    contact.username || contact.title
  }${suffix}</p></div><button id="${endpoint}-${contact.id}">${typeText}</button></li>`;
  if (contact.username) {
    addClickListener(`#${endpoint}-${contact.id}`, () => {
      addFriend(contact.id);
    });
  }
}

function appendRequest(contact, sent = false) {
  let right = sent
    ? `<button id="cancel-${contact.id}">Cancel request</button>`
    : `<div><button id="decline-${contact.id}">Decline</button> | <button id="accept-${contact.id}">Accept</button></div>`;
  let suffix = '';
  let type = !contact.username ? 'group' : 'user';
  let profilePic = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  requestsContainer.innerHTML += `<li id="request-${contact.id}"><div><img src="${profilePic}" alt="pfp" /><p>${contact.username}${suffix}</p></div>${right}</li>`;
  addClickListener(`#decline-${contact.id}`, () => {
    removeFriend(contact.id);
  });
  addClickListener(`#cancel-${contact.id}`, () => {
    removeFriend(contact.id);
  });
  addClickListener(`#accept-${contact.id}`, () => {
    addFriend(contact.id);
  });
}

function appendKnown(contact) {
  let type = 'user';
  let typeText = 'Remove friend';
  let suffix = '';
  let endpoint = 'del';
  if (!contact.username) {
    type = 'group';
    typeText = 'Leave group';
    suffix = ' <span class="badge">group</span>';
    endpoint = 'leave';
  }
  let profilePic = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  knownContainer.innerHTML += `<li><div><img src="${profilePic}" alt="pfp" /><p>${
    contact.username || contact.title
  }${suffix}</p></div><button id="${endpoint}-${contact.id}">${typeText}</button></li>`;
  if (contact.username) {
    addClickListener(`#${endpoint}-${contact.id}`, () => {
      removeFriend(contact.id);
    });
  }
}

function addClickListener(selector, eventHandler, delayMs = 100) {
  setTimeout(() => {
    const element = document.querySelector(selector);
    if (element) element.addEventListener('click', eventHandler);
  }, delayMs);
}

function setOuterHtml(selector, html, parent = false) {
  try {
    let element = document.querySelector(selector);
    if (parent) element = element.parentElement;
    if (element) element.outerHTML = html;
  } catch (error) {
    return console.log(error);
  }
}

filterElem.addEventListener('keydown', function (event) {
  if (event.key.toLowerCase() === 'Enter'.toLowerCase()) filter();
});

filterButtonElem.addEventListener('click', filter);

function filter() {
  contactsContainer.innerHTML = '';
  loadContacts(filterElem.value);
}

function addFriend(id) {
  fetch(`api/add/${id}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data === null) {
        setOuterHtml(`#add-${id}`, '<p>Friend request sent</p>');
        setOuterHtml(`#accept-${id}`, '<p>Friend accepted</p>', true);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function removeFriend(id) {
  fetch(`api/del/${id}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data === null) {
        setOuterHtml(`#cancel-${id}`, '<p>Request cancelled</p>');
        setOuterHtml(`#del-${id}`, '<p>Friend removed</p>');
        setOuterHtml(`#decline-${id}`, '<p>Friend declined</p>', true);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function init() {
  loadContacts();
  loadRequests();
  loadKnown();
}

window.addEventListener('load', init);
