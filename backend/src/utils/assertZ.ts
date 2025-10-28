import { z } from "zod";

export function assertZ(schema: z.ZodSchema, data: unknown) {
	const result = schema.safeParse(data);
	if (!result.success) throw new Error(result.error.message);
	return result.data;
}
