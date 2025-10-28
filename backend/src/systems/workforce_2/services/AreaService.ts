import { WORKER_2 } from "../models/WORKER_2";
import { SUPERVISOR_2 } from "../models/SUPERVISOR_2";
import { AREA_2 } from "../models/AREA_2";
import type { Area } from "../types";

/**
 * AreaService - Optimized Area Access and Fetching
 * 
 * This service provides efficient role-based area operations that combine
 * access validation and data fetching in single operations.
 * 
 * OPTIMIZATION STRATEGY:
 * - Single Operation: Access check + fetch in one database query
 * - Unique userId Optimization: Leverage unique userId constraint
 * - Role-Based Logic:
 *   - Admin: Fetch area if exists in org - 1 query
 *   - Worker: Fetch area if user is assigned to any shift - 2 queries
 *   - Supervisor: Fetch area if supervised workers are assigned - 3 queries
 * 
 * PERFORMANCE BENEFITS:
 * - Eliminates separate access validation + fetch operations
 * - Reduces database round trips
 * - Returns null if no access (no exceptions needed)
 * 
 * USAGE:
 * - getArea(): Get single area if accessible, null otherwise
 * - getAllAreas(): Get all accessible areas for user
 * - getAreaIds(): Get accessible area IDs only
 */

export class AreaService {
	/**
	 * Get a single area if user has access - OPTIMIZED SINGLE OPERATION
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, worker, supervisor)
	 * @param areaId - The area ID to fetch
	 * @returns Promise<Area | null> - The area if accessible, null otherwise
	 */
	static async getArea(
		userId: string,
		orgId: string,
		role: string,
		areaId: string
	): Promise<Area | null> {
		let area: Area | null = null;

		switch (role) {
			case "admin":
				// Admin: Fetch area if it exists in org
				area = await AREA_2.findOne({
					_id: areaId,
					orgId: orgId.toString(),
				}).populate([
					"shifts.shift",
					{
						path: "shifts.worker",
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
				]);
				break;

			case "worker":
				// Worker: Fetch area only if user is assigned to any shift
				const worker = await WORKER_2.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (worker) {
					area = await AREA_2.findOne({
						_id: areaId,
						orgId: orgId.toString(),
						"shifts.worker": worker._id,
					}).populate([
						"shifts.shift",
						{
							path: "shifts.worker",
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
					]);
				}
				break;

			case "supervisor":
				// Supervisor: Fetch area only if supervised workers are assigned
				const supervisor = await SUPERVISOR_2.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (supervisor) {
					const supervisedWorkers = await WORKER_2.find({
						supervisor: supervisor._id,
						orgId: orgId.toString(),
					}).select("_id");

					if (supervisedWorkers.length > 0) {
						const supervisedWorkerIds = supervisedWorkers.map((w) => w._id);

						area = await AREA_2.findOne({
							_id: areaId,
							orgId: orgId.toString(),
							"shifts.worker": { $in: supervisedWorkerIds },
						}).populate([
							"shifts.shift",
							{
								path: "shifts.worker",
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
						]);
					}
				}
				break;
		}

		return area;
	}

	/**
	 * Get all accessible areas for a user - OPTIMIZED SINGLE OPERATION
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, worker, supervisor)
	 * @returns Promise<Area[]> - Array of accessible areas
	 */
	static async getAllAreas(
		userId: string,
		orgId: string,
		role: string
	): Promise<Area[]> {
		let areas: Area[] = [];

		switch (role) {
			case "admin":
				// Admin: Get all areas in org
				areas = await AREA_2.find({
					orgId: orgId.toString(),
				}).populate([
					"shifts.shift",
					{
						path: "shifts.worker",
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
				]);
				break;

			case "worker":
				// Worker: Get areas where user is assigned to shifts
				const worker = await WORKER_2.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (worker) {
					areas = await AREA_2.find({
						"shifts.worker": worker._id,
						orgId: orgId.toString(),
					}).populate([
						"shifts.shift",
						{
							path: "shifts.worker",
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
					]);
				}
				break;

			case "supervisor":
				// Supervisor: Get areas where supervised workers are assigned
				const supervisor = await SUPERVISOR_2.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (supervisor) {
					const supervisedWorkers = await WORKER_2.find({
						supervisor: supervisor._id,
						orgId: orgId.toString(),
					}).select("_id");

					if (supervisedWorkers.length > 0) {
						const supervisedWorkerIds = supervisedWorkers.map((w) => w._id);

						areas = await AREA_2.find({
							"shifts.worker": { $in: supervisedWorkerIds },
							orgId: orgId.toString(),
						}).populate([
							"shifts.shift",
							{
								path: "shifts.worker",
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
						]);
					}
				}
				break;
		}

		return areas;
	}

	/**
	 * Get accessible area IDs only - OPTIMIZED FOR CACHE OPERATIONS
	 * @param userId - The user's ID
	 * @param orgId - The organization ID
	 * @param role - The user's role (admin, worker, supervisor)
	 * @returns Promise<string[]> - Array of accessible area IDs
	 */
	static async getAreaIds(
		userId: string,
		orgId: string,
		role: string
	): Promise<string[]> {
		let areaIds: string[] = [];

		switch (role) {
			case "admin":
				// Admin: Get all area IDs in org
				const adminAreas = await AREA_2.find({
					orgId: orgId.toString(),
				}).select("_id");
				areaIds = adminAreas.map((a) => a._id.toString());
				break;

			case "worker":
				// Worker: Get area IDs where user is assigned to shifts
				const worker = await WORKER_2.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (worker) {
					const workerAreas = await AREA_2.find({
						"shifts.worker": worker._id,
						orgId: orgId.toString(),
					}).select("_id");
					areaIds = workerAreas.map((a) => a._id.toString());
				}
				break;

			case "supervisor":
				// Supervisor: Get area IDs where supervised workers are assigned
				const supervisor = await SUPERVISOR_2.findOne({
					user: userId,
					orgId: orgId.toString(),
				}).select("_id");

				if (supervisor) {
					const supervisedWorkers = await WORKER_2.find({
						supervisor: supervisor._id,
						orgId: orgId.toString(),
					}).select("_id");

					if (supervisedWorkers.length > 0) {
						const supervisedWorkerIds = supervisedWorkers.map((w) => w._id);

						const supervisorAreas = await AREA_2.find({
							"shifts.worker": { $in: supervisedWorkerIds },
							orgId: orgId.toString(),
						}).select("_id");
						areaIds = supervisorAreas.map((a) => a._id.toString());
					}
				}
				break;
		}

		return areaIds;
	}
}
