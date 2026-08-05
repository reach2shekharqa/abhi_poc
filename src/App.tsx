import { useEffect, useMemo, useState } from "react";

import Dashboard from "./components/Dashboard";
import PdfUploader from "./components/PdfUploader";
import { mockDashboardService } from "./services/mockDashboardService";

import type {
  BenchmarkResponse,
  DashboardSnapshot,
  EntityRecord,
  InsightResult,
  UploadedDocument,
  UserAccount,
} from "./types";
import type { ReportData } from "./parser/reportParser";

interface ParsedPdfPayload {
  documentType: "financial" | "stock" | "gst";
  parsedData: ReportData[];
  unit?: string;
}

function normalizeMetricKey(label: string): string {
  const normalizedLabel = label.toLowerCase().trim();
  const normalizedKey = normalizedLabel.replace(/[^a-z0-9]+/g, "");

  if (normalizedKey.includes("rawmaterial")) return "rawMaterial";
  if (normalizedKey.includes("workinprogress") || normalizedKey.includes("wip")) return "workInProgress";
  if (normalizedKey.includes("finishedgoods") || normalizedKey.includes("fg")) return "finishedGoods";
  if (normalizedKey.includes("fixedassets") || normalizedKey.includes("ppe")) return "fixedAssets";
  if (normalizedKey.includes("cashandbalance") || normalizedKey.includes("cash")) return "cashAndBalance";
  if (normalizedKey.includes("debtor") || normalizedKey.includes("receivable")) return "debtor";
  if (normalizedKey.includes("creditor") || normalizedKey.includes("payable")) return "creditors";
  if (normalizedKey.includes("borrowing") || normalizedKey.includes("loan")) return "borrowings";
  if (normalizedKey.includes("operatingprofit")) return "operatingProfit";
  if (normalizedKey.includes("netprofit")) return "netProfit";
  if (normalizedKey.includes("financecost") || normalizedKey.includes("interest")) return "financeCost";
  if (normalizedKey.includes("revenue") || normalizedKey.includes("sales")) return "revenue";
  if (normalizedKey.includes("gstpaid")) return "gstPaid";
  if (normalizedKey.includes("gstinput")) return "gstInputCredit";
  if (normalizedKey.includes("return")) return "returnAmount";

  return "";
}

function buildDashboardSnapshotFromPdfData(
  data: ReportData[],
  documentType: "financial" | "stock" | "gst",
  currentSnapshot: DashboardSnapshot | null,
): DashboardSnapshot {
  const baseSnapshot = currentSnapshot ?? {
    salesTrend: [{ period: "Latest", sales: 0 }],
    inventorySnapshot: {
      rawMaterial: 0,
      workInProgress: 0,
      finishedGoods: 0,
    },
    assetBreakdown: [],
    liabilityBreakdown: [],
    costBreakdown: [],
  };

  const metrics = new Map<string, number>();

  data.forEach((item) => {
    const key = normalizeMetricKey(item.category);
    if (key) {
      metrics.set(key, item.amount);
    }
  });

  if (documentType === "stock") {
    return {
      ...baseSnapshot,
      inventorySnapshot: {
        rawMaterial: metrics.get("rawMaterial") ?? baseSnapshot.inventorySnapshot.rawMaterial,
        workInProgress: metrics.get("workInProgress") ?? baseSnapshot.inventorySnapshot.workInProgress,
        finishedGoods: metrics.get("finishedGoods") ?? baseSnapshot.inventorySnapshot.finishedGoods,
      },
    };
  }

  if (documentType === "financial") {
    const revenue = metrics.get("revenue") ?? baseSnapshot.salesTrend[0]?.sales ?? 0;
    const financeCost = metrics.get("financeCost") ?? 0;
    const operatingProfit = metrics.get("operatingProfit") ?? Math.max(revenue * 0.2, 0);
    const netProfit = metrics.get("netProfit") ?? Math.max(revenue * 0.12, 0);

    return {
      ...baseSnapshot,
      salesTrend: [
        ...baseSnapshot.salesTrend.slice(1),
        { period: "Latest Upload", sales: revenue },
      ],
      assetBreakdown: [
        { name: "Fixed Assets", value: metrics.get("fixedAssets") ?? baseSnapshot.assetBreakdown[0]?.value ?? 0 },
        { name: "Cash and Balance", value: metrics.get("cashAndBalance") ?? baseSnapshot.assetBreakdown[1]?.value ?? 0 },
        { name: "Debtors", value: metrics.get("debtor") ?? baseSnapshot.assetBreakdown[2]?.value ?? 0 },
      ],
      liabilityBreakdown: [
        { name: "Borrowings", value: metrics.get("borrowings") ?? baseSnapshot.liabilityBreakdown[0]?.value ?? 0 },
        { name: "Creditors", value: metrics.get("creditors") ?? baseSnapshot.liabilityBreakdown[1]?.value ?? 0 },
      ],
      costBreakdown: [
        { category: "Finance Cost", amount: financeCost },
        { category: "Operating Profit", amount: operatingProfit },
        { category: "Net Profit", amount: netProfit },
      ],
    };
  }

  return {
    ...baseSnapshot,
    salesTrend: [
      ...baseSnapshot.salesTrend.slice(1),
      { period: "Latest Upload", sales: metrics.get("revenue") ?? baseSnapshot.salesTrend[0]?.sales ?? 0 },
    ],
  };
}

