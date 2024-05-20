import axios from "axios";
import { server } from "./mocks/server";
import APIClient, { axiosInstance, baseURL } from "../src/services/ApiClient";
import { HttpResponse, http } from "msw";

interface ITestEndpoint {
  data: string;
}

const testEndpoint = http.get(`${baseURL}/test-endpoint`, ({ request }) => {
  if (request.headers.get("Authorization") === "JWT new-access-token") {
    return HttpResponse.json({ data: "test-data" });
  }
  return new HttpResponse(null, {
    status: 403,
  });
});

describe("APIClient", () => {
  const getClient = () =>
    new APIClient<ITestEndpoint>("/test-endpoint", axiosInstance);

  it("should fetch data with GET request", async () => {
    const client = getClient();
    const data = await client.get();
    expect(data).toEqual({ data: "posted-data" });
  });

  it("should retrieve multiple items with GET request", async () => {
    server.use(
      http.get(`${baseURL}/test-endpoint`, () =>
        HttpResponse.json([{ data: "posted-data" }, { data: "posted-data-2" }])
      )
    );

    const client = getClient();
    const data = await client.getAll();
    expect(data).toHaveLength(2);
  });

  it("should post data with POST request", async () => {
    const client = getClient();
    const data = await client.post({ data: "test-data" });
    expect(data).toEqual({ data: "posted-data" });
  });

  it("should handle token refresh on 403 response", async () => {
    server.use(testEndpoint);

    // Set initial tokens in localStorage
    localStorage.setItem("access", "old-access-token");
    localStorage.setItem("refresh", "old-refresh-token");

    const client = getClient();
    const data = await client.get();
    expect(data).toEqual({ data: "test-data" });
    expect(localStorage.getItem("access")).toBe("new-access-token");
    expect(localStorage.getItem("refresh")).toBe("new-refresh-token");
  });

  it("should clear tokens and reject request if token refresh fails", async () => {
    // Simulate token refresh failure
    server.use(
      http.post(`${baseURL}/accounts/jwt/refresh`, () => {
        return new HttpResponse(null, {
          status: 403,
        });
      }),
      testEndpoint
    );

    // Set initial tokens in localStorage
    localStorage.setItem("access", "old-access-token");
    localStorage.setItem("refresh", "old-refresh-token");

    const client = getClient();

    try {
      await client.get();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Now we can safely assert on the error response
        expect(error.response.status).toBe(403);
      } else {
        throw error; // Re-throw the error if it's not the expected shape
      }
    } finally {
      expect(localStorage.getItem("access")).toBe(null);
      expect(localStorage.getItem("refresh")).toBe(null);
    }
  });
});
