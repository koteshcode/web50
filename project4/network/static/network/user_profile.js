document.addEventListener('DOMContentLoaded', function () {
    const butFollow = document.querySelector('#follow-user');
    try{ butFollow.addEventListener('click', () => followUser(butFollow)); }
    catch(error){ error.message }
    
})

async function followUser(butFollow) {
    const followingUser = document.querySelector('#user-id')
    let isFollow = false;
    if (butFollow.innerHTML === 'Follow') { isFollow = true };
    console.log(isFollow);
    try {
        const response = await fetch(`${followingUser.value}`, {
            method: 'PUT',
            body: JSON.stringify({
                follow: isFollow,
            })
        });
        const data = response.json();
        data.then(message => console.log(message));
        data.then(followers => console.log(followers));

    } catch (error) {console.error('Error fecthing data',error)}
    // Change follower counter
    if (isFollow) { document.querySelector('#following').innerHTML = ""}
    else {}

    butFollow.innerHTML = 'Unfollow';
    isFollow = false;
    
}
