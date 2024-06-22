import { Router } from "express";
import zod from "zod";
import data from "../db.js";
// import dataConfig from "../config.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware.js";

const userRouter = Router();

const signupSchema = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const updateSchema = zod.object({
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  password: zod.string().optional(),
});

// Signup route
userRouter.post("/signup", async (req, res) => {
  try {
    const body = req.body;
    const { success, error } = signupSchema.safeParse(body);
    if (!success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: error.errors,
      });
    }

    const dbUser = await data.User.findOne({
      username: body.username,
    });

    if (dbUser) {
      return res.status(409).json({
        message: "Email already taken",
      });
    }

    // const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = new data.User({
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password,
    });

    const result = await user.save();
    const userId = user._id;
    const token = jwt.sign(
      {
        userId,
      },
      process.env.JWT_SECRET
    );
    await data.Account.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });
    res.status(200).json({
      message: "User created successfully",
      token: token,
      userId,
    });
  } catch (error) {
    return res.status(409).json({
      message: "Something went wrong",
      error:error.message
    });
  }
});

// Signin route
userRouter.post("/signin", async (req, res) => {
  try {
    const { success, error } = signinBody.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: error.errors,
      });
    }

    const user = await data.User.findOne({
      username: req.body.username,
    });

    if (user && req.body.password === user.password) {
      const token = jwt.sign(
        {
          userId: user._id,
        },
        process.env.JWT_SECRET
      );

      res.status(200).json({
        token: token,
      });
      return;
    }

    res.status(401).json({
      message: "Invalid username or password",
    });
  } catch (error) {
    return res.status(409).json({
      message: "Something went wrong",
      error:error.message
    });
  }
});

// Update route
userRouter.put("/", authMiddleware, async (req, res) => {
  try {
    const body = req.body;
    const { success, error } = updateSchema.safeParse(body);
    if (!success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: error.errors,
      });
    }

    // if (body.password) {
    //     body.password = await bcrypt.hash(body.password, 10);
    // }

    await data.User.updateOne({ _id: req.userId }, { $set: body });

    const token = jwt.sign(
      {
        userId: req.userId,
      },
      process.env.JWT_SECRET
    );

    res.json({
      message: "User updated successfully",
      token: token,
    });
  } catch (error) {
    return res.status(409).json({
      message: "Something went wrong",
      error:error.message
    });
  }
});

// Bulk get route
userRouter.get("/bulk", authMiddleware,async (req, res) => {
  try {
    const filter = req.query.filter || "";
    const users = await data.User.find({
      $or: [
        {
          firstName: {
            $regex: filter,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: filter,
            $options: "i",
          },
        },
      ],
    });
    const rowData=users.map((user) => ({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        _id: user._id,
      }))
      const filterData=rowData.filter((item) => {
        return item._id.toString() !== req.userId;
      });
    res.json({
      users: filterData,
    });
  } catch (error) {
    return res.status(409).json({
      message: "Something went wrong",
      error:error.message
    });
  }
});

export default userRouter;
