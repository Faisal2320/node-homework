const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.boolean().default(false).not(null),
});
const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  isCompleted: Joi.bool().not(null),
})
  .min(1)
  .message("No attribute to change were specified.");

module.exports = { taskSchema, patchTaskSchema };
