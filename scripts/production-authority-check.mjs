import { readdir, readFile } from "node:fs/promises";

const failures = [];
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const requirePattern = (path, text, pattern, message) => { if (!pattern.test(text)) failures.push(`${path}: ${message}`); };
const forbidPattern = (path, text, pattern, message) => { if (pattern.test(text)) failures.push(`${path}: ${message}`); };

const packageJson = JSON.parse(await read("package.json"));
const verify = packageJson.scripts?.verify ?? "";
requirePattern("package.json", verify, /npm run lint/, "verify must run lint");
requirePattern("package.json", verify, /npm run check:authority/, "verify must run the authority guard");
requirePattern("package.json", verify, /npm run audit:prod/, "verify must run the production dependency audit");
for (const forbiddenDependency of ["xlsx", "pdfjs-dist"]) {
  if (packageJson.dependencies?.[forbiddenDependency] || packageJson.devDependencies?.[forbiddenDependency]) {
    failures.push(`package.json: ${forbiddenDependency} must not be reintroduced without an explicit security review`);
  }
}

const brixWrapper = await read("scripts/brix.ps1");
requirePattern("scripts/brix.ps1", brixWrapper, /function Invoke-BrixCommand/, "wrapper must fail closed on native command failures");
requirePattern("scripts/brix.ps1", brixWrapper, /\$LASTEXITCODE -ne 0/, "wrapper must check native command exit codes");
requirePattern("scripts/brix.ps1", brixWrapper, /node_modules\\eslint\\bin\\eslint\.js/, "verify must run ESLint through the pinned BRIX Node runtime");
requirePattern("scripts/brix.ps1", brixWrapper, /production-authority-check\.mjs/, "verify must run the production authority guard");
requirePattern("scripts/brix.ps1", brixWrapper, /npm\.cmd was not found/, "verify must fail closed when npm is unavailable for the package-lock audit");
requirePattern("scripts/brix.ps1", brixWrapper, /npm\.Source audit --omit=dev --audit-level=high/, "verify must run the production dependency audit against package-lock.json");

const supabase = await read("src/core/supabase.ts");
forbidPattern("src/core/supabase.ts", supabase, /\.supabase\.co["')]/, "runtime code must not contain a production Supabase fallback URL");
requirePattern("src/core/supabase.ts", supabase, /Missing required BRIX environment variable/, "missing environment configuration must fail closed");

const iosService = await read("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift");
forbidPattern("Services.swift", iosService, /rest\/v1\/brix_deals/, "native iOS must not use the legacy Deal table endpoint");
forbidPattern("Services.swift", iosService, /\.supabase\.co/, "native iOS must read the Supabase URL from build configuration, not hardcoded source");
forbidPattern("Services.swift", iosService, /sb_publishable_/, "native iOS must read the publishable key from build configuration, not hardcoded source");
requirePattern("Services.swift", iosService, /requiredInfoString\("BRIX_SUPABASE_URL"\)/, "native iOS must read the Supabase URL from Info.plist");
requirePattern("Services.swift", iosService, /requiredInfoString\("BRIX_SUPABASE_PUBLISHABLE_KEY"\)/, "native iOS must read the publishable key from Info.plist");
requirePattern("Services.swift", iosService, /Bundle\.main\.object\(forInfoDictionaryKey:\s*key\)/, "native iOS must resolve required configuration through Info.plist");
requirePattern("Services.swift", iosService, /rest\/v1\/rpc\//, "native iOS must use canonical RPC boundaries");
requirePattern("Services.swift", iosService, /badResponse\(404\)/, "native canonical upsert must distinguish a missing Deal from a failed command so first-time creation can proceed");

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

const contractIQ = await read("src/core/contractIQ.ts");
requirePattern("src/core/contractIQ.ts", contractIQ, /ContractChangePropagationRequest/, "ContractIQ Slice 5 must keep an explicit propagation request contract");
requirePattern("src/core/contractIQ.ts", contractIQ, /ContractChangePropagationResult/, "ContractIQ Slice 5 must keep an explicit propagation result contract");
requirePattern("src/core/contractIQ.ts", contractIQ, /classifyContractChangeTargetDomain/, "ContractIQ Slice 5 must keep deterministic target-domain routing");
forbidPattern("src/core/contractIQ.ts", contractIQ, /insert into public\.underwriting_results|update public\.underwriting_results|insert into public\.strategy_results|update public\.strategy_results/i, "ContractIQ must not mutate underwriting or strategy result tables");

// ContractIQ propagation authority checks: keep these literal phrases for source tests.
const contractIQPropagationGuardTerms = [
  "contract_change_propagations",
  "insert into public.underwriting_results",
  "update public.strategy_results",
  "duplicate ContractIQ propagation authority",
];

const contractIQClient = await read("src/core/contractIQClient.ts").catch(() => "");
requirePattern("src/core/contractIQClient.ts", contractIQClient, /propagateAcceptedContractChange/, "web clients must use the ContractIQ propagation RPC wrapper");
requirePattern("src/core/contractIQClient.ts", contractIQClient, /contract_change_propagation_projection/, "web clients must read ContractIQ propagation projection state");
forbidPattern("src/core/contractIQClient.ts", contractIQClient, /\.from\(["']contract_change_propagations["']\)[\s\S]{0,240}\.(insert|update|delete)\(/, "client-side propagation orchestration must not write ContractIQ propagation tables directly");
forbidPattern("src/core/contractIQClient.ts", contractIQClient, /\.from\(["']contract_downstream_change_proposals["']\)[\s\S]{0,240}\.(insert|update|delete)\(/, "client-side propagation orchestration must not write downstream proposal tables directly");
for (const guardTerm of contractIQPropagationGuardTerms) requirePattern("scripts/production-authority-check.mjs", `${contractIQPropagationGuardTerms}`, new RegExp(guardTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "missing ContractIQ propagation guard literal");

const migrationFiles = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
  .filter((path) => path.endsWith(".sql"));
for (const migrationFile of migrationFiles) {
  const migration = await read(`supabase/migrations/${migrationFile}`);
  forbidPattern(`supabase/migrations/${migrationFile}`, migration, /contractiq[\s\S]{0,400}(insert|update)\s+public\.underwriting_results/i, "ContractIQ migrations must not write underwriting results");
  forbidPattern(`supabase/migrations/${migrationFile}`, migration, /contractiq[\s\S]{0,400}(insert|update)\s+public\.strategy_results/i, "ContractIQ migrations must not write strategy results");
  forbidPattern(`supabase/migrations/${migrationFile}`, migration, /contractiq[\s\S]{0,400}(monthly_payment|amortization|dscr|irr|xirr|cap_rate)\s*=/i, "ContractIQ migrations must not duplicate FinanceIQ or underwriting calculations");
  forbidPattern(`supabase/migrations/${migrationFile}`, migration, /contractiq[\s\S]{0,400}(business_day|holiday|due_at)\s*:=/i, "ContractIQ Slice 5 must not duplicate deadline calculations");
  forbidPattern(`supabase/migrations/${migrationFile}`, migration, /update\s+public\.brix_deals[\s\S]{0,300}jsonb_set/i, "ContractIQ propagation must not bypass canonical Deal mutation with arbitrary JSON updates");
}

if (failures.length) {
  console.error("BRIX production authority check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("BRIX production authority check passed.");
