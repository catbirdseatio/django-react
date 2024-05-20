import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
