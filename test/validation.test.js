const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation test", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
  it("2. Require an email", () => {
    const { error } = userSchema.validate(
      {
        name: "bob",
        password: "StrongPass123!",
      },
      { abortEarly: false },
    );
    expect(error.details.find((d) => d.context.key == "email")).toBeDefined();
  });
  it("3. Require a valid email", () => {
    const { error } = userSchema.validate(
      {
        name: "bob",
        password: "StrongPass123",
        email: "not-an-email",
      },
      { abortEarly: false },
    );
    expect(error.details.find((d) => d.context.key == "email")).toBeDefined();
  });
  it("4. Requires a password", () => {
    const { error } = userSchema.validate(
      {
        name: "bob",
        email: "bob@gamil.com",
      },
      { abortEarly: false },
    );
    expect(
      error.details.find((d) => d.context.key === "password"),
    ).toBeDefined();
  });
  it("5. Requires name", () => {
    const { error } = userSchema.validate(
      {
        email: "bob@gmail.com",
        password: "StrongPass123!!!",
      },
      { abortEarly: false },
    );
    expect(error.details.find((d) => d.context.key === "name")).toBeDefined();
  });
  it("6. requires a valid name length", () => {
    const { error } = userSchema.validate({
      name: "bo",
      password: "StrongPass123",
      email: "bob@gmail.com",
    });
    expect(
      error.details.find((detail) => detail.context.key === "name"),
    ).toBeDefined();
  });
  it("7. Valid user object returns no error", () => {
    const { error } = userSchema.validate(
      {
        name: "bob smith",
        email: "bob@gmail.com",
        password: "StrongPass123???",
      },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
  });
});

describe("Task object validation test:", () => {
  it("8. task requires a title", () => {
    const { error } = taskSchema.validate(
      {
        isComplete: false,
        priority: "medium",
      },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "title"),
    ).toBeDefined();
  });

  it("9. require isCompleted to be valid when specified", () => {
    const { error } = taskSchema.validate(
      {
        title: "title",
        isCompleted: "yes",
      },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key === "isCompleted"),
    ).toBeDefined();
  });
  it("10. default isCompleted to false", () => {
    const { error, value } = taskSchema.validate(
      {
        title: "title",
      },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
    expect(value.isCompleted).toBe(false);
  });
  it("11. keeps the provided value for isCompleted", () => {
    const { error, value } = taskSchema.validate(
      {
        title: "title",
        priority: "medium",
        isCompleted: true,
      },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
    expect(value.isCompleted).toBe(true);
  });
});
describe("patchTaskSchema validation tests", () => {
  it("12. does not require a title", () => {
    const { error } = patchTaskSchema.validate({
      isCompleted: true,
    });

    expect(error).toBeFalsy();
  });

  it("13. leaves isCompleted undefined when not provided", () => {
    const { error, value } = patchTaskSchema.validate({
      title: "Buy milk",
    });

    expect(error).toBeFalsy();
    expect(value.isCompleted).toBeUndefined();
  });
});