const defaultAccountForm: UserAccount = {
  userId: "",
  password: "",
  userName: "",
  city: "",
  state: "",
  country: "India",
  email: "",
  contactNumber: "",
};

const defaultEntityForm: EntityRecord = {
  id: "",
  userId: "",
  name: "",
  sector: "Agriculture",
  subSector: "Farming",
  constitution: "Private Limited",
  city: "",
  state: "",
  country: "India",
  email: "",
  contactNumber: "",
};

function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [entities, setEntities] = useState<EntityRecord[]>([]);
  const [view, setView] = useState<"login" | "dashboard" | "upload" | "profile" | "insights" | "benchmarking">("login");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("consolidated");
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [dashboardSnapshot, setDashboardSnapshot] = useState<DashboardSnapshot | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [accountForm, setAccountForm] = useState<UserAccount>(defaultAccountForm);
  const [entityForm, setEntityForm] = useState<EntityRecord>(defaultEntityForm);
  const [loginForm, setLoginForm] = useState({ userId: "USER001", password: "Demo@123" });
  const [recoverForm, setRecoverForm] = useState({ userId: "", email: "" });
  const [status, setStatus] = useState<string>("");
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  const entityOptions = useMemo(
    () => [{ id: "consolidated", name: "Consolidated" }, ...entities.map((entity) => ({ id: entity.id, name: entity.name }))],
    [entities],
  );

  const refreshDashboard = (userId: string, entityId: string, year: number) => {
    const snapshot = mockDashboardService.getDashboardData(userId, entityId, year);
    setDashboardSnapshot(snapshot);
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const savedEntities = mockDashboardService.getEntities(currentUser.userId);
    setEntities(savedEntities);
    refreshDashboard(currentUser.userId, selectedEntityId, selectedYear);
    setUploadedDocuments(mockDashboardService.getDocuments(currentUser.userId));
  }, [currentUser, selectedEntityId, selectedYear]);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = mockDashboardService.login(loginForm.userId, loginForm.password);

    if (!user) {
      setStatus("Login failed. Please check user id and password.");
      return;
    }

    setCurrentUser(user);
    setView("dashboard");
    setStatus("Login successful.");
  };

  const handleCreateAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const created = mockDashboardService.createAccount({
      ...accountForm,
      contactNumber: accountForm.contactNumber || undefined,
    });

    setCurrentUser(created);
    setLoginForm({ userId: created.userId, password: created.password });
    setStatus("Account created successfully. You are now logged in.");
    setView("dashboard");
  };

  const handleRecoverPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = mockDashboardService.recoverPassword(recoverForm.userId, recoverForm.email);

    if (!password) {
      setStatus("Unable to recover password for the provided user id and email.");
      return;
    }

    setStatus(`Recovered password: ${password}`);
  };

  const handleSaveEntity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    const nextEntity: EntityRecord = {
      ...entityForm,
      id: entityForm.id || `entity-${Date.now()}`,
      userId: currentUser.userId,
    };

    const saved = mockDashboardService.saveEntity(nextEntity);
    const updatedEntities = mockDashboardService.getEntities(currentUser.userId);
    setEntities(updatedEntities);
    setEntityForm({
      ...defaultEntityForm,
      userId: currentUser.userId,
    });
    setSelectedEntityId(saved.id);
    setStatus(`${saved.name} saved successfully.`);
  };

  const handleEntityEdit = (entity: EntityRecord) => {
    setEntityForm(entity);
  };

  const handleUpload = (document: UploadedDocument) => {
    if (!currentUser) {
      return;
    }

    const saved = mockDashboardService.uploadDocument(document);
    setUploadedDocuments((prev) => [saved, ...prev]);
    setStatus(`Document ${saved.fileName} uploaded successfully.`);
    setView("dashboard");
  };

  const handleInsightLoad = () => {
    if (!currentUser || !selectedEntityId) {
      return;
    }

    const nextInsight = mockDashboardService.getIndustryInsight(selectedEntityId, "Last Month");
    setInsight(nextInsight);
  };

  const handleBenchmarkLoad = () => {
    if (!currentUser || !selectedEntityId) {
      return;
    }

    const nextBenchmark = mockDashboardService.getBenchmarkData(selectedEntityId, "Revenue", "Annual", "Country");
    setBenchmark(nextBenchmark);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEntities([]);
    setDashboardSnapshot(null);
    setInsight(null);
    setBenchmark(null);
    setView("login");
    setStatus("You have been logged out.");
  };

  const [reportingUnit, setReportingUnit] = useState<string>("₹");

  const handlePdfDataParsed = (payload: ParsedPdfPayload) => {
    console.log('[App] Received parsed PDF data:', payload);
    const newSnapshot = buildDashboardSnapshotFromPdfData(
      payload.parsedData,
      payload.documentType,
      dashboardSnapshot,
    );
    console.log('[App] New dashboard snapshot:', newSnapshot);
    setDashboardSnapshot(newSnapshot);

    const normalizedUnit =
      payload.unit && payload.unit.toLowerCase() !== "unknown"
        ? payload.unit
        : "₹";

    setReportingUnit(normalizedUnit);
  };

  return (
    <div className="min-h-screen w-full px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-cyan-300">Financial Dashboard</h1>
            <p className="text-sm text-slate-300">Mock proof-of-concept with stable service contracts</p>
          </div>

          {currentUser && (
            <div className="flex flex-wrap gap-2">
              {[
                ["dashboard", "Dashboard"],
                ["upload", "Upload"],
                ["profile", "Profile"],
                ["insights", "Industry Insight"],
                ["benchmarking", "Benchmarking"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key as typeof view)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${view === key ? "bg-cyan-500 text-slate-950" : "bg-white/10"}`}
                >
                  {label}
                </button>
              ))}
              <button type="button" onClick={handleLogout} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white">
                Logout
              </button>
            </div>
          )}
        </div>

        {status && <div className="mb-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-cyan-100">{status}</div>}

        {!currentUser ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-2xl font-bold">Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
                  value={loginForm.userId}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, userId: event.target.value }))}
                  placeholder="User ID"
                />
                <input
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                />
                <button type="submit" className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                  Login
                </button>
              </form>

              <form onSubmit={handleRecoverPassword} className="mt-6 space-y-4 rounded-2xl bg-slate-950/35 p-4">
                <h3 className="text-lg font-semibold">Recover Password</h3>
                <input
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
                  value={recoverForm.userId}
                  onChange={(event) => setRecoverForm((prev) => ({ ...prev, userId: event.target.value }))}
                  placeholder="User ID"
                />
                <input
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
                  value={recoverForm.email}
                  onChange={(event) => setRecoverForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Registered Email"
                />
                <button type="submit" className="w-full rounded-2xl bg-white/10 px-4 py-3 font-semibold">
                  Recover Password
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-2xl font-bold">Create New Account</h2>
              <form onSubmit={handleCreateAccount} className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="User ID" value={accountForm.userId} onChange={(event) => setAccountForm((prev) => ({ ...prev, userId: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="Password" type="password" value={accountForm.password} onChange={(event) => setAccountForm((prev) => ({ ...prev, password: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="User Name" value={accountForm.userName} onChange={(event) => setAccountForm((prev) => ({ ...prev, userName: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="City" value={accountForm.city} onChange={(event) => setAccountForm((prev) => ({ ...prev, city: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="State" value={accountForm.state} onChange={(event) => setAccountForm((prev) => ({ ...prev, state: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="Country" value={accountForm.country} onChange={(event) => setAccountForm((prev) => ({ ...prev, country: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="Email ID" value={accountForm.email} onChange={(event) => setAccountForm((prev) => ({ ...prev, email: event.target.value }))} />
                <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3 sm:col-span-2" placeholder="Contact Number (optional)" value={accountForm.contactNumber ?? ""} onChange={(event) => setAccountForm((prev) => ({ ...prev, contactNumber: event.target.value }))} />
                <button type="submit" className="sm:col-span-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-semibold text-slate-950">
                  Create Account
                </button>
              </form>
            </section>
          </div>
        ) : (
          <>
            {view === "dashboard" && dashboardSnapshot && (
              <Dashboard
                snapshot={dashboardSnapshot}
                unit={reportingUnit}
                entityOptions={entityOptions}
                selectedEntityId={selectedEntityId}
                selectedYear={selectedYear}
                onEntityChange={setSelectedEntityId}
                onYearChange={setSelectedYear}
              />
            )}

            {view === "upload" && (
              <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
                <PdfUploader
                  entities={entities}
                  currentUser={currentUser}
                  onUpload={handleUpload}
                  onParsedData={handlePdfDataParsed}
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {uploadedDocuments.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-950/35 p-4">
                      <p className="text-sm text-cyan-200">{item.type.toUpperCase()}</p>
                      <p className="font-semibold">{item.fileName}</p>
                      <p className="text-xs text-slate-300">{item.month} {item.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {view === "profile" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
                  <h2 className="mb-4 text-2xl font-bold">Profile</h2>
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-slate-950/35 p-4">User ID: {currentUser.userId}</div>
                    <div className="rounded-2xl bg-slate-950/35 p-4">User Name: {currentUser.userName}</div>
                    <div className="rounded-2xl bg-slate-950/35 p-4">Email: {currentUser.email}</div>
                    <div className="rounded-2xl bg-slate-950/35 p-4">City / State: {currentUser.city}, {currentUser.state}</div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
                  <h2 className="mb-4 text-2xl font-bold">Add / Update Entity</h2>
                  <form onSubmit={handleSaveEntity} className="grid gap-3 sm:grid-cols-2">
                    <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="Entity Name" value={entityForm.name} onChange={(event) => setEntityForm((prev) => ({ ...prev, name: event.target.value }))} />
                    <select className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" value={entityForm.sector} onChange={(event) => setEntityForm((prev) => ({ ...prev, sector: event.target.value as EntityRecord["sector"] }))}>
                      <option>Agriculture</option>
                      <option>Manufacturing</option>
                      <option>Services</option>
                      <option>Mining</option>
                    </select>
                    <select className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" value={entityForm.subSector} onChange={(event) => setEntityForm((prev) => ({ ...prev, subSector: event.target.value }))}>
                      <option>Farming</option>
                      <option>Horticulture</option>
                      <option>Animal Husbandry and Dairy</option>
                      <option>Fisheries</option>
                      <option>Automotive and Aerospace</option>
                      <option>Chemicals and Petrochemicals</option>
                      <option>Food Processing</option>
                      <option>Electronics and High-Tech</option>
                      <option>Textiles and Apparel</option>
                      <option>Metals and Machinery</option>
                      <option>Gems and Jewellery</option>
                      <option>Public Infrastructure</option>
                      <option>Financial Services</option>
                      <option>Real Estate Services</option>
                      <option>Information Technology</option>
                      <option>Tourism and Hospitality</option>
                      <option>Healthcare Services</option>
                      <option>Retail Trade</option>
                      <option>Wholesale Trade</option>
                      <option>Professional Services</option>
                    </select>
                    <select className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" value={entityForm.constitution} onChange={(event) => setEntityForm((prev) => ({ ...prev, constitution: event.target.value as EntityRecord["constitution"] }))}>
                      <option>HUF</option>
                      <option>Proprietorship</option>
                      <option>Partnership</option>
                      <option>LLP</option>
                      <option>Private Limited</option>
                      <option>Unlisted Public Limited</option>
                      <option>Listed Public Limited</option>
                    </select>
                    <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="City" value={entityForm.city} onChange={(event) => setEntityForm((prev) => ({ ...prev, city: event.target.value }))} />
                    <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="State" value={entityForm.state} onChange={(event) => setEntityForm((prev) => ({ ...prev, state: event.target.value }))} />
                    <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="Country" value={entityForm.country} onChange={(event) => setEntityForm((prev) => ({ ...prev, country: event.target.value }))} />
                    <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" placeholder="Email" value={entityForm.email} onChange={(event) => setEntityForm((prev) => ({ ...prev, email: event.target.value }))} />
                    <input className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3 sm:col-span-2" placeholder="Contact Number" value={entityForm.contactNumber ?? ""} onChange={(event) => setEntityForm((prev) => ({ ...prev, contactNumber: event.target.value }))} />
                    <button type="submit" className="sm:col-span-2 rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                      Save Entity
                    </button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {entities.map((entity) => (
                      <button key={entity.id} type="button" onClick={() => handleEntityEdit(entity)} className="block w-full rounded-2xl bg-slate-950/35 px-4 py-3 text-left">
                        <span className="font-semibold">{entity.name}</span> - {entity.sector} / {entity.subSector}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {view === "insights" && (
              <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex flex-wrap gap-3">
                  <select className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" value={selectedEntityId} onChange={(event) => setSelectedEntityId(event.target.value)}>
                    {entityOptions.map((entity) => (
                      <option key={entity.id} value={entity.id}>{entity.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleInsightLoad} className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                    View Summary
                  </button>
                </div>
                {insight && (
                  <div className="space-y-4 rounded-2xl bg-slate-950/40 p-4">
                    <p className="text-lg leading-7">{insight.summary}</p>
                    <div className="space-y-2">
                      {insight.sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-white/10 px-3 py-2 text-cyan-200 underline">
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {view === "benchmarking" && (
              <section className="rounded-3xl border border-white/15 bg-white/8 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex flex-wrap gap-3">
                  <select className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3" value={selectedEntityId} onChange={(event) => setSelectedEntityId(event.target.value)}>
                    {entityOptions.map((entity) => (
                      <option key={entity.id} value={entity.id}>{entity.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleBenchmarkLoad} className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950">
                    Load Benchmark
                  </button>
                </div>

                {benchmark && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-950/40 p-4">
                      <h3 className="text-xl font-bold">Ranked Entities</h3>
                      <div className="mt-3 space-y-2">
                        {benchmark.entries.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-white/8 px-3 py-2">
                            <span>#{entry.rank} {entry.name}</span>
                            <span>Revenue: ₹{entry.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-950/40 p-4">
                      <h3 className="text-xl font-bold">Comparison Panel</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {benchmark.comparisonEntities.map((item) => (
                          <div key={item.name} className={`rounded-2xl p-3 ${item.highlight ? "border-2 border-cyan-400 bg-cyan-500/20" : "bg-white/8"}`}>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-slate-300">Revenue: ₹{item.revenue.toLocaleString()}</p>
                            <p className="text-sm text-slate-300">Op Margin: {item.operatingProfitMargin}%</p>
                            <p className="text-sm text-slate-300">Net Margin: {item.netProfitMargin}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;