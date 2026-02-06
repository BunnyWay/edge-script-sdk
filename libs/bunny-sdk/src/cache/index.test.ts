import * as cache from "./index.ts";

describe("cache api", () => {
  describe("default", () => {
    describe("add", () => {
      it("should throw Not Implemented error when calling add", async () => {
        await expect(cache.default.add("/")).rejects.toThrow(
          new Error("Not Implemented"),
        );
      });
    });

    describe("addAll", () => {
      it("should throw Not Implemented error when calling addAll", async () => {
        await expect(cache.default.addAll(["/a", "/b"])).rejects.toThrow(
          new Error("Not Implemented"),
        );
      });
    });

    describe("delete", () => {
      it("should throw Not Implemented error when calling delete", async () => {
        await expect(cache.default.delete("/")).rejects.toThrow(
          new Error("Not Implemented"),
        );
      });
    });

    /**
     * key calls should always throw as this api is not supported
     */
    describe("keys", () => {
      it("should throw not supported error when calling keys()", async () => {
        await expect(cache.default.keys()).rejects.toThrow(
          new Error("Not Supported"),
        );
      });

      it("should throw not supported error when calling keys(req)", async () => {
        const req = {} as Request;
        await expect(cache.default.keys(req)).rejects.toThrow(
          new Error("Not Supported"),
        );
      });

      it("should throw not supported error when calling keys(URL)", async () => {
        const url = new URL("http://example.com");
        await expect(cache.default.keys(url)).rejects.toThrow(
          new Error("Not Supported"),
        );
      });

      it("should throw not supported error when calling keys(string)", async () => {
        await expect(cache.default.keys("/")).rejects.toThrow(
          new Error("Not Supported"),
        );
      });
    });

    describe("match", () => {
      it("should throw Not Implemented error when calling match", async () => {
        await expect(cache.default.match("/")).rejects.toThrow(
          new Error("Not Implemented"),
        );
      });
    });

    /**
     * matchAll calls should always throw as this api is not supported
     */
    describe("matchAll", () => {
      it("should throw not supported error when calling matchAll(req)", async () => {
        const req = {} as Request;
        await expect(cache.default.matchAll(req)).rejects.toThrow(
          new Error("Not Supported"),
        );
      });

      it("should throw not supported error when calling matchAll(req, options)", async () => {
        const req = {} as Request;
        await expect(
          cache.default.matchAll(req, {
            ignoreSearch: true,
            ignoreMethod: true,
          }),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(url)", async () => {
        const url = new URL("http://example.com");
        await expect(cache.default.matchAll(url)).rejects.toThrow(
          new Error("Not Supported"),
        );
      });

      it("should throw not supported error when calling matchAll(url, options)", async () => {
        const url = new URL("http://example.com");
        await expect(
          cache.default.matchAll(url, {
            ignoreSearch: true,
            ignoreMethod: true,
          }),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(string)", async () => {
        await expect(cache.default.matchAll("/")).rejects.toThrow(
          new Error("Not Supported"),
        );
      });

      it("should throw not supported error when calling matchAll(string, options)", async () => {
        await expect(
          cache.default.matchAll("/", {
            ignoreSearch: true,
            ignoreMethod: true,
          }),
        ).rejects.toThrow(new Error("Not Supported"));
      });
    });

    describe("put", () => {
      it("should throw Not Implemented error when calling put", async () => {
        const req = {} as Request;
        const res = {} as Response;
        await expect(cache.default.put(req, res)).rejects.toThrow(
          new Error("Not Implemented"),
        );
      });
    });
  });

  describe("open('custom:cache')", () => {
    describe("add", () => {
      it("should throw Not Implemented error when calling add", async () => {
        await expect(
          cache.open("custom:cache").then((cache) => cache.add("/")),
        ).rejects.toThrow(new Error("Not Implemented"));
      });
    });

    describe("addAll", () => {
      it("should throw Not Implemented error when calling addAll", async () => {
        await expect(
          cache
            .open("custom:cache")
            .then((cache) => cache.addAll(["/a", "/b"])),
        ).rejects.toThrow(new Error("Not Implemented"));
      });
    });

    describe("delete", () => {
      it("should throw Not Implemented error when calling delete", async () => {
        await expect(
          cache.open("custom:cache").then((cache) => cache.delete("/")),
        ).rejects.toThrow(new Error("Not Implemented"));
      });
    });

    describe("keys", () => {
      it("should throw not supported error when calling keys()", async () => {
        await expect(
          cache.open("custom:cache").then((cache) => cache.keys()),
        ).rejects.toThrow(new Error("Not Supported"));
      });
      it("should throw not supported error when calling keys(req)", async () => {
        const req = {} as Request;
        await expect(
          cache.open("custom:cache").then((cache) => cache.keys(req)),
        ).rejects.toThrow(new Error("Not Supported"));
      });
      it("should throw not supported error when calling keys(URL)", async () => {
        const url = new URL("http://example.com");
        await expect(
          cache.open("custom:cache").then((cache) => cache.keys(url)),
        ).rejects.toThrow(new Error("Not Supported"));
      });
      it("should throw not supported error when calling keys(string)", async () => {
        await expect(
          cache.open("custom:cache").then((cache) => cache.keys("/")),
        ).rejects.toThrow(new Error("Not Supported"));
      });
    });

    describe("match", () => {
      it("should throw Not Implemented error when calling match", async () => {
        await expect(
          cache.open("custom:cache").then((cache) => cache.match("/")),
        ).rejects.toThrow(new Error("Not Implemented"));
      });
    });

    describe("matchAll", () => {
      it("should throw not supported error when calling matchAll(req)", async () => {
        const req = {} as Request;
        await expect(
          cache.open("custom:cache").then((cache) => cache.matchAll(req)),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(req, options)", async () => {
        const req = {} as Request;
        await expect(
          cache.open("custom:cache").then((cache) =>
            cache.matchAll(req, {
              ignoreSearch: true,
              ignoreMethod: true,
            }),
          ),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(url)", async () => {
        const url = new URL("http://example.com");
        await expect(
          cache.open("custom:cache").then((cache) => cache.matchAll(url)),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(url, options)", async () => {
        const url = new URL("http://example.com");
        await expect(
          cache.open("custom:cache").then((cache) =>
            cache.matchAll(url, {
              ignoreSearch: true,
              ignoreMethod: true,
            }),
          ),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(string)", async () => {
        await expect(
          cache.open("custom:cache").then((cache) => cache.matchAll("/")),
        ).rejects.toThrow(new Error("Not Supported"));
      });

      it("should throw not supported error when calling matchAll(string, options)", async () => {
        await expect(
          cache.open("custom:cache").then((cache) =>
            cache.matchAll("/", {
              ignoreSearch: true,
              ignoreMethod: true,
            }),
          ),
        ).rejects.toThrow(new Error("Not Supported"));
      });
    });

    describe("put", () => {
      it("should throw Not Implemented error when calling put", async () => {
        const req = {} as Request;
        const res = {} as Response;
        await expect(
          cache.open("custom:cache").then((cache) => cache.put(req, res)),
        ).rejects.toThrow(new Error("Not Implemented"));
      });
    });
  });
});
