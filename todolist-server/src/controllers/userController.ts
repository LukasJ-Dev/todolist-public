import { Request, Response } from "express";
import { userModel } from "../models/userModel";

export const getAllUsers = async(req: Request, res: Response) => {
    const users = await userModel.find();
    res.status(200).json({data: {users}});
}