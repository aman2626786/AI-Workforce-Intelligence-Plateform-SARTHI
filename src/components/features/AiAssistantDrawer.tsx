'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sparkles, X, Send, Bot, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { AiInsightBadge } from '../ui/AiInsightBadge';

export const AiAssistantDrawer: React.FC = () => {
  const { isAiDrawerOpen, setIsAiDrawerOpen, aiDrawerTopic, profile, activeRole } = useApp();
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string; time: string }>>([
    {
      role: 'ai',
      text: `Hello Yogesh! I am your SkillVantage AI Career Intelligence Assistant. Based on your current profile and target role as a ${activeRole}, SQL and Statistics are your top high-impact skills to focus on this week.`,
      time: 'Just now',
    },
  ]);

  if (!isAiDrawerOpen) return null;

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    const userText = inputMsg;
    setInputMsg('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Based on real-time market signals for ${activeRole} roles in Bengaluru, focusing on Advanced SQL Window Functions and Power BI DAX will increase your job readiness score by +16%.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  const samplePrompts = [
    'How do I bridge my SQL skill gap?',
    'What are top hiring companies for Data Analysts in Bengaluru?',
    'Explain the GenAI trend for analysts.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-tight text-white">SkillVantage AI Assistant</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium">Context: {aiDrawerTopic}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAiDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200/80 text-xs text-brand-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Lightbulb className="w-4 h-4 text-brand-600" />
                Industry Intelligence Insight
              </div>
              <p className="leading-relaxed">
                78% of Data Analyst jobs in your target area mandate SQL. Completing your SQL node will unlock 4 new matched roles.
              </p>
            </div>

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-md shadow-brand-600/10 font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-soft-sm font-normal'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="mb-1">
                      <AiInsightBadge label="SkillVantage AI" variant="purple" />
                    </div>
                  )}
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="p-4 bg-white border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Suggested Queries</span>
            <div className="flex flex-col gap-1.5">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInputMsg(prompt)}
                  className="text-left text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 p-2.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI about skills, market gaps, or roadmaps..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={handleSend}
                className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md shadow-brand-600/20 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
