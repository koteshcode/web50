document.addEventListener('DOMContentLoaded', function () {
    loadPosts();
})

function loadPosts() {
    let postsView = document.querySelector('#posts-view');
    console.log('hi')
    fetch('posts')
    .then(response => response.json())
    .then(posts => {
        const postElements = [];
        posts.forEach(post => {
            postElements.push(composePost(post))
        })
        postElements.forEach(post => postsView.appendChild(post))
    })
    .catch(error => console.error(error))

}

function composePost(post) {
    let p = createPostElement();
    p.querySelector('#user').innerHTML = post.user;
    p.querySelector('#post').innerHTML = post.post;
    p.querySelector('#timestamp').innerHTML = post.timestamp;
    p.querySelector('#likes-count').innerHTML = post.likes;
    // Check if user is liked current post and render filled heart
    if (post.user_liked.includes(username)) {
        console.log('User liked')
        p.querySelector('#likes-button').className = 'bi bi-heart-fill';
    } else {
        p.querySelector('#likes-button').className = 'bi bi-heart';
    }
    // Add edit button for user post
    if (username === post.user) {
        console.log('Author')
        const edit = document.createElement('a');
        edit.innerHTML = 'Edit';
        edit.href = '#';
        p.insertBefore(edit, p.querySelector('#post'));
    }

    p.querySelector('#likes-button').addEventListener('click', function () {
        let liked = false;
        if (!post.user_liked.includes(username)) {
            console.log('Like')
            liked = true;
        } else (console.log('Unlike'))
        // Send request for like or unlike to server
        fetch(`like_post/${post.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                liked: liked
            })
        })
        .then(response => response.json())
        .then(message => console.log(message))
        .catch(error => console.error(error))
    })
    return p
}

function createPostElement() {
    // Prepare elements
    const post = document.createElement('div'); // entire post
    const user = document.createElement('h5'); // user name
    const body = document.createElement('p'); // post body
    const likes = document.createElement('div'); // likes column
    const likesCount = document.createElement('span'); // likes
    const likesButton = document.createElement('i');
    const timestamp = document.createElement('div'); // timestamp
    const footer = document.createElement('div'); // create footer for post
    const separator = document.createElement('hr')

    // Configure elements
    user.id = 'user';
    body.id = 'post';
    likesCount.id = 'likes-count';
    likesButton.id = 'likes-button';

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