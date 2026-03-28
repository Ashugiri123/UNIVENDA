import { createSignupHandler } from "../../_lib/auth-handlers.js";
import { USER_ROLES } from "../../_lib/auth.js";

export default createSignupHandler({
  role: USER_ROLES.CUSTOMER,
  capabilities: [],
});
