import { createSignupHandler } from "../../_lib/auth-handlers.js";
import { getDefaultStudentCapabilities, USER_ROLES } from "../../_lib/auth.js";

export default createSignupHandler({
  role: USER_ROLES.SELLER,
  capabilities: getDefaultStudentCapabilities(),
});
