import { createHandler } from "../_handler.js";
import { handleChat } from "../../backend/lib/chat.js";

export default createHandler(handleChat);
