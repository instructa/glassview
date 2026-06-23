import { handleRequest } from "./app";
import type { GlassviewEnv } from "./types";

export default {
  fetch(request: Request, env: GlassviewEnv): Promise<Response> {
    return handleRequest(request, env);
  },
};
