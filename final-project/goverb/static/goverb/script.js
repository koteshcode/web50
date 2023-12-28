document.addEventListener("DOMContentLoaded", function() {
    // Run function for listen if user get right answer
    if (document.getElementById('verbs')) {
        chooseQuiz();
    } else {
        console.log('Element with ID does not exist');
    }
    
    
})

function addHint(q) {
    const quiz = document.getElementById('quiz');
    const link = document.createElement('a');
    link.innerHTML = 'Get hint';
    link.className = 'text-center my-3';
    link.href = 'javascript:void[0]';
    link.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'col-3 border text-center text-success-emphasis fs-4 border-success border-1 rounded-3';
        div.innerHTML = q;
        if (quiz.childElementCount < 5) {quiz.appendChild(div);}
        

    })
    quiz.appendChild(link)
}

async function getAnswer(q) {

    const quiz = document.getElementById('quiz');
    const input = document.getElementById('user-answer');
    const answer = {
        'answer': false,
        'hint': 0,
        'tries': 0
    }
    return new Promise((resolve) => {
        if (quiz.parentElement.id === 'word-view') {
            console.log('word view');
            let tries = 0;
            
            input.addEventListener('keydown', handleKeyPress);
            
            function handleInput(event) {
    
            }
    
            function handleKeyPress(event) {
                if ( event.key === 'Enter') {
                    tries++;
                    if (event.target.value  === q ) {
                        console.log('true')
                        event.target.className = 'form-control is-valid';
                        quiz.parentElement.innerHTML = '';
                        // Update data verb to server
                        // Resolve answer
                        answer.answer = true;
                        answer.tries = tries;
                        resolve(answer);
                    }
                    if (tries !== 0 && quiz.childElementCount < 4) { addHint(q) }
                    if (tries > 3) {
                        quiz.parentElement.innerHTML = '';
                        // Update data verb to server 
                        // Resolve answer
                        answer.tries = tries;
                        resolve(answer);
                    }
                    // Set border to invalid
                    event.target.className = 'form-control is-invalid';
                    event.target.value = '';
                }
            }
        } else if (quiz.parentElement.id === 'letter-view') {
            console.log('letter check');
            let tries = 0;
            const inputFields = document.querySelectorAll('.dot-input');

            // Add an event listener to each input field
            inputFields.forEach((inputField) => {
                inputField.addEventListener('keydown', handleInput);
                inputField.addEventListener('keydown', handleKeyInput);
            });

            // Add an event listener for the input event
            function handleKeyInput(event) {
                // Keep only the last character entered
                event.target.value = event.target.value.slice(-1);
            };

            function handleInput(event) {
                if (event.key === 'Enter') {
                    // Create array for quiz word
                    const lettersArray = q.split('');
                    tries++
                    // Add hint if first time was not succefull guess
                    if (tries !== 0 && quiz.childElementCount < 4) { addHint(q) };
                    // Resolve after first 3 tries
                    if (tries > 3) {
                        console.log('miss');
                        quiz.parentElement.innerHTML = '';
                        // Update data verb to server 
                        // Resolve answer
                        answer.tries = tries;
                        resolve(answer);
                    }
                    // Iterate for each inpured 
                    inputFields.forEach(input => {
                        // Break if input doesnt match
                        if (input.value !== lettersArray[input.id]) {
                            inputFields.forEach(e => e.className = 'wrong')
                            return false;
                        } else {
                            quiz.parentElement.innerHTML = '';
                            answer.tries = tries;
                            answer.answer = true;
                            resolve(answer);
                        }
                    })
                }
            }

        } else if (quiz.parentElement.id === 'order-view') {
            console.log('order view');
        }
     
    });
}

