import { expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

import { requiredEnv } from "./test-env";

/** Signs in as the seeded Editor through the REST API and returns auth headers. */
export async function editorHeaders(request: APIRequestContext) {
  const response = await request.post("/api/users/login", {
    data: {
      email: requiredEnv("TEST_EDITOR_EMAIL"),
      password: requiredEnv("TEST_EDITOR_PASSWORD"),
    },
  });
  expect(response.ok()).toBe(true);
  const { token } = await response.json();
  return { Authorization: `JWT ${token}` };
}
