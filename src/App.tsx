import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { 
  UploadCloud, FileText, Loader2, Key, CheckCircle2, AlertCircle, 
  BrainCircuit, Search, Bell, Settings, Home, Library, BarChart2, 
  Download, HelpCircle, Archive, Plus, Globe, FlaskConical, 
  RefreshCw, File, Link as LinkIcon, ChevronRight
} from 'lucide-react';
import { extractTextFromPDF } from './lib/pdfParser';
import { runAgent1Extractor, runAgent2Reviewer, runAgent3Generator } from './services/agentService';
import { cn } from './lib/utils';

type ProcessState = 'idle' | 'parsing' | 'agent1' | 'agent2' | 'agent3' | 'done' | 'error';

// --- Mock Data for Sparklines ---
const sparkData1 = [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 }, { v: 5 }, { v: 9 }, { v: 8 }];
const sparkData2 = [{ v: 1 }, { v: 1 }, { v: 2 }, { v: 2 }, { v: 3 }, { v: 2 }, { v: 3 }];
const sparkData3 = [{ v: 4 }, { v: 3 }, { v: 5 }, { v: 4 }, { v: 7 }, { v: 6 }, { v: 9 }];

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [finalReport, setFinalReport] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (processState !== 'idle' && processState !== 'done' && processState !== 'error') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [processState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
      } else {
        alert('请上传 PDF 格式的文件。'); // Simple alert for UI compliance
      }
    }
  };

  const startAnalysis = async () => {
    if (!pdfFile) return;
    try {
      setProcessState('parsing');
      setErrorMsg('');
      setFinalReport('');
      
      const fullText = await extractTextFromPDF(pdfFile);
      if (!fullText.trim()) throw new Error("无法从该 PDF 中提取到有效文本。请确保该文件不是纯图片扫描版。");

      setProcessState('agent1');
      const extractedJSON = await runAgent1Extractor(fullText, apiKey);

      setProcessState('agent2');
      const criticalReview = await runAgent2Reviewer(fullText, extractedJSON, apiKey);

      setProcessState('agent3');
      const report = await runAgent3Generator(extractedJSON, criticalReview, apiKey);

      setFinalReport(report);
      setProcessState('done');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '系统运行中发生未知错误。');
      setProcessState('error');
    }
  };

  // Auto-start analysis when file is selected
  useEffect(() => {
    if (pdfFile && processState === 'idle') {
      startAnalysis();
    }
  }, [pdfFile]);

  const isProcessing = ['parsing', 'agent1', 'agent2', 'agent3'].includes(processState);

  return (
    <div className="relative min-h-screen bg-[#F0F4F8] text-slate-800 font-sans flex overflow-hidden selection:bg-blue-200">
      {/* Background Blobs for Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-300/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-300/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-indigo-300/20 rounded-full blur-[90px] pointer-events-none" />

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-white/40 backdrop-blur-3xl border-r border-white/50 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="p-8 flex flex-col items-center border-b border-white/40">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <BrainCircuit className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-blue-900">Alexandria</h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mt-1">Precision Analysis</p>
        </div>

        <div className="px-6 py-6">
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-[1.02]">
            <Plus className="w-5 h-5" />
            New Analysis
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem icon={<Home />} label="Home" active />
          <NavItem icon={<Library />} label="Library" />
          <NavItem icon={<BarChart2 />} label="Analytics" />
          <NavItem icon={<Download />} label="Export" />
        </nav>

        <div className="p-4 space-y-4">
          <div className="bg-white/50 border border-white/60 p-4 rounded-xl shadow-sm">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5" /> API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="System API Key Active"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <nav className="space-y-1">
            <NavItem icon={<HelpCircle />} label="Help" />
            <NavItem icon={<Archive />} label="Archive" />
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* TOP NAV */}
        <header className="h-[88px] flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex gap-6 font-medium text-sm">
              <a href="#" className="text-blue-700 border-b-2 border-blue-700 pb-1">Dashboard</a>
              <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors pb-1">Deep Review</a>
              <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors pb-1">Knowledge Matrix</a>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search literature..." 
                className="pl-9 pr-4 py-2 w-64 bg-white/50 border border-white/60 rounded-full text-sm focus:outline-none focus:bg-white/80 transition-all shadow-sm"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors shadow-sm">
              UPLOAD PAPER
            </button>
            <div className="flex gap-3 text-slate-500">
              <button className="hover:text-slate-800 transition-colors"><Bell className="w-5 h-5"/></button>
              <button className="hover:text-slate-800 transition-colors"><Settings className="w-5 h-5"/></button>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white text-xs font-bold">
              US
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto px-10 pb-10">
          
          <div className="mb-8 mt-2">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              Advanced <span className="text-blue-600">Research</span> Analysis Hub
            </h2>
          </div>

          {/* METRICS ROW */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Quick Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard title="Library Size" value="1,245" sub="Papers" chartColor="#3B82F6" data={sparkData1} />
              <MetricCard title="Active Agents" value="3/3" sub="Online" chartColor="#10B981" data={sparkData2} />
              <MetricCard title="Insights Generated" value="15k+" sub="" chartColor="#06B6D4" data={sparkData3} />
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: 8 cols */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* IDLE STATE: UPLOAD & DISCOVER */}
              {processState === 'idle' && (
                <>
                  {/* UPLOAD HERO */}
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-10 flex flex-col items-center justify-center transition-all hover:bg-white/50"
                  >
                    {/* Subtle inner gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
                    
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner mb-6 relative z-10">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">Drag & Drop Documents</h3>
                    <p className="text-slate-500 mb-8 relative z-10">Support for PDF, DOCX, and TXT files up to 50MB.</p>

                    <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/80 hover:bg-white border border-slate-200 text-slate-700 font-medium px-8 py-3 rounded-full shadow-sm transition-all mb-8 relative z-10"
                    >
                      Browse Files
                    </button>

                    <div className="flex gap-4 relative z-10">
                      <IntegrationBtn icon="drive" label="Google Drive" />
                      <IntegrationBtn icon="onedrive" label="OneDrive" />
                      <IntegrationBtn icon="zotero" label="Zotero" />
                    </div>
                  </div>

                  {/* IMPORT URL */}
                  <div className="bg-white/40 backdrop-blur-xl border border-white shadow-sm rounded-2xl p-6">
                    <h4 className="text-base font-semibold flex items-center gap-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-slate-500" /> Import via URL
                    </h4>
                    <p className="text-sm text-slate-500 mb-4">Paste links from arXiv, PubMed, or direct DOIs.</p>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="https://arxiv.org/abs/..." 
                        className="flex-1 bg-white/60 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                      <button className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
                        Fetch Paper
                      </button>
                    </div>
                  </div>

                  {/* DISCOVER & TRENDING */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Discover & Trending</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <TrendingCard 
                        title="Large Language Models in R&D" 
                        img="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop" 
                        progress={60} 
                      />
                      <TrendingCard 
                        title="Sustainable Materials Research" 
                        img="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=600&auto=format&fit=crop" 
                        progress={85} 
                      />
                      <TrendingCard 
                        title="Quantum Computing Strides" 
                        img="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop" 
                        progress={30} 
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ACTIVE ANALYSIS STATE */}
              {processState !== 'idle' && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* PROGRESS BANNER */}
                  <div className="bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/50">
                      <div>
                        <h3 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                          {isProcessing ? <Loader2 className="w-6 h-6 text-blue-600 animate-spin" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                          {processState === 'error' ? 'Analysis Failed' : 
                          isProcessing ? 'Agent Pipeline Active' : 'Analysis Complete'}
                        </h3>
                        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4" /> {pdfFile?.name}
                        </p>
                      </div>
                      <button 
                        onClick={() => { setProcessState('idle'); setPdfFile(null); }}
                        className="px-4 py-2 bg-white/80 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                      >
                       Cancel / New
                      </button>
                    </div>

                    {processState === 'error' ? (
                      <div className="bg-red-50/50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div><h4 className="font-medium">Task Error</h4><p className="text-sm mt-1">{errorMsg}</p></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        <div className="absolute top-[28px] left-8 right-8 h-1 bg-slate-200/50 rounded-full hidden md:block" />
                        <ProgressStep idx={1} isActive={processState === 'parsing'} isDone={['agent1','agent2','agent3','done'].includes(processState)} title="Parsing PDF" />
                        <ProgressStep idx={2} isActive={processState === 'agent1'} isDone={['agent2','agent3','done'].includes(processState)} title="Data Extraction" />
                        <ProgressStep idx={3} isActive={processState === 'agent2'} isDone={['agent3','done'].includes(processState)} title="Critical Review" />
                        <ProgressStep idx={4} isActive={processState === 'agent3'} isDone={processState === 'done'} title="Synthesis" />
                      </div>
                    )}
                  </div>

                  {/* FINAL REPORT */}
                  {finalReport && (
                    <div className="bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-10 mt-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <div className="prose prose-slate prose-blue max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-blue-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {finalReport}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* RIGHT COLUMN: 4 cols */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* AGENT NETWORK MAP */}
              <div className="bg-[#1B2333] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-slate-300">
                {/* Subtle dark glowing background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1E293B] to-[#0F172A] z-0" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[50px]" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-[50px]" />

                <div className="relative z-10 flex items-center justify-between mb-8">
                  <h3 className="text-white font-semibold flex items-center gap-2 tracking-wide">
                    Agent Network Status
                  </h3>
                  <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    ACTIVE
                  </div>
                </div>

                {/* Network Graph Visualizer */}
                <div className="relative w-full aspect-[4/3] mt-2 mb-4">
                  {/* Lines mapping the agents */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <defs>
                      <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
                      </linearGradient>
                      <linearGradient id="lineGrad2" x1="100%" y1="100%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.5" />
                      </linearGradient>
                      <linearGradient id="lineGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.5" />
                      </linearGradient>
                    </defs>
                    {/* Hardcoded approx paths for triangle layout */}
                    <path d="M 50% 20% L 85% 70%" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" className={cn("transition-opacity duration-700", ['agent1', 'parsing'].includes(processState) ? "opacity-100 animate-[dash_20s_linear_infinite]" : "opacity-30")} />
                    <path d="M 85% 70% L 15% 70%" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" className={cn("transition-opacity duration-700", processState === 'agent2' ? "opacity-100 animate-[dash_20s_linear_infinite]" : "opacity-30")} />
                    <path d="M 15% 70% L 50% 20%" stroke="url(#lineGrad3)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" className={cn("transition-opacity duration-700", processState === 'agent3' ? "opacity-100 animate-[dash_20s_linear_infinite]" : "opacity-30")} />
                  </svg>

                  {/* Nodes */}
                  {/* Top Node: Metadata / Extractor */}
                  <NetworkNode 
                    icon={<Globe />} 
                    label="Metadata" 
                    color="text-cyan-400" 
                    bg="bg-cyan-500/10" 
                    border="border-cyan-500/30" 
                    pos="left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2" 
                    isPulsing={['parsing', 'agent1'].includes(processState)}
                  />
                  {/* Bottom Right Node: Reviewer */}
                  <NetworkNode 
                    icon={<FlaskConical />} 
                    label="Methodology" 
                    color="text-emerald-400" 
                    bg="bg-emerald-500/10" 
                    border="border-emerald-500/30" 
                    pos="left-[85%] top-[70%] -translate-x-1/2 -translate-y-1/2" 
                    isPulsing={processState === 'agent2'}
                  />
                  {/* Bottom Left Node: Synthesis */}
                  <NetworkNode 
                    icon={<FileText />} 
                    label="Review" 
                    color="text-blue-400" 
                    bg="bg-blue-500/10" 
                    border="border-blue-500/30" 
                    pos="left-[15%] top-[70%] -translate-x-1/2 -translate-y-1/2" 
                    isPulsing={processState === 'agent3'}
                  />
                </div>
              </div>

              {/* RECENT SUBMISSIONS */}
              <div className="bg-white/40 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-6 flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Submissions</h3>
                <div className="space-y-3">
                  <RecentItem 
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} 
                    title="Attention is All You Need.pdf" 
                    sub="Analysis complete • 2 hours ago" 
                    bg="bg-emerald-50 text-emerald-600"
                  />
                  <RecentItem 
                    icon={<RefreshCw className="w-5 h-5 text-blue-500 animate-spin-slow" />} 
                    title="arXiv:2303.08774" 
                    sub="Processing agents (2/3) • Just now" 
                    bg="bg-blue-50 text-blue-600"
                  />
                  <RecentItem 
                    icon={<File className="w-5 h-5 text-slate-500" />} 
                    title="climate_model_v4_draft.docx" 
                    sub="Archived • Yesterday" 
                    bg="bg-slate-100 text-slate-600"
                  />
                </div>
                <button className="w-full mt-6 py-3 border-t border-white/50 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  View All History
                </button>
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* Basic keyframes for dashboard SVG animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}} />
    </div>
  );
}

// ------ Helper Components ------

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a href="#" className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm",
      active ? "bg-blue-600/10 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-white/50 hover:text-slate-800"
    )}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      {label}
    </a>
  );
}

