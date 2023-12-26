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
        data.then(data => {
            if ( isFollow === true ) { 
                butFollow.innerHTML = 'Unfollow';
                document.querySelector('#following').innerHTML = 'Following: ' + (data.followers + 1);
            } else if ( isFollow === false) {
                butFollow.innerHTML = 'Follow';
                document.querySelector('#following').innerHTML = 'Following: ' + (data.followers - 1);
            }
            isFollow = false;
        });
        data.then(data => console.log(data.message))
    } catch (error) {console.error('Error fecthing data',error)}
}
