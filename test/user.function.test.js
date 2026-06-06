require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");

let agent;
let saveRes;
const registerUrl = "/api/users/register";
const logonUrl = "/api/users/logon";
const logoffUrl = "/api/users/logoff";
const tasksUrl = "/api/tasks";

const { app, server } = require("../app");

beforeAll(async () => {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  agent = request.agent(app);
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe("register a user", () => {
  let saveRes = null;
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post(registerUrl).send(newUser);
    expect(saveRes.status).toBe(201);
  });
  it("47. Registration returns an object with the expected name", () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  });
  it("48. Returned object includes a csrfToken", () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });
  it("49. User can logon", async () => {
    saveRes = await agent.post(logonUrl).send({
      email: "jdeere@example.com",
      password: "Pa$$word20",
    });
    expect(saveRes.status).toBe(200);
  });
  it("50. Logged in user can access /api/tasks", async () => {
    const res = await agent.get(tasksUrl);
    console.log("50. Response: ", res.body);
    expect(res.status).not.toBe(401);
  });
  it("51. User can log out", async () => {
    saveRes = await agent
      .post(logoffUrl)
      .set("X-CSRF-TOKEN", saveRes.body.csrfToken);
    // console.log("51. headers: ", saveRes.headers["set-cookie"]);
    expect(saveRes.status).toBe(200);
  });
  it("52. After logoff, /api/tasks returns 401", async () => {
    saveRes = await agent.get(tasksUrl);
    // console.log("52. Status Code: ", saveRes.status);
    // console.log("52. Body: ", saveRes.body);
    expect(saveRes.status).toBe(401);
  });
});
