const filterElem = document.getElementById('filter');
const filterButtonElem = document.getElementById('filter-button');
const contactsContainer = document.querySelector('.people .all ul');
const requestsContainer = document.querySelector('.people .requests ul');
const knownContainer = document.querySelector('.people .known ul');

async function loadContacts(filter = null) {
  try {
    const data = await (await fetch(`/api/contacts/new?filter=${filter}`)).json();
    if (!data || data.length === 0) return;
    contactsContainer.innerHTML = '';
    data.forEach((contact) => {
      appendContact(contact);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

async function loadRequests(filter = null) {
  try {
    const data = await (await fetch(`/api/contacts/requests?filter=${filter}`)).json();
    if (!data || data.length === 0) return;
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

async function loadKnown(filter = null) {
  try {
    const data = await (await fetch(`/api/contacts/?filter=${filter}`)).json();
    if (!data || data.length === 0) return;
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
  const suffix = createBadgeHtml(contact);
  let endpoint = 'add';
  if (!contact.username) {
    type = 'group';
    typeText = 'Join group';
    endpoint = 'join';
  }
  const profilePic = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  contactsContainer.innerHTML += `<li><div><img src=".${profilePic}" alt="pfp" /><p>${
    contact.username || contact.title
  }${suffix}</p></div><button id="${endpoint}-${contact.id}">${typeText}</button></li>`;
  if (contact.username) {
    addClickListener(`#${endpoint}-${contact.id}`, async () => {
      await addFriend(contact.id);
    });
  } else if (contact.title) {
    addClickListener(`#${endpoint}-${contact.id}`, async () => {
      await joinGroup(contact.id);
    });
  }
}

function appendRequest(contact, sent = false) {
  const right = sent
    ? `<button id="cancel-${contact.id}">Cancel request</button>`
    : `<div><button id="decline-${contact.id}">Decline</button> | <button id="accept-${contact.id}">Accept</button></div>`;
  const suffix = createBadgeHtml(contact);
  const type = !contact.username ? 'group' : 'user';
  const profilePic = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  requestsContainer.innerHTML += `<li id="request-${contact.id}"><div><img src="${profilePic}" alt="pfp" /><p>${contact.username}${suffix}</p></div>${right}</li>`;
  addClickListener(`#decline-${contact.id}`, async () => {
    await removeFriend(contact.id);
  });
  addClickListener(`#cancel-${contact.id}`, async () => {
    await removeFriend(contact.id);
  });
  addClickListener(`#accept-${contact.id}`, async () => {
    await addFriend(contact.id);
  });
}

function appendKnown(contact) {
  let type = 'user';
  let typeText = 'Remove friend';
  const suffix = createBadgeHtml(contact);
  let endpoint = 'del';
  if (!contact.username) {
    type = 'group';
    typeText = 'Leave group';
    endpoint = 'leave';
  }
  const profilePic = './imgs/' + (contact.picture ? `${type}/${contact.id}.png` : 'default_pfp_low.png');
  knownContainer.innerHTML += `<li><div><img src="${profilePic}" alt="pfp" /><p>${
    contact.username || contact.title
  }${suffix}</p></div><button id="${endpoint}-${contact.id}">${typeText}</button></li>`;
  if (contact.username) {
    addClickListener(`#${endpoint}-${contact.id}`, async () => {
      await removeFriend(contact.id);
    });
  } else if (contact.title) {
    addClickListener(`#${endpoint}-${contact.id}`, async () => {
      await leaveGroup(contact.id);
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
    if (element) element.outerHTML = sanitizeHtml(html);
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

async function addFriend(id) {
  try {
    const response = await fetch(`api/add/${id}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (response === null || response.status === 200) {
      setOuterHtml(`#add-${id}`, '<p>Friend request sent</p>');
      setOuterHtml(`#accept-${id}`, '<p>Friend accepted</p>', true);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function removeFriend(id) {
  try {
    const response = await fetch(`api/del/${id}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (response === null || response.status === 200) {
      setOuterHtml(`#cancel-${id}`, '<p>Request cancelled</p>');
      setOuterHtml(`#del-${id}`, '<p>Friend removed</p>');
      setOuterHtml(`#decline-${id}`, '<p>Friend declined</p>', true);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function joinGroup(id) {
  try {
    const response = await fetch(`api/join/${id}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (response === null || response.status === 200) {
      setOuterHtml(`#join-${id}`, '<p>Joined the group</p>');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function leaveGroup(id) {
  const response = await fetch(`api/leave/${id}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  console.log(response);
  if (response === null || response.status === 200) {
    setOuterHtml(`#leave-${id}`, '<p>Left the group</p>');
  }
}

function init() {
  loadContacts();
  loadRequests();
  loadKnown();
}

window.addEventListener('load', init);
