document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#submit-mail').addEventListener('click', event => submit_mail(event));
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  console.log("Compose mail")
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  console.log(`Load ${mailbox}`)
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-header').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
  
  const emailsList = document.querySelector('#emails-list');
  // Empty list before add current mailbox
  if (emailsList.childElementCount !== 0) {
    console.log('clear inbox')
    emailsList.innerHTML = '';
  }

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails)
    mail_list(emails)})
  .catch(error => {
    console.error("Error:", error)
  });

  // When user click on email list to read
  emailsList.addEventListener('click', event => {
    // If list of emails is inside inbox
    if (document.querySelector('ul')) {
    // Look for parent email to find out email ID
    let parent = findParent(event.target);

    console.log(`final ${parent.tagName}`)
    // Open selected mail
    fetch(`emails/${parent.id}`)
    .then(response => response.json())
    .then(mail => open_mail(mail))
    .catch(error => console.error('Error:', error))
    }

  });
}


function findParent(element) {
  /** 
   * Recursevly looking for element with "A" 
   */ 
  if (element.tagName === 'A') {return element}
  return findParent(element.parentElement)
}


function mail_list(emails){
  const emailsList = document.querySelector('#emails-list');
  const listBody = document.createElement('ul');
  listBody.className = 'list-group';
  // Check for new emails for user
  emailsList.append(listBody);
  console.log(listBody.childElementCount)
  if (listBody.childElementCount === 0) {
    console.log("load first time")
    emails.forEach(mail => createNewEmailListItem(mail, listBody));

  }
  if (listBody.childElementCount < emails.length) {
    // Separate new emails from the existing mails in inbox
    // for now here is append into end of the list
    const newMails = emails.filter( obj => obj.id > listBody.firstElementChild.id);
    console.log('add new mails')
    newMails.forEach(mail => createNewEmailListItem(mail, listBody));
  }
}

function open_mail(mail) {
  // Create elements for mail view
  document.querySelector('#emails-list').innerHTML = '';
  document.querySelector('#emails-header').innerHTML = '';
  const element = document.createElement('div');
  const mailHeader = document.createElement('div');
  const sender = document.createElement('p');
  const recipients = document.createElement('p');
  const subject = document.createElement('p');
  const timestamp = document.createElement('p');
  const mailBody = document.createElement('div');

  sender.innerHTML = `<span class='fw-bold'>From</span>: ${mail.sender}`;
  recipients.innerHTML = `<span class='fw-bold'>From</span>: ${mail.recipients}`;
  subject.innerHTML = `<span class='fw-bold'>From</span>: ${mail.subject}`;
  timestamp.innerHTML = `<span class='fw-bold'>From</span>: ${mail.timestamp}`;
  mailBody.innerHTML = `<hr>${mail.body}`;

  mailHeader.append(sender);
  mailHeader.append(recipients);
  mailHeader.append(subject);
  mailHeader.append(timestamp);

  element.append(mailHeader);
  element.append(mailBody);
  document.querySelector('#emails-list').append(element);
  fetch(`emails/${mail.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}


function submit_mail(event) {
  
  // Select form 
  const q = document.querySelectorAll('.form-control');
  let recipients, subject, body
  // Take values from form array
  q.forEach(q => {
    if (q.valueOf().id === 'compose-recipients') {recipients = q.valueOf().value;}
    else if (q.valueOf().id === 'compose-subject') { subject = q.valueOf().value;}
    else if (q.valueOf().id === 'compose-body') { body = q.valueOf().value;}
  });
  
  // Send mail to server
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    const message = document.createElement('p');
    message.innerHTML = result.error;
    document.querySelector('#compose-form').append(message)})
  .catch(error => console.log('Error: ', error))
}

function createNewEmailListItem(mail, listBody) {
  const listItem = document.createElement('a');
  const subject = document.createElement('h5');
  const sender = document.createElement('small');
  const timestamp = document.createElement('small');
  const header = document.createElement('div');
  header.className = "d-flex w-100 justify-content-between";

  header.append(subject);
  header.append(timestamp);
  timestamp.innerHTML = mail.timestamp;
  sender.innerHTML =  `Sent by: ${mail.sender}`;
  subject.innerHTML = mail.subject;
  // If mail has been read
  if (mail.read === true) {
    // Set color to secondary
    listItem.className = 'list-group-item list-group-item-action list-group-item-light text-secondary';
    timestamp.className = 'text-secondary';
  } else {
    // If else set color to normal
    listItem.className = 'list-group-item list-group-item-action';
    timestamp.className = 'text-muted';
  };
  listItem.href = '#';
  listItem.id = mail.id;
  listItem.append(header)
  listItem.append(sender)
  // Need to move out append from this func to mail_list
  listBody.append(listItem);
  
}