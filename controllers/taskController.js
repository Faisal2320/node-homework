const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const querySchema = require("../validation/querySchema");
const prisma = require("../db/prisma");
//
function sanitize(task) {
  const { userId, ...rest } = task;
  userId;
  return rest;
}
const getOrderBy = (query) => {
  const validSortFields = [
    "title",
    "priority",
    "createdAt",
    "id",
    "isCompleted",
  ];
  const sortBy = query.sortBy || "createAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
  }
  return { createdAt: "desc" };
};
async function index(req, res) {
  const {
    error,
    value: { page, limit },
  } = querySchema.validate(req.query);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }
  const skip = (page - 1) * limit;
  const { find, isCompleted, priority, min_date, max_date } = req.query;

  const userId = global.user_id;

  if (!userId) {
    return res.status(401).json({ message: "Not Logged in" });
  }

  const whereClause = { userId };

  if (find) {
    whereClause.title = {
      contains: req.query.find,
      mode: "insensitive",
    };
  }
  if (isCompleted) {
    whereClause.isCompleted = req.query.isCompleted;
  }
  if (priority) {
    whereClause.priority = req.query.priority;
  }
  if (min_date) {
    whereClause.createdAt = { gte: new Date(min_date) };
  }
  if (max_date) {
    whereClause.createdAt = { lte: new Date(max_date) };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      title: true,
      isCompleted: true,
      priority: true,
      id: true,
      createdAt: true,
      User: { select: { name: true, email: true } },
    },
    skip: skip,
    take: limit,
    orderBy: getOrderBy(req.query),
  });
  if (tasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }
  const totalTasks = await prisma.task.count({
    where: whereClause,
  });
  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  return res.status(StatusCodes.OK).json({ tasks, pagination });
}
async function create(req, res) {
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
      priority: value.priority,
      userId: global.user_id,
    },
    select: { id: true, title: true, isCompleted: true, priority: true },
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
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        userId: true,
        priority: true,
        User: { select: { name: true, email: true } },
      },
    });
    if (task.userId !== global.user_id) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: `Task with the id ${taskId} not found for the current user`,
      });
    }
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
      select: { id: true, title: true, isCompleted: true, priority: true },
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
        priority: true,
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

const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid request data. Expected an array of tasks." });
  }

  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Validation failed", details: error.details });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: global.user_id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });
    return res.status(StatusCodes.CREATED).json({
      messate: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { index, create, show, update, deleteTask, bulkCreate };
