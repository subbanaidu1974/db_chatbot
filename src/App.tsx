import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Database, 
  Code, 
  Settings, 
  Box, 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Terminal,
  Cpu,
  ChevronDown,
  Monitor,
  Play,
  Table,
  History,
  Plus,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { generateQuery, QueryResponse } from './services/geminiService';
import { sampleProducts } from './data/sampleProducts';
import { Product } from './types/product';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  queryData?: QueryResponse;
  executionResult?: {
    success: boolean;
    results?: any[];
    rowCount?: number;
    executionTime?: string;
    error?: string;
    message?: string;
  };
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

const EXAMPLE_QUERIES = [
  "Find all featured products in Electronics",
  "Show items with less than 10 in stock",
  "Active products priced $100 to $500",
  "List products with 4+ star reviews"
];

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your Database Query Bot. I can help you generate SQL or NoSQL queries for your refined Product catalog. What would you like to find today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbType, setDbType] = useState<'SQL' | 'NoSQL'>('SQL');
  const [connString, setConnString] = useState('postgresql://user:pass@localhost:5432/inventory');
  const [showSchema, setShowSchema] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  
  const sqlConnections = [
    'postgresql://user:pass@localhost:5432/inventory',
    'mysql://root:secret@127.0.0.1:3306/shop_db',
    'sqlserver://sa:Password123@db.prod.local:1433/catalog'
  ];

  const nosqlConnections = [
    'mongodb+srv://admin:pass@cluster0.mongodb.net/shop',
    'https://firestore.googleapis.com/v1/projects/my-prod-app',
    'redis://:authpassword@127.0.0.1:6379/0'
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('querybot_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Revive dates
        const revived = parsed.map((s: any) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(revived);
        if (revived.length > 0) {
          setCurrentSessionId(revived[0].id);
          setMessages(revived[0].messages);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Sync current messages to sessions and localStorage
  useEffect(() => {
    if (!currentSessionId) {
      const newId = Date.now().toString();
      setCurrentSessionId(newId);
      setSessions([{
        id: newId,
        title: 'New Chat',
        messages: messages,
        updatedAt: new Date()
      }]);
      return;
    }

    setSessions(prev => {
      const existing = prev.find(s => s.id === currentSessionId);
      if (existing) {
        const title = messages.find(m => m.role === 'user')?.content.substring(0, 30) || 'New Chat';
        const updated = prev.map(s => s.id === currentSessionId ? { ...s, messages, title, updatedAt: new Date() } : s);
        localStorage.setItem('querybot_history', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [messages, currentSessionId]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: 'Hello! New session started. How can I help with your queries?',
      timestamp: new Date()
    };
    
    setSessions(prev => [{
      id: newId,
      title: 'New Chat',
      messages: [initialMessage],
      updatedAt: new Date()
    }, ...prev]);
    
    setCurrentSessionId(newId);
    setMessages([initialMessage]);
  };

  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('querybot_history', JSON.stringify(updated));
    if (currentSessionId === id) {
      if (updated.length > 0) {
        switchSession(updated[0].id);
      } else {
        createNewChat();
      }
    }
  };

  // Reset validation when connection changes
  useEffect(() => {
    setValidationStatus('idle');
    setValidationMessage('');
  }, [connString, dbType]);

  const validateConnection = async () => {
    setIsValidating(true);
    setValidationStatus('idle');
    try {
      const response = await fetch('/api/validate-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connString, type: dbType })
      });
      const data = await response.json();
      if (data.valid) {
        setValidationStatus('success');
        setValidationMessage(data.message);
      } else {
        setValidationStatus('error');
        setValidationMessage(data.message);
      }
    } catch (err) {
      setValidationStatus('error');
      setValidationMessage('Failed to reach validation server.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteQuery = async (messageId: string, query: string) => {
    if (!connString || validationStatus !== 'success') {
      setValidationStatus('error');
      setValidationMessage('Please validate your connection first.');
      return;
    }

    setIsExecuting(messageId);
    try {
      const response = await fetch('/api/execute-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dialect: dbType, connectionString: connString })
      });
      const data = await response.json();
      
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, executionResult: data } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, executionResult: { success: false, error: 'Network Error', message: 'Could not connect to the execution server.' } } : m
      ));
    } finally {
      setIsExecuting(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateQuery(input, dbType);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.explanation,
        queryData: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating your query. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-gray-100 font-sans">
      {/* Sidebar - Settings and Schema */}
      <aside className="w-80 border-r border-gray-800 bg-[#161b22] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">QueryBot Pro</h1>
              <p className="text-xs text-gray-400">Natural Language to Query</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Database Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0d1117] rounded-lg">
                <button
                  onClick={() => {
                    setDbType('SQL');
                    setConnString(sqlConnections[0]);
                  }}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    dbType === 'SQL' ? 'bg-[#1f6feb] text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  SQL
                </button>
                <button
                  onClick={() => {
                    setDbType('NoSQL');
                    setConnString(nosqlConnections[0]);
                  }}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    dbType === 'NoSQL' ? 'bg-[#1f6feb] text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  NoSQL
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Connection String Selection
              </label>
              <div className="relative">
                <select
                  value={connString}
                  onChange={(e) => setConnString(e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg py-2 px-3 text-xs font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                >
                  {(dbType === 'SQL' ? sqlConnections : nosqlConnections).map(conn => (
                    <option key={conn} value={conn}>{conn}</option>
                  ))}
                  <option value="custom">Custom Connection...</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-3 text-gray-600 pointer-events-none" />
              </div>
              {connString === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter manual URI..."
                  className="w-full mt-2 bg-[#0d1117] border border-gray-700 rounded-lg py-2 px-3 text-xs font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onChange={(e) => setConnString(e.target.value)}
                />
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={validateConnection}
                disabled={isValidating}
                className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  validationStatus === 'success' 
                    ? 'bg-green-900/40 text-green-400 border border-green-800' 
                    : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20'
                }`}
              >
                {isValidating ? (
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                ) : validationStatus === 'success' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Database size={14} />
                )}
                {isValidating ? 'Testing...' : validationStatus === 'success' ? 'Validated' : 'Test Connection'}
              </button>
              
              <AnimatePresence>
                {validationMessage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`mt-2 text-[10px] p-2 rounded border ${
                      validationStatus === 'success' 
                        ? 'bg-green-900/10 border-green-900/30 text-green-500' 
                        : 'bg-red-900/10 border-red-900/30 text-red-500'
                    }`}
                  >
                    {validationMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <button 
            onClick={createNewChat}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 mb-2"
          >
            <Plus size={16} /> New Chat
          </button>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><History size={14} /> History</span>
            </h3>
            <div className="space-y-1 mb-6 max-h-48 overflow-y-auto pr-1">
              {sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    currentSessionId === s.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare size={14} className="flex-shrink-0" />
                    <span className="text-xs truncate">{s.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowSchema(!showSchema)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 hover:text-indigo-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers size={14} /> Product Schema
              </span>
              <ChevronDown size={14} className={`transform transition-transform ${showSchema ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showSchema && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2 text-[11px] font-mono text-gray-400 border-l border-gray-800 ml-1 pl-4">
                    <li><span className="text-indigo-400">id</span>: string</li>
                    <li><span className="text-indigo-400">name</span>: string</li>
                    <li><span className="text-indigo-400">price</span>: number</li>
                    <li><span className="text-indigo-400">stock</span>: number</li>
                    <li><span className="text-indigo-400">supplier</span>: object</li>
                    <li><span className="text-indigo-400">dimensions</span>: object</li>
                    <li><span className="text-indigo-400">weight</span>: number</li>
                    <li><span className="text-indigo-400">status</span>: enum</li>
                    <li><span className="text-indigo-400">reviews</span>: array</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Box size={14} /> Sample Products
            </h3>
            <div className="space-y-3">
              {sampleProducts.slice(0, 3).map(p => (
                <div key={p.id} className="p-3 bg-[#0d1117] border border-gray-800 rounded-lg group hover:border-gray-600 transition-all cursor-default">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-indigo-400">{p.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {p.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">{p.name}</h4>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-indigo-300 font-mono">${p.price}</span>
                    <span className="text-[10px] text-gray-500">{p.stockQuantity} in stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 text-[10px] text-gray-500 flex items-center justify-between">
          <span>AI Powered Platform</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#0d1117]">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-[#161b22]/50 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Terminal size={20} className="text-indigo-500" />
            <span className="font-semibold text-gray-200">Session: Active Exploration</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Dialect:</span>
              <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-400 rounded-full font-bold">{dbType}</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-32">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                  m.role === 'user' ? 'bg-indigo-600' : 'bg-[#161b22] border border-gray-700'
                }`}>
                  {m.role === 'user' ? <Monitor size={16} /> : <Cpu size={16} className="text-indigo-400" />}
                </div>
                
                <div className="space-y-3">
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-[#161b22] text-gray-300 border border-gray-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>

                  {m.queryData && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden shadow-2xl"
                    >
                      <div className="px-4 py-2 bg-[#161b22] border-b border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Code size={14} className="text-indigo-500" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Generated {m.queryData.dialect} Query
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleExecuteQuery(m.id, m.queryData?.query || '')}
                            disabled={isExecuting === m.id}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              isExecuting === m.id 
                                ? 'bg-gray-700 text-gray-500' 
                                : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                            }`}
                          >
                            {isExecuting === m.id ? (
                              <div className="w-2.5 h-2.5 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : <Play size={10} />}
                            {isExecuting === m.id ? 'Running...' : 'Execute'}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(m.queryData?.query || '')}
                            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-500 hover:text-white"
                            title="Copy query"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <code className="text-xs font-mono text-indigo-300 whitespace-pre">
                          {m.queryData.query}
                        </code>
                      </div>

                      <AnimatePresence>
                        {m.executionResult && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            className="border-t border-gray-800 bg-[#0d1117] p-4"
                          >
                            {!m.executionResult.success ? (
                              <div className="flex items-start gap-3 p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                                <AlertCircle size={14} className="text-red-500 mt-0.5" />
                                <div>
                                  <div className="text-[10px] font-bold text-red-400 uppercase">{m.executionResult.error}</div>
                                  <div className="text-[11px] text-red-200/80 mt-0.5">{m.executionResult.message}</div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between mb-3 text-[10px] text-gray-500 uppercase font-bold">
                                  <span className="flex items-center gap-2">
                                    <Table size={12} className="text-green-500" />
                                    Execution Results ({m.executionResult.rowCount} rows)
                                  </span>
                                  <span>Time: {m.executionResult.executionTime}</span>
                                </div>
                                
                                <div className="overflow-hidden rounded-lg border border-gray-800">
                                  <table className="w-full text-[10px] text-left">
                                    <thead className="bg-[#161b22] text-gray-400 border-b border-gray-800">
                                      <tr>
                                        {Object.keys(m.executionResult.results?.[0] || {}).map(k => (
                                          <th key={k} className="px-3 py-2 font-semibold">{k}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                      {m.executionResult.results?.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-800/30">
                                          {Object.values(row).map((v: any, j: number) => (
                                            <td key={j} className="px-3 py-2 text-gray-300 font-mono">
                                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#161b22] border border-gray-700 flex items-center justify-center animate-pulse">
                  <Cpu size={16} className="text-indigo-400" />
                </div>
                <div className="px-4 py-3 bg-[#161b22] border border-gray-800 rounded-2xl rounded-tl-none flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-gray-500">Formulating query...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#0d1117] via-[#0d1117] to-transparent">
          <div className="max-w-3xl mx-auto mb-4 flex flex-wrap gap-2 justify-center">
            {EXAMPLE_QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="text-[10px] px-3 py-1.5 bg-[#161b22] border border-gray-800 rounded-full text-gray-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
          
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-indigo-500/10 blur-xl group-focus-within:bg-indigo-500/20 transition-all"></div>
            <div className="relative flex items-center gap-2 bg-[#161b22] border border-gray-700 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500/50 transition-all">
              <input
                type="text"
                placeholder={`Ask for a ${dbType} query... (e.g. "Find all accessories under $50 with high stock")`}
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm text-gray-100 placeholder-gray-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-[10px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-green-500" />
                Schema Validated
              </div>
              <div className="flex items-center gap-1.5">
                <Info size={12} className="text-indigo-500" />
                Supports SQL & MongoDB
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle size={12} className="text-amber-500" />
                Preview Mode
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
