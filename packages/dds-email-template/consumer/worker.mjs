import * as email from "./packed/index.mjs";
import { checkEmailApi } from "./contract.mjs";

export default {
  fetch() {
    if (typeof document !== "undefined" || typeof window !== "undefined") {
      throw new Error("Workers fixture unexpectedly has browser DOM globals");
    }
    return Response.json(checkEmailApi(email));
  },
};
