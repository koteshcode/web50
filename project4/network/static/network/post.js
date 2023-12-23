document.addEventListener('DOMContentLoaded', function () {
    
    if (document.querySelector('#index-view')) {
        loadPosts(1);
    }
    else if (document.querySelector('#user-view')) {
        loadUserPosts();
    }
    if (document.querySelector('#following-view')) {
        following()
    }
})

async function editPost(event, id) {
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
    let postsView = document.querySelector('#posts-view');
    fetch('following_posts')
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

function loadPosts(pageNumber) {
    let postsView = document.querySelector('#posts-view');
    postsView.innerHTML = '';
    const url = `/posts/?page=${pageNumber}`;
    fetch(url)
    .then(response => response.json())
    .then(data => {
        const postElements = [];
        const pagesCount = data.meta.pagescount;
        data.data.forEach(post => {
            postElements.push(fillPost(post));
        })
        postElements.forEach(post => postsView.appendChild(post));
        fillPaginator(pagesCount, pageNumber);
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

function fillPaginator(count, number) {
    const old = number;
    const paginator = document.querySelector('#paginator');
    const prev = document.querySelector('#page-prev');
    const next = document.querySelector('#page-next');
    if (paginator.querySelectorAll('.number')) {
        // Clear all pages inside paginator
        paginator.querySelectorAll('.number').forEach(item => item.remove())
    }
    // Add pages paginations for pages count
    for (let i = 0; i < count; i++) {
        let page = composePaginatorElement();
        page.firstElementChild.innerHTML = i + 1;
        page.id = `page-${i + 1}`;
        paginator.insertBefore(page, next);
    }
    // Set active page 
    paginator.querySelector(`#page-${number}`).className = 'page-item number active';
    // Disable next or prev switcher for first or last pages
    if (number === 1) {prev.className = 'page-item disabled'}
    else if (number === count) (next.className = 'page-item disabled');

    function handlePageClick(event) {
        // Check if user clicked on pagintator pages
        if (event.target.classList.contains('page-link')) {
            if (event.target.classList.contains('disabled')) {return false};
        
            // If user click on next button
            if (event.target.classList.contains('next')) {
                number++;
                // Change state of page switchers
                if (event.target.parentElement.parentElement.querySelector('#page-prev').className === 'page-item disabled') {
                    prev.className = 'page-item';
                }
                if (number === count) {
                    next.className = 'page-item disabled';
                }
            }
            // If user click on previous button
            else if (event.target.classList.contains('prev')) {
                // Set page number -1
                number--;
                // Change state of page selectors
                if (event.target.parentElement.parentElement.querySelector('#page-next').className === 'page-item disabled') {
                    next.className = 'page-item';
                }
                if (number === 1) {
                    prev.className = 'page-item disabled';
                }
            } else {
                // Set page number to target
                number = parseInt(event.target.innerHTML);
                // Update status for switchers
                if (number === 1) {prev.className = 'page-itam disabled'}
                else { prev.className = 'page-item'};
                if (number === count) {next.className = 'page-itam disabled'}
                else { next.className = 'page-item'};
            }
            // Disable current active page selector
            paginator.querySelector('.active').className = 'page-item number';
            // Set active page for selected page
            paginator.querySelector(`#page-${number}`).className = 'page-item number active';
            // Fetch new page if selected page is not current 
            if (old !== number ) { loadPosts(number); }
            paginator.removeEventListener('click', handlePageClick);
        }
    }
    // Add event listener 
    paginator.addEventListener('click', handlePageClick);
}

function fillPost(post) {
    // Create post
    let p = composePostElement();
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

function composePaginatorElement() {
    const item = document.createElement('li');
    const link = document.createElement('a');
    item.className = 'page-item number';
    link.className = 'page-link';
    link.href='#';
    item.append(link);
    return item;
}

function composePostElement() {
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