import { OPERATOR_1 } from "../models/OPERATOR_1";
import { SUPERVISOR_1 } from "../models/SUPERVISOR_1";
import { REVOLUTION_COUNTER_1 } from "../models/REVOLUTION_COUNTER_1";
import type { RevolutionCounter } from "../types";

/**
 * MachineService - Optimized Machine Access and Fetching
 * 
 * This service provides efficient role-based machine operations that combine
 * access validation and data fetching in single operations.
 * 
 * OPTIMIZATION STRATEGY:
 * - Single Operation: Access check + fetch in one database query
 * - Unique userId Optimization: Leverage unique userId constraint
 * - Role-Based Logic:
 *   - Admin: Fetch machine if exists in org - 1 query
 *   - Operator: Fetch machine if user is assigned to any shift - 2 queries
 *   - Supervisor: Fetch machine if supervised operators are assigned - 3 queries
 * 
 * PERFORMANCE BENEFITS:
 * - Eliminates separate access validation + fetch operations
 * - Reduces database round trips
 * - Returns null if no access (no exceptions needed)
 * 
 * USAGE:
 * - getMachine(): Get single machine if accessible, null otherwise
 * - getAllMachines(): Get all accessible machines for user
 * - getMachineIds(): Get accessible machine IDs only
 */

export class MachineService {
	/**
	 * Get a single machine if user has access - OPTIMIZED SINGLE OPERATION
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, operator, supervisor)
	 * @param machineId - The machine ID to fetch
	 * @returns Promise<RevolutionCounter | null> - The machine if accessible, null otherwise
	 */
	static async getMachine(
		userId: string,
		orgId: string,
		role: string,
		machineId: string
	): Promise<RevolutionCounter | null> {
		let machine: RevolutionCounter | null = null;

		switch (role) {
			case "admin":
				// Admin: Fetch machine if it exists in org
				machine = await REVOLUTION_COUNTER_1.findOne({
					_id: machineId,
					orgId: orgId.toString(),
				}).populate([
					"yarn",
					"location",
					"shifts.shift",
					{
						path: "shifts.operator",
						populate: {
							path: "user",
							select: "name email",
						},
					},
					{
						path: "shifts.supervisor",
						populate: {
							path: "user",
							select: "name email",
						},
					},
					"lastNeedleChange",
				]);
				break;

			case "operator":
				// Operator: Fetch machine only if user is assigned to any shift
				const operator = await OPERATOR_1.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (operator) {
					machine = await REVOLUTION_COUNTER_1.findOne({
						_id: machineId,
						orgId: orgId.toString(),
						"shifts.operator": operator._id,
					}).populate([
						"yarn",
						"location",
						"shifts.shift",
						{
							path: "shifts.operator",
							populate: {
								path: "user",
								select: "name email",
							},
						},
						{
							path: "shifts.supervisor",
							populate: {
								path: "user",
								select: "name email",
							},
						},
						"lastNeedleChange",
					]);
				}
				break;

			case "supervisor":
				// Supervisor: Fetch machine only if supervised operators are assigned
				const supervisor = await SUPERVISOR_1.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (supervisor) {
					const supervisedOperators = await OPERATOR_1.find({
						supervisor: supervisor._id,
						orgId: orgId.toString(),
					}).select("_id");

					if (supervisedOperators.length > 0) {
						const supervisedOperatorIds = supervisedOperators.map((op) => op._id);

						machine = await REVOLUTION_COUNTER_1.findOne({
							_id: machineId,
							orgId: orgId.toString(),
							"shifts.operator": { $in: supervisedOperatorIds },
						}).populate([
							"yarn",
							"location",
							"shifts.shift",
							{
								path: "shifts.operator",
								populate: {
									path: "user",
									select: "name email",
								},
							},
							{
								path: "shifts.supervisor",
								populate: {
									path: "user",
									select: "name email",
								},
							},
							"lastNeedleChange",
						]);
					}
				}
				break;
		}

		return machine;
	}

