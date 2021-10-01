const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const cookieSession = require('cookie-session');
const {
  generateRandomString,
  getUserByEmail,
  createNewUser,
  authenticateUser,
} = require('./helpers');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: "session",
    keys: ['value', 'another value'],
  })
);

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'm3o0Ww'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: '1zIziz'
  }
};

const hashedPassword1 = bcrypt.hashSync("jump", salt);
const hashedPassword2 = bcrypt.hashSync("0000", salt);

const userDatabase = {
  'm3o0Ww': {
    id: 'm3o0Ww',
    email: 'meow@kitty.cat',
    password: hashedPassword1
  },
  '1zIziz': {
    id: '1zIziz',
    email: 'ufo@iz.iz',
    password: hashedPassword2
  }
};

const urlsForUser = id => {
  const urlsForId = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlsForId[url] = urlDatabase[url];
    }
  }

  return urlsForId;
};

//Route for URL Database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Route for user Database
app.get("/user.json", (req, res) => {
  res.json(userDatabase);
});

// Create redirect routes for /
app.get("/", (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;

  if (userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

//Display URLs in database belong to a logged in user
app.get('/urls', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;

  //Filter urls belong to userId
  const filteredUrls = urlsForUser(userId);

  const templateVars = {
    urls: filteredUrls,
    activeUser: userDatabase[userId]
  };
  res.render('urls_index', templateVars);
  
});

//Add GET route for new link creation
app.get('/urls/new', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;
  
  if (userId) {
    const templateVars = {
      urls: urlDatabase,
      activeUser: userDatabase[userId]
    };
    res.render('urls_new', templateVars);

  } else {
    const templateVars = {
      activeUser: null
    };
    res.render('login', templateVars);
  }
});

//Create a route for displaying a single URL
app.get('/urls/:shortURL', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;
  const shortURL = req.params.shortURL;
  
  let longURL = '';
  let isOwner = false;

  //Check if shorURL exists in urlDatabase
  if (Object.keys(urlDatabase).includes(shortURL)) {
    longURL = urlDatabase[shortURL].longURL;
    isOwner = urlDatabase[shortURL].userID === userId;
  }
  
  const activeUser = userDatabase[userId];
  
  const templateVars = {
    shortURL,
    longURL,
    isOwner,
    activeUser
  };
  
  res.render('urls_show', templateVars);
});

//Redirect the short URL to the original long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = '';

  //Check if shorURL exists in urlDatabase
  if (Object.keys(urlDatabase).includes(shortURL)) {
    longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
  res.status(400).send('Invalid URL - Page not found');
});

//Add POST route for form submission and redirect to new link
app.post('/urls', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;
  const generateShortURL = generateRandomString(6);
  
  urlDatabase[generateShortURL] = {};
  urlDatabase[generateShortURL].longURL = req.body.longURL;
  urlDatabase[generateShortURL].userID = userId;
  
  res.redirect(`/urls/${generateShortURL}`);
});

//Add POST route to update URL
app.post('/urls/:shortURL', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;
  const urlId = req.params.shortURL;

  if (urlDatabase[urlId].userID === userId) {
    urlDatabase[urlId].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});

//Add GET route to display delete URL
app.get('/urls/:shortURL/delete', (req, res) => {
  res.send('You do not have permission to delete this URL.');
});

//Add POST route to remove URL
app.post('/urls/:shortURL/delete', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;
  const urlId = req.body.shortURL;
  
  if (urlDatabase[urlId].userID === userId) {
    delete urlDatabase[urlId];
    res.redirect('/urls');
  }
  
});

//Add route for login
app.get('/login', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;

  if (userId) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {
    activeUser: null
  };
  res.render('login', templateVars);
});

// Add GET route for register page
app.get('/register', (req, res) => {
  //Retrieve current user id
  const userId = req.session.userId;

  if (userId) {
    res.redirect('/urls');
    return;
  }

  const templateVars = {
    activeUser: null
  };
  res.render('registration', templateVars);
});

//Add login handler
app.post('/login', (req, res) => {
  //Retrieve submitted data
  const {email, password} = req.body;

  //Check if login information is correct
  const activeUser = authenticateUser(email, password, userDatabase);
  if (activeUser) {
    req.session.userId = activeUser.id;

    res.redirect('/urls');
    return;
  }

  res.status(400).send('Incorrect email or password');
});

//Add resigtration handler
app.post('/register', (req, res) => {
  //Retrieve submitted data
  const email = req.body.email;
  let password = req.body.password;

  //Check if email and password are not empty strings
  if (email === '' || password === '') {
    res.status(400).send('Please enter valid email and/or password');
    return;
  }

  //Check if user is  already in database
  const userFound = getUserByEmail(email, userDatabase);
  if (userFound) {
    res.status(403).send(`User with ${email} already exists!`);
    return;
  }

  //Hash user input password
  password = bcrypt.hashSync(password, salt);

  //Add user into database if this is a new user
  const userID = createNewUser(email, password, userDatabase);

  // Set userId to cookie value
  req.session.userId = userID;

  res.redirect('/urls');
});

//Add POST route for logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});