import { Request, Response, NextFunction } from "express";
import { userModel } from "../models/userModel";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types";
import "dotenv/config";

export const auth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.jwt || req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ message: "No token" });
    return;
  }
  try {
    if (!process.env.JWT_SECRET) return;
    const userId = await jwt.verify(token, process.env.JWT_SECRET); //TODO: Replace MY-SECRET-KEY with .env
    const user = await userModel.findById(userId);
    if (!user) {
      res.status(401).json({ message: "Auth failed" });
      return;
    }
    req.user = user;

    next();
  } catch (e) {
    res.status(401).json({ message: "Auth failed" });
    return;
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    if (!process.env.JWT_SECRET) return;
    const user = await userModel.create(req.body);

    const token = jwt.sign(user?._id.toString(), process.env.JWT_SECRET, {
      expiresIn: "90d",
    }); //TODO: MAKE A BETTER KEY
    const jwtExpires = 90; //TODO: Add JWTExpires
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + jwtExpires * 24 * 60 * 60 * 1000),
      httpOnly: true,
      // sameSite: "none",
      secure: false, // req.secure || req.headers["x-forwarded-proto"] === "https",
    });
    res.status(200).json({ data: user, token });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const user = await userModel
      .findOne({ email: req.body.email })
      .select("+password");
    if (!user || !(await user.checkPassword(req.body.password, user.password!)))
      return res.status(400).json({ message: "Wrong email or password" });

    if (!process.env.JWT_SECRET) return;
    const jwtExpires = 90; //TODO: Add JWTExpires
    const token = jwt.sign(user._id.toString(), process.env.JWT_SECRET, {
      expiresIn: "90d",
    });
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + jwtExpires * 24 * 60 * 60 * 1000),
      httpOnly: true,
      // sameSite: "none",
      secure: false, // req.secure || req.headers["x-forwarded-proto"] === "https",
    });
    res.status(200).json({ data: user, token });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};
