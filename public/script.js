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
  wordCount.textContent = currentLength + "/371"
}
//vaildate form
function validateForm() {
  let x = document.getElementById("fnote").value.trim()
  if (x == null || x == "") {
    alert("Content cannot be empty.")
    return false
  }
}
//clean button
function cleanInputContent() {
  document.getElementById("fnote").value = "";
  wordCount.textContent = "0/371"
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
  bindSaveButtons();  // 确保这里是调用 bindSaveButtons
  bindCancelButtons();  // 和 bindCancelButtons
});

function bindEditButtons() {
  document.querySelectorAll('.edit').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const noteId = this.getAttribute('data-doc');
      toggleFormAndActions(noteId, true); // 显示编辑表单和保存、取消按钮
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

      fetch(`/notes/update/${noteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content }),
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
      toggleFormAndActions(noteId, false); // 隐藏编辑表单，显示编辑和删除按钮
    });
  });
}

function toggleFormAndActions(noteId, isEditing) {
  const form = document.querySelector(`form[data-doc='${noteId}']`);
  const editAndDelete = document.querySelectorAll(`.noteActions .edit[data-doc='${noteId}'], .noteActions .delete[data-doc='${noteId}']`);
  const saveAndCancel = document.querySelectorAll(`.noteActions .save[data-doc='${noteId}'], .noteActions .cancel[data-doc='${noteId}']`);

  if (isEditing) {
    form.style.display = 'block';
    editAndDelete.forEach(action => action.style.display = 'none');
    saveAndCancel.forEach(action => action.style.display = 'inline-block');
  } else {
    form.style.display = 'none';
    editAndDelete.forEach(action => action.style.display = 'inline-block');
    saveAndCancel.forEach(action => action.style.display = 'none');
  }
}
