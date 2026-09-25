import request from "supertest";
import app from "../src/app.js";

describe("API Tests", () => {
  describe("Authentication", () => {
    it("should reject signup when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({ email: "test@example.com" }); // Missing fullName and password

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("All fields are required");
    });

    it("should reject signup with invalid/short password", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          fullName: "Test User",
          email: "test@example.com",
          password: "123", // Short password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 6 characters");
    });

    it("should reject unauthenticated access to protected auth endpoint", async () => {
      const response = await request(app).get("/api/auth/check");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorised - No token provided");
    });

    it("should logout successfully", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out succefully");
      // Check if cookie is cleared
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/jwt=;/);
    });
  });

  describe("Messaging / Groups", () => {
    it("should reject unauthenticated message access", async () => {
      const response = await request(app).get("/api/messages/12345");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorised - No token provided");
    });

    it("should reject unauthenticated access to protected group endpoint", async () => {
      const response = await request(app).get("/api/groups");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorised - No token provided");
    });
  });
});
