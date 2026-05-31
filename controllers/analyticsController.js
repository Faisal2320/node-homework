const { StatusCodes } = require("http-status-codes");
const prisma = require("../db/prisma");

const getUserAnalytics = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ Message: "Invalid user id" });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: `User with id ${userId} not found` });
  }
  const taskStats = await prisma.task.groupBy({
    by: ["isCompleted"],
    where: { userId },
    _count: {
      id: true,
    },
  });
  const recentTasks = await prisma.task.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true,
      User: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyProgress = await prisma.task.groupBy({
    by: ["createdAt"],
    where: {
      userId,
      createdAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
  });

  return res
    .status(StatusCodes.OK)
    .json({ taskStats, recentTasks, weeklyProgress });
};
const getUsersWithStats = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const usersRaw = await prisma.user.findMany({
    include: {
      Task: {
        where: { isCompleted: false },
        select: { id: true },
        take: 5,
      },
      _count: {
        select: {
          Task: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  const users = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createAt: u.createdAt,
    _count: u._count,
    Task: u.Task,
  }));
  const totalUsers = await prisma.user.count();

  const pagination = {
    page,
    limit,
    total: totalUsers,
    pages: Math.ceil(totalUsers / limit),
    hasNext: page * limit < totalUsers,
    hasPrev: page > 1,
  };

  return res.status(StatusCodes.OK).json({ users, pagination });
};
const searchTasks = async (req, res) => {
  const search = req.query.q || req.query.search;
  if (!search || search.trim().length < 2) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Search query mush be at least 2 characters long" });
  }
  const limit = parseInt(req.query.limit) || 20;

  const searchPattern = `%${search}%`;
  const exactMatch = search;
  const startWith = `${search}%`;

  const searchResult = await prisma.$queryRaw`
  SELECT
  t.id,
  t.title,
  t.is_completed as "isCompleted",
  t.priority,
  t.created_at as "createdAt",
  t.user_id as "userId",
  u.name as "user_name"
  FROM tasks as t
  JOIN users as u
  ON t.user_id = u.id
  WHERE t.title ILIKE ${searchPattern}
    OR u.name ILIKE ${searchPattern}
  ORDER BY
    CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT ${limit}
  `;

  return res.status(StatusCodes.OK).json({
    results: searchResult,
    query: search,
    count: searchResult.length,
  });
};
module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };
