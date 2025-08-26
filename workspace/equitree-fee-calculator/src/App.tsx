import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, LineChart as IconLineChart } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// small ui helpers
// Render value in Crores, input is Lakhs
const Money = ({ v, className = "" }: { v: number; className?: string }) => (
  <span className={`font-mono ${className}`}>₹{(((v ?? 0) / 100)).toFixed(2)}Cr</span>
);

// ---------- Utils ----------
// Backward compat helper: interpret input in Lakhs, output Crores string
const fmtL = (n: number) => `₹${(((n ?? 0) / 100)).toFixed(2)}Cr`;

// ---------- Fee Tiers (UI only) ----------
const FeeStructureInfo = ({ feeModel }: { feeModel: 'hybrid' | 'variable' }) => (
  <div className="mt-6 space-y-6">
    {feeModel === 'hybrid' ? (
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-200 rounded-xl text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">AUM Slab</th>
              <th className="p-3 text-center">Fixed Fees (p.a.)</th>
              <th className="p-3 text-center">Performance Fee</th>
              <th className="p-3 text-center">Hurdle</th>
              <th className="p-3 text-center">Operational</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-slate-50">
              <td className="p-3 font-medium">₹1–5 Cr</td>
              <td className="p-3 text-center">0.75%</td>
              <td className="p-3 text-center">20%</td>
              <td className="p-3 text-center">10% p.a.</td>
              <td className="p-3 text-center">0.20%</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="p-3 font-medium">₹5–10 Cr</td>
              <td className="p-3 text-center">0.75%</td>
              <td className="p-3 text-center">18%</td>
              <td className="p-3 text-center">10% p.a.</td>
              <td className="p-3 text-center">0.20%</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="p-3 font-medium">₹10+ Cr</td>
              <td className="p-3 text-center">0.75%</td>
              <td className="p-3 text-center">15%</td>
              <td className="p-3 text-center">10% p.a.</td>
              <td className="p-3 text-center">0.20%</td>
            </tr>
          </tbody>
        </table>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-200 rounded-xl text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">AUM Slab</th>
              <th className="p-3 text-center">Fixed Fees (p.a.)</th>
              <th className="p-3 text-center">Performance Fee</th>
              <th className="p-3 text-center">Hurdle</th>
              <th className="p-3 text-center">Operational</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-slate-50">
              <td className="p-3 font-medium">
                <div>₹10+ Cr</div>
                <div className="text-xs text-slate-500">(Variable Only)</div>
              </td>
              <td className="p-3 text-center">0%</td>
              <td className="p-3 text-center">22%</td>
              <td className="p-3 text-center">10% p.a.</td>
              <td className="p-3 text-center">0.20%</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Balanced notes */}
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Back-ended like PE</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Performance fees are <strong>back-ended</strong>: charged only at <strong>2× HWM</strong> or <strong>investor exit</strong>.</li>
          <li>No churn — only <strong>long-term capital gains tax</strong> at exit, no STCG impact.</li>
        </ul>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Hard Hurdle</div>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>10% p.a.</strong> compounded from the <strong>last crystallised HWM</strong>.</li>
          <li>Between crystallisations, the hurdle compounds from that base.</li>
        </ul>
      </div>
    </div>
  </div>
);

// ---------- Breakdown panels ----------
// --- Compact waterfall for the expanded row ---
function YearFlowCompact({ r }: { r: any }) {
  const totalFees =
    (r.fixedFees || 0) + (r.operationalCharges || 0) + (r.performanceFees || 0);

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm">
      <div className="grid grid-cols-8 gap-4 items-start">
        {/* Start / Top-up */}
        <div className="col-span-2 space-y-2">
          <div className="flex justify-between"><span>Start AUM</span><span className="font-mono">{fmtL(r.startAUM)}</span></div>
          {r.topUp > 0 && (
            <div className="flex justify-between"><span>+ Top-up</span><span className="font-mono text-emerald-700">+{fmtL(r.topUp)}</span></div>
          )}
          <div className="border-t pt-2 flex justify-between font-medium"><span>After Top-up</span><span className="font-mono">{fmtL(r.afterTopUp)}</span></div>
        </div>

        {/* + sign */}
        <div className="col-span-1 flex items-center justify-center">
          <span className="text-2xl font-bold text-emerald-600">+</span>
        </div>

        {/* Growth and Fees */}
        <div className="col-span-2 space-y-2">
          <div className="flex justify-between"><span>Growth (gross)</span><span className="font-mono text-emerald-700">+{fmtL(r.growth)}</span></div>
          <div className="flex justify-between"><span>Total fees</span><span className="font-mono text-red-600">-{fmtL(totalFees)}</span></div>
          <div className="text-xs text-slate-500 border-t pt-2">
            {r.fixedFees>0 && <>Fixed {fmtL(r.fixedFees)} • </>}
            {r.operationalCharges>0 && <>Ops {fmtL(r.operationalCharges)} • </>}
            {r.performanceFees>0 && <>Perf {fmtL(r.performanceFees)}</>}
          </div>
        </div>

        {/* = sign */}
        <div className="col-span-1 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-700">=</span>
        </div>

        {/* End / Hurdle / HWM */}
        <div className="col-span-2 space-y-2">
          <div className="flex justify-between"><span>End AUM</span><span className="font-mono">{fmtL(r.endAUM)}</span></div>
          <div className="flex justify-between"><span>Hurdle</span><span className="font-mono text-purple-700">{fmtL(r.hurdleAmount||0)}</span></div>
          <div className="flex justify-between"><span>HWM (end)</span><span className="font-mono text-amber-600">{fmtL(r.hwm)}</span></div>
        </div>
      </div>
    </div>
  );
}

