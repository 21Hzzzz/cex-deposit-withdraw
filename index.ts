type CoinChain = { chain: string; withdrawable: string; rechargeable: string };
type CoinData = { coin: string; chains: CoinChain[] };
type Snapshot = Record<
  string,
  Record<string, { withdrawable: string; rechargeable: string }>
>;

const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN;
const PROXY = process.env.HTTPS_PROXY;

async function pushNotify(content: string) {
  if (!PUSHPLUS_TOKEN) return;
  await fetch("https://www.pushplus.plus/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: PUSHPLUS_TOKEN,
      title: "充提状态变化",
      content,
      channel: "app",
    }),
    ...(PROXY && { proxy: PROXY }),
  }).catch((e) => console.error("Push error:", e));
}

async function fetchCoins(): Promise<CoinData[]> {
  const res = await fetch("https://api.bitget.com/api/v2/spot/public/coins", {
    ...(PROXY && { proxy: PROXY }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as {
    code: string;
    msg: string;
    data: CoinData[];
  };
  if (json.code !== "00000")
    throw new Error(`Bitget error: ${json.code} ${json.msg}`);
  return json.data;
}

function toSnapshot(data: CoinData[]): Snapshot {
  const snap: Snapshot = {};
  for (const { coin, chains } of data) {
    snap[coin] = {};
    for (const { chain, withdrawable, rechargeable } of chains)
      snap[coin][chain] = { withdrawable, rechargeable };
  }
  return snap;
}

async function printDiff(prev: Snapshot, curr: Snapshot) {
  const lines: string[] = [];
  for (const coin of new Set([...Object.keys(prev), ...Object.keys(curr)])) {
    const pc = prev[coin] ?? {},
      cc = curr[coin] ?? {};
    for (const chain of new Set([...Object.keys(pc), ...Object.keys(cc)])) {
      const p = pc[chain],
        c = cc[chain];
      if (JSON.stringify(p) !== JSON.stringify(c)) {
        const line =
          `[${new Date().toISOString()}] ${coin}/${chain}: ` +
          `withdraw ${p?.withdrawable ?? "N/A"}->${c?.withdrawable ?? "N/A"}, ` +
          `recharge ${p?.rechargeable ?? "N/A"}->${c?.rechargeable ?? "N/A"}`;
        console.log(line);
        lines.push(line);
      }
    }
  }
  if (lines.length > 0) await pushNotify(lines.join("<br>"));
}

async function fetchCoinsWithRetry(maxRetries = 5): Promise<CoinData[]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchCoins();
    } catch (e) {
      console.error(`Fetch error (attempt ${i + 1}/${maxRetries}):`, e);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 10_000));
    }
  }
  console.error("Max retries reached, exiting.");
  process.exit(1);
}

let prev = toSnapshot(await fetchCoinsWithRetry());
await Bun.write("snapshot.json", JSON.stringify(prev, null, 2));
console.log(
  `[${new Date().toISOString()}] Snapshot saved (${Object.keys(prev).length} coins).`,
);

setInterval(async () => {
  try {
    const data = await fetchCoinsWithRetry();
    const curr = toSnapshot(data);
    const ts = new Date().toISOString();
    await printDiff(prev, curr);
    const changed = JSON.stringify(prev) !== JSON.stringify(curr);
    console.log(
      `[${ts}] Polled (${data.length} coins, ${changed ? "changes detected" : "no changes"}).`,
    );
    prev = curr;
    await Bun.write("snapshot.json", JSON.stringify(curr, null, 2));
  } catch (e) {
    console.error("Fetch error:", e);
  }
}, 60_000);
