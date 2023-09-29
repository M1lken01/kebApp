const imageInput = document.getElementById('pfp');
const imagePreview = document.getElementsByClassName('edit-pfp')[0];

imageInput.addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = '';
  }
});

function init() {
  fetch('/api/shortuser')
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (!data) return;
      document.getElementById('username').innerHTML += data.username;
      document.getElementById('userId').ariaValueMax += data.id;
      if (data.picture == true) imagePreview.src = `./imgs/user/${data.id}.png`;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

window.addEventListener('load', init);