	/**
	 * Get all accessible machines for a user - OPTIMIZED SINGLE OPERATION
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, operator, supervisor)
	 * @returns Promise<RevolutionCounter[]> - Array of accessible machines
	 */
	static async getAllMachines(
		userId: string,
		orgId: string,
		role: string
	): Promise<RevolutionCounter[]> {
		let machines: RevolutionCounter[] = [];

		switch (role) {
			case "admin":
				// Admin: Get all machines in org
				machines = await REVOLUTION_COUNTER_1.find({
					orgId: orgId.toString(),
				}).populate([
					"yarn",
					"location",
					"shifts.shift",
					{
						path: "shifts.operator",
						populate: {
							path: "user",
							select: "name email",
						},
					},
					{
						path: "shifts.supervisor",
						populate: {
							path: "user",
							select: "name email",
						},
					},
					"lastNeedleChange",
				]);
				break;

			case "operator":
				// Operator: Get machines where user is assigned to shifts
				const operator = await OPERATOR_1.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (operator) {
					machines = await REVOLUTION_COUNTER_1.find({
						"shifts.operator": operator._id,
						orgId: orgId.toString(),
					}).populate([
						"yarn",
						"location",
						"shifts.shift",
						{
							path: "shifts.operator",
							populate: {
								path: "user",
								select: "name email",
							},
						},
						{
							path: "shifts.supervisor",
							populate: {
								path: "user",
								select: "name email",
							},
						},
						"lastNeedleChange",
					]);
				}
				break;

			case "supervisor":
				// Supervisor: Get machines where supervised operators are assigned
				const supervisor = await SUPERVISOR_1.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (supervisor) {
					const supervisedOperators = await OPERATOR_1.find({
						supervisor: supervisor._id,
						orgId: orgId.toString(),
					}).select("_id");

					if (supervisedOperators.length > 0) {
						const supervisedOperatorIds = supervisedOperators.map((op) => op._id);

						machines = await REVOLUTION_COUNTER_1.find({
							"shifts.operator": { $in: supervisedOperatorIds },
							orgId: orgId.toString(),
						}).populate([
							"yarn",
							"location",
							"shifts.shift",
							{
								path: "shifts.operator",
								populate: {
									path: "user",
									select: "name email",
								},
							},
							{
								path: "shifts.supervisor",
								populate: {
									path: "user",
									select: "name email",
								},
							},
							"lastNeedleChange",
						]);
					}
				}
				break;
		}

		return machines;
	}

	/**
	 * Get accessible machine IDs only - OPTIMIZED FOR CACHE OPERATIONS
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, operator, supervisor)
	 * @returns Promise<string[]> - Array of accessible machine IDs
	 */
	static async getMachineIds(
		userId: string,
		orgId: string,
		role: string
	): Promise<string[]> {
		let machineIds: string[] = [];

		switch (role) {
			case "admin":
				// Admin: Get all machine IDs in org
				const adminMachines = await REVOLUTION_COUNTER_1.find({
					orgId: orgId.toString(),
				}).select("_id");
				machineIds = adminMachines.map((m) => m._id.toString());
				break;

			case "operator":
				// Operator: Get machine IDs where user is assigned to shifts
				const operator = await OPERATOR_1.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (operator) {
					const operatorMachines = await REVOLUTION_COUNTER_1.find({
						"shifts.operator": operator._id,
						orgId: orgId.toString(),
					}).select("_id");
					machineIds = operatorMachines.map((m) => m._id.toString());
				}
				break;

			case "supervisor":
				// Supervisor: Get machine IDs where supervised operators are assigned
				const supervisor = await SUPERVISOR_1.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (supervisor) {
					const supervisedOperators = await OPERATOR_1.find({
						supervisor: supervisor._id,
						orgId: orgId.toString(),
					}).select("_id");

					if (supervisedOperators.length > 0) {
						const supervisedOperatorIds = supervisedOperators.map((op) => op._id);

						const supervisorMachines = await REVOLUTION_COUNTER_1.find({
							"shifts.operator": { $in: supervisedOperatorIds },
							orgId: orgId.toString(),
						}).select("_id");
						machineIds = supervisorMachines.map((m) => m._id.toString());
					}
				}
				break;
		}

		return machineIds;
	}
}
