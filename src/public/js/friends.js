const filterElem = document.getElementById('filter');
const filterButtonElem = document.getElementById('filter-button');
const contactsContainer = document.querySelector('.people .all ul');
const requestsContainer = document.querySelector('.people .requests ul');

async function loadContacts(filter = null) {
  try {
    const data = await (await fetch('/api/contacts/all?filter=' + filter)).json();
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
  if (document.getElementById(`accept-${contact.id}`)) return;
  let type = 'Add friend';
  let suffix = '';
  if (!contact.username) {
    type = 'Join group';
    suffix = ' <span class="badge">group</span>';
  }
  contactsContainer.innerHTML += `<li id="add-${contact.id}"><div><img src="./imgs/default_pfp_low.png" alt="pfp" /><p>${
    contact.username || contact.title
  }${suffix}</p></div><button>${type}</button></li>`;
  document.querySelector(`#add-${contact.id} button`).addEventListener('click', () => {
    addFriend(contact.id);
  });
}

function appendRequest(contact, sent = false) {
  let right = sent
    ? `<button id="delete-${contact.id}")">Delete request</button>`
    : `<div><button href="#" id="decline-${contact.id}")">Decline</button> | <button href="#" id="accept-${contact.id}")">Accept</button></div>`;
  let suffix = '';
  requestsContainer.innerHTML += `<li id="request-${contact.id}"><div><img src="./imgs/default_pfp_low.png" alt="pfp" /><p>${contact.username}${suffix}</p></div>${right}</li>`;
  /*document.querySelector(`#add-${contact.id} a`).addEventListener('click', () => {
    addFriend(contact.id);
  });*/
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
      if (data == null) {
        document.querySelector(`#add-${id} a`).outerHTML = '<p>Friend request sent</p>';
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
