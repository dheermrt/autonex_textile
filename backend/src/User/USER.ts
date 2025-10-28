import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		hashedPassword: { type: String, required: true },
		revolution_counter_1: {
			type: {
				orgId: {
					// the organization's user id
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "USER",
				},
				role: {
					type: String,
					required: true,
					enum: ["admin", "operator", "supervisor"],
				},
				ticket: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "TICKET",
				},
			},
			required: false,
		},
		workforce_2: {
			type: {
				orgId: {
					// the organization's user id
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "USER",
				},
				role: {
					type: String,
					required: true,
					enum: ["admin", "worker", "supervisor"],
				},
				ticket: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "TICKET",
				},
			},
			required: false,
		},
		donear_3: {
			type: {
				orgId: {
					// the organization's user id
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "USER",
				},
				role: {
					type: String,
					required: true,
					enum: ["admin", "analyst", "viewer"],
				},
				ticket: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					ref: "TICKET",
				},
			},
			required: false,
		},
		super_management_0: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export const USER = mongoose.models.USER || mongoose.model("USER", UserSchema);
