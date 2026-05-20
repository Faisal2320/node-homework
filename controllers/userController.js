const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
// const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
const { emit } = require("cluster");
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
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  try {
    user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword: value.hashedPassword,
      },
      select: { name: true, email: true, id: true },
    });
    global.user_id = user.id;
    res.status(StatusCodes.CREATED).json(user);
  } catch (e) {
    if (e.name === "PrismaClientKnownRequestError" && e.code === "P2002") {
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
  const lowerEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lowerEmail } });

  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }
  const isMatch = await comparePassword(password, user.hashedPassword);
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
