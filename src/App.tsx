import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UploadCloud, FileText, Loader2, Key, CheckCircle2, AlertCircle, Sparkles, BrainCircuit, Bot } from 'lucide-react';
import { extractTextFromPDF } from './lib/pdfParser';
import { runAgent1Extractor, runAgent2Reviewer, runAgent3Generator } from './services/agentService';
import { cn } from './lib/utils';

type ProcessState = 'idle' | 'parsing' | 'agent1' | 'agent2' | 'agent3' | 'done' | 'error';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [finalReport, setFinalReport] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If not in idle, don't allow leaving page easily if processing
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
      setProcessState('idle');
      setFinalReport('');
      setErrorMsg('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setProcessState('idle');
        setFinalReport('');
        setErrorMsg('');
      } else {
        setErrorMsg('请上传 PDF 格式的文件。');
      }
    }
  };

  const startAnalysis = async () => {
    if (!pdfFile) return;

    try {
      setProcessState('parsing');
      setErrorMsg('');
      
      // Step 1: Parse PDF
      const fullText = await extractTextFromPDF(pdfFile);
      if (!fullText.trim()) throw new Error("无法从该 PDF 中提取到有效文本。请确保该文件不是纯图片扫描版。");

      // Step 2: Agent 1 (Extraction)
      setProcessState('agent1');
      const extractedJSON = await runAgent1Extractor(fullText, apiKey);

      // Step 3: Agent 2 (Critical Review CoT)
      setProcessState('agent2');
      const criticalReview = await runAgent2Reviewer(fullText, extractedJSON, apiKey);

      // Step 4: Agent 3 (Report Generation)
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

  const isProcessing = ['parsing', 'agent1', 'agent2', 'agent3'].includes(processState);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Sidebar Layout */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 text-indigo-600 mb-8">
          <Bot className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight">Research Copilot</h1>
        </div>

        <div className="space-y-6 flex-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              关于本系统
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              本系统是一个基于多 Agent 协作的学术论文自动分析引擎。您在此处上传 PDF 后，系统将依次启动三个专属领域智能体：<strong>结构化拆解员</strong>、<strong>方法论审稿专家</strong>以及<strong>综述与排版助手</strong>为您提供深度的论文简报。
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400">
                ⚠️ 环境说明：为支持云端毫秒级实时预览与更好的跨平台 UI 体验，本项目已从 Python/Streamlit 栈迁移至 React + Node.js 全栈渲染引擎，大语言模型核心切换为同样强悍且支持百万上下文的 Gemini API。
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key 配置 (可选)
            </label>
            <input
              type="password"
              placeholder="默认使用系统内置的 API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>
        </div>

        <footer className="mt-8 text-xs text-slate-400 text-center">
          Powered by Gemini & Google AI Studio
        </footer>
      </aside>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="px-8 py-5 border-b border-slate-200 bg-white shadow-sm flex-shrink-0">
          <h2 className="text-lg font-medium">学术论文深度研读任务面板</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {/* Upload Area */}
          {processState === 'idle' && !finalReport && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 bg-white",
                pdfFile ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              )}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {pdfFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="font-medium text-lg text-slate-800">{pdfFile.name}</p>
                  <p className="text-sm text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setPdfFile(null)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={startAnalysis}
                      disabled={isProcessing}
                      className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:bg-indigo-400"
                    >
                      <Sparkles className="w-4 h-4" />
                      开始 AI 研读
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center gap-4 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-slate-100 p-4 rounded-full text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-700 flex flex-col gap-1 items-center">
                      <span>点击上传或将 PDF 文件拖拽至此</span>
                      <span className="text-sm text-slate-400 block font-normal">建议上传包含文本层的标准双栏/单栏学术推论 PDF 文件</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {processState === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">任务执行失败</h3>
                <p className="text-sm mt-1">{errorMsg}</p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={startAnalysis}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    重试计算流程
                  </button>
                  <button
                    onClick={() => {
                      setProcessState('idle'); 
                      setPdfFile(null); 
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    更换文件
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          {(isProcessing || processState === 'done') && processState !== 'idle' && processState !== 'error' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto w-full">
              <h3 className="text-base font-semibold text-slate-800 mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                多智能体执行流 (Multi-Agent Pipeline)
              </h3>
              <div className="space-y-0">
                <ProgressItem 
                  isActive={processState === 'parsing'} 
                  isDone={['agent1', 'agent2', 'agent3', 'done'].includes(processState)}
                  title="PDF 解析模块"
                  desc="正在基于浏览器纯客端渲染环境提取 PDF 原文..."
                />
                <ProgressItem 
                  isActive={processState === 'agent1'} 
                  isDone={['agent2', 'agent3', 'done'].includes(processState)}
                  title="Agent 1: 结构化拆解员 (Information Extractor)"
                  desc="由 AI 助理提取基础面：标题、背景、数据集、核心方法概要。"
                />
                <ProgressItem 
                  isActive={processState === 'agent2'} 
                  isDone={['agent3', 'done'].includes(processState)}
                  title="Agent 2: 方法论审稿专家 (Critical Reviewer)"
                  desc="执行长链推理 (Chain of Thought)：解构原理、对比基线并深层次挖掘可能存在的实验漏洞。"
                />
                <ProgressItem 
                  isActive={processState === 'agent3'} 
                  isDone={processState === 'done'}
                  title="Agent 3: 综述与排版助手 (Report Generator)"
                  desc="对分析产物与抽取数据进行合成润色，生成具备极简风与专家观点的中文长文章简报。"
                  isLast={true}
                />
              </div>
            </div>
          )}

          {/* Final Report Results */}
          {processState === 'done' && finalReport && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-8">
              <div className="bg-indigo-50/50 px-6 py-5 border-b border-indigo-100 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  最终研读简报 (Final Academic Brief)
                </h3>
                <button
                  onClick={() => {
                    setProcessState('idle');
                    setPdfFile(null);
                    setFinalReport('');
                  }}
                  className="px-4 py-2 bg-white rounded-md shadow-sm border border-slate-200 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 transition-colors"
                >
                  处理新论文
                </button>
              </div>
              <div className="p-8">
                <div className="prose prose-slate prose-indigo max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-extrabold pb-3 border-b-2 border-slate-100 mb-6 mt-0 text-slate-900" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-bold mt-10 mb-4 tracking-tight text-slate-800 flex items-center" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-semibold mt-8 mb-3 text-slate-800" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-slate-700" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
                      p: ({node, ...props}) => <p className="leading-relaxed mb-6 text-slate-700 text-[1.05rem]" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 pl-5 py-2 text-slate-700 bg-indigo-50/50 rounded-r-lg my-6 not-italic font-medium" {...props} />
                    }}
                  >
                    {finalReport}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProgressItem({ isActive, isDone, title, desc, isLast = false }: { isActive: boolean; isDone: boolean; title: string; desc: string, isLast?: boolean }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 bg-white",
          isDone ? "border-emerald-500 text-emerald-600 bg-emerald-50 shadow-sm" :
          isActive ? "border-indigo-500 text-indigo-600 shadow-md ring-4 ring-indigo-50" :
          "border-slate-200 text-slate-400"
        )}>
          {isDone ? <CheckCircle2 className="w-5 h-5" /> :
           isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : 
           <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
        </div>
        {!isLast && (
          <div className={cn(
            "w-[2px] h-full mt-2 -mb-2 transition-colors duration-500",
            isDone ? "bg-emerald-500" : "bg-slate-100"
          )} />
        )}
      </div>
      <div className="pb-10 pt-1">
        <h4 className={cn(
          "text-base font-semibold transition-colors duration-300 gap-2 flex items-center",
          isDone ? "text-slate-800" :
          isActive ? "text-indigo-700" : "text-slate-400"
        )}>{title}</h4>
        <p className={cn(
          "text-sm mt-1.5 leading-relaxed",
          isActive || isDone ? "text-slate-600" : "text-slate-400"
        )}>{desc}</p>
      </div>
    </div>
  );
}
