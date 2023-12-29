# GO_Learn

## Distinctiveness and Complexity

**GO_Learn** is a web app that helps users learn irregular verbs in a fun and interactive way. It is distinct from other similar apps because it offers three different learning modes: *regular*, *explore*, and *repeat*.

Each mode has a different algorithm to select the verbs from the database and test the user’s knowledge. The app also tracks the user’s score and progress and stores them in the database. The app is mobile-responsive and can adapt to different screen sizes.

The project is built with **Python**, **Django**, **JavaScript**, and **SQLite**. The app uses **Bootstrap** for the front-end design. The back-end logic is handled by the following files:

- **views.py**: This file contains the Django routes for index, register, login, and *update_verbs*. The 
    - *update_verbs* route returns a JSON object with the verbs based on the selected learning mode.
- **models.py**: This file contains the Django models for User, Verbs, and VerbScore. 
    - *User* model stores the user’s information. 
    - *Verbs* model stores the verb’s id and three forms.
    - *VerbScore* model stores the verb’s id, user’s id, repeat counter, and score for verb.

## How the app works

The app uses JavaScript to create dynamic quizzes for the user. The main function is **chooseQuiz**, which runs on each page load. It fetches 10 verbs from the database using the *update_verbs* route and the selected learning mode. Then, it randomly selects one of two quiz types: *wordQuiz* or *letterQuiz*. It goes through each verb and waits for the user to answer with async/await.

- **wordQuiz**, the app randomly picks one of the three forms of the irregular verb and hides it with an input field. The user has to guess the missing form.

-**letterQuiz**, the app randomly picks one of the three forms of the verb and hides some of the letters with input fields. The user has to fill in the blanks with the correct letters.

After the user answers, the app calls an async function: -**getAnswer**, which waits for the user input using a promise and then compares it with the correct answer. Depending on the user's answer, the app sends a PUT request to the *update_verbs* route and the server updates the score and the repeat count for that verb and user.
Afterthat app moves on to the next verb until all 10 verbs are done.
