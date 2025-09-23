import User from "../models/User.js";

describe("User Model", () => {
  describe("Password Hashing", () => {
    it("should hash password before saving", async () => {
      const userData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: "user" as const,
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe("password123");
      expect(user.password).toMatch(/^\$2a\$\d+\$.+/); // bcrypt hash format

      // Test password verification
      const isValidPassword = await user.validatePassword("password123");
      expect(isValidPassword).toBe(true);

      const isInvalidPassword = await user.validatePassword("wrongpassword");
      expect(isInvalidPassword).toBe(false);
    });
  });

  describe("User Creation", () => {
    it("should create user with required fields", async () => {
      const userData = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        username: "testuser2",
        email: "test2@example.com",
        password: "password123",
        role: "user" as const,
      };

      const user = await User.create(userData);

      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username", "testuser2");
      expect(user).toHaveProperty("email", "test2@example.com");
      expect(user).toHaveProperty("role", "user");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
    });

    it("should fail without required fields", async () => {
      try {
        await User.create({
          username: "testuser3",
          // Missing email, password, role
        });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.name).toBe("SequelizeValidationError");
      }
    });
  });

  describe("User Instance Methods", () => {
    let user: any;

    beforeEach(async () => {
      user = await User.create({
        id: "123e4567-e89b-12d3-a456-426614174002",
        username: "testuser4",
        email: "test4@example.com",
        password: "password123",
        role: "user",
      });
    });

    it("should have toJSON method that excludes password", () => {
      const userJSON = user.toJSON();
      expect(userJSON).not.toHaveProperty("password");
      expect(userJSON).toHaveProperty("id");
      expect(userJSON).toHaveProperty("username");
      expect(userJSON).toHaveProperty("email");
      expect(userJSON).toHaveProperty("role");
    });

    it("should update user data", async () => {
      await user.update({
        username: "updateduser",
        email: "updated@example.com",
      });

      await user.reload();
      expect(user.username).toBe("updateduser");
      expect(user.email).toBe("updated@example.com");
    });
  });
});
