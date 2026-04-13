import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Wallet, 
  Activity, 
  Terminal, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  Layers
} from "lucide-react";

interface Log {
  id: number;
  timestamp: string;
  agent: string;
  message: string;
  type: 'thought' | 'action' | 'system' | 'deliverable';
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status: string;
  gas: string;
  timestamp: string;
}

type StreamEvent =
  | { type: "init"; logs: Log[]; transactions: Transaction[] }
  | { type: "log"; log: Log }
  | { type: "transaction"; transaction: Transaction }
  | { type: "reset" }
  | { type: "done" }
  | { type: "error"; message: string };

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<{name: string, id: string, role: string, baseRate: number}[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Fetch agents on load
    fetch("/api/agents")
      .then(res => res.json())
      .then(data => setAgents(data))
      .catch(err => console.error("Failed to load agents", err));

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const attachStream = () => {
    eventSourceRef.current?.close();

    const es = new EventSource("/events");
    eventSourceRef.current = es;

    es.onmessage = (evt) => {
      const data = JSON.parse(evt.data) as StreamEvent;
      if (data.type === "init") {
        setLogs(data.logs);
        setTransactions(data.transactions);
        return;
      }
      if (data.type === "reset") {
        setLogs([]);
        setTransactions([]);
        return;
      }
      if (data.type === "log") {
        setLogs((prev) => [...prev, data.log]);
        return;
      }
      if (data.type === "transaction") {
        setTransactions((prev) => [...prev, data.transaction]);
        return;
      }
      if (data.type === "done") {
        setIsProcessing(false);
        return;
      }
      if (data.type === "error") {
        setIsProcessing(false);
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            agent: "System",
            message: `CRITICAL ERROR: ${data.message}`,
            type: "system",
          },
        ]);
      }
    };

    es.onerror = () => {
      // Keep UI stable; backend may not be running yet.
    };
  };

  const runAgentEconomy = async (humanPrompt: string) => {
    setIsProcessing(true);
    setLogs([]);
    setTransactions([]);

    attachStream();

    try {
      await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: humanPrompt }),
      });
    } catch (error: any) {
      setIsProcessing(false);
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          agent: "System",
          message: `CRITICAL ERROR: ${error?.message || "Failed to reach backend"}`,
          type: "system",
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    runAgentEconomy(prompt);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1C] bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F27D26] rounded-sm flex items-center justify-center">
              <Layers className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">AgentMesh</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1C] border border-[#2A2A2C] rounded-full text-[10px] font-mono text-[#F27D26]">
              <Activity className="w-3 h-3 animate-pulse" />
              KITE TESTNET ACTIVE
            </div>
            <div className="flex items-center gap-2 text-xs font-mono opacity-60">
              <Wallet className="w-4 h-4" />
              0xKite...4337
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Logs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prompt Input */}
          <section className="bg-[#111113] border border-[#1A1A1C] p-6 rounded-xl shadow-2xl">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#F27D26] mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Human Principal Interface
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a complex task for the AgentMesh economy..."
                className="w-full bg-[#0A0A0B] border border-[#2A2A2C] rounded-lg p-4 text-sm focus:border-[#F27D26] focus:ring-1 focus:ring-[#F27D26] outline-none transition-all min-h-[100px] resize-none"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="w-full bg-[#F27D26] hover:bg-[#ff8c3a] disabled:opacity-50 disabled:hover:bg-[#F27D26] text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    ORCHESTRATING AGENTS...
                  </>
                ) : (
                  <>
                    DEPLOY AGENT MESH
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Live Logs */}
          <section className="bg-[#111113] border border-[#1A1A1C] rounded-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#1A1A1C] flex items-center justify-between bg-[#151517]">
              <h2 className="text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#F27D26]" />
                Agent Thought Process & Execution
              </h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-green-500/20" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
              {logs.length === 0 && !isProcessing && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <Search className="w-12 h-12 mb-4" />
                  <p>Awaiting instructions from Human Principal...</p>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded border ${
                      log.type === 'system' 
                        ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' 
                        : log.type === 'action'
                        ? 'bg-green-500/5 border-green-500/20 text-green-400'
                        : log.type === 'deliverable'
                        ? 'bg-[#F27D26]/10 border-[#F27D26]/30 text-[#F27D26]'
                        : 'bg-[#1A1A1C] border-[#2A2A2C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 opacity-50 text-[10px]">
                      <span className="font-bold uppercase">{log.agent}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="leading-relaxed">{log.message}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Transactions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Agent Registry Status */}
          <section className="bg-[#111113] border border-[#1A1A1C] p-6 rounded-xl">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#F27D26] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Kite Agent Passport Registry
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#0A0A0B] border border-[#1A1A1C] rounded text-xs">
                <div>
                  <p className="font-bold cursor-help" title="Orchestrator Agent">Manager Agent</p>
                  <p className="text-[10px] opacity-40 font-mono">0xMGR...99</p>
                </div>
                <div className="flex items-center gap-1 text-green-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </div>
              </div>
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-[#0A0A0B] border border-[#1A1A1C] rounded text-xs">
                  <div>
                    <p className="font-bold cursor-help" title={`Role: ${agent.role}`}>{agent.name}</p>
                    <p className="text-[10px] opacity-40 font-mono">{agent.id.slice(0, 8)}...{agent.id.slice(-4)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#F27D26]">
                    Idle
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Transactions */}
          <section className="bg-[#111113] border border-[#1A1A1C] p-6 rounded-xl flex flex-col h-[450px]">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#F27D26] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              x402 Agentic Settlements
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {transactions.length === 0 && (
                <p className="text-center py-12 opacity-20 text-xs italic">No on-chain activity detected.</p>
              )}
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-[#0A0A0B] border border-[#1A1A1C] rounded text-[10px] font-mono space-y-2"
                >
                  <div className="flex justify-between items-center border-b border-[#1A1A1C] pb-1 mb-1">
                    <a href={`https://testnet.kitescan.ai/tx/${tx.id}`} target="_blank" rel="noopener noreferrer" className="text-[#F27D26] hover:underline flex items-center gap-1">
                      TX: {tx.id.startsWith("0xmock_") ? tx.id : tx.id.slice(0, 15) + "..."}
                    </a>
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      SETTLED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="opacity-40 uppercase">From</p>
                      <p>{tx.from}</p>
                    </div>
                    <div>
                      <p className="opacity-40 uppercase">To</p>
                      <p>{tx.to}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#1A1A1C]">
                    <p className="text-sm font-bold">{tx.amount} {tx.currency}</p>
                    <p className="opacity-40">Gas: {tx.gas}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="border-t border-[#1A1A1C] bg-[#0A0A0B] py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[10px] font-mono opacity-40 uppercase tracking-widest">
          <div className="flex gap-6">
            <span>Block: 12,948,102</span>
            <span>Latency: 1.02s</span>
            <span>Network: Kite-A2A-Mainnet-v1</span>
          </div>
          <div>
            AgentMesh v0.1.0-alpha
          </div>
        </div>
      </footer>
    </div>
  );
}
