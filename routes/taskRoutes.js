const express = require("express");
const router = express.Router();
const {
  index,
  create,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require("../controllers/taskController");

router.route("/").get(index);
router.route("/").post(create);
router.route("/bulk").post(bulkCreate);
router.route("/:id").get(show);
router.route("/:id").patch(update);
router.route("/:id").delete(deleteTask);

module.exports = router;
