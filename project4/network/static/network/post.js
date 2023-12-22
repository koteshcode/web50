document.addEventListener('DOMContentLoaded', function () {
    
    if (document.querySelector('#index-view')) {
        loadPosts();
    }
    else if (document.querySelector('#user-view')) {
        loadUserPosts();
    }
    if (document.querySelector('#following')) {
        document.querySelector('#following').addEventListener('click', () => following())
    }
})

async function editPost(event, id) {
    const post = await fetchPost(id);
    const button = event.target;
    // Check current target
    if (button.innerHTML !== 'Edit') {
        return console.error("Error: Bad button")
    } else if (button.parentElement.nextElementSibling.id !== 'post') {
        return console.error("Error: Wrong post")
    } else if (username !== button.parentElement.previousElementSibling.innerHTML) {
        return console.error('Error: Bad user')
    }
    // Check if on the page is save button
    if (document.querySelector('#edit-post')) { removeSaveButton() };
    // Prepare buttons and textarea
    const originalPost = button.parentElement.nextElementSibling;
    const saveButton = document.createElement('a');
    const editPost = document.createElement('textarea');
    editPost.className = 'form-control mb-2';
    editPost.innerHTML = originalPost.innerHTML;

    saveButton.innerHTML = 'Save';
    saveButton.href = 'javascript:void(0)';
    saveButton.id = 'edit-post';

    button.parentElement.parentNode.insertBefore(editPost, originalPost);
    button.parentElement.parentNode.insertBefore(saveButton, editPost);
    // Set focus to the end of textarea
    editPost.setSelectionRange(originalPost.innerHTML.length, originalPost.innerHTML.length);
    editPost.focus();
    // Remove event on edit post 
    originalPost.style.display = 'none';
    button.style.display = 'none';
    // Add event on save post
    saveButton.addEventListener('click', () => {
        // Check if post has been changed
        if  (originalPost.innerHTML !== editPost.value) {
            // Request to save post via PUT
            fetch(`like_post/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    type: 'Edit post',
                    post: editPost.value
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Succes') {
                    console.log('Succes');
                    originalPost.innerHTML = data.data.post;
                    removeSaveButton();
                } else {error = data.error}
            })
            .catch(error => console.log(error))
        } else {removeSaveButton()} // Remove save button
    })
}

function following() {
    
}

function loadPosts() {
    let postsView = document.querySelector('#posts-view');
    fetch('posts')
    .then(response => response.json())
    .then(posts => {
        const postElements = [];
        posts.forEach(post => {
            postElements.push(fillPost(post));
        })
        postElements.forEach(post => postsView.appendChild(post));
    })
    .catch(error => console.error(error));
}

function loadUserPosts() {
    let postsView = document.querySelector('#posts-view');
    const user_id = document.querySelector('#user-id');
    console.log(user_id)
    fetch(`posts_user/${user_id.value}`)
    .then(response => response.json())
    .then(posts => {
        const postElements = [];
        posts.forEach(post => {
            postElements.push(fillPost(post));
        })
        postElements.forEach(post => postsView.appendChild(post));
    })
    .catch(error => console.error(error));
}

async function likePost(event, id) {
    const post  = await fetchPost(id);
    // Prepare 
    const button = event.target;
    const counter = event.target.nextElementSibling;
    let liked = false;
    // If liked
    if (!post.user_liked.includes(username)) {
        event.target.className = 'bi bi-heart-fill' // Like
        liked = true;
    } else {
        event.target.className = 'bi bi-heart' // Unlike
    }
    // Send request for update likes
    fetch(`like_post/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            type: 'Modify like',
            liked: liked
        })
    })
    .then(response => response.json())
    .then(data => {counter.textContent = data.data.likes})
    .then(message => console.log(message))
    .catch(error => console.error(error));
}

function fillPost(post) {
    // Create post
    let p = createPostElement();
    // Add post data into post
    p.querySelector('#user').innerHTML = post.user;
    p.querySelector('#user').href = `/user/${post.user_id}`;
    p.querySelector('#post').innerHTML = post.post;
    p.querySelector('#timestamp').innerHTML = post.timestamp;
    p.querySelector('#likes-count').innerHTML = post.likes;

    const likesButton = p.querySelector('#likes-button');
    // Check if user is liked current post and render filled heart
    if (post.user_liked.includes(username) && username !== '') {
        likesButton.className = 'bi bi-heart-fill';
    } else {
        likesButton.className = 'bi bi-heart';
    }
    // Add edit button for post if user is author
    if (username === post.user) {
        const edit = document.createElement('a');
        const div = document.createElement('div');
        div.className = 'my-2';
        edit.innerHTML = 'Edit';
        edit.className = 'mb-2';
        edit.href = 'javascript:void(0)';
        div.append(edit)
        p.insertBefore(div, p.querySelector('#post'));

        // Define function to handle edit events
        edit.addEventListener('click', (event) => editPost(event, post.id));
    }
    // Add click listener on like button
    if (username !== '') {
        likesButton.addEventListener('click', (event) => likePost(event, post.id));
    }
    
    return p;
}

function createPostElement() {
    // Prepare elements
    const post = document.createElement('div'); // entire post
    const user = document.createElement('a'); // user name
    const body = document.createElement('p'); // post body
    const likes = document.createElement('div'); // likes column
    const likesCount = document.createElement('span'); // likes
    const likesButton = document.createElement('i');
    const timestamp = document.createElement('div'); // timestamp
    const footer = document.createElement('div'); // create footer for post
    const separator = document.createElement('hr');

    // Configure elements
    user.id = 'user';
    body.id = 'post';
    likesCount.id = 'likes-count';
    likesButton.id = 'likes-button';
    
    user.className = 'text-decoration-none text-body fs-6 fw-semibold';
    footer.className = 'row';
    likes.className = 'col-3';
    likesCount.className = 'fs-5 mx-2'
    timestamp.className = 'col-6';
    timestamp.innerHTML = '<span class="text-muted" id="timestamp"></span>';

    // Append elements
    likes.appendChild(likesButton);
    likes.appendChild(likesCount);
    footer.append(likes);
    footer.append(timestamp);
    post.append(user);
    post.append(body);
    post.append(footer);
    post.append(separator)
    
    return post;
}

function removeSaveButton() {
    const old = document.querySelector('#edit-post');
    old.previousElementSibling.firstElementChild.style.display = 'inline';
    old.nextElementSibling.remove();
    old.parentElement.querySelector('#post').style.display = 'block';
    old.remove();
}

async function fetchPost(id) {
    try {
      const response = await fetch(`like_post/${id}`);
      const data = await response.json();
      const post = await data.data;
      const message = await data.message;
      return post; // The fetched data
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
}