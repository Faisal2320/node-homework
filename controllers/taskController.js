const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
// counter for task
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();
function sanitize(task) {
  const { userId, ...rest } = task;
  userId;
  return rest;
}
//
function index(req, res) {
  const userTasks = global.tasks.filter((task) => {
    return task.userId === global.user_id.email;
  });
  if (userTasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }
  const sanitizedTask = userTasks.map(sanitize);

  return res.status(StatusCodes.OK).json(sanitizedTask);
}
function create(req, res) {
  // create new task
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate({ ...req.body });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json(error);
  }
  console.log("Create called: ", req.body);
  const newTask = {
    ...value,
    id: taskCounter(),
    userId: global.user_id.email,
  };
  //   push the task to global task array
  global.tasks.push(newTask);
  // remove the user_id and send back the task and everyting
  res.status(StatusCodes.CREATED).json(sanitize(newTask));
}
function show(req, res) {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid Task ID" });
  }
  const taskIndex = global.tasks.findIndex((task) => {
    return task.id === taskId && task.userId === global.user_id.email;
  });
  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task ID not found" });
  }
  const sanitizedTask = sanitize(global.tasks[taskIndex]);
  res.status(StatusCodes.OK).json(sanitizedTask);
}
function update(req, res) {
  const taskId = parseInt(req.params?.id);
  if (isNaN(taskId)) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "The task ID is not valid" });
  }
  //   check if the user is logged in and it is its own task
  const taskIndex = global.tasks.findIndex((task) => {
    return task.id === taskId && task.userId === global.user_id.email;
  });
  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Task not found" });
  }

  const currentTask = global.tasks[taskIndex];
  //   validate the req.body
  const { error, value } = patchTaskSchema.validate({ ...req.body });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json(error);
  }
  Object.assign(currentTask, value);
  res.status(StatusCodes.OK).json(sanitize(currentTask));
}
function deleteTask(req, res) {
  // if there is id in params we get that from req.params
  const currentTask = parseInt(req.params?.id);
  if (isNaN(currentTask)) {
    return res.status(400).json({ message: "The task ID is not valid." });
  }
  //    now find that id int from params in tasks array
  const taskIndex = global.tasks.findIndex((task) => {
    // checks every tasks id to params.id and if that this user is loggedin or not
    return task.id === currentTask && task.userId === global.user_id.email;
  });
  //   if not found 404
  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  //   pull out that task by inserting index in global.task array
  //    so that we can send it back in res. as a success message
  // destructure it and take out only the task and not userId
  const sanitizedTask = sanitize(global.tasks[taskIndex]);
  //   remove the task from global task array
  global.tasks.splice(taskIndex, 1);
  return res.json(sanitizedTask);
}

module.exports = { index, create, show, update, deleteTask };
