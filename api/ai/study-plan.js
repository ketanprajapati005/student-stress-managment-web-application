import { createHandler } from "../_handler.js";
import { handleStudyPlan } from "../../backend/lib/studyPlan.js";

export default createHandler(handleStudyPlan);
