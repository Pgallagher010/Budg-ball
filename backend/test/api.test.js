import { assert } from "chai";
import request from "supertest";

let app;

// Integration tests focus on API contracts (black-box style):
// auth guard behavior, response envelope, and key happy paths.
describe("Budg'Ball API integration tests", function () {
  this.timeout(10000);

  before(async () => {
    process.env.USE_MEMORY_DB = "true";
    process.env.ALLOW_DEV_AUTH = "true";
    process.env.FRONTEND_ORIGIN = "http://localhost:3000";
    const mod = await import("../src/app.js");
    app = mod.default;
  });

  it("returns health payload", async () => {
    const res = await request(app).get("/health").expect(200);
    assert.isTrue(res.body.success);
    assert.equal(res.body.data.status, "ok");
  });

  it("blocks unauthenticated API calls", async () => {
    const res = await request(app).get("/api/users/me").expect(401);
    assert.isFalse(res.body.success);
  });

  it("creates profile and fetches dashboard summary", async () => {
    await request(app)
      .post("/api/users/me")
      .set("x-dev-user-id", "react_user_1")
      .send({
        username: "react_user_1",
        displayName: "React User",
      })
      .expect(201);

    const summary = await request(app)
      .get("/api/dashboard/summary")
      .set("x-dev-user-id", "react_user_1")
      .expect(200);

    assert.isTrue(summary.body.success);
    assert.property(summary.body.data, "ballimal");
  });
});
