import { DurableObject } from "cloudflare:workers";
import { handleAsk } from "./ask.mjs";

const shanghaiDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export class DailyBudget extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS usage (day TEXT PRIMARY KEY, calls INTEGER NOT NULL)");
  }

  reserve() {
    // One named object and one atomic statement cover all concurrent requests.
    const rows = this.sql.exec(
      `INSERT INTO usage (day, calls) VALUES (?, 1)
       ON CONFLICT(day) DO UPDATE SET calls = calls + 1 WHERE calls < 100
       RETURNING calls`,
      shanghaiDay.format(new Date()),
    ).toArray();
    return rows.length === 1;
  }
}

export default {
  fetch(request, env) {
    return handleAsk(request, env);
  },
};
