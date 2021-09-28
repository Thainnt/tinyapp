const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

//Add GET route for new link creation
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
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
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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

//Add POST route for username input and login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});