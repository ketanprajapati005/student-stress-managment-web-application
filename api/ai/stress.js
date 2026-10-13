import { createHandler } from "../_handler.js";
import { handleStress } from "../../backend/lib/stress.js";

export default createHandler(handleStress);
