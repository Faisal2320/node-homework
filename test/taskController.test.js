require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const { EventEmitter } = require("events");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  user1 = await prisma.user.create({
    data: { name: "Bob", email: "bob@gmail.com", hashedPassword: "nonsense" },
  });
  user2 = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@gmail.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. Creates a task", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "mock task" },
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
    // expect(saveRes.statusCode).toBe(201);
  });
  it("15. can't create a task with a bogus user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: 9000 };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    try {
      await waitForRouteHandlerCompletion(create, req, res);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });
  it("16. create succeeds with a valid user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "buy milk" },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("17. returned object has expected title", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("buy milk");
  });
  it("18. returned object has correct isCompleted value", () => {
    expect(saveData.isCompleted).toBe(false);
  });
  it("19. returned object does not contain userId", () => {
    expect(saveData.userId).toBeUndefined();
    saveTaskId = saveData.id;
  });
});
describe("test getting created tasks", () => {
  it("20. can't get a list of tasks without a user id", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    try {
      await waitForRouteHandlerCompletion(index, req, res);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  it("21. If ou use user1's id on index() the call returns a 200 status", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("22. The returned object has a task array of length 1", async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks.length).toBe(1);
  });
  it("23. The title of the first array object is as expected.", async () => {
    expect(saveData.tasks[0].title).toBe("buy milk");
  });
  it("24. the first array object does not contain a userId.", async () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });
  it("25. user2 gets a 404", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user2.id };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, res);
    expect(res.statusCode).toBe(404);
  });
  it("26. user1 can retrieve the created task.", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };

    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, res);
    expect(res.statusCode).toBe(200);
  });
  it("27. user2 can't retrieve user1 task", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("testing task update and delete", () => {
  it("28. User1 can update the task", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };

    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(update, req, res);
    expect(res.statusCode).toBe(200);
  });

  it("29. User2 can't update the task.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };

    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(update, req, res);
    expect(res.statusCode).toBe(404);
  });

  it("30. User2 can't delete the task.", async () => {
    const req = httpMocks.createRequest({ method: "DELETE" });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(deleteTask, req, res);
    expect(res.statusCode).toBe(404);
  });

  it("31. User1 can delete the task.", async () => {
    const req = httpMocks.createRequest({ method: "DELETE" });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(deleteTask, req, res);
    expect(res.statusCode).toBe(200);
  });

  it("32. Retrieving user1 tasks now returns a 404.", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    req.user = { id: user1.id };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, res);
    expect(res.statusCode).toBe(404);
  });
});
