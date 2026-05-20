const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");
//
function sanitize(task) {
  const { user_id, ...rest } = task;
  user_id;
  return rest;
}
//
async function index(req, res) {
  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true },
  });
  if (tasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }

  return res.status(StatusCodes.OK).json(tasks);
}
async function create(req, res) {
  if (!global.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Not logged in" });
  }
  // create new task
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate({ ...req.body });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json(error);
  }

  const task = await prisma.task.create({
    data: {
      title: value.title,
      isCompleted: value.isCompleted ?? false,
      userId: global.user_id,
    },
    select: { id: true, title: true, isCompleted: true },
  });

  return res.status(StatusCodes.CREATED).json(task);
}
async function show(req, res, next) {
  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid Task ID" });
  }
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: { id: true, title: true, isCompleted: true },
    });
    return res.status(StatusCodes.OK).json(sanitize(task));
  } catch (e) {
    if (e.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The task not found." });
    } else {
      return next(e);
    }
  }
}
async function update(req, res, next) {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID is not valid" });
  }
  const { error, value } = patchTaskSchema.validate({ ...req.body });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json(error);
  }
  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: { id: true, title: true, isCompleted: true },
    });
    res.status(StatusCodes.OK).json(task);
  } catch (e) {
    if (e.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The task not found." });
    } else {
      return next(e);
    }
  }
}
async function deleteTask(req, res, next) {
  // if there is id in params we get that from req.params
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID is not valid." });
  }

  try {
    await prisma.task.delete({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: "Task Deleted Successfully" });
  } catch (e) {
    if (e.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The task was not found." });
    } else {
      return next(e);
    }
  }
}

module.exports = { index, create, show, update, deleteTask };
