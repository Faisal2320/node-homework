const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");
//
function sanitize(task) {
  const { user_id, ...rest } = task;
  user_id;
  return rest;
}
//
async function index(req, res) {
  const tasks = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE user_id = $1`,
    [global.user_id],
  );
  console.log(tasks.rows);
  if (tasks.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }

  return res.status(StatusCodes.OK).json(tasks.rows);
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
  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
    VALUES ($1,$2,$3) RETURNING id,title,is_completed`,
    [value.title, value.isCompleted ?? false, global.user_id],
  );

  res.status(StatusCodes.CREATED).json({ ...task.rows[0] });
}
async function show(req, res) {
  const taskId = parseInt(req.params?.id);

  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid Task ID" });
  }
  const task = await pool.query(
    `SELECT * FROM tasks WHERE id = $1 AND user_id = $2`,
    [taskId, global.user_id],
  );
  if (task.rows.length !== 1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task ID not found" });
  }
  res.status(StatusCodes.OK).json(sanitize(task.rows[0]));
}
async function update(req, res) {
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

  let keys = Object.keys(value);
  keys = keys.map((key) => {
    return key === "isCompleted" ? "is_completed" : key;
  });
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const result = await pool.query(
    `UPDATE tasks SET ${setClauses}
    WHERE id = ${idParm} AND user_id = ${userParm}
    RETURNING id, title, is_completed`,
    [...Object.values(value), taskId, global.user_id],
  );

  if (result.rows.length !== 1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task not found" });
  }
  res.status(StatusCodes.OK).json(result.rows[0]);
}
async function deleteTask(req, res) {
  // if there is id in params we get that from req.params
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID is not valid." });
  }
  //    now find that id int from params in tasks array
  const task = await pool.query(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
  if (task.rows.length !== 1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: `The task for the id ${taskId} not found` });
  }
  if (task.rows[0].user_id !== global.user_id) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task not found" });
  }
  const deletedTask = await pool.query(
    `DELETE FROM tasks WHERE id = $1 AND user_id = $2 
     RETURNING id,title,is_completed`,
    [taskId, global.user_id],
  );
  //   if not found 404
  if (deletedTask.rows.length !== 1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task not found" });
  }
  return res.json(deletedTask.rows[0]);
}

module.exports = { index, create, show, update, deleteTask };
