import { createLoginHandler } from "../../_lib/auth-handlers.js";
import { USER_ROLES } from "../../_lib/auth.js";

export default createLoginHandler({
  role: USER_ROLES.SELLER,
});
