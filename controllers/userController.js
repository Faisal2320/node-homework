const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
// const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
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
  // console.log("This data was posted", JSON.stringify(req.body));
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    console.log("VALIDATION ERROR:", error);
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  value.email = value.email.toLowerCase();
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: value.name,
          email: value.email,
          hashedPassword: value.hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];

      await tx.task.createMany({ data: welcomeTaskData });

      const welcomeTask = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTaskData.map((t) => t.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });
      return { newUser, welcomeTask };
    });
    global.user_id = result.newUser.id;
    return res.status(201).json({
      user: result.newUser,
      welcomeTasks: result.welcomeTask,
      transactionStatus: "success",
    });
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
  return res.status(StatusCodes.OK).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
};
// ============================ Logoff
const logoff = (req, res) => {
  global.user_id = null;
  return res.sendStatus(StatusCodes.OK);
};

const show = async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid user ID" });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "user not found" });
  }
  res.status(StatusCodes.OK).json(user);
};
/*

*/
module.exports = { register, logon, logoff, show };