function MetricCard({ title, value, sub, chartColor, data }: any) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white shadow-sm p-5 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          {sub && <span className="text-slate-500 text-xs">{sub}</span>}
        </div>
      </div>
      <div className="w-24 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke={chartColor} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function IntegrationBtn({ icon, label }: { icon: string; label: string }) {
  const getIcon = () => {
    switch(icon) {
      case 'drive': return <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-green-400 via-yellow-400 to-blue-500 flex shrink-0" />;
      case 'onedrive': return <UploadCloud className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'zotero': return <div className="w-4 h-4 rounded-sm bg-red-500 text-white font-serif text-[10px] flex items-center justify-center font-bold shrink-0">Z</div>;
      default: return null;
    }
  };
  return (
    <button className="flex items-center gap-2 bg-white/50 hover:bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all text-slate-700">
      {getIcon()} {label}
    </button>
  );
}

function TrendingCard({ title, img, progress }: { title: string; img: string; progress: number }) {
  return (
    <div className="rounded-2xl overflow-hidden relative h-36 border border-slate-200/50 shadow-sm group">
      <img src={img} alt="cover" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-white font-medium text-sm mb-3 line-clamp-2 leading-tight">{title}</h4>
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function NetworkNode({ icon, label, color, bg, border, pos, isPulsing }: any) {
  return (
    <div className={cn("absolute flex flex-col items-center gap-2 z-10", pos)}>
      <div className={cn(
        "w-12 h-12 rounded-full border flex items-center justify-center backdrop-blur-md transition-all duration-500", 
        color, bg, border,
        isPulsing ? "shadow-[0_0_30px_rgba(var(--color-current),0.5)] scale-110 border-current" : ""
      )}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      </div>
      <span className={cn("text-xs font-semibold tracking-wide transition-colors", isPulsing ? "text-white" : "text-slate-400")}>{label}</span>
    </div>
  );
}

function RecentItem({ icon, title, sub, bg }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{title}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
    </div>
  );
}

function ProgressStep({ idx, isActive, isDone, title }: any) {
  return (
    <div className="flex flex-col items-center z-10">
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center border-4 backdrop-blur-md font-bold transition-all duration-500",
        isDone ? "bg-emerald-500 border-white text-white shadow-xl shadow-emerald-500/20" :
        isActive ? "bg-blue-600 border-blue-100 text-white shadow-xl shadow-blue-500/30 scale-110" :
        "bg-white/80 border-white text-slate-400 text-slate-400 shadow-sm"
      )}>
        {isDone ? <CheckCircle2 className="w-6 h-6" /> : isActive ? <Loader2 className="w-6 h-6 animate-spin" /> : idx}
      </div>
      <p className={cn("mt-4 text-sm font-bold text-center", isActive || isDone ? "text-slate-800" : "text-slate-400")}>
        {title}
      </p>
    </div>
  );
}
