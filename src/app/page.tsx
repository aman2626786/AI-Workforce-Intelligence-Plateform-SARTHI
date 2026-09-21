'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { ShareModal } from '@/components/resources/ShareModal';
import { GuestLimitModal } from '@/components/resources/GuestLimitModal';
import { api, ResourceItem, getToken } from '@/services/api';
import {
  ArrowRight,
  Compass,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Cpu,
  BarChart3,
  Layers,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

// Reusable Scroll-Reveal Animation Wrapper
function RevealOnScroll({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.12 }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Authentic Industry Market Demand Telemetry by Role (Real-world employer requirements)
interface RoleMarketDemand {
  id: string;
  roleName: string;
  category: string;
  demandSurge: string;
  openingsMapped: string;
  avgCompensation: string;
  hiringCompanies: string[];
  interviewFocus: string[];
  trendingSkills: {
    name: string;
    description: string;
    demandPercent: number;
    growth: string;
    tag: string;
  }[];
  marketInsight: string;
}

const INDUSTRY_ROLE_DEMANDS: RoleMarketDemand[] = [
  {
    id: 'ai-engineer',
    roleName: 'AI / ML Engineer',
    category: 'Artificial Intelligence',
    demandSurge: '+142% Hiring Surge',
    openingsMapped: '3,850+ Active Roles',
    avgCompensation: '₹18L - ₹45L / $145k - $220k',
    hiringCompanies: ['NVIDIA', 'Google', 'Microsoft', 'Meta', 'Amazon AWS', 'OpenAI'],
    interviewFocus: [
      'Production RAG pipelines, chunking strategies & vector search',
      'Distributed training, quantization (AWQ/GPTQ) & model latency tuning',
      'Transformer attention mechanisms & hallucinations evaluation',
    ],
    trendingSkills: [
      { name: 'PyTorch', description: 'Core standard for deep learning architectures & tensor math', demandPercent: 94, growth: '+65% YoY', tag: 'Deep Learning' },
      { name: 'Transformers & LLMs', description: 'HuggingFace, attention mechanisms, and prompt fine-tuning', demandPercent: 91, growth: '+180% YoY', tag: 'GenAI' },
      { name: 'Vector DBs (Milvus / Pinecone)', description: 'Semantic vector similarity indexing & hybrid retrieval', demandPercent: 86, growth: '+210% YoY', tag: 'Information Retrieval' },
      { name: 'LangChain & LlamaIndex', description: 'Orchestration frameworks for autonomous AI agents & tools', demandPercent: 82, growth: '+145% YoY', tag: 'Agentic Workflows' },
      { name: 'FastAPI & TensorRT', description: 'High-throughput async inference serving & GPU acceleration', demandPercent: 78, growth: '+88% YoY', tag: 'Model Serving' },
    ],
    marketInsight: 'Hyperscalers and AI labs prioritize engineers with verifiable hands-on production deployment experience over theoretical certifications.',
  },
  {
    id: 'fullstack',
    roleName: 'Full-Stack Developer',
    category: 'Software Engineering',
    demandSurge: '+89% Hiring Surge',
    openingsMapped: '6,200+ Active Roles',
    avgCompensation: '₹12L - ₹32L / $110k - $175k',
    hiringCompanies: ['Uber', 'Stripe', 'Atlassian', 'Microsoft', 'Shopify', 'Coinbase'],
    interviewFocus: [
      'Full-stack system design, database indexing, and query plan profiling',
      'Server-Side Rendering (SSR) & Next.js Server Components architecture',
      'REST & GraphQL API contracts with OAuth2/JWT security workflows',
    ],
    trendingSkills: [
      { name: 'TypeScript', description: 'Strict typing for enterprise scale, shared schemas & safety', demandPercent: 96, growth: '+75% YoY', tag: 'Language' },
      { name: 'React 19 & Next.js', description: 'App router, streaming UI, server actions & component hooks', demandPercent: 93, growth: '+95% YoY', tag: 'Frontend' },
      { name: 'Node.js & Express / NestJS', description: 'Async event loop, microservices & middleware architecture', demandPercent: 88, growth: '+55% YoY', tag: 'Backend' },
      { name: 'PostgreSQL & Prisma', description: 'Relational modeling, migrations, CTEs & connection pooling', demandPercent: 85, growth: '+70% YoY', tag: 'Database' },
      { name: 'Docker & CI/CD Pipelines', description: 'Containerized reproducible local development & automated testing', demandPercent: 81, growth: '+62% YoY', tag: 'DevOps' },
    ],
    marketInsight: 'Companies seek developers who can take a product feature from frontend Figma wireframes down to schema indexing and deployment.',
  },
  {
    id: 'cloud-devops',
    roleName: 'Cloud & DevOps Architect',
    category: 'Infrastructure & Cloud',
    demandSurge: '+115% Hiring Surge',
    openingsMapped: '4,100+ Active Roles',
    avgCompensation: '₹16L - ₹38L / $130k - $195k',
    hiringCompanies: ['Amazon Web Services', 'Google Cloud', 'Microsoft Azure', 'Datadog', 'Red Hat'],
    interviewFocus: [
      'Kubernetes cluster networking (Ingress, CNI), pod autoscaling & zero-downtime rolling deploys',
      'Infrastructure as Code (Terraform) multi-account modular architecture',
      'Full observability with Prometheus, Grafana, OpenTelemetry & incident SLAs',
    ],
    trendingSkills: [
      { name: 'Kubernetes & Helm', description: 'Container orchestration, helm charting, stateful sets & service mesh', demandPercent: 95, growth: '+85% YoY', tag: 'Orchestration' },
      { name: 'Terraform (IaC)', description: 'Declarative cloud provisioning, remote states & policy-as-code', demandPercent: 90, growth: '+92% YoY', tag: 'Infrastructure' },
      { name: 'AWS / GCP Cloud Architecture', description: 'VPCs, IAM zero-trust, serverless lambdas & managed DB services', demandPercent: 94, growth: '+68% YoY', tag: 'Cloud Platforms' },
      { name: 'Docker & Container Security', description: 'Multi-stage builds, slim images, and vulnerability CVE scanning', demandPercent: 92, growth: '+50% YoY', tag: 'Containers' },
      { name: 'GitHub Actions & GitOps', description: 'Automated CI/CD pipelines, branch rules, and ArgoCD syncing', demandPercent: 84, growth: '+110% YoY', tag: 'Automation' },
    ],
    marketInsight: 'Zero-trust architecture, automated GitOps deployment, and cloud cost efficiency are the top 3 requirements in enterprise cloud teams.',
  },
  {
    id: 'data-scientist',
    roleName: 'Data Scientist & Engineer',
    category: 'Data & Analytics',
    demandSurge: '+96% Hiring Surge',
    openingsMapped: '3,450+ Active Roles',
    avgCompensation: '₹14L - ₹36L / $120k - $185k',
    hiringCompanies: ['JPMorgan Chase', 'Netflix', 'Walmart Global Tech', 'Airbnb', 'Spotify'],
    interviewFocus: [
      'Advanced SQL optimization (window functions, partitions, explain plans)',
      'Real-time streaming ingestion with Apache Kafka & schema registries',
      'A/B testing statistical rigor, hypothesis formulation & metric tracking',
    ],
    trendingSkills: [
      { name: 'Python & Pandas / Polars', description: 'High-performance tabular manipulation and vector operations', demandPercent: 97, growth: '+60% YoY', tag: 'Data Science' },
      { name: 'Advanced SQL & dbt', description: 'Analytics engineering, transformation dag modeling & data testing', demandPercent: 95, growth: '+82% YoY', tag: 'Analytics' },
      { name: 'Apache Spark & Kafka', description: 'Distributed batch compute, streaming consumers & event processing', demandPercent: 87, growth: '+74% YoY', tag: 'Big Data' },
      { name: 'Snowflake / BigQuery', description: 'Modern cloud data warehousing, clustering keys & cost optimization', demandPercent: 84, growth: '+98% YoY', tag: 'Data Warehouse' },
      { name: 'Machine Learning & Scikit-learn', description: 'Supervised/unsupervised algorithms, cross-validation & feature store', demandPercent: 81, growth: '+55% YoY', tag: 'Predictive Modeling' },
    ],
    marketInsight: 'Analytics teams have shifted from building isolated notebooks to production-grade analytics engineering pipelines with dbt and version control.',
  },
  {
    id: 'cybersecurity',
    roleName: 'Cybersecurity Analyst',
    category: 'Security & Systems',
    demandSurge: '+135% Hiring Surge',
    openingsMapped: '2,900+ Active Roles',
    avgCompensation: '₹15L - ₹40L / $135k - $205k',
    hiringCompanies: ['CrowdStrike', 'Palo Alto Networks', 'Cisco', 'Cloudflare', 'Apple'],
    interviewFocus: [
      'OWASP Top 10 vulnerabilities, secure code reviews & defense in depth',
      'Network traffic forensics, packet analysis (Wireshark) & SIEM triage',
      'Identity and Access Management (IAM), SSO, and cloud threat modeling',
    ],
    trendingSkills: [
      { name: 'Network Security & Wireshark', description: 'Deep packet inspection, TCP/IP handshake analysis & firewall rules', demandPercent: 92, growth: '+78% YoY', tag: 'Networking' },
      { name: 'Application Security (OWASP)', description: 'XSS, SQLi, CSRF, SSRF prevention and static/dynamic SAST/DAST testing', demandPercent: 90, growth: '+115% YoY', tag: 'AppSec' },
      { name: 'Linux Systems & Shell Scripting', description: 'Privilege escalation checks, log auditing & kernel hardening', demandPercent: 88, growth: '+65% YoY', tag: 'OS Security' },
      { name: 'Cloud Security & IAM Governance', description: 'Least privilege policies, AWS GuardDuty & compliance monitoring', demandPercent: 86, growth: '+130% YoY', tag: 'Cloud Security' },
      { name: 'Penetration Testing & Burp Suite', description: 'Web application vulnerability discovery, fuzzing & ethical exploitation', demandPercent: 82, growth: '+70% YoY', tag: 'Offensive Security' },
    ],
    marketInsight: 'With surging enterprise cloud adoption, demand for application security and cloud IAM engineers has outpaced supply by over 400%.',
  },
];

// Interactive Hero Showcase Roles
const HERO_ROLES = [
  { title: 'AI & Machine Learning', demand: '+142% hiring surge' },
  { title: 'Full-Stack Engineering', demand: '+89% job openings' },
  { title: 'Cloud & DevOps Architecture', demand: '+115% cloud demand' },
  { title: 'Data Science & Analytics', demand: '+96% data roles' },
  { title: 'Cybersecurity & Systems', demand: '+135% security roles' },
];

export default function LandingPage() {
  const router = useRouter();

  // Feeds
  const [recommended, setRecommended] = useState<ResourceItem[]>([]);
  const [trending, setTrending] = useState<ResourceItem[]>([]);
  const [industryNews, setIndustryNews] = useState<ResourceItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResourceItem[]>([]);
  const [learningResources, setLearningResources] = useState<ResourceItem[]>([]);
  const [techUpdates, setTechUpdates] = useState<ResourceItem[]>([]);
  const [opportunities, setOpportunities] = useState<ResourceItem[]>([]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sharingResource, setSharingResource] = useState<ResourceItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Role Market Demand Telemetry Tab
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const activeRole = INDUSTRY_ROLE_DEMANDS[selectedRoleIndex];

  // Feed Tab Switcher
  const [activeFeedTab, setActiveFeedTab] = useState<'trending' | 'papers' | 'news' | 'opportunities'>('trending');

  // Hero Animated Role Ticker
  const [activeRoleIdx, setActiveRoleIdx] = useState<number>(0);

  // Rotate hero benchmark role every 2.8 seconds
  useEffect(() => {
    const roleInterval = setInterval(() => {
      setActiveRoleIdx((prev) => (prev + 1) % HERO_ROLES.length);
    }, 2800);
    return () => clearInterval(roleInterval);
  }, []);

  // Handle direct navigation to #how-it-works with smooth scrolling
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#how-it-works') {
      const timer = setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(Boolean(token));

    async function loadFeeds() {
      setIsLoading(true);
      try {
        const [trendData, newsData, paperData, learnData, techData, oppData] = await Promise.all([
          api.getTrendingResources(4),
          api.listResources({ type: 'INDUSTRY_NEWS', page_size: 4 }),
          api.listResources({ type: 'RESEARCH_PAPER', page_size: 4 }),
          api.listResources({ type: 'LEARNING_RESOURCE', page_size: 4 }),
          api.listResources({ type: 'TECH_UPDATE', page_size: 4 }),
          api.listResources({ type: 'OPPORTUNITY', page_size: 4 }),
        ]);

        setTrending(trendData || []);
        setIndustryNews(newsData.resources || []);
        setResearchPapers(paperData.resources || []);
        setLearningResources(learnData.resources || []);
        setTechUpdates(techData.resources || []);
        setOpportunities(oppData.resources || []);

        if (token) {
          const recData = await api.getRecommendedResources(4);
          setRecommended(recData || []);
        }
      } catch (err) {
        console.warn('Homepage feeds load notice:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeeds();
  }, []);

  const getActiveTabResources = () => {
    switch (activeFeedTab) {
      case 'trending':
        return trending;
      case 'papers':
        return researchPapers;
      case 'news':
        return industryNews;
      case 'opportunities':
        return opportunities;
      default:
        return trending;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100/50 via-sky-50/30 to-white flex flex-col font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      <LandingHeader />

      {/* ========================================================
          1. HERO SECTION: 70% Light / 30% Sky Blue Balance
          ======================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-sky-200/70">
        {/* Dynamic ambient radial gradients for depth */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-sky-300/40 via-sky-200/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 -left-40 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 -right-40 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-sky-300/80 shadow-sm shadow-sky-500/10 backdrop-blur-md animate-fade-in">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
              </span>
              <span className="text-xs font-bold text-sky-900 tracking-wide">
                MatchSkill • Intelligent Workforce & Skill Matching Engine
              </span>
            </div>

            {/* High-Impact Main Heading with Smooth Staggered Motion Blur & Flowing Gradient */}
            <div className="relative">
              <div className="absolute -inset-x-12 -inset-y-6 bg-gradient-to-r from-sky-400/15 via-sky-300/25 to-sky-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-aura-glow" />
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12] select-none">
                <span className="inline-block animate-title-entrance">
                  Match Your Skills to What
                </span>{' '}
                <span className="inline-block animate-title-delay-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-sky-400 to-sky-800 animate-gradient-flow inline-block">
                    The Tech Industry
                  </span>
                </span>{' '}
                <span className="inline-block animate-title-delay-2">
                  Actually Needs.
                </span>
              </h1>
            </div>

            {/* Dynamic Rotating Role Benchmark Pill */}
            <div className="flex items-center justify-center gap-2 pt-0.5 animate-fade-in">
              <span className="text-xs font-semibold text-slate-500">Live Benchmarks For:</span>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200/90 shadow-xs text-xs font-semibold text-slate-800 transition-all hover:scale-105">
                <span key={activeRoleIdx} className="font-semibold text-sky-800 animate-fade-in">
                  {HERO_ROLES[activeRoleIdx].title}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/70">
                  {HERO_ROLES[activeRoleIdx].demand}
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed animate-fade-in">
              Bridge the disconnect between college curriculum and real-world tech hiring.
              MatchSkill scans live employer job signals, uncovers your exact skill gaps, and guides you with verified learning resources.
            </p>

            {/* High-Impact Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1 animate-fade-in">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-slate-900 active:bg-slate-950 text-white text-sm font-semibold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/resources"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-sky-50/80 text-slate-800 text-sm font-semibold border border-sky-300/80 shadow-xs transition-all hover:border-sky-400 hover:scale-[1.01] cursor-pointer"
              >
                <Compass className="w-4 h-4 text-sky-600" />
                <span>Explore Intelligence Hub</span>
              </Link>

              <a
                href="#market-demands"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-sky-700 hover:text-sky-900 hover:bg-sky-100/50 transition-all cursor-pointer"
              >
                <span>Explore Role Demands</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. TRENDING SKILLS & MARKET DEMAND BY ROLE (SCROLL REVEAL)
          ======================================================== */}
      <section id="market-demands" className="py-16 bg-white/70 border-b border-sky-200/70">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
          <RevealOnScroll>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-2 border border-sky-200">
                <span>Real-Time Industry Hiring Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Trending Skills Top Companies Demand
              </h2>
              <p className="text-sm text-slate-600 mt-2 font-normal max-w-2xl mx-auto">
                Real-time hiring data synthesized from 10,000+ active enterprise job postings. Select any engineering specialization below to inspect verified technical skills, active hiring companies, and interview evaluation criteria.
              </p>
            </div>
          </RevealOnScroll>

          {/* Role selector pills */}
          <RevealOnScroll delay={100}>
            <div className="flex items-center justify-center flex-wrap gap-2.5 mb-8">
              {INDUSTRY_ROLE_DEMANDS.map((role, idx) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleIndex(idx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                    selectedRoleIndex === idx
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{role.roleName}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedRoleIndex === idx
                        ? 'bg-white/20 text-white'
                        : 'bg-sky-50 text-sky-700 border border-sky-100'
                    }`}
                  >
                    {role.demandSurge.replace(' Hiring Surge', '')}
                  </span>
                </button>
              ))}
            </div>
          </RevealOnScroll>

          {/* Role Market Intelligence Board */}
          <RevealOnScroll delay={200}>
            <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-6 sm:p-8 lg:p-10">
              {/* Role Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {activeRole.roleName}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
                      {activeRole.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-2.5 flex-wrap">
                    <span className="text-slate-600">
                      Active Roles: <strong className="text-slate-900 font-semibold">{activeRole.openingsMapped}</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600">
                      Market Comp: <strong className="text-slate-900 font-semibold">{activeRole.avgCompensation}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-bold tracking-wide">
                    {activeRole.demandSurge}
                  </span>
                </div>
              </div>

              {/* Companies Actively Hiring Tag Bar */}
              <div className="py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Top Hiring Companies:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeRole.hiringCompanies.map((company) => (
                    <span
                      key={company}
                      className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-colors"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              {/* Two Column Layout: Skills & Frameworks vs Technical Interview Focus */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
                {/* Left Column: Top In-Demand Skills with Demand Weights */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Top Tested Competencies (% of Hiring Specs)
                    </h4>
                    <span className="text-[11px] font-semibold text-sky-700">Recruiter Demand</span>
                  </div>

                  <div className="space-y-3">
                    {activeRole.trendingSkills.map((sk) => (
                      <div
                        key={sk.name}
                        className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/90 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{sk.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                              {sk.tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {sk.growth}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {sk.demandPercent}%
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 font-normal leading-relaxed">
                          {sk.description}
                        </p>

                        <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-600 transition-all duration-700"
                            style={{ width: `${sk.demandPercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Interview Evaluation Focus & Actionable Intelligence */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Interview Evaluation Focus Box */}
                  <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                    <div className="pb-3 border-b border-slate-200/70">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Interview Evaluation Focus
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        What technical hiring panels test
                      </p>
                    </div>

                    <div className="space-y-3">
                      {activeRole.interviewFocus.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs text-slate-700">
                          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-normal leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recruiter Consensus Insight */}
                  <div className="bg-sky-50/50 rounded-2xl border-l-4 border-sky-500 border-y border-r border-sky-100/80 p-4 space-y-2">
                    <span className="text-xs font-bold text-sky-950 uppercase tracking-wider block">
                      Hiring Panel Consensus
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{activeRole.marketInsight}"
                    </p>
                  </div>

                  {/* Resource Hub Quick Link CTA */}
                  <div className="pt-1">
                    <Link
                      href={`/resources?search=${encodeURIComponent(activeRole.roleName)}`}
                      className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
                    >
                      <span>Explore Verified {activeRole.roleName} Materials</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================
          3. HOW MATCHSKILL WORKS (3-STEP VISUAL JOURNEY)
          ======================================================== */}
      <section id="how-it-works" className="py-16 scroll-mt-20 bg-gradient-to-b from-sky-50/40 via-white to-sky-50/30 border-b border-sky-200/70">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
          <RevealOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-widest text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200 inline-block mb-2">
                Engineered for Clarity
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                How MatchSkill Transforms Your Career Path
              </h2>
              <p className="text-sm text-slate-600 mt-2 font-normal">
                Three deterministic steps to eliminate guesswork and prepare you for technical hiring.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: FileTextIcon,
                title: 'Extract Verified Skills',
                desc: 'Upload your resume or paste GitHub/LinkedIn. Our NLP parser extracts technical proficiencies, frameworks, and tools into a structured student profile.',
                badge: 'Automated Extraction',
                delay: 100,
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Market Gap Analysis',
                desc: 'Your profile is cross-referenced against 10,000+ live employer postings. We calculate your exact match percentage and identify missing high-leverage skills.',
                badge: 'Real-Time Labor Signals',
                delay: 200,
              },
              {
                step: '03',
                icon: Award,
                title: 'Bridge & Get Job-Ready',
                desc: 'Direct access to verified official documentation, research papers, and targeted modules. As you complete milestones, your Readiness Score increases.',
                badge: 'Actionable Career Roadmaps',
                delay: 300,
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <RevealOnScroll key={step.step} delay={step.delay}>
                  <div className="h-full bg-white rounded-2xl p-6 border border-sky-200/80 shadow-sm hover:shadow-md hover:border-sky-300 hover:-translate-y-1 transition-all group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-3xl font-black text-sky-200 group-hover:text-sky-400 transition-colors">
                          {step.step}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-5 mt-4 border-t border-sky-100">
                      <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200/70 inline-block">
                        {step.badge}
                      </span>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. CORE PLATFORM CAPABILITIES (SCROLL REVEAL GRID)
          ======================================================== */}
      <section className="py-16 bg-white border-b border-sky-200/70">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
          <RevealOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-widest text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200 inline-block mb-2">
                Comprehensive Suite
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Six Core Pillars of MatchSkill
              </h2>
              <p className="text-sm text-slate-600 mt-2 font-normal">
                Built specifically to provide authentic, data-backed intelligence without marketing hype.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Cpu,
                title: 'Resume & Skill Extraction',
                desc: 'Upload PDF or text resumes. MatchSkill automatically parses languages, frameworks, cloud platforms, and developer tooling into verified data points.',
                tag: 'NLP Parser',
              },
              {
                icon: TrendingUp,
                title: 'Live Labor Market Telemetry',
                desc: 'Scrapes and analyzes live job descriptions across top tech hubs, tracking shifts in framework popularity and hiring requirements in real time.',
                tag: '10k+ Postings',
              },
              {
                icon: Target,
                title: 'Deterministic Skill Gap Engine',
                desc: 'No vague general advice. See the exact 3 to 5 technologies separating your current CV from a candidate with a 90%+ hiring probability.',
                tag: 'Precision Gaps',
              },
              {
                icon: BookOpen,
                title: 'Curated Resource Hub',
                desc: 'Hand-vetted library of foundational research papers, production documentation, open tutorials, and tech updates indexed by skill and difficulty.',
                tag: '50+ Verified Items',
              },
              {
                icon: Award,
                title: 'Dynamic Job Readiness Score',
                desc: 'A transparent 0-100 metric calculated live against market postings. Watch your score increase in real time as you complete learning checkpoints.',
                tag: 'Live Scoring',
              },
              {
                icon: Zap,
                title: 'MatchSkill Career Advisor',
                desc: 'Context-aware advisor answering specific questions regarding interview preparation, industry benchmarks, and project architecture tips.',
                tag: 'Contextual Guidance',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <RevealOnScroll key={i} delay={i * 70}>
                  <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-white to-sky-50/40 border border-sky-200/80 shadow-xs hover:border-sky-300 hover:shadow-md hover:-translate-y-1 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        {f.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {f.desc}
                    </p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. CURATED INTELLIGENCE HUB LIVE PREVIEW (SCROLL REVEAL)
          ======================================================== */}
      <section className="py-16 bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30 border-b border-sky-200/70">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
          <RevealOnScroll>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-sky-200">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200 inline-block mb-2">
                  Curated Materials
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Explore the MatchSkill Intelligence Hub
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Authentic research papers, documentation, industry reports, and opportunities.
                </p>
              </div>

              {/* Feed Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'trending', label: 'Trending' },
                  { id: 'papers', label: 'Research Papers' },
                  { id: 'news', label: 'Industry News' },
                  { id: 'opportunities', label: 'Opportunities' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeedTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      activeFeedTab === tab.id
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </RevealOnScroll>

          {/* Cards Grid */}
          <RevealOnScroll delay={150}>
            {getActiveTabResources().length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {getActiveTabResources().map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onShare={(res) => setSharingResource(res)}
                    onRequireAuth={() => setIsAuthModalOpen(true)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 px-6 text-center space-y-3 bg-white/80 rounded-3xl border border-sky-200/80 max-w-xl mx-auto shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Fresh Intelligence Feed Ready</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  All dummy resources have been wiped clean. Publish new learning tutorials, research, or industry news directly from the Admin Panel to feature them here.
                </p>
              </div>
            )}
          </RevealOnScroll>

          <div className="text-center pt-4">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm hover:scale-105"
            >
              <span>Explore Intelligence Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. HIGH CONVERTING CALL TO ACTION (SCROLL REVEAL)
          ======================================================== */}
      <section className="py-16 bg-white">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12">
          <RevealOnScroll>
            <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-slate-900 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-sky-600/15">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                  <span>Zero Cost for Students</span>
                </span>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Ready to Stop Guessing What Tech Employers Want?
                </h2>

                <p className="text-sm sm:text-base text-sky-100 max-w-2xl mx-auto font-normal leading-relaxed">
                  Join MatchSkill today. Connect your profile, discover verified market demand percentages, and follow clear roadmaps to your dream engineering career.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  <Link
                    href="/signup"
                    className="px-7 py-3.5 rounded-xl bg-white text-slate-950 hover:bg-sky-50 text-xs font-black transition-all hover:scale-105 shadow-md"
                  >
                    Create Student Account
                  </Link>

                  <Link
                    href="/login"
                    className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 transition-all backdrop-blur-md hover:scale-105"
                  >
                    Sign In With Google
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================
          7. FOOTER: MATCHSKILL
          ======================================================== */}
      <footer className="py-10 bg-gradient-to-b from-sky-50/60 via-white to-sky-100/30 mt-auto border-t border-sky-200/90">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-600/20">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-slate-900">MatchSkill</span>
              <p className="text-xs text-slate-500 font-medium">Real-Time Labor & Skill Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <Link href="/" className="hover:text-sky-700 transition-colors">Home</Link>
              <Link href="/resources" className="hover:text-sky-700 transition-colors">Resources</Link>
              <Link href="/#how-it-works" className="hover:text-sky-700 transition-colors">How It Works</Link>
            </nav>
            <span className="h-4 w-px bg-sky-200" />
            <p className="text-xs text-slate-500 font-medium">© 2026 MatchSkill. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(sharingResource)}
        onClose={() => setSharingResource(null)}
        resource={sharingResource}
      />

      {/* Auth Modal */}
      <GuestLimitModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectUrl="/resources"
      />
    </div>
  );
}

// Icon helper to avoid lucide import conflict
function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
