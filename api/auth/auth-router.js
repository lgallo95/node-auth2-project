const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require("./auth-middleware");
const { BCRYPT_ROUNDS } = require("../secrets/index");
const bcrypt = require("bcryptjs");
const User = require("../users/users-model");
const makeToken = require("./auth-token-builder");

router.post("/register", validateRoleName, (req, res, next) => {
  let {username, password, role_name} = req.body
  role_name = role_name.trim()
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  User.add({username, password: hash, role_name})
    .then((saved) => {
      res.status(201).json(saved);
    })
    .catch(next);
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201

    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
});

router.post("/login", checkUsernameExists, (req, res, next) => {
  let { username, password } = req.body;
  User.findBy({ username })
    .then(([user]) => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = makeToken(user);
        res.status(200).json({ message: `${user.username} is back!`, token });
      } else {
        next({ status: 401, message: "Invalid Credentials" });
      }
    })
    .catch(next);
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
});

module.exports = router;
