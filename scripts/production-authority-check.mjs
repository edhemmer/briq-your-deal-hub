import { readdir, readFile } from "node:fs/promises";

const failures = [];
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const requirePattern = (path, text, pattern, message) => { if (!pattern.test(text)) failures.push(`${path}: ${message}`); };
const forbidPattern = (path, text, pattern, message) => { if (pattern.test(text)) failures.push(`${path}: ${message}`); };

const packageJson = JSON.parse(await read("package.json"));
const verify = packageJson.scripts?.verify ?? "";
requirePattern("package.json", verify, /npm run lint/, "verify must run lint");
requirePattern("package.json", verify, /npm run check:authority/, "verify must run the authority guard");

const supabase = await read("src/core/supabase.ts");
forbidPattern("src/core/supabase.ts", supabase, /\.supabase\.co["')]/, "runtime code must not contain a production Supabase fallback URL");
requirePattern("src/core/supabase.ts", supabase, /Missing required BRIX environment variable/, "missing environment configuration must fail closed");

const iosService = await read("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift");
forbidPattern("Services.swift", iosService, /rest\/v1\/brix_deals/, "native iOS must not use the legacy Deal table endpoint");
requirePattern("Services.swift", iosService, /rest\/v1\/rpc\//, "native iOS must use canonical RPC boundaries");

const nativeRoot = new URL("../ios/BRIXRealEstateiOS/BRIXRealEstateiOS/", import.meta.url);
const nativeFiles = (await readdir(nativeRoot, { recursive: true }))
  .filter((path) => path.endsWith(".swift") && !path.endsWith("AppState.swift"));
for (const relativePath of nativeFiles) {
  const path = `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/${relativePath}`;
  const source = await read(path);
  forbidPattern(path, source, /state\.analysis\s*\(/, "native presentation code must not invoke the duplicate local underwriting/strategy calculator");
}

const nativeDealIQ = await read("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/DealIQCockpitView.swift");
forbidPattern("DealIQCockpitView.swift", nativeDealIQ, /BrixMetric\(title:\s*"Confidence"|strategyScoreGap|bestStrategyName/, "native DealIQ must not present locally calculated ranking/confidence as canonical output");
requirePattern("DealIQCockpitView.swift", nativeDealIQ, /noUnderwritingCalculation\s*=\s*true/, "native source boundary must explicitly prohibit underwriting calculations");

const legacyAnalyze = await read("supabase/functions/analyze-deal/index.ts");
forbidPattern("analyze-deal/index.ts", legacyAnalyze, /compareStrategies\(|scoreStrategy\(|decision:\s*score/, "the legacy Edge Function must not be a competing decision authority");
requirePattern("analyze-deal/index.ts", legacyAnalyze, /410|deprecated|canonical/i, "the legacy endpoint must fail closed and identify the canonical path");

if (failures.length) {
  console.error("BRIX production authority check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("BRIX production authority check passed.");
