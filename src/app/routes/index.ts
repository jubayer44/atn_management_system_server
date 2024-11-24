import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { TimeSheetRoutes } from "../modules/TimeSheet/timeSheet.routes";
import { UserRoutes } from "../modules/User/user.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/",
    route: TimeSheetRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
