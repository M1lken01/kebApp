const filterElem = document.getElementById('filter');
const filterButtonElem = document.getElementById('filter-button');
const contactsContainer = document.querySelector('.people .all ul');
const requestsContainer = document.querySelector('.people .requests ul');

async function loadContacts(filter = null) {
  try {
    const data = await (await fetch('/api/contacts/new?filter=' + filter)).json();
    console.log(data);
    if (!data) return;
    if (data.length === 0) return;
    data.forEach((element) => {
      appendContact(element);
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
    data.forEach((element) => {
      if (element.requestStatus === 'requestReceived' && element.id === element.user_id_1) appendRequest(element);
      if (element.requestStatus === 'requestSent' && element.id === element.user_id_2) appendRequest(element, true);
      console.log(element);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

function appendContact(contact) {
  if ((document.getElementById(`accept-${contact.id}`) || document.getElementById(`delete-${contact.id}`)) && contact.username) return;
  let type = 'Add friend';
  let suffix = '';
  let endpoint = 'add';
  if (!contact.username) {
    type = 'Join group';
    suffix = ' <span class="badge">group</span>';
    endpoint = 'join';
  }
  contactsContainer.innerHTML += `<li><div><img src="./imgs/default_pfp_low.png" alt="pfp" /><p>${
    contact.username || contact.title
  }${suffix}</p></div><button id="${endpoint}-${contact.id}">${type}</button></li>`;
  if (contact.username) {
    addClickListener(`#${endpoint}-${contact.id}`, () => {
      addFriend(contact.id);
    });
  }
}

function appendRequest(contact, sent = false) {
  let right = sent
    ? `<button id="delete-${contact.id}">Delete request</button>`
    : `<div><button id="decline-${contact.id}">Decline</button> | <button id="accept-${contact.id}">Accept</button></div>`;
  let suffix = '';
  requestsContainer.innerHTML += `<li id="request-${contact.id}"><div><img src="./imgs/default_pfp_low.png" alt="pfp" /><p>${contact.username}${suffix}</p></div>${right}</li>`;
  addClickListener(`#decline-${contact.id}`, () => {
    removeFriend(contact.id);
  });
  addClickListener(`#delete-${contact.id}`, () => {
    removeFriend(contact.id);
  });
  addClickListener(`#accept-${contact.id}`, () => {
    addFriend(contact.id);
  });
}

function addClickListener(selector, eventHandler, delayMs = 100) {
  setTimeout(() => {
    const element = document.querySelector(selector);
    if (element) element.addEventListener('click', eventHandler);
  }, delayMs);
}

function setOuterHtml(selector, html) {
  const element = document.querySelector(selector);
  if (element) element.outerHTML = html;
}

filterElem.addEventListener('keydown', function (event) {
  if (event.key.toLowerCase() === 'Enter'.toLowerCase()) filter();
});

filterButtonElem.addEventListener('click', filter);

function filter() {
  contactsContainer.innerHTML = '';
  console.log(filterElem.value);
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
        setOuterHtml(`#accept-${id}`, '<p>Friend accepted</p>');
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
        setOuterHtml(`#delete-${id}`, '<p>Friend removed</p>');
        setOuterHtml(`#decline-${id}`, '<p>Friend declined</p>');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function init() {
  loadContacts();
  loadRequests();
}

window.addEventListener('load', init);
