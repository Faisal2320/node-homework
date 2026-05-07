const { StatusCodes } = require("http-status-codes");
/*



*/
const register = (req, res) => {
  console.log("This data was posted", JSON.stringify(req.body));
  const newUser = { ...req.body };
  global.users.push(newUser);
  global.user_id = newUser;
  delete req.body.password;
  res.status(StatusCodes.CREATED).json(req.body);
};
// ============================= Logon

const logon = (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
  //
  //
  global.user_id = user;

  return res.json({ name: user.name, email: user.email });
};
// ============================ Logoff
const logoff = (req, res) => {
  global.user_id = null;
  return res.sendStatus(StatusCodes.OK);
};

/*






*/
module.exports = { register, logon, logoff };
