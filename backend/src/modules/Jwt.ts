// import { log } from "console";
import jwt from "jsonwebtoken";
import { ENV } from "../utils/loadEnv";

export const Jwt = {
	generateToken(payload: object, options?: jwt.SignOptions): string {
		const secret = ENV.JWT_SECRET!;
		// log({ secret });
		return jwt.sign(payload, secret, options);
	},
	verifyToken<T>(token: string, options?: jwt.VerifyOptions): T {
		return jwt.verify(token, ENV.JWT_SECRET!, options) as T;
	},
};