async function chooseQuiz() {
    let user = false;
    const csrf = getCookie('csrftoken');
    const url = window.location.href.split('/');
    const route = url[3];

    // Change  heading
    document.getElementById('verbs').innerHTML = route.charAt(0).toUpperCase() + route.slice(1);
    if (document.querySelector('#current-user')) {
        user = true;
    }
    // Fetch verbs from server
    while (true) {
        const update = await fetch('update', {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf, // Include the CSRF token
                'Upd-Type': route
            }
        });
        const response = await update.json();
        let verbs = await response.data;
        
        // For verbs choose one of 3 quizes
        for (let i = 0; i < verbs.length; i++) {
            let num = Math.floor(Math.random() * 2);
            //let num = 0;
            if (num === 0) { 
                // Run word quiz for selected verb
                const q = await wordQuiz(i, verbs); 
                const answer = await getAnswer(q);
                // Update verbs data
                updateVerb(verbs[i], answer);
                console.log(answer)
            } 
            else if (num === 1) {
                // Run letters quiz for selected verb
                const q = await letterQuiz(i, verbs);
                const answer = await getAnswer(q);
                // Update verbs data
                updateVerb(verbs[i], answer);
            }
            // One more quiz where user should rearrenge in right order all forms
            //else if ( num === 2) { q = await orderQuiz(i); }
        }
    }
}

function composeQuiz(num) {

}

function hideLetter(word, count) {
    // Return span element with hided letters
    // of word and count letters hide
    const arr = new Array();
    const length = word.length;
    // Create random arr for pick random letter
    while (arr.length < count) {
        // Generate a random number 
        let num = Math.floor(Math.random() * length);
        // Check if the number is already in the array
        if (arr.indexOf(num) === -1) {
        arr.push(num);
        }
    }
    // Split word into array
    const wordarray = word.split('');
    const span = document.createElement('span');
    // For each random place replace letter to input
    arr.forEach(place => {
        const input = document.createElement('input');
        input.className = 'dot-input mx-1';
        input.max = 1;
        input.id = place;
        wordarray.splice(place, 1, input);
    });
    // Compose back all word with input element
    wordarray.forEach((element) => {
        if (element instanceof HTMLInputElement) {
            span.appendChild(element);
        } else {
            span.appendChild(document.createTextNode(element));
        }});
    span.className = 'fs-4';
    span.id = 'user-answer';
    return span;
}

function letterQuiz(i, verbs) {
    console.log('letters quiz');
    // Pick i verb from array 
    const verb = verbs[i];
    // Pick random word from verbs
    const q = Math.floor(Math.random() * 3);
    let question = verb[q];
    let input;
    const length = question.length;
    const view = document.getElementById('letter-view');
    const quiz = document.createElement('div');
    console.log(length);
    // Check length and replace word letters
    if (length < 3) {
        input = hideLetter(question, 1)
    } else if (length >= 3 && length <= 6) {
        input = hideLetter(question, 2);
    } else if (length > 6 && length < 10) {
        input = hideLetter(question, 3);
    } else {
        input = hideLetter(question, 4);
    }
    // Crate table with verbs
    for (let j = 0; j < verb.length; j++) {
        const col = document.createElement('div');
        col.className = 'col-md-3 col-sm-6  border text-center border-1 rounded-3';
        if (j === q) {col.id = 'input';}
        else {col.innerHTML = `<span class="fs-4">${verb[j]}</span>`;}
        
        quiz.appendChild(col); 
    }
    view.appendChild(quiz);
    document.querySelector('#input').appendChild(input);
    quiz.className = 'row justify-content-center align-items-center';
    quiz.id = 'quiz';
    return question;
}

function orderQuiz(i) {
    console.log('order quiz');
    return true;
}

function wordQuiz (i, verbs) {
    console.log('words quiz');
    const verb = verbs[i];
    const q = Math.floor(Math.random() * 3);
    const view = document.getElementById('word-view');
    const question = verb[q];
    const quiz = document.createElement('div');

    for (let j = 0; j < 3; j++) {
        if (j === q ) {
            const input = document.createElement('input');
            const div = document.createElement('div');
            div.className = 'col-md-3 col-sm-6 ';
            input.className = 'form-control';
            input.id = 'user-answer';
            div.appendChild(input)
            quiz.appendChild(div);
        } else {
            const col = document.createElement('div');
            col.className = 'col-md-3 col-sm-6 border text-center border-1 rounded-3';
            col.innerHTML = `<span class="fs-4">${verb[j]}</span>`;
            quiz.appendChild(col);
        }
    }
    quiz.className = 'row justify-content-center align-items-center';
    quiz.id = 'quiz';
    console.log(`qestion ${question}`);
    view.append(quiz);
    return question;
}

async function updateVerb(verb, answer) {
    const response = await fetch('update', {
        method: "PUT",
        body: JSON.stringify({
            verb: verb,
            answer: answer
        })
    })
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null; // Cookie not found
}