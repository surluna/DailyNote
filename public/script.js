//default local date
function defaultLocalDate() {
  const today = new Date();
  const localDate = today.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  document.getElementById("fdate").value = localDate;
}

document.addEventListener('DOMContentLoaded', (event) => {
  defaultLocalDate();
  setMidnightTimer();
});
//re-execute defaultLocalDate() at 12am
function setMidnightTimer() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const msToMidnight = tomorrow - now;

  setTimeout(() => {
    defaultLocalDate();
    setMidnightTimer();
  }, msToMidnight);
}

//update word count
function updateInputCount() {
  let inputText = document.getElementById("fnote")
  let wordCount = document.getElementById("wordCount")
  let currentLength = inputText.value.length;
  wordCount.textContent = currentLength + "/400"
}
//vaildate form
async function validateForm() {
  let content = document.getElementById("fnote").value.trim();
  let date = document.getElementById("fdate").value;

  if (!content) {
    alert("Content cannot be empty.");
    return false;
  }

  try {
    const response = await fetch(`/notes/check-date/${date}`, {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.exists) {
      alert("A note for this date already exists. Please edit the existing note.");
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    alert("Failed to validate date.");
    return false;
  }
}


//clean button
function cleanInputContent() {
  document.getElementById("fnote").value = "";
  wordCount.textContent = "0/400"
}

// Delete function with DOM manipulation
const deleteButtons = document.querySelectorAll('a.delete');
deleteButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this note?')) return
    const endpoint = `/notes/${button.dataset.doc}`;
    fetch(endpoint, {
      method: 'DELETE',
    }).then(response => response.json())
      .then(data => {
        const noteElement = document.querySelector(`#note-${button.dataset.doc}`)
        if (noteElement) noteElement.remove();
      }).catch(err => {
        console.error(err)
        alert('Error deleting note')
      });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  bindEditButtons();
  bindSaveButtons();
  bindCancelButtons();
  document.querySelectorAll('.delete').forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.querySelector('img').src = 'img/dustbinHover.png';
    });

    button.addEventListener('mouseleave', function () {
      this.querySelector('img').src = 'img/defaultDustbin.png';
    });

    button.addEventListener('click', function () {
      this.querySelector('img').src = 'img/dustbinHover.png';
    });
  });
  document.querySelectorAll('.edit').forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.querySelector('img').src = 'img/editHover.png';
    });

    button.addEventListener('mouseleave', function () {
      this.querySelector('img').src = 'img/defaultEdit.png';
    });

    button.addEventListener('click', function () {
      this.querySelector('img').src = 'img/editHover.png';
    });
  });

});
document.querySelectorAll('.editForm').forEach(form => {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const noteId = this.dataset.doc;
    const content = this.querySelector('textarea[name="content"]').value.trim();
    const date = this.querySelector('input[type="date"]').value;

    // 检查内容是否为空
    if (!content) {
      alert('Content cannot be empty.');
      return;
    }

    // 检查日期是否重复（假设您有一个路由来检查日期）
    const dateCheckResponse = await fetch(`/notes/check-date/${date}/${noteId}`);
    const dateCheckResult = await dateCheckResponse.json();
    if (dateCheckResult.exists) {
      alert('A note for this date already exists. Please choose a different date.');
      return;
    }

    // 如果验证通过，则执行更新操作
    const updateResponse = await fetch(`/notes/update/${noteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, date }),
    });
    const updateResult = await updateResponse.json();
    if (updateResult.success) {
      window.location.reload();
    } else {
      alert('Error updating note');
    }
  });
});

function bindEditButtons() {
  document.querySelectorAll('.edit').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const noteId = this.getAttribute('data-doc');
      toggleFormAndActions(noteId, true);
    });
  });
}

function bindSaveButtons() {
  document.querySelectorAll('.save').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const noteId = this.getAttribute('data-doc');
      const form = document.querySelector(`form[data-doc='${noteId}']`);
      const content = form.querySelector('textarea[name="content"]').value;
      const editDate = document.getElementById(`editDate-${noteId}`).value;
      fetch(`/notes/update/${noteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content, date: editDate }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            window.location.reload();
          } else {
            alert('Error updating note');
          }
        })
        .catch(error => console.error('Error:', error));
    });
  });
}

function bindCancelButtons() {
  document.querySelectorAll('.cancel').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const noteId = this.getAttribute('data-doc');
      toggleFormAndActions(noteId, false);
    });
  });
}

function toggleFormAndActions(noteId, isEditing) {
  const form = document.querySelector(`form[data-doc='${noteId}']`);
  const editAndDelete = document.querySelectorAll(`.noteActions .edit[data-doc='${noteId}'], .noteActions .delete[data-doc='${noteId}']`);
  const saveAndCancel = document.querySelectorAll(`.noteActions .save[data-doc='${noteId}'], .noteActions .cancel[data-doc='${noteId}']`);
  const editDateField = document.getElementById(`editDate-${noteId}`);
  const displayDateDiv = document.getElementById(`displayDate-${noteId}`);
  if (isEditing) {
    editDateField.style.display = 'block';
    displayDateDiv.style.display = 'none';
    form.style.display = 'block';
    editAndDelete.forEach(action => action.style.display = 'none');
    saveAndCancel.forEach(action => action.style.display = 'inline-block');
  } else {
    editDateField.style.display = 'none';
    displayDateDiv.style.display = 'block';
    form.style.display = 'none';
    editAndDelete.forEach(action => action.style.display = 'inline-block');
    saveAndCancel.forEach(action => action.style.display = 'none');
  }
}
