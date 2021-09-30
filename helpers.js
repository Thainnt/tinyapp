const bcrypt = require('bcryptjs');

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

const getUserByEmail = (email, usersDB) => {
  for (let id in usersDB) {
    const user = usersDB[id];
    if (email === user.email) {
      return user;
    }
  }
  
  return false;
};

const createNewUser = (email, password, userDB) => {
  const id = generateRandomString(6);

  userDB[id] = {
    id,
    email,
    password
  };

  return id;
};

const authenticateUser = (email, password, userDB) => {
  //Retrieve user data from database
  const userFound = getUserByEmail(email, userDB);

  //check if input password match with database
  if (userFound){
    if (bcrypt.compareSync(password,userFound.password)) {
      return userFound;
    }
    console.log('Incorrect password');
  }
  console.log('Incorrect email');

  return false;
};

module.exports = { generateRandomString, getUserByEmail, createNewUser, authenticateUser };