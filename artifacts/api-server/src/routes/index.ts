import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);

export default router;
