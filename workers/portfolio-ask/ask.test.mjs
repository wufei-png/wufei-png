import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAsk } from "./ask.mjs";
import { sources } from "./sources.mjs";

const endpoint = "https://worker.example/api/ask";
const origin = "https://wufei-png.github.io";
const testKey = "fixture-only";

function setup({ reserve = () => true, provider } = {}) {
  const calls = { budget: 0, openai: [] };
  const env = {
    ASK_ALLOWED_ORIGIN: origin,
    ASK_AI_ENABLED: "true",
    OPENAI_API_KEY: testKey,
    ASK_BUDGET: {
      getByName(name) {
        assert.equal(name, "portfolio");
        return {
          async reserve() {
            calls.budget += 1;
            return reserve();
          },
        };
      },
    },
  };
  const fetchOpenAI = async (url, init) => {
    calls.openai.push({ url, init });
    return provider ? provider() : completion({ answer: "Fei Wu co-authored OakInk.", source_ids: ["oakink"] });
  };
  return { calls, env, request: request => handleAsk(request, env, fetchOpenAI) };
}

function question(body = { question: "What is OakInk?" }, headers = {}) {
  return new Request(endpoint, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function completion(answer, status = "completed") {
  return Response.json({
    status,
    output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(answer) }] }],
  });
}

test("the flag defaults to off and overrides a valid key without reserving quota", async () => {
  const { calls, env, request } = setup();
  for (const flag of [undefined, "false", "TRUE"]) {
    env.ASK_AI_ENABLED = flag;
    const status = await request(new Request(endpoint));
    assert.deepEqual(await status.json(), { enabled: false });
    assert.equal(status.headers.get("Cache-Control"), "no-store");
    const response = await request(question());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "disabled" });
  }
  assert.deepEqual(calls, { budget: 0, openai: [] });
});

test("missing secrets or a missing quota binding disable the service", async () => {
  for (const name of ["OPENAI_API_KEY", "ASK_BUDGET"]) {
    const { calls, env, request } = setup();
    delete env[name];
    assert.deepEqual(await (await request(new Request(endpoint))).json(), { enabled: false });
    assert.equal((await request(question())).status, 503);
    assert.deepEqual(calls, { budget: 0, openai: [] });
  }
});

test("the enabled status and preflight allow the portfolio without consuming quota", async () => {
  const { calls, request } = setup();
  const response = await request(new Request(endpoint, { headers: { Origin: origin } }));
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.deepEqual(await response.json(), { enabled: true });
  const preflight = await request(new Request(endpoint, { method: "OPTIONS", headers: { Origin: origin } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Headers"), "Content-Type");
  const forbidden = await request(question(undefined, { Origin: "https://other.example" }));
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.headers.has("Access-Control-Allow-Origin"), false);
  assert.deepEqual(calls, { budget: 0, openai: [] });
});

test("invalid question, long UTF-8 body and missing origin do not reserve quota", async () => {
  const { calls, request } = setup();
  for (const value of [" ", "a".repeat(301), "脑".repeat(1000), 42]) {
    const response = await request(question({ question: value }));
    assert.equal(response.status, 400);
  }
  const direct = new Request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "test" }),
  });
  assert.equal((await request(direct)).status, 403);
  assert.deepEqual(calls, { budget: 0, openai: [] });
});

test("the daily cap and a failure in quota storage stop the model call", async () => {
  const capped = setup({ reserve: () => false });
  const exhausted = await capped.request(question());
  assert.equal(exhausted.status, 429);
  assert.deepEqual(await exhausted.json(), { error: "daily_limit" });
  assert.equal(capped.calls.openai.length, 0);

  const offline = setup({ reserve() { throw new Error("Storage unavailable"); } });
  const unavailable = await offline.request(question());
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: "unavailable" });
  assert.equal(offline.calls.openai.length, 0);
});

test("the worker chooses the model and returns only the answer and allowed sources", async () => {
  const { calls, request } = setup();
  const response = await request(question({ question: "  OakInk 有什么用途？ ", model: "visitor-model" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    answer: "Fei Wu co-authored OakInk.",
    sources: [{ title: sources.oakink.title, url: sources.oakink.url }],
  });
  assert.equal(calls.budget, 1);
  assert.equal(calls.openai.length, 1);
  const [{ url, init }] = calls.openai;
  assert.equal(url, "https://api.openai.com/v1/responses");
  assert.equal(init.headers.Authorization, `Bearer ${testKey}`);
  assert.equal(init.redirect, "error");
  const body = JSON.parse(init.body);
  assert.equal(body.model, "gpt-6.2-sol");
  assert.equal(body.input, "OakInk 有什么用途？");
  assert.equal(body.store, false);
  assert.equal(body.service_tier, "default");
  assert.equal(body.max_output_tokens, 300);
  assert.equal(body.text.format.strict, true);
});

test("credits exhaustion, truncated responses and unknown citations cannot leak upstream data", async () => {
  const providers = [
    () => Response.json({ error: { code: "credit_balance_exhausted", message: testKey } }, { status: 429 }),
    () => completion({ answer: "Partial", source_ids: [] }, "incomplete"),
    () => completion({ answer: "Fake source", source_ids: ["__proto__"] }),
    () => { throw new Error(testKey); },
  ];
  for (const provider of providers) {
    const { calls, request } = setup({ provider });
    const response = await request(question());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "unavailable" });
    assert.equal(response.headers.has("Authorization"), false);
    assert.equal(calls.budget, 1);
    assert.equal(calls.openai.length, 1);
  }
});