// --- Minimal performance-fee check ---
const PerfFeeMini = ({ r }: { r: any }) => {
  const target = Math.max(r.startOfYearHWM * 2, r.hurdleAmount);
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 text-sm">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="flex justify-between"><span>Start HWM</span><span className="font-mono">{fmtL(r.startOfYearHWM)}</span></div>
          <div className="flex justify-between"><span>2× HWM</span><span className="font-mono text-orange-600">{fmtL(r.startOfYearHWM*2)}</span></div>
          <div className="flex justify-between"><span>Hurdle</span><span className="font-mono text-purple-700">{fmtL(r.hurdleAmount)}</span></div>
        </div>

        {r.performanceTriggered ? (
          <div className="space-y-1">
            <div className="font-medium text-yellow-800">🎯 Crystallised</div>
            <div className="flex justify-between"><span>Profit for fee</span><span className="font-mono text-green-700">{fmtL(r.profit)}</span></div>
            <div className="flex justify-between"><span>Perf. fee ({r.performanceFeeRate}%)</span><span className="font-mono text-red-600">{fmtL(r.performanceFees)}</span></div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="font-medium text-slate-700">❌ Not triggered</div>
            <div className="flex justify-between"><span>Portfolio</span><span className="font-mono">{fmtL(r.beforePerformanceFees)}</span></div>
            <div className="flex justify-between"><span>Needs to exceed</span><span className="font-mono">{fmtL(target)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Main ----------
export default function EquitreeFeeCalculator() {
  // Inputs
  const [initialInvestment, setInitialInvestment] = useState(1000); // ₹10 Cr = 1000L
  const [annualReturn, setAnnualReturn] = useState(25);
  const [years, setYears] = useState(5);
  const [feeModel, setFeeModel] = useState<'hybrid' | 'variable'>('hybrid'); // default hybrid
  const [topUps, setTopUps] = useState<{year:number,amount:number}[]>([]);

  // UI state
  const [results, setResults] = useState<any[]>([]);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [showTopups, setShowTopups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Options
  const initialInvestmentOptions = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({ value: (i + 1) * 100, label: `₹${i + 1} Crore` })),
    []
  );
  const annualReturnOptions = [5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50].map((v) => ({ value: v, label: `${v}%` }));
  const yearsOptions = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1} Year${i ? 's' : ''}` }));

  // Fee structure helper
  const getFeeStructure = (aumL: number) => {
    const aumCr = aumL / 100;
    if (feeModel === 'hybrid') {
      if (aumCr >= 10) return { fixedFeeRate: 0.75, performanceFeeRate: 15, hurdleRate: 10, operationalCharges: 0.2 };
      if (aumCr >= 5)  return { fixedFeeRate: 0.75, performanceFeeRate: 18, hurdleRate: 10, operationalCharges: 0.2 };
      return             { fixedFeeRate: 0.75, performanceFeeRate: 20, hurdleRate: 10, operationalCharges: 0.2 };
    }
    return { fixedFeeRate: 0, performanceFeeRate: 22, hurdleRate: 10, operationalCharges: 0.2 };
  };

  // Core calculation (monthly stepping & hurdle base reset on crystallisation)
  useEffect(() => {
    const yearly: any[] = [];
    let hwm = initialInvestment;
    let currentAUM = initialInvestment;

    let hurdleBase = initialInvestment; // resets to HWM only after fees charged
    let ageYears = 0; // years since last crystallisation

    for (let year = 1; year <= years; year++) {
      const startOfYear = currentAUM;
      const startOfYearHWM = hwm;
      const fs = getFeeStructure(currentAUM);

      // Top-up at start of year
      const t = topUps.find((x) => x.year === year);
      const topUpAmt = t ? Number(t.amount || 0) : 0;
      currentAUM += topUpAmt;

      // Monthly simulation
      let monthlyAUM = currentAUM;
      let monthlyFixedTotal = 0;
      let performanceTriggered = false;
      let performanceFees = 0;
      let profit = 0;
      let doublingMonth = 12;

      const mReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
      const mFixedPct = (fs.fixedFeeRate + fs.operationalCharges) / 1200; // incl operational

      for (let m = 1; m <= 12; m++) {
        const f = monthlyAUM * mFixedPct;
        monthlyAUM -= f; // fixed + operational first
        monthlyFixedTotal += f;
        monthlyAUM *= 1 + mReturn; // growth

        const monthlyHurdle = hurdleBase * Math.pow(1 + fs.hurdleRate / 100, ageYears + m / 12);
        const crossesDouble = monthlyAUM >= startOfYearHWM * 2;
        const crossesHurdle = monthlyAUM > monthlyHurdle;

        if (!performanceTriggered && crossesDouble && crossesHurdle) {
          performanceTriggered = true;
          const benchmark = Math.max(startOfYearHWM, monthlyHurdle);
          profit = monthlyAUM - benchmark;
          performanceFees = (profit * fs.performanceFeeRate) / 100;
          monthlyAUM -= performanceFees;
          doublingMonth = m;
        }
      }

      const fixedPct = fs.fixedFeeRate, opPct = fs.operationalCharges;
      const fixedFeesOnly = (fixedPct + opPct) > 0 ? monthlyFixedTotal * (fixedPct / (fixedPct + opPct)) : 0;
      const opFeesOnly = monthlyFixedTotal - fixedFeesOnly;

      const endAUM = monthlyAUM;
      currentAUM = endAUM;

      let newHWM = startOfYearHWM;
      if (performanceTriggered) newHWM = endAUM; else if (topUpAmt > 0) newHWM = startOfYearHWM + topUpAmt;

      const yearEndHurdle = hurdleBase * Math.pow(1 + fs.hurdleRate / 100, ageYears + 1);

      // Reset hurdle base only on crystallisation
      if (performanceTriggered) { hurdleBase = newHWM; ageYears = 0; } else { ageYears += 1; }

      const growth = endAUM + performanceFees + monthlyFixedTotal - startOfYear - topUpAmt;

      yearly.push({
        year,
        startAUM: startOfYear,
        topUp: topUpAmt,
        afterTopUp: startOfYear + topUpAmt,
        fixedFees: fixedFeesOnly,
        operationalCharges: opFeesOnly,
        fixedFeeRate: fs.fixedFeeRate,
        afterFixedFees: startOfYear + topUpAmt - monthlyFixedTotal,
        growth,
        beforePerformanceFees: endAUM + performanceFees,
        hurdleBase,
        hurdleAmount: yearEndHurdle,
        performanceFees,
        performanceFeeRate: fs.performanceFeeRate,
        performanceTriggered,
        doublingMonth: doublingMonth < 12 ? doublingMonth : null,
        endAUM,
        hwm: newHWM,
        startOfYearHWM,
        profit,
        targetForNextFees: Math.max(newHWM * 2, yearEndHurdle * 1.1),
      });

      hwm = newHWM;
    }

    // Exit crystallisation if not triggered in final year
    const last = yearly[yearly.length - 1];
    if (last && !last.performanceTriggered) {
      const fs = getFeeStructure(last.endAUM);
      const exitBenchmark = Math.max(last.startOfYearHWM, last.hurdleAmount);
      if (last.endAUM > exitBenchmark) {
        const exitProfit = last.endAUM - exitBenchmark;
        const exitFees = (exitProfit * fs.performanceFeeRate) / 100;
        yearly.push({
          year: `Exit (Y${years})`,
          startAUM: last.endAUM,
          topUp: 0,
          afterTopUp: last.endAUM,
          fixedFees: 0,
          operationalCharges: 0,
          fixedFeeRate: 0,
          afterFixedFees: last.endAUM,
          growth: 0,
          beforePerformanceFees: last.endAUM,
          hurdleBase: last.hurdleBase,
          hurdleAmount: last.hurdleAmount,
          performanceFees: exitFees,
          performanceFeeRate: fs.performanceFeeRate,
          performanceTriggered: true,
          doublingMonth: null,
          endAUM: last.endAUM - exitFees,
          hwm: last.endAUM - exitFees,
          startOfYearHWM: last.startOfYearHWM,
          profit: exitProfit,
          targetForNextFees: 0,
        });
      }
    }

    setResults(yearly);
  }, [initialInvestment, annualReturn, years, feeModel, topUps]);

  // Aggregates
  const totalFixedFees = results.reduce((s, r) => s + (r.fixedFees || 0), 0);
  const totalOperationalCharges = results.reduce((s, r) => s + (r.operationalCharges || 0), 0);
  const totalPerformanceFees = results.reduce((s, r) => s + (r.performanceFees || 0), 0);
  const finalAUM = results.length ? results[results.length - 1].endAUM : 0;
  const totalInvested = initialInvestment + topUps.reduce((s,t)=> s + Number(t.amount||0), 0);
  const netReturnPA = years > 0 ? ((finalAUM / Math.max(totalInvested,1e-6)) ** (1/years) - 1) * 100 : 0;

  // Gross (no-fee) final AUM & CAGR
  const rDec = annualReturn / 100;
  let grossFinalAUM = initialInvestment * Math.pow(1 + rDec, years);
  for (const t of topUps) {
    const yrs = Math.max(0, years - (Number(t.year||0) - 1)); // top-up compounds from start of that year
    grossFinalAUM += Number(t.amount || 0) * Math.pow(1 + rDec, yrs);
  }
  const grossCAGR = years > 0 ? ((grossFinalAUM / Math.max(totalInvested,1e-6)) ** (1/years) - 1) * 100 : 0;

  // Chart data in Crores (divide by 100)
  const chartData = results.map((r) => ({
    year: typeof r.year === 'string' ? r.year : `Y${r.year}`,
    AUM: Number((r.endAUM / 100).toFixed(2)),
    HWM: Number((r.hwm / 100).toFixed(2)),
    Hurdle: Number(((r.hurdleAmount || 0) / 100).toFixed(2)),
    'Fixed Fees': Number(((r.fixedFees || 0) / 100).toFixed(2)),
    'Performance Fees': Number(((r.performanceFees || 0) / 100).toFixed(2)),
    'Operational Charges': Number(((r.operationalCharges || 0) / 100).toFixed(2)),
  }));

  // Summary card expand state
  const [openCard, setOpenCard] = useState<string | null>(null);

  // UI: summary card component
  function SummaryCard({ id, title, value, tone = 'neutral', children }:{id:string; title:string; value:React.ReactNode; tone?: 'neutral'|'success'|'warn'; children: React.ReactNode}){
    const toneClass = tone === 'success' ? 'text-emerald-700' : tone === 'warn' ? 'text-yellow-700' : 'text-slate-900';
    const open = openCard === id;
    return (
      <div className={`rounded-xl border border-slate-200 p-3 bg-white cursor-pointer transition-all duration-200 ease-out ${open ? 'ring-2 ring-emerald-200 shadow-md' : 'hover:shadow-sm hover:-translate-y-0.5'}`}
           onClick={()=> setOpenCard(open ? null : id)}
           role="button" aria-expanded={open}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-slate-500">{title}</div>
            <div className={`mt-1 font-semibold ${toneClass}`}>{value}</div>
          </div>
          <div className="text-slate-400">{open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
        </div>
        {open && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl"><Calculator size={24} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Equitree Capital</h1>
            <p className="text-emerald-700 font-medium">Portfolio Management Fee Simulator</p>
          </div>
        </div>
      </div>

      {/* Controls: Left (inputs) | Right (fees + notes) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Left: Inputs stacked */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Initial Investment</label>
                <select value={initialInvestment} onChange={(e)=>setInitialInvestment(parseFloat(e.target.value))} className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {initialInvestmentOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Annual Return</label>
                <select value={annualReturn} onChange={(e)=>setAnnualReturn(parseFloat(e.target.value))} className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {annualReturnOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Investment Period</label>
                <select value={years} onChange={(e)=>setYears(parseInt(e.target.value))} className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {yearsOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Top-ups */}
              <div className="rounded-xl border border-slate-200 p-4">
                <button className="w-full flex items-center justify-between" onClick={()=>setShowTopups(v=>!v)}>
                  <span className="text-sm font-semibold text-slate-700">Top-ups</span>
                  {showTopups ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} 
                </button>
                {showTopups && (
                  <div className="mt-3 space-y-2">
                    {topUps.map((t,i)=> (
                      <div key={i} className="flex gap-2 items-center">
                        <select value={t.year} onChange={(e)=>setTopUps(p=>{const c=[...p]; c[i].year=parseInt(e.target.value); return c;})} className="w-24 p-1.5 border border-slate-200 rounded bg-slate-50 text-sm">
                          {Array.from({length: years}, (_,k)=>k+1).map(y=> <option key={y} value={y}>Y{y}</option>)}
                        </select>
                        <input type="number" value={(t.amount||0)/100} onChange={(e)=>setTopUps(p=>{const c=[...p]; c[i].amount=(parseFloat(e.target.value)||0)*100; return c;})} placeholder="Amount (₹ Cr)" className="flex-1 p-1.5 border border-slate-200 rounded bg-slate-50 text-sm"/>
                        <button onClick={()=>setTopUps(p=>p.filter((_,idx)=>idx!==i))} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                      </div>
                    ))}
                    <button onClick={()=>setTopUps(p=>[...p,{year:2, amount:50}])} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium">+ Add Top-up</button>
                  </div>
                )}
              </div>

              {/* Execute */}
              <button
                onClick={() => { setShowResults(false); setExpandedYear(null); window.requestAnimationFrame(()=>{ setLoading(true); setTimeout(()=>{ setLoading(false); setShowResults(true); }, 850); }); }}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
                  {loading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Calculating…</>) : 'Generate Results'}
              </button>
            </div>
          </div>

          {/* Right: Fee model + slabs + notes */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Fee Model</label>
                <div className="mt-2 flex gap-2">
                  <button onClick={()=>setFeeModel('hybrid')} className={`px-4 py-2 rounded-lg border ${feeModel==='hybrid' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>Hybrid</button>
                  <button onClick={()=>setFeeModel('variable')} className={`px-4 py-2 rounded-lg border ${feeModel==='variable' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>Variable</button>
                </div>
              </div>

              {/* Tiers */}
              <FeeStructureInfo feeModel={feeModel} />
            </div>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      {showResults && (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 mb-8 animate-[fadeIn_300ms_ease]">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Investment Summary</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6 text-sm">
          <SummaryCard id="invested" title="Total Invested" value={<Money v={totalInvested}/>}> 
            <div>Initial: <Money v={initialInvestment}/></div>
            <div>Top-ups: {topUps.length ? topUps.map(t=>`₹${((Number(t.amount||0))/100).toFixed(2)}Cr (Y${t.year})`).join(', ') : 'None'}</div>
            <div className="text-slate-500">Sum equals Total Invested.</div>
          </SummaryCard>

          <SummaryCard id="finalAUM" title="Final AUM" value={<span className="text-emerald-700 font-semibold">{fmtL(finalAUM)}</span>} tone="success">
            <div>End of {typeof results[results.length-1]?.year==='string' ? results[results.length-1].year : `Y${results.length}`}</div>
            <div>End HWM: <Money v={results[results.length-1]?.hwm || 0}/></div>
            <div>Absolute return: <Money v={finalAUM - totalInvested}/></div>
          </SummaryCard>
          
          <SummaryCard id="grossCAGR" title="Gross CAGR (p.a.)" value={`${grossCAGR.toFixed(1)}%`}>
            <div>Formula: ((Gross Final / Invested)^(1/years)-1)</div>
            <div>Gross Final: <Money v={grossFinalAUM}/></div>
          </SummaryCard>

          <SummaryCard id="netCAGR" title="Net CAGR (p.a.)" value={<span className="text-emerald-700 font-semibold">{netReturnPA.toFixed(1)}%</span>} tone="success">
            <div>Formula: ((Net Final / Invested)^(1/years)-1)</div>
            <div>Net Final: <Money v={finalAUM}/></div>
          </SummaryCard>

          <SummaryCard id="moic" title="MOIC" value={`${(finalAUM/Math.max(totalInvested,1e-6)).toFixed(2)}×`}>
            <div>Final / Total Invested</div>
            <div>Final: <Money v={finalAUM}/> • Invested: <Money v={totalInvested}/></div>
          </SummaryCard>

          <SummaryCard id="fixedFees" title="Fixed Fees" value={<Money v={totalFixedFees}/> }>
            <div>Weighted avg rate varies by slab.</div>
            <div>By year: {results.slice(0, Math.min(results.length, 5)).map((r)=>`Y${r.year}: ₹${(((r.fixedFees||0)/100)).toFixed(2)}Cr`).join(' • ')}{results.length>5?' • …':''}</div>
          </SummaryCard>

          <SummaryCard id="perfFees" title="Performance Fees" value={<Money v={totalPerformanceFees}/> } tone={totalPerformanceFees>0?'warn':'neutral'}>
            <div>Crystallisations: {results.filter(r=>r.performanceTriggered).length || 0}</div>
            <div>Years: {results.filter(r=>r.performanceTriggered).map(r=>typeof r.year==='string'?r.year:`Y${r.year}`).join(', ')||'—'}</div>
          </SummaryCard>

          <SummaryCard id="ops" title="Operational Charges" value={<Money v={totalOperationalCharges}/> }>
            <div>By year: {results.slice(0, Math.min(results.length, 5)).map((r)=>`Y${r.year}: ₹${(((r.operationalCharges||0)/100)).toFixed(2)}Cr`).join(' • ')}{results.length>5?' • …':''}</div>
          </SummaryCard>
        </div>
      </div>)}

      {/* Charts */}
      {showResults && !!chartData.length && (
        <div className="grid md:grid-cols-2 gap-6 mb-8 animate-[fadeIn_300ms_ease]">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Portfolio Growth vs Benchmarks</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: '₹ Cr', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => (typeof value === 'number' ? (value as number).toFixed(2) : value)} />
                <Legend />
                <Line type="monotone" dataKey="AUM" stroke="#10b981" strokeWidth={3} name="AUM" />
                <Line type="monotone" dataKey="HWM" stroke="#f59e0b" strokeWidth={2} name="HWM" />
                <Line type="monotone" dataKey="Hurdle" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Hurdle" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Annual Fees Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: '₹ Cr', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => (typeof value === 'number' ? (value as number).toFixed(2) : value)} />
                <Legend />
                <Bar dataKey="Fixed Fees" fill="#6366f1" name="Fixed Fees" />
                <Bar dataKey="Performance Fees" fill="#dc2626" name="Performance Fees" />
                <Bar dataKey="Operational Charges" fill="#9333ea" name="Operational Charges" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Year-by-year table (restored layout) */}
      {showResults && !!results.length && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-lg p-6 mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <IconLineChart className="text-emerald-700" size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Year-by-Year Breakdown</h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Click a year for details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50">
                  <th className="p-3 text-left">Year</th>
                  <th className="p-3 text-right">Start AUM</th>
                  <th className="p-3 text-right">Top-up</th>
                  <th className="p-3 text-right">Fixed Fees</th>
                  <th className="p-3 text-right">Operational</th>
                  <th className="p-3 text-right">Growth</th>
                  <th className="p-3 text-right">Hurdle</th>
                  <th className="p-3 text-right">Performance Fees</th>
                  <th className="p-3 text-right">End AUM</th>
                  <th className="p-3 text-right">HWM</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const yr = typeof r.year === "string" ? r.year : r.year;
                  const open = expandedYear === i;
                  return (
                    <React.Fragment key={i}>
                      <tr
                        className={`border-b cursor-pointer hover:bg-slate-50 ${
                          r.performanceTriggered ? "bg-yellow-50 hover:bg-yellow-100" : ""
                        }`}
                        onClick={() => setExpandedYear(open ? null : i)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setExpandedYear(open ? null : i);
                        }}
                      >
                        <td className="p-3 font-medium">{yr}</td>
                        <td className="p-3 text-right">{fmtL(r.startAUM)}</td>
                        <td className="p-3 text-right">{r.topUp > 0 ? fmtL(r.topUp) : "—"}</td>
                        <td className="p-3 text-right text-red-600">
                          {r.fixedFees > 0 ? `${fmtL(r.fixedFees)} (${r.fixedFeeRate}%)` : "—"}
                        </td>
                        <td className="p-3 text-right text-red-600">
                          {r.operationalCharges > 0 ? fmtL(r.operationalCharges) : "—"}
                        </td>
                        <td className="p-3 text-right text-emerald-700">{fmtL(r.growth)}</td>
                        <td className="p-3 text-right text-purple-700">
                          {r.hurdleAmount > 0 ? fmtL(r.hurdleAmount) : "—"}
                        </td>
                        <td className="p-3 text-right text-red-600">
                          {r.performanceFees > 0 ? `${fmtL(r.performanceFees)} (${r.performanceFeeRate}%)` : "—"}
                        </td>
                        <td className="p-3 text-right font-medium">{fmtL(r.endAUM)}</td>
                        <td className="p-3 text-right text-amber-600 font-medium">{fmtL(r.hwm)}</td>
                      </tr>

                      {open && (
                        <tr className="bg-blue-50">
                          <td colSpan={10} className="p-4 border-l-4 border-blue-400 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-semibold text-slate-700 mb-2">Year Cash Flow</h5>
                                <YearFlowCompact r={r} />
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-slate-700 mb-2">Performance Fee Check</h5>
                                <PerfFeeMini r={r} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investor Recap (personalized) */}
      {showResults && (() => {
        const trig = results.filter(r => r.performanceTriggered).map(r => (typeof r.year === 'string' ? r.year : `Y${r.year}`));
        const trigText = trig.length ? trig.join(', ') : 'No crystallisation during the period';
        const fm = feeModel === 'hybrid' ? 'Hybrid (Fixed + Performance)' : 'Variable Only';
        const topupText = topUps.length ? topUps.map(t=>`₹${Number(t.amount||0).toFixed(0)}L in Y${t.year}`).join(', ') : 'None';
        return (
          <div className="rounded-2xl bg-white border border-slate-200 shadow p-6 mb-12 animate-[fadeIn_300ms_ease]">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Investor Recap</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              You started with <span className="font-semibold">{fmtL(initialInvestment)}</span> for <span className="font-semibold">{years} year{years>1?'s':''}</span>, targeting a gross <span className="font-semibold">{annualReturn}% p.a.</span>.
              Fee model: <span className="font-semibold">{fm}</span>. Top-ups: <span className="font-semibold">{topupText}</span>.
              Without fees, the portfolio would reach <span className="font-semibold">{fmtL(grossFinalAUM)}</span> (Gross CAGR <span className="underline decoration-dotted" title="CAGR before any fees">{grossCAGR.toFixed(1)}% p.a.</span>).
              After all fees, you end with <span className="font-semibold text-emerald-700">{fmtL(finalAUM)}</span> (Net CAGR <span className="underline decoration-dotted" title="Annualised return after all fees">{netReturnPA.toFixed(1)}% p.a.</span>).
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">
              Performance fees are <span className="font-semibold">back-ended</span> and crystallise only when AUM hits <span className="font-semibold">2× the start-of-year HWM</span> and exceeds the <span className="font-semibold">10% hurdle</span>, or on investor exit.
              In this run, triggers occurred in: <span className="font-semibold">{trigText}</span>. After each crystallisation the <span className="font-semibold">HWM resets</span> and the hurdle restarts from that new HWM.
            </p>
          </div>
        );
      })()}

      <footer className="text-center text-slate-500 text-xs pb-8">Equitree Capital — SEBI Registered PMS | Indian Small and Micro Cap Specialists</footer>
    </div>
  );
}
