import { Request, Response } from "express";
import { handler } from "../../../utils/handler";
import { AuthenticatedRequest } from "../../../utils/types";
import { SHIFT_REPORT_1 } from "../models/SHIFT_REPORT_1";
import { log } from "console";
import { MachineService } from "../services/MachineService";

export const get_shift_reports = handler(
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				machineId,
			} = req.query as Record<string, string>;
			const pageNum = Number(page);
			const limitNum = Number(limit);
			const { orgId, role } = req.user!.revolution_counter_1!;

			// If machineId is provided, validate access and filter by specific machine
			let accessibleMachineIds: string[] = [];
			if (machineId) {
				// Validate machine access using MachineService
				const machine = await MachineService.getMachine(
					req.user!.userId,
					orgId,
					role,
					machineId
				);
				if (!machine) {
					throw new Error("Machine not found or unauthorized access");
				}
				accessibleMachineIds = [machineId];
			}
			// Get accessible machine IDs using the service
			else {
				accessibleMachineIds = await MachineService.getMachineIds(
					req.user!.userId,
					orgId,
					role
				);
			}

			// If no accessible machines, return empty result
			if (accessibleMachineIds.length === 0) {
				res.json({
					reports: [],
					totalPages: 0,
					currentPage: pageNum,
					totalCount: 0,
				});
				return;
			}

			// Build query with orgId filter and accessible machines
			const query: Record<string, unknown> = {
				orgId: orgId,
				machine: { $in: accessibleMachineIds },
			};

			// If search term is provided, search across shift names
			if (search.trim()) {
				query["shift.name"] = { $regex: search.trim(), $options: "i" };
			}

			// Calculate pagination
			const skip = (pageNum - 1) * limitNum;

			// Execute query with population
			const [reports, totalCount] = await Promise.all([
				SHIFT_REPORT_1.find(query)
					.populate("machine")
					.populate("rollInfo.yarn")
					.populate({
						path: "operator",
						populate: {
							path: "user",
							select: "name email",
						},
					})
					.populate({
						path: "supervisor",
						populate: {
							path: "user",
							select: "name email",
						},
					})
					.populate("downtimeLogs")
					.populate("needleChangeLogs")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limitNum),
				SHIFT_REPORT_1.countDocuments(query),
			]);

			const totalPages = Math.ceil(totalCount / limitNum);

			res.json({
				reports,
				totalPages,
				currentPage: pageNum,
				totalCount,
			});
		} catch (error) {
			log("Error fetching shift reports:", error);
			res.status(500).json({
				error: "Failed to fetch shift reports",
				reports: [],
				totalPages: 0,
				currentPage: 1,
				totalCount: 0,
			});
		}
	}
);
