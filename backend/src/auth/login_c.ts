import { Request, Response } from "express";
import { Jwt } from "../modules/Jwt";
import { Crypt } from "../modules/Crypt";
import { UserRepo } from "../User/UserRepo";
import { z } from "zod";
import { assertZ } from "../utils/assertZ";
import { handler } from "../utils/handler";
import { ENV } from "../utils/loadEnv";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const login_c = handler(async (req: Request, res: Response) => {
	assertZ(loginSchema, req.body);

	const user = (await UserRepo.getUserByEmail(req.body.email)) as {
		_id: string;
		email: string;
		hashedPassword: string;
	};
	
	if (!user) {
		return res.status(401).json({ error: "User not found" });
	}

	const isPasswordValid = await Crypt.comparePassword(
		req.body.password,
		user.hashedPassword
	);
	
	if (!isPasswordValid) {
		return res.status(401).json({ error: "Invalid credentials" });
	}

	const token = Jwt.generateToken({ userId: user._id, email: user.email });
	
	console.log("Login successful", user.email);
	
	// Set token in cookie (optional - can also just return in body)
	res.cookie("auth_token", token, {
		httpOnly: true,
		secure: ENV.MODE === "production",
		sameSite: ENV.MODE === "production" ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});

	res.json({
		message: "Login successful",
		token,
		userId: user._id,
		email: user.email,
	});
});
