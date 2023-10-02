const pfpInput = document.getElementById('pfp');
const pfpPreview = document.getElementsByClassName('edit-pfp')[0];

pfpInput.addEventListener('change', function () {
  const img = this.files[0];
  if (img) {
    const reader = new FileReader();
    reader.onload = function (e) {
      pfpPreview.src = e.target.result;
    };
    reader.readAsDataURL(img);
  } else {
    pfpPreview.src = '';
  }
});

function init() {
  fetch('/api/shortuser')
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (!data) return;
      document.getElementById('username').innerHTML = data.username;
      document.getElementById('userId').value = data.id;
      if (data.picture === 1) pfpPreview.src = `./imgs/user/${data.id}.png`;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

window.addEventListener('load', init);
