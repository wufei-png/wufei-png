# Portfolio Q&A Worker

The GitHub Pages site ships with three preset answers. The Worker enables free-form questions when the owner turns on the flag. It sends the question and a curated set of public facts to the OpenAI Responses API using GPT-6.2 Sol. The page receives the answer and verified source links from the catalog in [sources.mjs](sources.mjs).

## Use the subscription's API credits

1. Claim [the API credits benefit](https://developers.openai.com/api/docs/guides/chatgpt-api-credits) and verify the grant in the receiving API organization's billing page.
2. Create a dedicated API project and key in that organization. For a credits-only budget, use an organization that holds only the promotional grant, with no API payment method or automatic recharge. OpenAI stops serving requests when the available credits run out.
3. Deploy this folder to Cloudflare Workers with Wrangler. In the project directory, run `npx wrangler deploy`. Store the project key as the encrypted `OPENAI_API_KEY` Worker Secret with `npx wrangler secret put OPENAI_API_KEY`.
4. Set the public `data-ask-endpoint` attribute in [site/index.html](../../site/index.html) to the Worker URL ending in `/api/ask`, then publish GitHub Pages. `ASK_ALLOWED_ORIGIN` is set to the portfolio's Pages origin in [wrangler.toml](wrangler.toml).

## Turn AI answers on and off

Open the Worker in Cloudflare's dashboard and go to **Settings → Variables and Secrets**. Create the plain-text variable `ASK_AI_ENABLED` and set its value to `true` to open the input, or `false` to pause AI answers. Apply the Worker configuration. A missing flag or secret leaves the service closed. The Worker checks the same flag on every request before reserving quota or calling OpenAI. The page checks availability each time the Q&A dialog opens and always offers the preset answers.

A single SQLite Durable Object reserves at most 100 calls across the entire site per calendar day in Asia/Shanghai. Provider failures count toward the cap. Status checks and preset questions use no model calls. OpenAI receives a maximum of 300 output tokens per request, including reasoning. The Worker stores the daily counter and sends requests with `store: false`.

## Test locally

```sh
node --test workers/portfolio-ask/ask.test.mjs
```

Run this command from the repository root. The tests simulate the provider and cover default-off behavior, the quota gate, malformed requests, and stripped provider errors.
