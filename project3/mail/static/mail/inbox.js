document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', event => compose_email(event));
  document.querySelector('#submit-mail').addEventListener('click', event => submit_mail(event));
  // By default, load the inbox
  load_mailbox('inbox');
  history.pushState({status: 'inbox'}, '')
});

function compose_email(event) {
  console.log("Compose mail")
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  // If user get to compose to reply
  if (event.target.innerHTML === 'Reply') {
    // Fetch mail to which reply
    fetch(`emails/${event.target.value}`)
    .then(response => response.json())
    .then(mail => {
      document.querySelector('#compose-recipients').value = mail.sender;
      // Check if reply subject has already response heading
      if (mail.subject.substring(0, 3) !== 'Re:') {
        document.querySelector('#compose-subject').value = 'Re: '+ mail.subject;
      } else {
        document.querySelector('#compose-subject').value = mail.subject;
      }
      const responseHead = `On ${mail.timestamp} ${mail.sender} wrote: \n`;
      document.querySelector('#compose-body').value = responseHead + mail.body + '\n';
      document.querySelector('#compose-body').focus();
    })
  } else {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}

function load_mailbox(mailbox) {
  console.log(`Load ${mailbox}`)
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-header').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
  
  const emailsList = document.querySelector('#emails-list');
  // Empty list before add current mailbox
  if (emailsList.childElementCount !== 0) {
    console.log('clear inbox')
    emailsList.innerHTML = '';
  }
  
  // Get emails from server
  fetch(`emails/${mailbox}`)
  .then(response => response.json()) // Jsonufy
  .then(emails => mail_list(emails)) // Create list of elements from emails
  .catch(error => console.log("Error:", error));

  // Add listener for click on mail list
  emailsList.addEventListener('click', event => {
    // If list exist inside inbox
    if (document.querySelector('ul')) {
      // Look for parent element of email it should be A
      let parent = findParent(event.target);
      // Open selected mail
      fetch(`emails/${parent.id}`)
      .then(response => response.json())
      .then(mail => {
        open_mail(mail);
        history.pushState({status: 'view'}, '');
      })
      .catch(error => console.log('Error:', error))
    }
  });
}

function findParent(element) {
  /** 
   * Recursevly looking for element with "A" 
   */ 
  if (element.tagName === 'BUTTON') {return element}
  return findParent(element.parentElement)
}

function mail_list(emails){
  const emailsList = document.querySelector('#emails-list');
  const listBody = document.createElement('ul');
  listBody.className = 'list-group';
  // Check for new emails of user
  emailsList.append(listBody);
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
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  const container = document.querySelector('#mail-view');
  container.innerHTML = '';
  container.style.display = 'block';
  const element = document.createElement('div');
  const mailHeader = document.createElement('div');
  const sender = document.createElement('p');
  const recipients = document.createElement('p');
  const subject = document.createElement('p');
  const timestamp = document.createElement('p');
  const mailBody = document.createElement('div');

  sender.innerHTML = `<span class='fw-bold'>From</span>: ${mail.sender}`;
  recipients.innerHTML = `<span class='fw-bold'>To</span>: ${mail.recipients}`;
  subject.innerHTML = `<span class='fw-bold'>Subject</span>: ${mail.subject}`;
  timestamp.innerHTML = `<span class='fw-bold'>Timestamp</span>: ${mail.timestamp}`;
  mailBody.innerHTML = `<hr>${mail.body}<hr>`;

  mailHeader.append(sender);
  mailHeader.append(recipients);
  mailHeader.append(subject);
  mailHeader.append(timestamp);

  element.append(mailHeader);
  element.append(mailBody);
  container.append(element);

  const reply = document.createElement('button');
  reply.className = 'btn btn-primary';
  reply.innerHTML = 'Reply';
  reply.value = mail.id;
  element.append(reply);

  // Add event on button to send for compose mail to reply
  reply.addEventListener('click', event => {
    history.pushState({status: 'view'}, '')
    compose_email(event)});

  // Create archive button for mail if view is inbox or archive
  if (document.querySelector('#emails-header').innerHTML !== 'Sent') {

    // Prepare button
    const archive = document.createElement('button');
    archive.className = 'btn btn-primary';

    // Get status of mail and set button name to opposite
    if (mail.archived === true ) {
      archive.innerHTML = 'Unarchive';
    } else {
      archive.innerHTML = 'Archive';}
    element.insertBefore(archive, reply);

    // Add listener to archive button
    archive.addEventListener('click', () => {
      console.log(mail.archived)
      // Send request with opposite state to arhive or unarhive 
      fetch(`emails/${mail.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !mail.archived
        })
      })
      .then(() => {
        history.pushState({status: 'archive'}, '');
        load_mailbox('inbox')});
    })
  }

  // Send info that mail has been readed
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
  const message = document.querySelector('#message');
  message.innerHTML = '';
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
    if (result.error) {
      message.innerHTML = result.error;
      message.className = 'text-danger';
      history.pushState({page : Compose}, '', 'Compose')
    } else {load_mailbox('sent')}})
  .catch(error => console.log('Error: ', error))
}

function createNewEmailListItem(mail, listBody) {
  const listItem = document.createElement('button');
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
    // Else set color to normal
    listItem.className = 'list-group-item list-group-item-action';
    timestamp.className = 'text-muted';
  };
  listItem.id = mail.id;
  listItem.append(header)
  listItem.append(sender)
  // Need to move out append from this func to mail_list
  listBody.append(listItem);
}