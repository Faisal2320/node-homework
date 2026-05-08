const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
/*



*/
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}
// /////////////////////////////////
async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
///////////////////////////////////
const register = async (req, res) => {
  console.log("This data was posted", JSON.stringify(req.body));
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ Err: "user was not created", error });
  }
  const { name, email, password } = value;
  const hashedPasswordToSave = await hashPassword(password);
  const newUser = { name, email, password: hashedPasswordToSave };
  global.users.push(newUser);
  global.user_id = newUser;
  delete req.body.password;
  res.status(StatusCodes.CREATED).json({ name, email });
};
// ============================= Logon

const logon = async (req, res) => {
  const { email, password } = req.body;

  const user = global.users.find((u) => u.email === email);

  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
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
