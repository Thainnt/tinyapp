const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());
app.use(
  cookieSession ({
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

// CREATE ROUTES
app.get("/", (req, res) => {
  res.send("Hello!");
});

//Route for URL Database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/user.json", (req, res) => {
  res.json(userDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Display URLs in database
app.get('/urls', (req, res) => {
  //Retrieve current user id
  const userId = req.session.user_id; //req.cookies['user_id'];

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
  const userId = req.session.user_id; //req.cookies['user_id'];
  console.log(userId);

  if (userId) {
    const templateVars = {
      urls: urlDatabase,
      activeUser: userDatabase[userId]
    };
    
    res.render('urls_new', templateVars);
  } else {
    templateVars = {
      activeUser: null
    }
    res.render('login', templateVars);
  }
});

//Add POST route for form submission and redirect to newly create link
app.post('/urls', (req, res) => {
  //Retrieve current user id
  const userId = req.session.user_id; //req.cookies['user_id'];

  const generateShortURL = generateRandomString(6);
  urlDatabase[generateShortURL] = {};
  urlDatabase[generateShortURL].longURL = req.body.longURL;
  urlDatabase[generateShortURL].userID = userId;
  console.log(urlDatabase);
  res.redirect(`/urls/${generateShortURL}`);
});

//Create a route for displaying a single URL
app.get('/urls/:shortURL', (req, res) => {
  //Retrieve current user id
  const userId = req.session.user_id; //req.cookies['user_id'];

  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const activeUser = userDatabase[userId];
  
  const isOwner = urlDatabase[shortURL].userID === userId;

  console.log(isOwner);

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
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//Add POST route to remove URL
app.post('/urls/:shortURL/delete', (req, res) => {
  //Retrieve current user id
  const userId = req.session.user_id; //req.cookies['user_id'];
  const activeUser = userDatabase[userId];

  if (urlDatabase[req.body.shortURL].userID === userId) {
    delete urlDatabase[req.body.shortURL];
  }

  res.redirect('/urls');
});

//Add POST route to update URL
app.post('/urls/:shortURL', (req, res) => {
  //Retrieve current user id
  const userId = req.session.user_id; //req.cookies['user_id'];
  const activeUser = userDatabase[userId];

  if (urlDatabase[req.params.shortURL].userID === userId) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});

//Add POST route for logout
app.post('/logout', (req, res) => {
  // res.clearCookie('user_id');
  req.session = null;
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
  console.log('register data: ', req.body);
  const email = req.body.email;
  let password = req.body.password;
  //Check if email and password are not empty strings
  if (email ==='' && password === '') {
    res.status(400).send('Please enter valid email and/or password');
  }

  //Check if user is  already in database
  const userFound = getUserByEmail(email, userDatabase);
  if (userFound) {
    res.status(403).send(`User with ${email} already exists!`);
    return;
  }

  //hash user input password
  password = bcrypt.hashSync(password, salt);
  //Add user into database if this is a new user
  const userID = createNewUser(email, password, userDatabase);
  console.log('new user: ', userDatabase[userID]);
  // Set user_id to cookie value
  // res.cookie('user_id', userID);
  req.session.user_id = userID;

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
  const {email, password} = req.body;
  console.log('login info: ', {email, password});

  //Check if login information is correct
  const activeUser = authenticateUser(email, password, userDatabase);
  if (activeUser) {
    // res.cookie('user_id', activeUser.id);
    req.session.user_id = activeUser.id;

    res.redirect('/urls');
    return;
  }

  res.status(400).send('Incorrect email or password');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});