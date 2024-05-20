import { http, HttpResponse } from "msw";

const baseURL: string | undefined = import.meta.env.VITE_BASE_URL;

export const handlers = [
  http.post(`${baseURL}/accounts/jwt/refresh`, () =>
    HttpResponse.json({
      access: "new-access-token",
      refresh: "new-refresh-token",
    })
  ),
  http.get(`${baseURL}/test-endpoint`, () =>
    HttpResponse.json({ data: "posted-data" })
  ),
  http.post(`${baseURL}/test-endpoint`, () => {
    return HttpResponse.json({ data: "posted-data" });
  }),
];
