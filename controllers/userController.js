const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");
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
const register = async (req, res, next) => {
  console.log("This data was posted", JSON.stringify(req.body));
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    console.log("VALIDATION ERROR:", error);
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  let user = null;
  const hashed_password = await hashPassword(value.password);

  try {
    user = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, hashed_password],
    );
    delete req.body.password;
    res.status(StatusCodes.CREATED).json(user.rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "User already exist with this email",
      });
    }
    return next(e);
  }
};
// ============================= Logon

const logon = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length !== 1) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
  const user = result.rows[0];
  const isMatch = await comparePassword(password, user.hashed_password);
  if (!isMatch) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
  //
  //

  global.user_id = user.id;
  console.log("Logged in user: ", global.user_id);
  return res
    .status(StatusCodes.OK)
    .json({ id: user.id, name: user.name, email: user.email });
};
// ============================ Logoff
const logoff = (req, res) => {
  global.user_id = null;
  return res.sendStatus(StatusCodes.OK);
};

/*

*/
module.exports = { register, logon, logoff };
