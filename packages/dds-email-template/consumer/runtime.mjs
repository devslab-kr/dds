import * as email from "@devslab-kr/dds-email-template";
import { checkEmailApi } from "./contract.mjs";

process.stdout.write(JSON.stringify(checkEmailApi(email)));
