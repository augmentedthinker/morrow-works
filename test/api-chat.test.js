import assert from "node:assert/strict";
import test from "node:test";

import handler from "../api/chat.js";

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

test("rejects requests when the server credential is absent", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const response = createResponse();
  await handler({ method: "POST", headers: {}, body: { messages: [] } }, response);

  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /not been connected/i);

  if (previousKey) process.env.GEMINI_API_KEY = previousKey;
});

test("returns a grounded model reply", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = async (_url, options) => {
    const requestBody = JSON.parse(options.body);
    assert.match(requestBody.systemInstruction.parts[0].text, /public guide to Morrow Works/);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "A grounded answer." }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const response = createResponse();
  await handler({
    method: "POST",
    headers: { "x-forwarded-for": "test-client" },
    body: { messages: [{ role: "user", text: "What is this?" }] },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reply, "A grounded answer.");

  globalThis.fetch = previousFetch;
  if (previousKey) process.env.GEMINI_API_KEY = previousKey;
  else delete process.env.GEMINI_API_KEY;
});
