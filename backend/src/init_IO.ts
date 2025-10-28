import { createAdapter } from "@socket.io/redis-adapter";
import { redisPub, redisSub } from ".";
import { ENV } from "./utils/loadEnv";
import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { log } from "console";
import { Jwt } from "./modules/Jwt";

export const init_IO = (
	httpServer: HttpServer,
	{ originArray }: { originArray: string[] }
) => {
	const io = new Server(httpServer, {
		adapter: createAdapter(redisPub, redisSub),
		cors: {
			origin: originArray,
			methods: ["GET", "POST"],
			credentials: true,
		},
		transports: ["websocket", "polling"],
	});

	run_ios(io);
	return io;
};

function run_ios(io: Server) {
	io.on("connection", async (socket) => {
		const userCookies = socket.handshake.headers.cookie;
		let token = userCookies ? getCookie(userCookies, "auth_token") : undefined;

		if (!token) {
			const authPayload = socket.handshake.auth as
				| { token?: string }
				| undefined;
			token = authPayload?.token;
		}

		if (!token) {
			console.log("No token found in socket connection, throwing error");
			throw new Error("Unauthorized");
		}

		const decoded = Jwt.verifyToken<{ userId: string }>(token);
		if (!decoded || !decoded.userId) {
			console.log("Invalid token in socket connection, throwing error");
			throw new Error("Unauthorized");
		}
		socket.join(decoded.userId);

		log("socket io verified token and joined user to room");

		socket.emit("confirm-room-join");
	});
}

function getCookie(cookies: string, keyName: string) {
	return cookies
		.split(";")
		.find((cookie) => cookie.startsWith(`${keyName}=`))
		?.split("=")[1];
}
