const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {
  'm3o0Ww': {
    id: 'm3o0Ww',
    name: 'meow',
    email: 'meow@kitty.cat',
    password: 'jump'
  },
  '1zIziz': {
    id: '1zIziz',
    name: 'et',
    email: 'ufo@iz1z.iz',
    password: '@#$%^&*-)(*&^%'
  }
};

// HELPER FUNCTIONS
const generateRandomString = strLength => {
  //alphabet code from 65-90 & 97-122
  let randomStr = '';
  
  for (let i = 0; i < strLength; i++) {
    const randomCode = Math.floor((Math.random() * (122 - 65)) + 65);
    if (randomCode > 90 && randomCode < 97) {
      randomStr += Math.floor(Math.random() * 10);
    } else {
      randomStr += String.fromCharCode(randomCode);
    }
  }
  return randomStr;
};

const findUserByEmail = (email, usersDB) => {
  for (let id in usersDB) {
    const user = usersDB[id];
    if (email === user.email) {
      return user;
    }
  }
  
  return false;
};

const createNewUser = (name, email, password, userDB) => {
  const id = generateRandomString(6);

  userDB[id] = {
    id,
    name,
    email,
    password
  };

  return id;
};

const authenticateUser = (email, password, userDB) => {
  //Retrieve user data from database
  const userFound = findUserByEmail(email, userDB);

  //check if input password match with database
  if (userFound && userFound.password === password) {
    return userFound;
  }

  return false;
};

// CREATE ROUTES
app.get("/", (req, res) => {
  res.send("Hello!");
});

//Route for URL Database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Display URLs in database
app.get('/urls', (req, res) => {
  //Retrieve current user id
  const userId = req.cookies['user_id'];
  
  const templateVars = {
    urls: urlDatabase,
    activeUser: userDatabase[userId]
  };
  res.render('urls_index', templateVars);
});

//Add GET route for new link creation
app.get('/urls/new', (req, res) => {
  //Retrieve current user id
  const userId = req.cookies['user_id'];

  const templateVars = {
    urls: urlDatabase,
    activeUser: userDatabase[userId]
  };
  res.render('urls_new', templateVars);
});

//Add POST route for form submission and redirect to newly create link
app.post('/urls', (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const generateShortURL = generateRandomString(6);
  urlDatabase[generateShortURL] = req.body.longURL;
  res.redirect(`/urls/${generateShortURL}`);
});

//Create a route for displaying a single URL
app.get('/urls/:shortURL', (req, res) => {
  //Retrieve current user id
  const userId = req.cookies['user_id'];

  const templateVars = {
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],
    activeUser: userDatabase[userId]
  };
  res.render('urls_show', templateVars);
});

//Redirect the short URL to the original long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//Add POST route to remove URL
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.body.shortURL];
  res.redirect('/urls');
});

//Add POST route to update URL
app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

//Add POST route for logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Add GET route for register page
app.get('/register', (req, res) => {
  templateVars = {
    activeUser: null
  }
  res.render('registration', templateVars);
});

//Add resigtration handler
app.post('/register', (req, res) => {
  //Retrieve submitted data
  console.log(req.body);
  const {name, email, password} = req.body;
  console.log({name, email, password});
  //Check if email and password are not empty strings
  if (email ==='' && password === '') {
    res.status(400).send('Please enter valid email and/or password');
  }

  //Check if user is  already in database
  const userFound = findUserByEmail(email, userDatabase);
  if (userFound) {
    res.status(403).send(`User with ${email} already exists!`);
    return;
  }

  //Add user into database if this is a new user
  const userID = createNewUser(name, email, password, userDatabase);
  console.log('new user: ', userDatabase[userID]);
  // Set user_id to cookie value
  res.cookie('user_id', userID);
  
  res.redirect('/urls');
});

//Add route for login
app.get('/login', (req, res) => {
  templateVars = {
    activeUser: null
  }
  res.render('login', templateVars);
});

//Add login handler
app.post('/login', (req, res) => {
  //Retrieve submitted data
  console.log(req.body);
  const {email, password} = req.body;
  console.log({email, password});

  //Check if login information is correct
  const activeUser = authenticateUser(email, password, userDatabase);
  if (activeUser) {
    res.cookie('user_id', activeUser.id);

    res.redirect('/urls');
    return;
  }

  res.status(400).send('Incorrect email or password');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});