import {
  APIResponse,
  Response,
  expect as baseExpect,
  test,
} from "@playwright/test";
import { assertDefined } from "~/src/helpers.js";

const expect = baseExpect.extend({
  async toHaveHeader(
    response: Promise<APIResponse | Response> | APIResponse | Response,
    header: string,
    expected: string | string[]
  ) {
    const assertionName = "toHaveHeader";
    let pass: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matcherResult: any;
    response = await response;

    try {
      if (Array.isArray(expected)) {
        baseExpect(
          response.headers()[header],
          `${response.url()} ${header}=${response.headers()[header]} header`
        ).toEqual(
          expected.find(
            (matchingExpected) =>
              matchingExpected === response.headers()[header]
          ) ?? expected
        );
      } else {
        baseExpect(
          response.headers()[header],
          `${response.url()} ${header}=${response.headers()[header]} header`
        ).toEqual(expected);
      }
      pass = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      matcherResult = e.matcherResult;
      pass = false;
    }

    const message = pass
      ? () =>
          this.utils.matcherHint(assertionName, undefined, undefined, {
            isNot: this.isNot,
          }) +
          "\n\n" +
          `Header: ${header}\n` +
          `Expected: not ${this.utils.printExpected(expected)}\n` +
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          (matcherResult
            ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
            : "")
      : () =>
          this.utils.matcherHint(assertionName, undefined, undefined, {
            isNot: this.isNot,
          }) +
          "\n\n" +
          `Header: ${header}\n` +
          `Expected: ${this.utils.printExpected(expected)}\n` +
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          (matcherResult
            ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
            : "");

    return {
      message,
      pass,
      name: assertionName,
      expected,
      actual: matcherResult?.actual,
    };
  },
});

const cacheControl = "cache-control";
// Wrangler maps public, no-cache to this for HTML files.
// They appear to be functionally equivalent: https://stackoverflow.com/a/19938619
// I suspect this is some backwards compatibility conversion.
const mustRevalidate = "public, max-age=0, must-revalidate";
const noCache = "public, no-cache";
const hashedAssetCache = "public, max-age=31536000, immutable";

const requestOps = { failOnStatusCode: true } as const;

test.describe(
  "HTTP Header Cache-Control",
  { tag: "@needs-preview-server" },
  () => {
    test("it should set no-cache on unhashed files", async ({ request }) => {
      await expect(request.get("/", requestOps)).toHaveHeader(
        cacheControl,
        mustRevalidate
      );
      await expect(request.get("/index.html", requestOps)).toHaveHeader(
        cacheControl,
        mustRevalidate
      );
      await expect(request.get("/manifest.json", requestOps)).toHaveHeader(
        cacheControl,
        noCache
      );
      await expect(request.get("/robots.txt", requestOps)).toHaveHeader(
        cacheControl,
        noCache
      );
      await expect(
        request.get("/no-cache-assets/icons/favicon-ear-v1.svg", requestOps)
      ).toHaveHeader(cacheControl, noCache);
    });
    test("it should set max-age, immutable on hashed files", async ({
      request,
    }) => {
      const responseBody = await (await request.get("/", requestOps)).text();
      const urls = [
        ...responseBody.matchAll(/(\/assets\/index-[A-Za-z0-9-]+\.[js|css])/g),
      ];

      expect(urls).toHaveLength(2);

      for (const urlSet of urls) {
        const url = urlSet[1];
        expect(url).toBeDefined();
        assertDefined(url);
        await expect(request.get(url, requestOps)).toHaveHeader(
          cacheControl,
          hashedAssetCache
        );
      }
    });

    // Try to detect other assets aside from the primary JS and CSS files
    test("it should set correct headers on all resources requested on page load", async ({
      page,
    }) => {
      const responseUrls: string[] = [];
      page.on("response", async (response) => {
        const url = response.url();
        responseUrls.push(url);
        if (url.includes("/assets/")) {
          await expect(response).toHaveHeader(cacheControl, hashedAssetCache);
        } else {
          await expect(response).toHaveHeader(cacheControl, [
            noCache,
            mustRevalidate,
          ]);
        }
      });
      await page.goto(".", { waitUntil: "networkidle" });

      expect(
        responseUrls.find((url) =>
          /\/assets\/index-[A-Za-z0-9-]+\.js/.test(url)
        )
      ).toBeDefined();
      expect(
        responseUrls.find((url) =>
          /\/assets\/index-[A-Za-z0-9-]+\.css/.test(url)
        )
      ).toBeDefined();
      expect(
        responseUrls.find((url) =>
          /\/assets\/empty-board-[A-Za-z0-9-]+\.webp/.test(url)
        )
      ).toBeDefined();
    });
  }
);

test.describe(
  "HTTP Header Content-Security-Policy",
  { tag: "@needs-preview-server" },
  () => {
    test("it should set CSP header", async ({ request }) => {
      expect(
        (await request.get("/")).headers()["content-security-policy"]
      ).toBeDefined();
    });
  }
);
