import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clientsRouter from "./clients";
import shootsRouter from "./shoots";
import paymentsRouter from "./payments";
import freelancersRouter from "./freelancers";
import staffRouter from "./staff";
import expensesRouter from "./expenses";
import pnlRouter from "./pnl";
import deliverablesRouter from "./deliverables";
import contentRouter from "./content";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(clientsRouter);
router.use(shootsRouter);
router.use(paymentsRouter);
router.use(freelancersRouter);
router.use(staffRouter);
router.use(expensesRouter);
router.use(pnlRouter);
router.use(deliverablesRouter);
router.use(contentRouter);
router.use(dashboardRouter);

export default router;
