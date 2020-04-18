const HILLEL_URL = 'https://todo.hillel.it';

const loginForm = document.querySelector('.login-form');
const loginInput = document.querySelector('.login-form input');

const noteForm = document.querySelector('.note-form');
const noteInput = document.querySelector('.note-form input');
const noteList = document.querySelector('.note-list');
const newTaskSection = document.querySelector('.new-task-section');
const currentTaskSection = document.querySelector('.current-task-section');

const formatDate = date => moment(date).format('HH:mm:ss DD/MM/YYYY'); // eslint-disable-line

const loader = document.querySelector('.loader');

const state = {
    token: '',
    notes: []
};

//================= Rendering List =====================================
function renderTask(data) {

    noteList.innerHTML = '';

    data.forEach(note => {
        const taskItem = document.createElement('li');
        const dateField = document.createElement('div');
        const taskItemDate = document.createElement('span');
        const taskItemUpDate = document.createElement('span');
        const taskItemContent = document.createElement('span');
        const taskItemBtnComplete = document.createElement('button');
        const taskItemBtnRemove = document.createElement('button');
        const taskItemBtnEdit = document.createElement('button');

        dateField.classList.add('date-field');
        taskItemDate.classList.add('date');
        taskItemUpDate.classList.add('date');
        taskItemUpDate.classList.add('hide');
        taskItemBtnComplete.classList.add('complete');
        taskItemBtnRemove.classList.add('remove');
        taskItemBtnEdit.classList.add('edit');

        taskItemBtnComplete.innerText = 'Complete';
        taskItemBtnRemove.innerText = 'Remove';
        taskItemBtnEdit.innerText = 'Edit';
        taskItemContent.innerText = note.value;
        taskItemDate.innerText = `created at: ${formatDate(note.addedAt)}`;
        taskItemUpDate.innerText = `updated at: ${formatDate(note.updatedAt)}`;

        taskItem.append(taskItemContent);
        taskItem.append(taskItemBtnEdit);
        taskItem.append(taskItemBtnComplete);
        taskItem.append(taskItemBtnRemove);
        taskItem.prepend(dateField);
        dateField.append(taskItemDate);
        dateField.append(taskItemUpDate);

        taskItem.setAttribute('data-id', note._id);

        if(note.checked) {
            taskItemContent.classList.add('note-list__item--completed');
            taskItemBtnEdit.setAttribute('disabled','disabled');
        }

        if(note.updatedAt) {
            taskItemUpDate.classList.remove('hide');
        }

        noteList.append(taskItem);
    });
}

//=================== Authorization =============================
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    loader.classList.remove('hide');

    fetch(`${HILLEL_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({
            value: loginInput.value
        })
    }).then(response => response.json())
        .then(data => {
            state.token = `Bearer ${data.access_token}`;

            loginForm.classList.add('hide');
            newTaskSection.classList.remove('hide');
            currentTaskSection.classList.remove('hide');

            fetch(`${HILLEL_URL}/todo`, {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': state.token
                },
            }).then(response => response.json())
                .then(existingNotes => {
                    state.notes = existingNotes;
                    renderTask(state.notes);

                    loader.classList.add('hide');
                });
        });
});

//=============== Make new note =================================
noteForm.addEventListener('submit', e => {
    e.preventDefault();

    loader.classList.remove('hide');

    fetch(`${HILLEL_URL}/todo`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': state.token
        },
        body: JSON.stringify({
            value: noteInput.value,
            priority: 1
        })
    }).then(response => response.json())
        .then(note => {
            noteInput.value = '';
            state.notes.push(note);
            renderTask(state.notes);

            loader.classList.add('hide');
        });
});

let rememberCurrentNote;

//================== Actions with a note ===========================
noteList.addEventListener('click', e => {
    const element = e.target;
    const targetClassName = element.className;
    let currentId;
    let currentNote;
    const currentLi = element.closest('li');
    const editedInput = currentLi.querySelector('input');
    const dateField = currentLi.querySelector('.date-field');

    const editNoteInput = document.createElement('input');
    const taskItemBtnSave = document.createElement('button');
    const taskItemBtnCancel = document.createElement('button');

    switch(targetClassName) {
    case 'complete':
    case 'remove':
    case 'edit':
    case 'save':
    case 'cancel':
        currentId = currentLi.getAttribute('data-id');
        currentNote = state.notes.find(note => note._id === +currentId);
        break;
    }

    switch(targetClassName) {
    //================ COMPLETE button============================
    case 'complete':
        loader.classList.remove('hide');
        fetch((`${HILLEL_URL}/todo/${currentId}/toggle`), {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            },
        }).then(response => response.json())
            .then(() => {
                state.notes = state.notes.map(note => ({
                    ...note,
                    checked: note._id === +currentId ? !note.checked : note.checked
                }));
                renderTask(state.notes);
                loader.classList.add('hide');
            });
        break;

    //================ REMOVE button============================
    case 'remove':
        loader.classList.remove('hide');

        fetch((`${HILLEL_URL}/todo/${currentId}`), {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            },
        }).then(response => response.json())
            .then(() => {
                state.notes = state.notes.filter(note => note._id !== +currentId);
                renderTask(state.notes);

                loader.classList.add('hide');
            });
        break;

    //================ EDIT button============================
    case 'edit':
        rememberCurrentNote = currentLi.innerHTML;

        currentLi.innerHTML = '';

        currentLi.append(dateField);

        editNoteInput.setAttribute('placeholder', currentNote.value);
        currentLi.append(editNoteInput);

        taskItemBtnSave.classList.add('save');
        taskItemBtnSave.innerText = 'Save';
        currentLi.append(taskItemBtnSave);

        taskItemBtnCancel.classList.add('cancel');
        taskItemBtnCancel.innerText = 'Cancel';
        currentLi.append(taskItemBtnCancel);
        break;

    //================ SAVE button============================
    case 'save':
        loader.classList.remove('hide');

        editedInput.value ? currentNote.value = editedInput.value // eslint-disable-line
                : currentNote.value; // eslint-disable-line

        fetch(`${HILLEL_URL}/todo/${currentId}`, {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
                'Authorization': state.token
            },
            body: JSON.stringify({
                value: editedInput.value,
                priority: 1
            })
        }).then(response => response.json())
            .then((note) => {
                note.value = editedInput;
                renderTask(state.notes);

                loader.classList.add('hide');
            });
        break;

    //================ CANCEL button============================
    case 'cancel':
        currentLi.innerHTML = rememberCurrentNote;
        break;
    }
});
