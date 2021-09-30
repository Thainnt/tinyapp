const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = testUsers.userRandomID;
    assert.deepEqual(user, expectedOutput);
  });

  it('should return false when passing in an email that is not in the users Database', function() {
    const user = getUserByEmail("user@google.com", testUsers)
    const expectedOutput = false;
    assert.strictEqual(user, expectedOutput);
  });
});