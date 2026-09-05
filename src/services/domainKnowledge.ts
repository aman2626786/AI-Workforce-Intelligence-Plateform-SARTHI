import { CompanySkillCriteria, EmergingSkill, SkillToCompanyMapping, TrendPoint } from '../data/industry';

export interface BaseSkillDef {
  name: string;
  category: string;
  demand: number;
  trend: 'rapid' | 'up' | 'stable' | 'down';
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Emerging';
  status: 'Rising' | 'Stable' | 'Emerging' | 'Declining';
  desc: string;
}

export function getRoleSkillDefinitions(role: string): BaseSkillDef[] {
  const r = (role || 'Data Scientist').toLowerCase();

  // 1. DATA SCIENTIST & BUSINESS ANALYTICS
  if (r.includes('data scientist') || r.includes('business analytics')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'Python & Pandas', category: 'Data Analysis', demand: 98, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Data manipulation, dataframe transformations, and statistical exploratory analysis with NumPy & Pandas.' },
      { name: 'SQL & Advanced Query Optimization', category: 'Databases', demand: 96, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Complex joins, window functions, CTEs, indexing, query execution plans, and large-scale relational aggregation.' },
      { name: 'Machine Learning & Scikit-Learn', category: 'Core ML', demand: 94, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Supervised classification, regression, ensemble decision trees (RandomForest/XGBoost), and k-fold cross-validation.' },
      { name: 'Data Visualization (Power BI / Tableau)', category: 'Business Intelligence', demand: 91, trend: 'up', priority: 'High', status: 'Rising', desc: 'Building executive KPI dashboards, interactive charts, and DAX metric calculations for stakeholders.' },
      { name: 'Business Statistics & Probability Inference', category: 'Mathematical Foundations', demand: 89, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Hypothesis testing (p-values, t-tests, ANOVA, Chi-Square), probability distributions, and confidence intervals.' },
      { name: 'Data Preprocessing & Feature Engineering', category: 'Data Preparation', demand: 87, trend: 'up', priority: 'High', status: 'Rising', desc: 'Handling missing values, outlier detection, categorical encoding, feature scaling, and PCA dimensionality reduction.' },
      { name: 'Exploratory Data Analysis (EDA)', category: 'Analytics', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Extracting actionable business patterns, correlation analysis, and multivariate visualization using Seaborn & Matplotlib.' },
      { name: 'NumPy & Vectorized Computing', category: 'Scientific Computing', demand: 85, trend: 'stable', priority: 'High', status: 'Stable', desc: 'High-performance n-dimensional array manipulation, broadcasting, linear algebra routines, and masking.' },
      { name: 'Relational Database Architecture (PostgreSQL/MySQL)', category: 'Databases', demand: 84, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Relational schema design, normalization, constraints, transaction integrity (ACID), and materialized views.' },
      { name: 'Data Cleaning & Quality Validation', category: 'Data Wrangling', demand: 83, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Automated data validation rules, regex parsing, schema type enforcement, and anomaly detection.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Deep Learning & PyTorch / TensorFlow', category: 'Deep Learning', demand: 81, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Building multi-layer neural networks, backpropagation optimization, and GPU tensor acceleration.' },
      { name: 'Big Data Processing (PySpark & Databricks)', category: 'Distributed Computing', demand: 79, trend: 'rapid', priority: 'High', status: 'Rising', desc: 'Distributed cluster computing, Resilient Distributed Datasets (RDD), and Spark SQL on large-scale datasets.' },
      { name: 'Model Evaluation & A/B Testing', category: 'Experimentation', demand: 77, trend: 'up', priority: 'High', status: 'Rising', desc: 'Designing controlled randomized experiments, sample sizing, ROC-AUC metrics, and statistical significance analysis.' },
      { name: 'REST APIs & Model Deployment (FastAPI / Flask)', category: 'Production Systems', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Wrapping ML model checkpoints into production-ready asynchronous REST microservice endpoints.' },
      { name: 'Git & GitHub Version Control', category: 'Developer Tools', demand: 74, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Collaborative code versioning, branch strategies, pull requests, and reproducible experiment codebases.' },
      { name: 'Cloud Platforms (AWS / GCP / Azure Data Lake)', category: 'Cloud Infrastructure', demand: 72, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Cloud object storage (S3/GCS), serverless functions, and managed analytics services (BigQuery/Athena).' },
      { name: 'Natural Language Processing (NLP)', category: 'Applied AI', demand: 71, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Text tokenization, sentiment classification, TF-IDF representations, and transformer sequence embeddings.' },
      { name: 'Data Warehousing & ETL Pipelines (Snowflake / BigQuery)', category: 'Data Engineering', demand: 70, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Automated extract-transform-load orchestration, dimensional schema design, and star schema modeling.' },
      { name: 'Docker & Containerization', category: 'DevOps & Tooling', demand: 68, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Containerizing Python data pipelines and model inference runtimes for consistent environment deployment.' },
      { name: 'Generative AI & LLM Prompting / RAG', category: 'Emerging Tech', demand: 67, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Integrating LLM APIs, prompt engineering, vector embeddings, and LangChain document retrieval pipelines.' },
      { name: 'Time Series Forecasting (ARIMA / Prophet)', category: 'Predictive Modeling', demand: 66, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Decomposing trends, seasonality, stationarity testing, autoregressive models, and supply chain demand forecasting.' },
      { name: 'Advanced Excel & Financial Modeling', category: 'Spreadsheets', demand: 65, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Advanced lookups (XLOOKUP/VLOOKUP), PivotTables, nested logical formulas, and quick financial validation.' },
      { name: 'MLOps & Model Tracking (MLflow)', category: 'ML Operations', demand: 63, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Tracking experiment hyperparameter runs, artifact logging, model versioning, and drift monitoring in production.' },
      { name: 'Workflow Orchestration (Apache Airflow)', category: 'Pipeline Automation', demand: 62, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'DAG scheduling, dependency graphs, automated task retries, and SLA alerting for enterprise data pipelines.' },
      { name: 'NoSQL & Document Databases (MongoDB)', category: 'Databases', demand: 60, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Semi-structured JSON document storage, aggregation pipelines, and flexible document schema querying.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Vector Databases (Pinecone / ChromaDB / Qdrant)', category: 'AI Infrastructure', demand: 58, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Storing high-dimensional vector embeddings, cosine similarity indexing, and k-NN semantic search retrieval.' },
      { name: 'Recommendation Systems & Collaborative Filtering', category: 'Personalization', demand: 56, trend: 'up', priority: 'Low', status: 'Rising', desc: 'User-item matrix factorization, content-based recommendation heuristics, and hybrid ranking algorithms.' },
      { name: 'Computer Vision & OpenCV', category: 'Visual AI', demand: 54, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Image preprocessing, feature extraction, filtering, and convolutional image classification.' },
      { name: 'Linux & Shell Scripting', category: 'System Operations', demand: 52, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Command-line data pipeline scheduling, bash scripting, cron jobs, and SSH remote server execution.' },
      { name: 'dbt (Data Build Tool) Analytics Engineering', category: 'Analytics Engineering', demand: 51, trend: 'rapid', priority: 'Low', status: 'Rising', desc: 'Modular SQL transformations, automated data testing, and data lineage documentation.' },
      { name: 'Real-Time Streaming (Kafka & Spark Streaming)', category: 'Event Streaming', demand: 50, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Publish-subscribe event topics, windowed streaming aggregations, and low-latency anomaly detection.' },
      { name: 'Hyperparameter Optimization (Optuna / Ray Tune)', category: 'Model Tuning', demand: 48, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Bayesian optimization, automated pruning, and distributed hyperparameter search spaces.' },
      { name: 'Model Interpretability & Explainability (SHAP / LIME)', category: 'Governance', demand: 47, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Shapley additive explanations, feature attribution weights, and local surrogate interpretability.' },
      { name: 'Graph Analytics & Graph Databases (Neo4j)', category: 'Graph Computing', demand: 45, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Cypher querying, connected entity graph traversal, and social/fraud network community detection.' },
      { name: 'Statistical Experiment Design (Factorial / Multi-Armed Bandit)', category: 'Advanced Statistics', demand: 44, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Adaptive dynamic allocation algorithms, multi-variable experiments, and conversion rate optimization.' },
      { name: 'Data Lakehouse Architecture (Delta Lake / Iceberg)', category: 'Architecture', demand: 43, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'ACID transactions over cloud object storage, time travel data versioning, and Parquet optimization.' },
      { name: 'Automated ML & Low-Code AI (AutoML / PyCaret)', category: 'Productivity', demand: 42, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Rapid baseline benchmarking, model comparison matrices, and fast-track prototyping.' },
      { name: 'Web Scraping & Data Extraction (BeautifulSoup / Scrapy)', category: 'Data Ingestion', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Automated HTML parsing, headless browser automation, and API response ingestion.' },

      // TIER 4: Best Practices & Governance (39-43)
      { name: 'Agile & Scrum for Analytics Teams', category: 'Methodology', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Two-week sprint delivery, backlog grooming, user story sizing, and iterative data product shipping.' },
      { name: 'Data Privacy & Ethics (GDPR / HIPAA Compliance)', category: 'Compliance', demand: 38, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Personally Identifiable Information (PII) masking, differential privacy, and ethical data governance.' },
      { name: 'Technical Storytelling & Stakeholder Presentations', category: 'Communication', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Translating complex quantitative findings into high-impact executive business recommendations.' },
      { name: 'Data Lineage & Metadata Cataloging', category: 'Data Governance', demand: 36, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Tracking end-to-end data provenance, data dictionary maintenance, and audit readiness.' },
      { name: 'Production Data Drift & Quality Alerting', category: 'Observability', demand: 35, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Automated statistical distribution drift checks (Evidently AI / Great Expectations) and PagerDuty alerts.' },
    ];
  }

  // 2. DATA ANALYST & BI ANALYST
  if (r.includes('data analyst') || r.includes('bi analyst')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'SQL & Complex Querying', category: 'Databases', demand: 99, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Writing CTEs, window aggregations, subqueries, complex multi-table joins, and query optimization.' },
      { name: 'Microsoft Excel & Advanced Formulas', category: 'Spreadsheets', demand: 98, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'XLOOKUP, INDEX-MATCH, Pivot Tables, power query data transforms, and complex business logic formulas.' },
      { name: 'Power BI & DAX Calculations', category: 'Business Intelligence', demand: 96, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Building enterprise executive dashboards, DAX measures, data modeling, and relationship schemas.' },
      { name: 'Tableau Desktop & Server', category: 'Visualization', demand: 94, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Level of Detail (LOD) expressions, parameters, storyboards, and interactive dashboard publishing.' },
      { name: 'Python (Pandas, NumPy, Matplotlib)', category: 'Programming', demand: 92, trend: 'up', priority: 'High', status: 'Rising', desc: 'Data cleaning scripts, exploratory data analysis (EDA), automated reporting, and statistical graphing.' },
      { name: 'Exploratory Data Analysis (EDA)', category: 'Analytics', demand: 90, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Identifying trends, anomaly detection, cohort tracking, and root-cause business variance analysis.' },
      { name: 'Business Metrics & KPI Frameworks', category: 'Business Strategy', demand: 89, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Defining North Star metrics, customer churn rates, LTV/CAC ratios, GMV, and retention curves.' },
      { name: 'Data Cleaning, Validation & Wrangling', category: 'Data Preparation', demand: 88, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Handling missing values, deduplication, standardizing date/currency formats, and schema enforcement.' },
      { name: 'Statistical Foundations & Hypothesis Testing', category: 'Statistics', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'A/B testing analysis, p-values, normal distributions, standard deviation, and sample size estimation.' },
      { name: 'Data Storytelling & Executive Presentations', category: 'Communication', demand: 85, trend: 'up', priority: 'High', status: 'Rising', desc: 'Translating quantitative numbers into visual business narratives and strategic recommendations for leadership.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Relational Database Design (PostgreSQL / MySQL)', category: 'Databases', demand: 83, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Dimensional star schema, snowflake schema, entity relationship diagrams (ERDs), and normalization.' },
      { name: 'Cloud Data Warehouses (Snowflake / BigQuery)', category: 'Cloud Warehousing', demand: 81, trend: 'rapid', priority: 'High', status: 'Rising', desc: 'Querying massive datasets in BigQuery, partitioning, clustering, and cost-effective SQL execution.' },
      { name: 'Google Analytics 4 & Product Telemetry', category: 'Product Analytics', demand: 79, trend: 'up', priority: 'High', status: 'Rising', desc: 'Tracking user conversion funnels, event triggers, bounce rates, and campaign UTM attribution.' },
      { name: 'Git & Version-Controlled Analytics', category: 'Developer Tools', demand: 77, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Managing SQL transformation scripts, dashboard code repositories, and collaborative peer reviews.' },
      { name: 'dbt (Data Build Tool) Core', category: 'Analytics Engineering', demand: 76, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Modular SQL modeling, documentation generation, and automated data freshness testing.' },
      { name: 'A/B Testing & Conversion Rate Optimization (CRO)', category: 'Experimentation', demand: 74, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Experiment variant tracking, statistical significance checks, confidence intervals, and lift analysis.' },
      { name: 'Customer Segmentation & RFM Analysis', category: 'Marketing Analytics', demand: 73, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Recency-Frequency-Monetary scoring, behavioral clustering, and targeted marketing insights.' },
      { name: 'Cohort & Retention Analysis', category: 'Growth Analytics', demand: 71, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'User retention matrices, churn progression over time, and feature adoption drop-off curves.' },
      { name: 'ETL Basics & Data Ingestion (Fivetran / Stitch)', category: 'Data Pipelines', demand: 70, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Connecting SaaS data sources, automated sync schedules, and schema mapping into warehouses.' },
      { name: 'Looker & LookML Data Modeling', category: 'BI Tools', demand: 68, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Defining LookML dimensions, measures, explores, and building centralized semantic layers.' },
      { name: 'Financial & Budget Forecasting in Spreadsheets', category: 'Finance Analytics', demand: 67, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'P&L variance modeling, run-rate projections, scenario analysis, and cash flow simulations.' },
      { name: 'Automated Reporting & Email Alerts (Python / Airflow)', category: 'Automation', demand: 65, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Scheduling daily KPI digests, automated Slack alerts on metric anomalies, and cron jobs.' },
      { name: 'Alteryx & Low-Code Workflow Automation', category: 'Analytics Automation', demand: 64, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Visual data preparation flows, geospatial blending, and automated scheduled workflows.' },
      { name: 'Salesforce & CRM Analytics', category: 'Sales Analytics', demand: 62, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Pipeline velocity, win-rate analysis, quota attainment, and lead conversion funnel tracking.' },
      { name: 'Basic Machine Learning for Analysts (Scikit-Learn)', category: 'Predictive Analytics', demand: 60, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Linear regression for trend forecasting, decision trees, and customer clustering.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'AWS QuickSight & Cloud BI', category: 'Cloud BI', demand: 58, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Serverless dashboards with ML insights, SPICE engine optimization, and enterprise IAM security.' },
      { name: 'Market Basket & Association Rule Mining', category: 'Retail Analytics', demand: 56, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Apriori algorithm, support/confidence/lift metrics for cross-sell recommendations.' },
      { name: 'Time Series Trend Decomposition', category: 'Forecasting', demand: 54, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Extracting seasonal patterns, baseline moving averages, and cyclical demand fluctuations.' },
      { name: 'Geospatial Analytics & QGIS / Folium', category: 'Spatial Analysis', demand: 52, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Choropleth mapping, coordinate heatmaps, polygon boundary filtering, and location density analysis.' },
      { name: 'Web Scraping for Market Research (BeautifulSoup)', category: 'Data Sourcing', demand: 51, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Scraping competitor pricing, product catalog updates, and structured HTML parsing.' },
      { name: 'Mixpanel / Amplitude Product Funnels', category: 'Product Analytics', demand: 50, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Event taxonomy design, user pathway exploration, and feature stickiness benchmarking.' },
      { name: 'Survey Data Analysis & NPS Metrics', category: 'CX Analytics', demand: 48, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Net Promoter Score calculations, CSAT tracking, sentiment coding, and Likert scale evaluation.' },
      { name: 'NoSQL Querying (MongoDB / Athena JSON)', category: 'Databases', demand: 47, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Unnesting JSON arrays, querying semi-structured event logs, and schema-on-read querying.' },
      { name: 'Excel VBA & Macro Automation', category: 'Legacy Automation', demand: 45, trend: 'down', priority: 'Low', status: 'Declining', desc: 'Writing VBA macros for repetitive spreadsheet tasks and report generation.' },
      { name: 'Data Dictionary & Metadata Maintenance', category: 'Data Governance', demand: 44, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Documenting column business definitions, calculation logic formulas, and source provenance.' },
      { name: 'Apache Superset Open-Source BI', category: 'Open BI', demand: 43, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Deploying open-source dashboarding layers connected to Postgres and Trino clusters.' },
      { name: 'Customer Journey Mapping & Touchpoints', category: 'Marketing Analytics', demand: 42, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Multi-touch attribution models (first-touch, last-touch, linear, W-shaped) and channel ROI.' },
      { name: 'HR & Workforce Analytics', category: 'Domain Analytics', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Attrition prediction, hiring velocity metrics, employee retention curves, and compensation benchmarking.' },

      // TIER 4: Best Practices & Governance (39-42)
      { name: 'Data Quality Auditing & Error Handling', category: 'Data Quality', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Reconciliation scripts, null count thresholds, duplicate detection alerts, and cross-source checks.' },
      { name: 'Agile Analytics & Jira Kanban Sprints', category: 'Methodology', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Managing ad-hoc request backlogs, user story estimation, and sprint deliverable tracking.' },
      { name: 'Data Privacy & GDPR PII Protection', category: 'Compliance', demand: 37, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Masking sensitive customer PII, anonymization standards, and role-based data access restrictions.' },
      { name: 'Executive Business Review Preparation', category: 'Executive Skills', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Creating quarterly business review (QBR) slides, highlighting strategic wins, and identifying risk areas.' },
    ];
  }

  // 3. DATA ENGINEER
  if (r.includes('data engineer')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'SQL & Advanced Query Optimization', category: 'Databases', demand: 99, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Partition pruning, indexing, execution plan analysis, CTEs, and large-scale relational modeling.' },
      { name: 'Python for Data Pipelines & Scripting', category: 'Programming', demand: 98, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Data structures, OOP, API integrations, generator streams, and pipeline orchestration scripts.' },
      { name: 'Apache Spark & PySpark Big Data', category: 'Distributed Computing', demand: 96, trend: 'rapid', priority: 'Critical', status: 'Rising', desc: 'Distributed transformations, RDDs, DataFrames, Catalyst optimizer, and Spark cluster execution.' },
      { name: 'Workflow Orchestration (Apache Airflow)', category: 'Orchestration', demand: 94, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'DAG development, dynamic task generation, sensor dependencies, SLA alerting, and task retries.' },
      { name: 'Cloud Data Warehouses (Snowflake / BigQuery)', category: 'Cloud Warehouses', demand: 92, trend: 'rapid', priority: 'Critical', status: 'Rising', desc: 'Snowpipe automated streaming, zero-copy cloning, clustering keys, and multi-cluster warehouses.' },
      { name: 'dbt (Data Build Tool) Analytics Engineering', category: 'Data Transformation', demand: 90, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Modular SQL transformations, incremental models, automated schema testing, and data lineage.' },
      { name: 'Data Modeling (Star Schema & 3NF Normalization)', category: 'Architecture', demand: 89, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Kimball dimensional modeling, fact/dimension tables, slowly changing dimensions (SCD Types 1, 2, 3).' },
      { name: 'Apache Kafka & Event Streaming', category: 'Event Streaming', demand: 88, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Producer/consumer APIs, topics, partition keys, consumer groups, and stream ingestion.' },
      { name: 'Relational & NoSQL Storage (PostgreSQL & MongoDB)', category: 'Storage Systems', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'ACID transaction management, replication, connection pooling, and semi-structured document querying.' },
      { name: 'Docker & Containerized Pipelines', category: 'DevOps', demand: 85, trend: 'up', priority: 'High', status: 'Rising', desc: 'Packaging ETL scripts into lightweight reproducible containers and multi-stage container builds.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Cloud Storage & Data Lakes (AWS S3 / GCS / Azure ADLS)', category: 'Cloud Storage', demand: 83, trend: 'up', priority: 'High', status: 'Rising', desc: 'Object lifecycle policies, bucket permissions, partitioned directory structures, and blob storage.' },
      { name: 'Delta Lake & Apache Iceberg Lakehouse Formats', category: 'Lakehouse', demand: 81, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'ACID transactions over Parquet files, time travel queries, schema evolution, and z-ordering.' },
      { name: 'Linux OS & Bash Shell Automation', category: 'Systems', demand: 80, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Crontab scheduling, process management, SSH remote execution, disk I/O monitoring, and shell scripts.' },
      { name: 'Git & CI/CD Pipelines (GitHub Actions / GitLab CI)', category: 'DevOps', demand: 78, trend: 'up', priority: 'High', status: 'Rising', desc: 'Automated data pipeline testing, linting checks (sqlfluff), pull request validations, and continuous delivery.' },
      { name: 'Columnar File Formats (Parquet, ORC, Avro)', category: 'Data Serialization', demand: 77, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Snappy compression, columnar projection pushdown, dictionary encoding, and Avro schema evolution.' },
      { name: 'AWS Managed Data Services (Glue, EMR, Athena, Redshift)', category: 'AWS Cloud', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Serverless crawler catalogs, serverless Spark jobs, interactive queries, and cluster management.' },
      { name: 'Distributed Query Engines (Presto / Trino)', category: 'Query Engines', demand: 74, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Federated SQL queries across heterogeneous data sources without data migration.' },
      { name: 'Redis & In-Memory Key-Value Caching', category: 'Caching', demand: 72, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'TTL cache policies, high-throughput key-value lookup, Pub/Sub, and deduplication sets.' },
      { name: 'Data Quality & Validation (Great Expectations / Soda)', category: 'Data Quality', demand: 71, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Automated assertions, schema drift alerts, anomaly detection, and data contract enforcement.' },
      { name: 'REST APIs & Webhooks Data Ingestion', category: 'Data Ingestion', demand: 69, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Paginated API scraping, rate limiting backoff, OAuth token refreshing, and JSON response parsing.' },
      { name: 'Apache Flink & Real-Time Stateful Stream Processing', category: 'Stream Processing', demand: 68, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Low-latency event-time processing, watermarks, sliding windows, and state checkpointing.' },
      { name: 'Databricks Unity Catalog & Managed Spark', category: 'Lakehouse Platform', demand: 66, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Centralized data governance, workspace notebooks, and serverless compute clusters.' },
      { name: 'Kubernetes for Data Infrastructure (K8s)', category: 'Cloud Infrastructure', demand: 65, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Deploying Spark-on-K8s, Airflow KubernetesExecutor, resource quotas, and pod lifecycle.' },
      { name: 'ClickHouse & Real-Time OLAP Databases', category: 'OLAP Databases', demand: 63, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'High-throughput append logs, vectorized query execution, and sub-second analytics.' },
      { name: 'Terraform & Infrastructure as Code (IaC)', category: 'Cloud DevOps', demand: 61, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Provisioning cloud storage buckets, IAM roles, warehouse clusters, and network policies declaratively.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Data Lineage & Metadata Cataloging (OpenMetadata / Amundsen)', category: 'Governance', demand: 59, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'End-to-end data provenance tracking, automated column-level lineage, and discovery catalogs.' },
      { name: 'Apache Cassandra & Distributed NoSQL', category: 'Distributed DB', demand: 57, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Masterless peer-to-peer ring architecture, tunable consistency, and high-velocity write throughput.' },
      { name: 'Change Data Capture (CDC & Debezium)', category: 'Real-Time Ingestion', demand: 56, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Streaming database transaction log binlogs into Kafka topics with zero production query load.' },
      { name: 'Scala for Apache Spark Extensions', category: 'Languages', demand: 54, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Functional programming, type-safe Spark RDDs, and high-performance custom Spark UDFs.' },
      { name: 'Elasticsearch for Log Indexing & Search', category: 'Search Engines', demand: 53, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Inverted indexes, log aggregation, and real-time telemetry indexing.' },
      { name: 'Apache Arrow & In-Memory Data Sharing', category: 'Memory Formats', demand: 51, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Zero-copy in-memory IPC, cross-language DataFrame interchange, and SIMD acceleration.' },
      { name: 'Grafana & Prometheus Pipeline Monitoring', category: 'Observability', demand: 50, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Pipeline latency metrics, DAG failure rates, cluster CPU/memory telemetry, and PagerDuty integration.' },
      { name: 'Data Mesh & Domain-Driven Data Architecture', category: 'Architecture', demand: 48, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Self-serve data platforms, federated computational governance, and data products as a service.' },
      { name: 'Reverse ETL (Hightouch / Census)', category: 'Integration', demand: 47, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Syncing warehouse insights back into CRM (Salesforce/HubSpot) and operational tools.' },
      { name: 'Apache Beam & Unified Streaming/Batch', category: 'Pipeline Frameworks', demand: 45, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Writing portable multi-cloud data pipelines executable on Google Cloud Dataflow and Spark.' },
      { name: 'Vector Database Ingestion Pipelines', category: 'AI Infrastructure', demand: 44, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Automated batch embedding generation, chunking text documents, and upserting to Pinecone/Milvus.' },
      { name: 'Data Privacy Masking & Anonymization', category: 'Security', demand: 43, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Dynamic PII hashing, tokenization, column encryption-at-rest, and role-based masking policies.' },
      { name: 'Cloud FinOps & Warehouse Cost Optimization', category: 'FinOps', demand: 41, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Snowflake warehouse auto-suspend tuning, BigQuery slot allocation, and storage tiering.' },

      // TIER 4: Best Practices & Governance (39-42)
      { name: 'Data SLA & Contract Management', category: 'Operations', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Formal schema contracts between software engineers and data pipelines to prevent schema breakages.' },
      { name: 'Disaster Recovery & Backup Replication', category: 'Reliability', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Cross-region data replication, point-in-time recovery testing, and warehouse failover runbooks.' },
      { name: 'Agile Sprint Planning for Data Teams', category: 'Methodology', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Managing technical debt, story estimation for complex pipelines, and sprint milestone delivery.' },
      { name: 'Automated Data Pipeline Documentation', category: 'Documentation', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Generating self-updating Markdown documentation from dbt models and database schemas.' },
    ];
  }

  // 4. AI ENGINEER & GENERATIVE AI SPECIALIST
  if (r.includes('ai') || r.includes('generative') || r.includes('genai') || r.includes('llm')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'Python & Scientific Computing (NumPy, SciPy)', category: 'Programming', demand: 99, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Vectorized operations, matrix computations, algorithm implementation, and high-performance data routines.' },
      { name: 'PyTorch & Neural Network Architecture', category: 'Deep Learning', demand: 97, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'Custom autograd modules, training loops, loss functions, optimizer tuning, and multi-GPU distributed data parallel.' },
      { name: 'Foundation Models & HuggingFace Transformers', category: 'Applied Deep Learning', demand: 96, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'Self-attention mechanisms, pretrained LLM tokenizers, pipeline fine-tuning, and HuggingFace model architectures.' },
      { name: 'Retrieval-Augmented Generation (RAG)', category: 'GenAI Architecture', demand: 94, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'Vector store retrieval, contextual reranking, semantic chunking, and document augmentation.' },
      { name: 'Vector Databases & Similarity Search (Pinecone/Milvus)', category: 'AI Infrastructure', demand: 92, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'HNSW indexing, IVFFlat, cosine similarity search, and high-dimensional vector embeddings storage.' },
      { name: 'Prompt Engineering & Programmatic Compilation (DSPy)', category: 'Prompt Optimization', demand: 90, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Few-shot prompting, chain-of-thought, ReAct reasoning, and algorithmic metric-driven compilation.' },
      { name: 'LangChain & LlamaIndex Frameworks', category: 'Orchestration', demand: 89, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Building multi-step reasoning chains, agentic tool bindings, structured output parsers, and memory buffers.' },
      { name: 'OpenAI, Anthropic & Claude API Integrations', category: 'APIs', demand: 87, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Function calling, streaming responses, structured JSON output mode, and token rate limit backoffs.' },
      { name: 'Scikit-Learn & Classical Machine Learning', category: 'Core ML', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Baseline regression, clustering, classification, cross-validation, and performance benchmarking.' },
      { name: 'Model Evaluation Metrics (BLEU, ROUGE, BERTScore)', category: 'Validation', demand: 84, trend: 'up', priority: 'High', status: 'Rising', desc: 'Evaluating generation accuracy, semantic similarity, hallucination rates, and LLM-as-a-judge benchmarking.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Parameter-Efficient Fine-Tuning (LoRA / QLoRA / PEFT)', category: 'LLM Fine-Tuning', demand: 83, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Low-Rank Adaptation, 4-bit quantized training, gradient checkpointing, and adapter merging.' },
      { name: 'CUDA GPU Acceleration & Memory Profiling', category: 'Hardware Systems', demand: 81, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Mixed precision FP16/BF16 training (AMP), GPU memory hierarchy, and avoiding CUDA out-of-memory errors.' },
      { name: 'Inference Optimization (vLLM / TensorRT-LLM / ONNX)', category: 'Inference Serving', demand: 80, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'PagedAttention, continuous batching, FP8/INT4 weight quantization, and sub-millisecond serving.' },
      { name: 'FastAPI & Production REST Microservices', category: 'Production Systems', demand: 78, trend: 'up', priority: 'High', status: 'Rising', desc: 'Building asynchronous REST endpoints, streaming Server-Sent Events (SSE), and Pydantic validation.' },
      { name: 'Agentic AI & Multi-Agent Systems (CrewAI / AutoGen)', category: 'Agentic Workflows', demand: 77, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Autonomous agent coordination, role-playing task delegation, and external tool execution loops.' },
      { name: 'Docker & Containerization for AI Models', category: 'DevOps', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Containerizing model checkpoints with NVIDIA Container Toolkit and lightweight runtime base images.' },
      { name: 'MLOps & Experiment Tracking (MLflow / WandB)', category: 'ML Operations', demand: 74, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Tracking loss curves, prompt experiment versions, evaluation benchmarks, and artifact registries.' },
      { name: 'SQL & Training Dataset Extraction', category: 'Databases', demand: 72, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Extracting clean fine-tuning examples, customer conversation logs, and relational dataset prep.' },
      { name: 'Cloud AI Platforms (AWS SageMaker / GCP Vertex AI)', category: 'Cloud AI', demand: 71, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Deploying serverless endpoints, managing training instances, and cloud model registries.' },
      { name: 'Direct Preference Optimization (DPO & RLHF)', category: 'Alignment', demand: 69, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Aligning model outputs with human preferences using paired preference datasets and reward models.' },
      { name: 'Multimodal AI & Vision-Language Models (CLIP / GPT-4V)', category: 'Multimodal', demand: 68, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Joint visual-textual reasoning, cross-attention encoders, and image understanding pipelines.' },
      { name: 'AI Safety, Guardrails & NeMo Guardrails', category: 'Security & Safety', demand: 66, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Preventing prompt injections, hallucination boundaries, jailbreak moderation, and topical constraints.' },
      { name: 'Distributed Model Training (DeepSpeed / Ray)', category: 'Distributed AI', demand: 65, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'ZeRO memory optimization, tensor parallelism, and distributed multi-node GPU cluster training.' },
      { name: 'Git & Version Control for AI Repositories', category: 'Developer Tools', demand: 63, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Code review workflows, configuration management, and reproducible environment dependencies.' },
      { name: 'Synthetic Dataset Generation & Augmentation', category: 'Data Engineering', demand: 62, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Generating multi-turn instruction datasets using teacher LLMs, self-instruct, and data filtering.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Speech AI & Audio Transcription (Whisper)', category: 'Audio AI', demand: 59, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Acoustic waveform processing, mel-spectrogram feature extraction, and real-time speech-to-text.' },
      { name: 'Diffusion Models & Generative Image Synthesis', category: 'Generative Media', demand: 57, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Latent diffusion architectures, ControlNet condition adapters, and image-to-image synthesis.' },
      { name: 'Edge AI Deployment (OpenVINO / ONNX / CoreML)', category: 'Edge Computing', demand: 55, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Quantizing neural models for low-power mobile, ARM, and embedded edge device deployment.' },
      { name: 'Graph Neural Networks (PyTorch Geometric)', category: 'Graph AI', demand: 54, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Message passing neural networks, graph convolutional layers, and node classification.' },
      { name: 'Embedding Distillation & Bi-Encoder Fine-Tuning', category: 'Embeddings', demand: 52, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Hard negative mining, multiple negatives ranking loss, and domain-adapted semantic search.' },
      { name: 'Low-Latency C++ Model Serving Runtimes', category: 'Systems Engineering', demand: 51, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Custom LibTorch C++ inference engines, memory pinned buffers, and sub-millisecond execution.' },
      { name: 'Kubernetes for AI Clusters (K8s & GPU Operator)', category: 'Infrastructure', demand: 49, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Autoscaling GPU inference pods, spot instance management, and cluster load balancing.' },
      { name: 'Model Distillation & Pruning Techniques', category: 'Compression', demand: 48, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Knowledge distillation from frontier models to compact 1B-3B student architectures.' },
      { name: 'Custom CUDA Kernel Programming (Triton / C++)', category: 'High Performance', demand: 46, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Writing OpenAI Triton Python kernels for custom attention mechanisms and fused operations.' },
      { name: 'CI/CD for Machine Learning (CML / DVC)', category: 'MLOps Automation', demand: 45, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Automated evaluation reports on pull requests and dataset version control.' },
      { name: 'Semantic Caching for LLM Responses (GPTCache / Redis)', category: 'Optimization', demand: 44, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Vector similarity response caching to reduce LLM API latency and billing costs.' },
      { name: 'Prompt Hacking Defense & Red Teaming', category: 'Security', demand: 42, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Adversarial jailbreak attacks, indirect prompt injection tests, and system prompt protection.' },
      { name: 'Explainability for Deep Neural Networks (Captum)', category: 'Interpretability', demand: 41, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Integrated gradients, layer conductances, and feature attribution heatmaps.' },

      // TIER 4: Best Practices & Governance (39-44)
      { name: 'Responsible AI & Bias Mitigation Frameworks', category: 'Ethics', demand: 39, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Fairness metrics, toxicity benchmarks, demographic representation checks, and ethical safety audits.' },
      { name: 'Model Documentation & Model Cards Standards', category: 'Documentation', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Documenting model capabilities, intended use cases, known failure modes, and training distributions.' },
      { name: 'Production AI SLA & Latency Budgeting', category: 'Operations', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'P99 latency constraints, streaming chunk time-to-first-token (TTFT), and graceful degradations.' },
      { name: 'Enterprise Data Privacy (Zero Retention / VPC Deployment)', category: 'Compliance', demand: 36, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Deploying isolated self-hosted LLM endpoints with zero third-party data leakage guarantees.' },
    ];
  }

  // 5. MACHINE LEARNING ENGINEER & MLOPS ENGINEER
  if (r.includes('machine learning') || r.includes('mlops')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'Python & Scientific Computing (NumPy, SciPy)', category: 'Programming', demand: 99, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Vectorized mathematical operations, matrix routines, and algorithm performance optimization.' },
      { name: 'PyTorch & Deep Learning Frameworks', category: 'Deep Learning', demand: 97, trend: 'rapid', priority: 'Critical', status: 'Rising', desc: 'Custom neural layers, loss functions, GPU acceleration, and distributed training primitives.' },
      { name: 'Scikit-Learn & Classical ML Algorithms', category: 'Core ML', demand: 95, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Gradient boosted trees (XGBoost/LightGBM), random forests, SVMs, clustering, and pipelines.' },
      { name: 'MLOps & Model Lifecycle (MLflow / Weights & Biases)', category: 'ML Operations', demand: 93, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'Experiment parameter logging, metric visualization, model registry, and artifact versioning.' },
      { name: 'Docker & Containerized Model Serving', category: 'DevOps', demand: 91, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Multi-stage Docker builds, NVIDIA container runtime, and lightweight reproducible inference containers.' },
      { name: 'REST APIs & Asynchronous Serving (FastAPI)', category: 'API Development', demand: 90, trend: 'up', priority: 'High', status: 'Rising', desc: 'Building asynchronous model prediction endpoints, request batching, and schema validation.' },
      { name: 'SQL & Large-Scale Feature Extraction', category: 'Databases', demand: 88, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Querying relational databases, complex joins, feature extraction scripts, and window aggregations.' },
      { name: 'Model Evaluation, Validation & Cross-Validation', category: 'Model Validation', demand: 87, trend: 'stable', priority: 'High', status: 'Stable', desc: 'ROC-AUC, F1-Score, Precision-Recall, stratified k-fold splits, and confusion matrix auditing.' },
      { name: 'Feature Engineering & Data Preprocessing', category: 'Data Preparation', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Handling missing values, categorical encoders (Target/One-Hot), PCA, and scaling transformations.' },
      { name: 'Git & Version Control Collaboration', category: 'Developer Tools', demand: 84, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Branching workflows, pull request code reviews, release tagging, and repository hygiene.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Kubernetes & Kubeflow Pipelines', category: 'Orchestration', demand: 83, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Automated containerized training workflows, pod scheduling, and resource allocation on Kubernetes.' },
      { name: 'Feature Stores (Feast / Hopsworks)', category: 'Feature Management', demand: 81, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Standardizing offline training features and low-latency online feature serving for real-time inference.' },
      { name: 'Hyperparameter Optimization (Optuna / Ray Tune)', category: 'Model Tuning', demand: 80, trend: 'up', priority: 'High', status: 'Rising', desc: 'Bayesian optimization, Tree-structured Parzen Estimators (TPE), and distributed pruning.' },
      { name: 'Inference Engines (NVIDIA Triton / ONNX Runtime)', category: 'Inference Systems', demand: 78, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Dynamic request batching, concurrent model execution, and GPU graph optimization.' },
      { name: 'Continuous Integration & CD for ML (GitHub Actions / CML)', category: 'CI/CD for ML', demand: 76, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Automated model retraining triggers, model accuracy pull request gates, and deployment.' },
      { name: 'Cloud ML Platforms (AWS SageMaker / GCP Vertex AI)', category: 'Cloud ML', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Managed training spot instances, serverless inference endpoints, and cloud model monitoring.' },
      { name: 'Data Version Control (DVC)', category: 'Data Management', demand: 73, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Version-controlling multi-gigabyte training datasets and connecting cloud storage buckets to Git commits.' },
      { name: 'Production Drift Monitoring (Evidently AI / Great Expectations)', category: 'Observability', demand: 72, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Detecting data distribution drift, prediction concept drift, and automated alerting on model degradation.' },
      { name: 'Big Data Processing (PySpark / Databricks)', category: 'Distributed Data', demand: 70, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Distributed feature engineering over terabyte-scale datasets using Spark DataFrames.' },
      { name: 'Model Quantization & Compression (TensorRT / INT8)', category: 'Optimization', demand: 69, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Post-training quantization, weight pruning, and memory reduction for high-throughput inference.' },
      { name: 'Linux System Administration & Bash Scripting', category: 'Systems', demand: 67, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Automated cron jobs, monitoring GPU status (nvidia-smi), and shell automation.' },
      { name: 'Distributed Training (PyTorch DDP / Ray)', category: 'Distributed ML', demand: 66, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Multi-GPU Distributed Data Parallel training, gradient synchronization, and cluster orchestration.' },
      { name: 'Transformers & Foundation Model Fine-Tuning', category: 'Applied AI', demand: 65, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Fine-tuning HuggingFace models with LoRA and PEFT for domain-specific NLP/Vision tasks.' },
      { name: 'Time Series Forecasting & Anomaly Detection', category: 'Applied ML', demand: 63, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Autoregressive models, Prophet, LSTM networks, and industrial telemetry anomaly detection.' },
      { name: 'Vector Databases (Pinecone / Qdrant)', category: 'AI Infrastructure', demand: 61, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Storing model vector embeddings, semantic nearest-neighbor retrieval, and metadata filtering.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Model Interpretability & Explainability (SHAP / LIME)', category: 'Governance', demand: 59, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Feature importance rankings, partial dependence plots, and tree SHAP value calculation.' },
      { name: 'Edge AI Deployment (TFLite / OpenVINO / CoreML)', category: 'Edge Computing', demand: 57, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Deploying optimized neural networks on ARM, Raspberry Pi, and mobile device chipsets.' },
      { name: 'Modern C++ for Low-Latency Inference', category: 'Systems Programming', demand: 56, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Writing high-performance C++ wrappers around LibTorch and TensorRT engine graphs.' },
      { name: 'Kafka & Real-Time Event Stream Ingestion', category: 'Event Streaming', demand: 54, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Streaming real-time features from Kafka topics directly into live model scoring engines.' },
      { name: 'Grafana & Prometheus Metrics for ML Servings', category: 'Monitoring', demand: 53, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Tracking P99 inference latency, throughput queries per second (QPS), and CPU/GPU memory loads.' },
      { name: 'Airflow for Scheduled ML Retraining', category: 'Orchestration', demand: 51, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Scheduling weekly batch feature extraction, model retraining DAGs, and evaluation steps.' },
      { name: 'Synthetic Data Generation (GANs / Diffusion)', category: 'Data Augmentation', demand: 50, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Synthesizing edge-case tabular and image training samples to balance under-represented classes.' },
      { name: 'Terraform for AI Cloud Infrastructure (IaC)', category: 'Infrastructure', demand: 48, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Automated provisioning of GPU clusters, storage buckets, and secure networking VPCs.' },
      { name: 'A/B Testing Infrastructure for ML Models', category: 'Experimentation', demand: 47, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Canary deployments, shadow model scoring, multi-armed bandits, and traffic splitting.' },
      { name: 'Computer Vision Basics (OpenCV & YOLO)', category: 'Visual AI', demand: 45, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Image preprocessing, bounding box augmentations, and object detection inference pipelines.' },
      { name: 'Automated Machine Learning (AutoML)', category: 'Productivity', demand: 44, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Automated model architecture search, baseline benchmarking, and automated pipeline generation.' },
      { name: 'Graph Neural Networks (PyTorch Geometric)', category: 'Graph ML', demand: 42, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Graph embeddings, message passing layers, and fraud detection on connected network graphs.' },
      { name: 'Active Learning & Uncertainty Sampling', category: 'Data Curation', demand: 41, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Selecting highest-uncertainty samples for human-in-the-loop annotation to minimize labeling cost.' },

      // TIER 4: Best Practices & Governance (39-43)
      { name: 'Responsible AI, Fairness & Bias Auditing', category: 'Ethics', demand: 39, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Evaluating demographic parity, equalized odds, and mitigating algorithmic training bias.' },
      { name: 'Model Documentation & Standardized Model Cards', category: 'Documentation', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Documenting training parameters, intended business scope, limitations, and benchmark results.' },
      { name: 'Production AI SLA & Latency Budgeting', category: 'Operations', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Setting latency thresholds, timeout fallbacks, graceful degradation, and disaster failovers.' },
      { name: 'Agile & MLOps Scrum Collaboration', category: 'Methodology', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Managing experiment backlogs, sizing engineering spikes, and sprint retrospective delivery.' },
      { name: 'Security Hardening for Model Endpoints', category: 'Security', demand: 35, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Securing model serialization files against pickle exploits, API authentication, and rate limiting.' },
    ];
  }

  // 6. FULL STACK DEVELOPER & SOFTWARE ENGINEER
  if (r.includes('full') || r.includes('software') || r.includes('developer') || r.includes('backend') || r.includes('frontend')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'TypeScript & JavaScript (ES6+)', category: 'Languages', demand: 98, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Strict type systems, asynchronous event loops, promises, generics, and modern ESNext features.' },
      { name: 'React & Next.js 15', category: 'Frontend Architecture', demand: 96, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'React Server Components, server actions, dynamic routing, state hooks, and client-side performance.' },
      { name: 'Node.js & Backend Runtime Services', category: 'Backend Development', demand: 94, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Express / NestJS REST backends, event loops, middleware pipelines, and scalable I/O handling.' },
      { name: 'SQL & Relational Databases (PostgreSQL / MySQL)', category: 'Databases', demand: 92, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Complex relational schemas, ACID transactions, index optimization, and connection pooling.' },
      { name: 'RESTful API Architecture & Design', category: 'API Design', demand: 90, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Stateless endpoints, standard HTTP status codes, request validation, and OpenAPI documentation.' },
      { name: 'Git & GitHub Collaborative Workflows', category: 'Developer Tooling', demand: 89, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Branching models, rebasing, pull request reviews, merge conflict resolution, and release tags.' },
      { name: 'HTML5 & Modern Responsive CSS / Tailwind', category: 'UI Development', demand: 87, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Semantic layout, CSS Grid/Flexbox, responsive breakpoints, accessible ARIA roles, and Tailwind styling.' },
      { name: 'Data Structures & Algorithmic Problem Solving', category: 'Computer Science', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Arrays, hash maps, trees, graphs, dynamic programming, and Big-O time/space complexity analysis.' },
      { name: 'Clean Code & SOLID Design Principles', category: 'Software Design', demand: 85, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Maintainable modular code, dependency injection, interface segregation, and DRY/KISS architecture.' },
      { name: 'Frontend State Management (Zustand / Redux)', category: 'Frontend Architecture', demand: 83, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Global application state stores, selectors, immutable updates, and reactive action dispatching.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Docker & Containerization', category: 'DevOps', demand: 81, trend: 'up', priority: 'High', status: 'Rising', desc: 'Dockerfile optimization, multi-stage builds, container networking, and docker-compose orchestration.' },
      { name: 'Python & Backend Frameworks (FastAPI / Django)', category: 'Backend Languages', demand: 79, trend: 'up', priority: 'High', status: 'Rising', desc: 'Async Python endpoint design, Pydantic data validation, and ORM integrations.' },
      { name: 'NoSQL Databases (MongoDB & Redis Caching)', category: 'Databases & Caching', demand: 77, trend: 'up', priority: 'High', status: 'Rising', desc: 'Document schemas, Redis in-memory key-value caching, pub/sub, and session storage.' },
      { name: 'CI/CD Pipelines & GitHub Actions Automation', category: 'Automation', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Automated test workflows, linting checks, build verification, and continuous deployment.' },
      { name: 'Cloud Infrastructure (AWS S3 / EC2 / Lambda)', category: 'Cloud Computing', demand: 74, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Deploying serverless functions, static asset buckets, compute instances, and load balancers.' },
      { name: 'Automated Testing (Jest / Playwright / Cypress)', category: 'Quality Assurance', demand: 72, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Unit testing, component mocking, integration tests, and end-to-end browser regression automation.' },
      { name: 'Authentication & Security (JWT, OAuth, NextAuth)', category: 'Security & Auth', demand: 71, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Token encryption, password hashing (bcrypt), refresh tokens, RBAC permissions, and social logins.' },
      { name: 'Microservices & Distributed Architecture', category: 'System Architecture', demand: 69, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Service discovery, API gateways, independent deployments, and loose coupling patterns.' },
      { name: 'Message Queues (Kafka / RabbitMQ)', category: 'Event Streaming', demand: 68, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Asynchronous event streaming, consumer groups, message partitioning, and backpressure handling.' },
      { name: 'GraphQL API Architecture (Apollo / Yoga)', category: 'APIs', demand: 66, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Schema definition language, query resolvers, mutations, and avoiding over-fetching.' },
      { name: 'WebSockets & Real-Time Sync (Socket.io)', category: 'Real-Time Systems', demand: 65, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Bi-directional socket connections, live notifications, real-time collaboration, and ping heartbeats.' },
      { name: 'System Design & High-Scalability Patterns', category: 'Engineering Design', demand: 64, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Horizontal scaling, database sharding, CAP theorem trade-offs, and rate limiting.' },
      { name: 'Linux Server Administration & Nginx', category: 'Infrastructure', demand: 62, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Nginx reverse proxying, systemd services, firewall rules (UFW), and SSL certbot automation.' },
      { name: 'Web Performance & Core Web Vitals (LCP/CLS)', category: 'Performance', demand: 61, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'LCP/FID/CLS optimization, code splitting, asset preloading, and bundle compression.' },
      { name: 'Mobile App Development (React Native / Flutter)', category: 'Mobile', demand: 60, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Cross-platform mobile UI, native bridge bindings, push notifications, and app store deployment.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Kubernetes Cluster Management & Helm', category: 'Cloud Native', demand: 58, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Pod manifests, deployment replicas, service ingress, and automated rolling updates.' },
      { name: 'Serverless Edge Functions (Vercel Edge / Cloudflare)', category: 'Edge Computing', demand: 56, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Low-latency serverless edge execution, edge KV storage, and geo-distributed rendering.' },
      { name: 'gRPC & Protocol Buffers (Protobuf)', category: 'High-Performance APIs', demand: 54, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Binary serialization, strongly-typed RPC definitions, and bi-directional streaming.' },
      { name: 'Elasticsearch & Full-Text Search Indexing', category: 'Search Engines', demand: 53, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Lucene inverted indexes, fuzzy matching, aggregation queries, and search relevance tuning.' },
      { name: 'Infrastructure as Code (Terraform)', category: 'DevOps', demand: 51, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Declarative cloud provisioning, state file management, and immutable infrastructure.' },
      { name: 'Web Security (CORS, CSRF, XSS, Content Security Policy)', category: 'AppSec', demand: 50, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Hardening browser security headers, sanitizing DOM inputs, and secure cookie configurations.' },
      { name: 'Database Read Replicas & Connection Pooling', category: 'Database Scaling', demand: 48, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Master-replica replication lags, PgBouncer connection pooling, and read-write splitting.' },
      { name: 'CDN Caching Strategies (Cache-Control / Stale-While-Revalidate)', category: 'Performance', demand: 47, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Edge cache invalidation, cache tagging, and static asset distribution optimization.' },
      { name: 'Progressive Web Apps (PWA & Service Workers)', category: 'Web Standards', demand: 45, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Offline cache intercepts, web app manifests, and background data synchronization.' },
      { name: 'WebAssembly (WASM) & Low-Level Web Modules', category: 'Emerging Web', demand: 44, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Compiling Rust/C++ to WASM bytecode for compute-intensive in-browser execution.' },
      { name: 'API Gateway & Rate Limiting (Kong / Envoy)', category: 'API Management', demand: 43, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Token bucket rate limiting, request throttling, and centralized API traffic routing.' },
      { name: 'Database Migration Tools (Prisma / Liquibase / Flyway)', category: 'Database Tooling', demand: 42, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Version-controlled database schema migrations, rollback scripts, and seed generation.' },
      { name: 'Storybook Component Design System', category: 'Frontend UI', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Isolated UI component development, visual regression testing, and design token documentation.' },

      // TIER 4: Best Practices & Governance (39-43)
      { name: 'Agile & Scrum Sprint Planning Delivery', category: 'Methodology', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Iterative sprint goals, epic breakdowns, standups, and retrospective continuous improvements.' },
      { name: 'Test-Driven Development (TDD & Red-Green-Refactor)', category: 'Engineering Practice', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Writing failing unit tests before implementation, ensuring high test coverage and regression safety.' },
      { name: 'Engineering RFCs & Architecture Documentation', category: 'Documentation', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Writing Request for Comments design docs, trade-off analysis, and system architecture diagrams.' },
      { name: 'Observability & APM (Datadog / Prometheus / Grafana)', category: 'Monitoring', demand: 36, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Distributed tracing (OpenTelemetry), CPU/memory metrics, and error rate alerting.' },
      { name: 'Production Incident Post-Mortem Reviews', category: 'Operations', demand: 35, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Blameless post-mortem investigations, timeline root cause analysis, and preventative action items.' },
    ];
  }

  // 7. CLOUD, DEVOPS & CYBERSECURITY
  if (r.includes('cloud') || r.includes('devops') || r.includes('sre') || r.includes('cyber') || r.includes('security') || r.includes('soc')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'Network Security & Firewall Architecture', category: 'Network Defense', demand: 98, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'TCP/IP packet routing, firewall ACLs, VLAN segmentation, VPN tunnels, and IDS/IPS inspection.' },
      { name: 'Linux System Security & Hardening', category: 'System Defense', demand: 96, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Kernel parameter hardening, sudo privilege separation, SSH key management, and auditd logging.' },
      { name: 'Python & Bash Security Automation', category: 'Scripting', demand: 94, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Automating security scans, parsing server logs, credential audits, and threat telemetry scripts.' },
      { name: 'SIEM & SOC Operations (Splunk / Microsoft Sentinel)', category: 'Incident Monitoring', demand: 92, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'Real-time alert triage, correlation rules, incident response playbooks, and log aggregation.' },
      { name: 'Vulnerability Assessment & Pen-Testing', category: 'Offensive Security', demand: 90, trend: 'up', priority: 'High', status: 'Rising', desc: 'Nessus vulnerability scans, Metasploit, Nmap network reconnaissance, and remediation reporting.' },
      { name: 'OWASP Top 10 & Web Application Security', category: 'AppSec', demand: 89, trend: 'up', priority: 'High', status: 'Rising', desc: 'Mitigating SQL injection, Cross-Site Scripting (XSS), CSRF, SSRF, and broken access controls.' },
      { name: 'Identity & Access Management (IAM / OAuth / SAML)', category: 'Identity Defense', demand: 87, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Role-Based Access Control (RBAC), multi-factor authentication (MFA), and single sign-on.' },
      { name: 'Cloud Infrastructure (AWS / Azure / GCP Security)', category: 'Cloud Security', demand: 86, trend: 'up', priority: 'High', status: 'Rising', desc: 'Securing cloud IAM policies, S3 bucket permissions, VPC security groups, and audit trails.' },
      { name: 'Docker & Container Security Hardening', category: 'DevSecOps', demand: 84, trend: 'up', priority: 'High', status: 'Rising', desc: 'Rootless container execution, image vulnerability scanning (Trivy), and secure base images.' },
      { name: 'Git & Infrastructure Version Control', category: 'Developer Tools', demand: 83, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Version-controlled security configurations, branch protections, and commit signing.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Threat Hunting & Incident Response (IR)', category: 'Defensive Operations', demand: 81, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Forensic memory analysis, timeline reconstruction, IoC (Indicators of Compromise) extraction.' },
      { name: 'Cryptography & PKI / TLS Certificate Management', category: 'Security Architecture', demand: 79, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Public-key infrastructure, SSL/TLS handshake security, AES/RSA ciphers, and automated cert renewal.' },
      { name: 'Wireshark & Deep Packet Inspection', category: 'Network Analysis', demand: 77, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Analyzing pcap traces, protocol anomalies, DNS exfiltration detection, and packet decryption.' },
      { name: 'Compliance Frameworks (ISO 27001, SOC 2, NIST)', category: 'Governance', demand: 75, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Security policy documentation, third-party risk assessments, and compliance audit frameworks.' },
      { name: 'Endpoint Detection & Response (EDR / CrowdStrike)', category: 'Endpoint Defense', demand: 74, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Behavioral malware blocking, agent telemetry, process tree inspection, and host containment.' },
      { name: 'DevSecOps & CI/CD Pipeline Security (SAST / DAST)', category: 'Application Security', demand: 72, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Static code analysis in pipeline (SonarQube), dynamic security scans, and secret scanning.' },
      { name: 'Zero Trust Architecture Governance', category: 'Modern Architecture', demand: 71, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Continuous authentication verification, micro-segmentation, and least privilege access.' },
      { name: 'Malware Analysis Fundamentals', category: 'Threat Intelligence', demand: 69, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Static string extraction, dynamic sandbox execution analysis, and Ghidra disassembling.' },
      { name: 'Infrastructure as Code Security (Terraform / Checkov)', category: 'Cloud Infrastructure', demand: 68, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Scanning Terraform HCL code for misconfigurations and enforcing immutable cloud guardrails.' },
      { name: 'Log Ingestion & ELK Stack (Elasticsearch/Kibana)', category: 'Telemetry', demand: 66, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Syslog forwarding, Windows Event Forwarding, and Elasticsearch schema mapping.' },
      { name: 'API Security & Web Application Firewalls (WAF)', category: 'API Defense', demand: 65, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Protecting API tokens, JSON schema validation, and preventing automated credential stuffing.' },
      { name: 'Kubernetes Security & OPA Gatekeeper', category: 'Cloud Native Defense', demand: 64, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Kubernetes RBAC policies, admission controllers, and network policy enforcement.' },
      { name: 'Cloud Security Posture Management (CSPM)', category: 'Cloud Governance', demand: 62, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Continuous posture assessment, drift detection, and multi-cloud compliance alerting.' },
      { name: 'Secrets Management (HashiCorp Vault / AWS KMS)', category: 'Key Management', demand: 61, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Dynamic database credentials, encryption-at-rest keys, and secret rotation policies.' },
      { name: 'Ansible & Automated Server Configuration', category: 'Automation', demand: 60, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Idempotent security playbook execution, patch orchestration, and baseline enforcement.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Red Teaming & MITRE ATT&CK Framework Mapping', category: 'Offensive Simulation', demand: 58, trend: 'up', priority: 'Low', status: 'Rising', desc: 'MITRE ATT&CK framework mapping, adversary emulation, and perimeter breach testing.' },
      { name: 'Active Directory & Kerberos Attack Defense', category: 'Enterprise Security', demand: 56, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Pass-the-Hash, Kerberoasting defense, BloodHound privilege auditing, and domain hardening.' },
      { name: 'Reverse Engineering & Disassembly (Ghidra / IDA)', category: 'Malware Forensics', demand: 54, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Decompiling binary payloads, analyzing obfuscated control flow, and extracting C2 signatures.' },
      { name: 'Network Intrusion Detection (Snort / Suricata / Zeek)', category: 'Network Defense', demand: 53, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Writing custom NIDS signatures, protocol behavioral inspection, and flow logging.' },
      { name: 'Cloud Digital Forensics & Incident Response (DFIR)', category: 'Digital Forensics', demand: 51, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'CloudTrail log parsing, disk snapshot memory acquisition, and chain of custody tracking.' },
      { name: 'Chaos Engineering & Site Resiliency (Chaos Mesh)', category: 'SRE Resiliency', demand: 50, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Injecting synthetic network latency, pod failures, and validating failover redundancy.' },
      { name: 'Service Mesh Security (Istio / mTLS)', category: 'Microservice Defense', demand: 48, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Automatic mutual TLS encryption between microservices and fine-grained authorization.' },
      { name: 'Threat Intelligence Platforms (MISP / AlienVault)', category: 'Threat Intel', demand: 47, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Aggregating STIX/TAXII threat feeds, indicator correlation, and automated firewall blocking.' },
      { name: 'Honeypots & Deception Technology', category: 'Deception Defense', demand: 45, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Deploying decoy servers, honey tokens, and capturing adversary reconnaissance activity.' },
      { name: 'Mobile Application Security Testing (OWASP MSTG)', category: 'Mobile Security', demand: 44, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Decompiling APKs, certificate pinning inspection, and runtime hook analysis (Frida).' },
      { name: 'Zero-Day Exploit Mitigation & Virtual Patching', category: 'Vulnerability Management', demand: 42, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Emergency WAF rule shielding and rapid mitigation before official vendor patch release.' },
      { name: 'Cloud Native SIEM (Chronicle / Datadog Security)', category: 'Cloud Telemetry', demand: 41, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Petabyte-scale cloud log analysis, Yara-L rule creation, and automated entity graphing.' },
      { name: 'Physical & Social Engineering Security Awareness', category: 'Human Defense', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Simulated phishing campaign design, credential harvest awareness, and social engineering drills.' },

      // TIER 4: Best Practices & Governance (39-43)
      { name: 'Disaster Recovery & Business Continuity (BCP)', category: 'Resilience', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'RTO / RPO metrics, multi-region failover drills, and automated backup restoration testing.' },
      { name: 'Security Incident Playbooks & Triage Protocol', category: 'Incident Management', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Standard operating procedures for ransomware isolation, data breach notification, and forensic preservation.' },
      { name: 'Penetration Testing Executive Reporting', category: 'Reporting', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Translating technical CVE risk severity into business impact and ROI remediation roadmaps.' },
      { name: 'Regulatory Audits & Evidence Collection', category: 'Governance', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Automating compliance evidence collection for SOC 2 Type II and PCI-DSS examinations.' },
      { name: 'Change Management & ITIL Framework Governance', category: 'Operations', demand: 35, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'CAB approval workflows, emergency change protocols, and production deployment risk analysis.' },
    ];
  }

  // 8. PRODUCT MANAGER
  if (r.includes('product')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'Product Discovery & User Research', category: 'Discovery', demand: 99, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Conducting customer interviews, problem identification, opportunity solution trees, and user persona creation.' },
      { name: 'Product Requirements Document (PRD) Authoring', category: 'Documentation', demand: 97, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Writing comprehensive PRDs, user stories, acceptance criteria, technical edge cases, and success metrics.' },
      { name: 'Roadmap Planning & Prioritization Frameworks (RICE / MoSCoW)', category: 'Strategy', demand: 95, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Scoring feature impact, engineering effort, reach, confidence, and aligning with business OKRs.' },
      { name: 'Data Analytics & SQL for Product Decisions', category: 'Analytics', demand: 94, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'Querying retention cohorts, funnel conversion rates, churn triggers, and feature adoption drop-offs.' },
      { name: 'A/B Testing & Experimentation Strategy', category: 'Experimentation', demand: 92, trend: 'up', priority: 'High', status: 'Rising', desc: 'Formulating testable hypotheses, sample sizing, statistical significance analysis, and conversion optimization.' },
      { name: 'Agile & Scrum Sprint Leadership', category: 'Execution', demand: 90, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Backlog grooming, sprint planning, sprint retrospectives, story estimation, and unblocking engineering teams.' },
      { name: 'Cross-Functional Stakeholder Alignment', category: 'Leadership', demand: 89, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Managing expectations across engineering, design, marketing, sales, legal, and executive leadership.' },
      { name: 'Wireframing & UI Prototyping (Figma / Miro)', category: 'Design', demand: 87, trend: 'up', priority: 'High', status: 'Rising', desc: 'Low-fidelity wireframes, user flow diagrams, whiteboard brainstorm maps, and design token reviews.' },
      { name: 'Product Metrics (North Star, LTV, CAC, Retention, Churn)', category: 'Metrics', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Building metric trees, monitoring daily/monthly active users (DAU/MAU), and revenue conversion.' },
      { name: 'Go-To-Market (GTM) Strategy & Product Launches', category: 'Marketing', demand: 84, trend: 'up', priority: 'High', status: 'Rising', desc: 'Coordinating feature launch checklists, positioning, release notes, sales enablement, and user onboarding.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Competitive Market Intelligence & Benchmarking', category: 'Market Research', demand: 82, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Feature comparison matrices, competitor teardowns, market share sizing, and differentiation strategy.' },
      { name: 'Customer Journey Mapping & Empathy Maps', category: 'User Experience', demand: 80, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Visualizing user emotions, pain points, touchpoints, and moments of delight across onboarding.' },
      { name: 'Product Telemetry (Mixpanel / Amplitude / GA4)', category: 'Analytics Tools', demand: 79, trend: 'up', priority: 'High', status: 'Rising', desc: 'Defining event tracking taxonomies, user funnel analysis, retention curves, and behavioral segmentation.' },
      { name: 'Pricing & Monetization Strategy', category: 'Business Strategy', demand: 77, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Freemium vs tiered SaaS pricing, usage-based billing models, willingness-to-pay surveys (Van Westendorp).' },
      { name: 'Technical Feasibility & Architecture Understanding', category: 'Engineering Collaboration', demand: 76, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Understanding REST APIs, database schemas, latency trade-offs, caching, and scalability constraints.' },
      { name: 'Jira, Linear & Confluence Management', category: 'Productivity', demand: 74, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Structuring epic hierarchies, sprint boards, automated status workflows, and team knowledge bases.' },
      { name: 'Product-Led Growth (PLG) & Virality Loops', category: 'Growth', demand: 72, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Self-serve onboarding funnels, viral invite loops, time-to-value reduction, and activation milestones.' },
      { name: 'Usability Testing & Feedback Synthesis', category: 'Research', demand: 71, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Moderated user testing sessions, task completion rates, System Usability Scale (SUS) scoring.' },
      { name: 'AI Product Strategy & LLM Use-Case Discovery', category: 'Emerging Tech', demand: 70, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Evaluating AI capability boundaries, ROI of LLM features, latency trade-offs, and fallback UX patterns.' },
      { name: 'Executive Presentations & Pitch Decks', category: 'Communication', demand: 68, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Creating quarterly product review slides, pitch decks for new business lines, and storytelling.' },
      { name: 'Customer Advisory Boards & B2B Feedback Loops', category: 'Enterprise PM', demand: 66, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Managing enterprise feature request pipelines, SLA commitments, and high-value client interviews.' },
      { name: 'Design System Governance & Accessibility (a11y)', category: 'Design Collaboration', demand: 65, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Ensuring accessible UI components, consistent design language, and WCAG compliance.' },
      { name: 'Continuous Discovery Habits (Teresa Torres Method)', category: 'Methodology', demand: 63, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Weekly customer interview rhythms, assumption testing, and rapid prototype validation experiments.' },
      { name: 'API Product Management & Developer Experience (DX)', category: 'Technical PM', demand: 62, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Treating developer APIs as products, SDK documentation, error code usability, and sandbox environments.' },
      { name: 'PostHog / FullStory Session Replay Analysis', category: 'UX Telemetry', demand: 60, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Watching rage clicks, session drop-offs, UX confusion points, and dead-click diagnostics.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Design Sprints & Google Ventures Framework', category: 'Innovation', demand: 58, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Five-day intensive sprint from mapping to prototyping and user testing.' },
      { name: 'Financial Modeling & Unit Economics for PMs', category: 'Finance', demand: 56, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Calculating payback periods, gross margins, customer acquisition payback, and burn rate impact.' },
      { name: 'Product Marketing Collateral & Sales Enablement', category: 'Marketing', demand: 54, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Battlecards, feature one-pagers, case studies, and demo scripts for sales teams.' },
      { name: 'Jobs-To-Be-Done (JTBD) Framework', category: 'Product Theory', demand: 53, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Uncovering the underlying functional, emotional, and social jobs users hire the product to do.' },
      { name: 'Beta Program Design & Feature Flag Management (LaunchDarkly)', category: 'Release Management', demand: 51, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Targeted rollout rings, dark launches, gradual canary releases, and rapid rollback triggers.' },
      { name: 'Regulatory & Data Privacy Compliance (GDPR/CCPA)', category: 'Legal', demand: 50, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Cookie consent workflows, data export tooling, and compliance with privacy mandates.' },
      { name: 'Product Operations & Feedback Aggregation (Productboard)', category: 'Product Ops', demand: 48, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Centralizing Zendesk/Slack customer feedback into categorized feature insights.' },
      { name: 'North Star Metric Tree Decomposition', category: 'Strategy', demand: 47, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Decomposing overall North Star into input metrics assigned across product squads.' },
      { name: 'Mobile App Store Optimization (ASO)', category: 'Growth', demand: 45, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Keyword rankings, screenshot conversion testing, and App Store review management.' },
      { name: 'No-Code Prototyping (Webflow / Bubble / Zapier)', category: 'Prototyping', demand: 44, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Building working MVPs to validate customer demand before writing engineering code.' },
      { name: 'Customer Churn Root-Cause Analysis', category: 'Retention', demand: 42, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Exit interview analysis, offboarding flow diagnostics, and churn prediction alerts.' },
      { name: 'Technical Spike & Proof-of-Concept Management', category: 'Engineering', demand: 41, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Timeboxed technical investigations to derisk architectural complexity.' },
      { name: 'Platform Ecosystem & Marketplace Dynamics', category: 'Business Models', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Two-sided network effects, liquidity management, and developer ecosystem partner integrations.' },

      // TIER 4: Best Practices & Governance (39-42)
      { name: 'Product Post-Mortems & Sunset Governance', category: 'Lifecycle Management', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Graceful feature deprecation roadmaps, customer migration timelines, and data exports.' },
      { name: 'Product Ethics & AI Safety Principles', category: 'Ethics', demand: 38, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Preventing dark patterns, ensuring algorithmic transparency, and responsible UX design.' },
      { name: 'Continuous Product Learning & Retrospectives', category: 'Culture', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Fostering psychological safety, learning from failed feature experiments, and team health checks.' },
      { name: 'Executive OKR Goal Setting & Scoring', category: 'Governance', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Setting quarterly Objectives and Key Results, tracking confidence scores, and final grading.' },
    ];
  }

  // 9. QA & AUTOMATION ENGINEER
  if (r.includes('qa') || r.includes('automation') || r.includes('test') || r.includes('quality')) {
    return [
      // TIER 1: Core Mandates (1-10)
      { name: 'Selenium / Playwright / Cypress Web Automation', category: 'UI Automation', demand: 99, trend: 'rapid', priority: 'Critical', status: 'Rising', desc: 'End-to-end browser test automation, auto-waiting locators, page object models (POM), and parallel execution.' },
      { name: 'API Testing & Automation (Postman / REST Assured)', category: 'API Testing', demand: 97, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Automating JSON schema validation, HTTP status code checks, auth token chaining, and contract testing.' },
      { name: 'Programming for Automation (Java / Python / TypeScript)', category: 'Programming', demand: 95, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Object-Oriented test framework design, clean coding patterns, custom assertions, and test utilities.' },
      { name: 'Test Case Design & Test Strategy Documentation', category: 'Testing Foundations', demand: 93, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Boundary value analysis, equivalence partitioning, state transition testing, and test matrix planning.' },
      { name: 'CI/CD Pipeline Integration (GitHub Actions / Jenkins)', category: 'DevOps', demand: 91, trend: 'up', priority: 'High', status: 'Rising', desc: 'Triggering automated regression suites on pull requests, headless execution, and test reporting.' },
      { name: 'Bug Triage, Severity Classification & Jira Tracking', category: 'Quality Management', demand: 90, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Writing reproducible bug tickets, stack trace logs, browser video recordings, and defect triage.' },
      { name: 'SQL & Database Data Integrity Testing', category: 'Database QA', demand: 88, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Writing verification queries to confirm database persistence, foreign key constraints, and rollback tests.' },
      { name: 'Agile & Scrum QA Sprint Collaboration', category: 'Methodology', demand: 86, trend: 'stable', priority: 'High', status: 'Stable', desc: 'In-sprint test automation, 3 Amigos user story acceptance criteria review, and sprint release sign-off.' },
      { name: 'Behavior-Driven Development (BDD / Cucumber / Gherkin)', category: 'BDD Frameworks', demand: 85, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Writing Given-When-Then human-readable scenarios and mapping to step definitions.' },
      { name: 'Git & Test Repository Version Control', category: 'Developer Tools', demand: 84, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Branching strategies for test suites, pull request reviews, and continuous test codebase refactoring.' },

      // TIER 2: Secondary Stack (11-25)
      { name: 'Mobile App Test Automation (Appium)', category: 'Mobile Testing', demand: 82, trend: 'up', priority: 'High', status: 'Rising', desc: 'Automating native iOS and Android gesture interactions, app installation flows, and device cloud grids.' },
      { name: 'Performance & Load Testing (JMeter / k6 / Locust)', category: 'Performance QA', demand: 80, trend: 'up', priority: 'High', status: 'Rising', desc: 'Simulating concurrent virtual users, stress testing endpoints, throughput bottlenecks, and latency thresholds.' },
      { name: 'Cross-Browser Testing (BrowserStack / Sauce Labs)', category: 'Cloud Testing', demand: 79, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Testing responsive layouts across Chrome, Safari, Firefox, Edge on desktop and mobile viewports.' },
      { name: 'Docker for QA Test Environments', category: 'Infrastructure', demand: 77, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Spinning up containerized test databases, mock servers, and Selenium grid clusters locally.' },
      { name: 'Mocking & Service Virtualization (WireMock / MSW)', category: 'Mocking', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Stubbing external third-party API dependencies to execute isolated and deterministic tests.' },
      { name: 'Web Accessibility Testing (WCAG 2.1 & Axe Core)', category: 'Accessibility', demand: 74, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Automating screen-reader accessibility assertions, keyboard tab order checks, and color contrast ratios.' },
      { name: 'Unit Testing Frameworks (JUnit, TestNG, PyTest, Jest)', category: 'Unit QA', demand: 72, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Parameterized test runs, test fixture setups/teardowns, annotations, and code coverage assertions.' },
      { name: 'Visual Regression Testing (Percy / Applitools)', category: 'Visual QA', demand: 71, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'AI-powered DOM pixel-diff comparisons, visual baseline approvals, and layout shift detection.' },
      { name: 'Security & Penetration QA Basics (OWASP ZAP / Burp)', category: 'Security QA', demand: 69, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Automated vulnerability scanning, input injection checks, and verifying authentication session timeouts.' },
      { name: 'Test Data Management & Factory Generation (Faker)', category: 'Test Data', demand: 68, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Programmatically generating realistic test datasets, edge-case strings, and database seeding.' },
      { name: 'Allure & Extent Test Reporting Dashboards', category: 'Reporting', demand: 66, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Generating interactive HTML test execution graphs, failure logs, and trend history dashboards.' },
      { name: 'GraphQL API Automation', category: 'API QA', demand: 65, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Testing GraphQL queries, mutations, subscription payloads, and validating error handling.' },
      { name: 'Linux Command Line & Server Log Inspection', category: 'Systems', demand: 63, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Inspecting server syslog errors, grep log parsing, systemd service checks, and tailing logs.' },
      { name: 'Chaos & Resiliency QA Testing', category: 'Resilience', demand: 62, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Simulating network latency spikes, database timeouts, server 500 crashes, and graceful recovery.' },
      { name: 'WebSockets & Event-Driven Testing', category: 'Real-Time QA', demand: 60, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Validating real-time message delivery over socket connections, reconnections, and payload schemas.' },

      // TIER 3: Specialized Domain Tools (26-38)
      { name: 'Contract Testing with Pact', category: 'Microservice QA', demand: 58, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Consumer-driven contract testing between independent microservices to prevent breaking changes.' },
      { name: 'IoT & Embedded Device Testing', category: 'Hardware QA', demand: 56, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Serial communication testing, firmware flashing regression tests, and hardware sensor emulation.' },
      { name: 'AI Model Testing & Evaluation Assertion', category: 'AI QA', demand: 55, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Automating prompt regression assertions, hallucination score checks, and LLM output schema validation.' },
      { name: 'Mutation Testing (Stryker / Pitest)', category: 'Test Quality', demand: 53, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Injecting synthetic code faults to test the effectiveness and true coverage of the test suite.' },
      { name: 'Microservices Distributed Tracing (Jaeger / Datadog)', category: 'Observability QA', demand: 52, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Tracing end-to-end user request lifecycles across 10+ microservice hops during regression tests.' },
      { name: 'Exploratory Testing Charters & Session-Based Testing', category: 'Manual QA Mastery', demand: 50, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Structured timeboxed exploratory sessions focused on edge cases, usability flaws, and race conditions.' },
      { name: 'Code Coverage Analysis (SonarQube / JaCoCo)', category: 'Code Quality', demand: 49, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Enforcing branch and line coverage thresholds, code smell tracking, and technical debt gates.' },
      { name: 'Self-Healing Test Frameworks (AI Locators)', category: 'AI Automation', demand: 47, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Using AI heuristic locators that dynamically adapt when frontend HTML IDs change.' },
      { name: 'Network Packet Sniffing & Mocking (Charles / Proxyman)', category: 'Network QA', demand: 46, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Intercepting HTTPS mobile requests, rewriting response headers, and testing offline modes.' },
      { name: 'Kubernetes Test Environment Orchestration', category: 'DevOps QA', demand: 44, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Spinning up ephemeral PR-preview test namespaces in Kubernetes on demand.' },
      { name: 'Regression Suite Optimization & Selective Testing', category: 'Optimization', demand: 43, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Running only tests relevant to modified code files to reduce CI build execution time from hours to minutes.' },
      { name: 'Memory Leak & Heap Dump Analysis', category: 'Performance', demand: 41, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Using Chrome DevTools Memory tab and profilers to catch JavaScript memory leaks and unreleased listeners.' },
      { name: 'Regulatory & Compliance Testing (HIPAA / FDA Software)', category: 'Compliance', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Traceability matrices, audit verification logs, and compliance documentation for regulated software.' },

      // TIER 4: Best Practices & Governance (39-42)
      { name: 'Quality Gates & Release Sign-Off Governance', category: 'Governance', demand: 39, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Formal release readiness reviews, zero-open-critical-bug policy, and deployment rollback checklists.' },
      { name: 'QA Metrics & Defect Escape Rate Tracking', category: 'Metrics', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Tracking production defect escape rate, mean time to detect (MTTD), and test pass rate stability.' },
      { name: 'Continuous Quality Culture & Developer Enablement', category: 'Culture', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Pair testing with developers, building reusable test helper libraries, and driving quality mindset.' },
      { name: 'Standard Operating Procedures & Test Documentation', category: 'Documentation', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Maintaining standard operating procedures for test environments, on-call bug escalations, and onboarding.' },
    ];
  }

  // 10. ROBOTICS & EMBEDDED SYSTEMS (DEFAULT / FALLBACK)
  return [
    // TIER 1: Core Mandates (1-10)
    { name: 'ROS / ROS2 (Robot Operating System)', category: 'Robotics Middleware', demand: 98, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'ROS2 DDS nodes, pub/sub topics, action servers, service clients, and custom message interfaces.' },
    { name: 'Modern C++ (C++17/20)', category: 'Systems Programming', demand: 96, trend: 'up', priority: 'Critical', status: 'Rising', desc: 'RAII memory safety, smart pointers, multi-threading, concurrency locks, and real-time execution.' },
    { name: 'Python for Robotics & Prototyping', category: 'Robotics Scripting', demand: 94, trend: 'stable', priority: 'Critical', status: 'Stable', desc: 'Algorithm prototyping, kinematic modeling, data logging, and ROS Python client bindings.' },
    { name: 'SLAM & Autonomous Navigation', category: 'Perception & Navigation', demand: 92, trend: 'rapid', priority: 'Critical', status: 'Emerging', desc: 'Simultaneous Localization and Mapping, LiDAR point clouds, 2D/3D costmaps, and Nav2 pathing.' },
    { name: 'Embedded C & Bare-Metal Programming', category: 'Firmware Development', demand: 90, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Direct register manipulation, hardware timers, interrupt service routines (ISR), and memory maps.' },
    { name: 'Linux / Ubuntu for Robotics Development', category: 'Operating Systems', demand: 89, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Systemd robotics daemon services, udev device rules, real-time Linux kernels, and bash workflows.' },
    { name: 'Gazebo Physics Simulation & URDF', category: 'Robotics Simulation', demand: 87, trend: 'up', priority: 'High', status: 'Rising', desc: 'Unified Robot Description Format (URDF/Xacro), physics engine contacts, and simulated sensor plugins.' },
    { name: 'Microcontrollers (STM32, ESP32, ARM Cortex-M)', category: 'Embedded Hardware', demand: 86, trend: 'up', priority: 'High', status: 'Rising', desc: 'ARM Cortex hardware debugging with JTAG/SWD, peripheral HAL drivers, and memory flashing.' },
    { name: 'Hardware Protocols (CAN Bus, SPI, I2C, UART)', category: 'Hardware Interfaces', demand: 85, trend: 'stable', priority: 'High', status: 'Stable', desc: 'CAN 2.0B / CAN-FD message frames, high-speed SPI sensors, I2C IMUs, and UART telemetry.' },
    { name: 'Git & Firmware Version Control', category: 'Developer Tools', demand: 83, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Submodules, firmware release tags, hardware revision branches, and CI builds.' },

    // TIER 2: Secondary Stack (11-25)
    { name: 'Real-Time Operating Systems (FreeRTOS / RTOS)', category: 'Real-Time Systems', demand: 81, trend: 'rapid', priority: 'High', status: 'Rising', desc: 'Deterministic task scheduling, semaphores, mutexes, message queues, and memory pools.' },
    { name: 'Kinematics, Dynamics & MoveIt Trajectory', category: 'Robotic Mechanics', demand: 79, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Forward/inverse kinematics, DH parameters, Jacobian matrices, and MoveIt arm trajectory planning.' },
    { name: 'Computer Vision & OpenCV Perception', category: 'Visual Perception', demand: 78, trend: 'up', priority: 'High', status: 'Rising', desc: 'Depth camera image processing, Apriltag tracking, optical flow, and visual object detection.' },
    { name: 'Sensor Fusion & Kalman Filtering (EKF / UKF)', category: 'State Estimation', demand: 76, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Fusing IMU accelerometers, wheel odometry, and LiDAR through Extended Kalman Filters.' },
    { name: 'LiDAR Point Cloud Processing (PCL)', category: 'Spatial Computing', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Voxel grid filtering, RANSAC plane segmentation, Euclidean cluster extraction, and ICP registration.' },
    { name: 'Motor Control & PID / Field-Oriented Control (FOC)', category: 'Motion Control', demand: 73, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Field-Oriented Control (FOC), PWM signal generation, encoder feedback reading, and PID loops.' },
    { name: 'Edge AI on NVIDIA Jetson & TensorRT', category: 'Edge Computing', demand: 72, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Running optimized deep neural networks on Jetson Nano/Orin using TensorRT GPU acceleration.' },
    { name: 'Nav2 Navigation Stack & Behavior Trees', category: 'Autonomous Systems', demand: 70, trend: 'rapid', priority: 'Medium', status: 'Emerging', desc: 'Configuring Behavior Trees, recovery behaviors, costmap inflation layers, and planner plugins.' },
    { name: 'PCB Schematics & Altium Hardware Debugging', category: 'Electronics', demand: 69, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Oscilloscope signal inspection, logic analyzer protocol decoding, multimeter testing, and schematics.' },
    { name: 'Drone & AMR Chassis Kinematics (Mecanum/Ackermann)', category: 'Vehicle Dynamics', demand: 67, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Differential drive, Ackermann steering, omnidirectional mecanum wheel geometry calculations.' },
    { name: 'MATLAB & Simulink Control Design', category: 'Control Systems', demand: 66, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'State-space control modeling, root locus, Bode plot stability analysis, and code generation.' },
    { name: 'Industrial Fieldbus (Modbus, EtherCAT, PROFINET)', category: 'Industrial Automation', demand: 65, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Real-time master/slave industrial automation communication across PLC and robotic arms.' },
    { name: 'Depth Cameras (Intel RealSense / OAK-D / Stereo)', category: 'Sensors', demand: 63, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'RGB-D point projection, spatial disparity maps, and hardware trigger synchronization.' },
    { name: 'Serial Telemetry & High-Speed Data Logging', category: 'Telemetry', demand: 62, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'DMA buffered serial transmission, binary ring buffers, and time-stamped flight logging.' },
    { name: 'JTAG / SWD In-Circuit Debugging (OpenOCD)', category: 'Embedded Tooling', demand: 60, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Hardware breakpoints, register step execution, memory watches, and core dump analysis.' },

    // TIER 3: Specialized Domain Tools (26-38)
    { name: 'CUDA GPU Acceleration for Robotics Perception', category: 'High Performance', demand: 58, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Massively parallel perception computation and occupancy grid calculation on GPU.' },
    { name: 'NVIDIA Isaac Sim & Omniverse Photorealism', category: 'Next-Gen Simulation', demand: 56, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'PhysX 5 simulation, synthetic domain randomization, and Isaac ROS hardware acceleration.' },
    { name: 'Reinforcement Learning for Robotics (Isaac Gym)', category: 'Robotic Learning', demand: 55, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Sim-to-real policy transfer, quadruped locomotion learning, and dexterous hand manipulation.' },
    { name: 'Visual Inertial Odometry (VIO & ORB-SLAM3)', category: 'Odometry', demand: 53, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Feature matching, IMU pre-integration, and bundle adjustment in GPS-denied environments.' },
    { name: 'Trajectory Optimization & MPC (Model Predictive Control)', category: 'Advanced Control', demand: 52, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Receding horizon optimal control, non-linear constraints, and obstacle avoidance cost formulation.' },
    { name: 'Custom Actuator & BLDC Driver Inverter Design', category: 'Power Electronics', demand: 50, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'MOSFET H-bridge gate drivers, current shunt sensing, and thermal dissipation heatsinking.' },
    { name: 'Wireless Telemetry (LoRa, BLE 5.0, Zigbee, ESP-NOW)', category: 'Wireless Interfaces', demand: 48, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Long-range sub-GHz packet telemetry, low-power advertising, and mesh networking.' },
    { name: 'ROS2 DDS Middleware Tuning & QoS Profiles', category: 'Middleware Tuning', demand: 47, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'CycloneDDS / FastDDS reliability, transient local durability, and multicast UDP optimization.' },
    { name: 'Battery Management Systems (BMS) Hardware', category: 'Power Management', demand: 45, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Li-Ion cell balancing, state-of-charge (SoC) estimation, over-current cutoff protection.' },
    { name: '3D Mechanical CAD Modeling (SolidWorks / Fusion360)', category: 'Mechanical Design', demand: 44, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Designing 3D printed brackets, sheet metal chassis, gearboxes, and center of gravity optimization.' },
    { name: 'Thermal Management & EMI Shielding for PCB', category: 'Hardware Reliability', demand: 42, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Ground planes, decoupling capacitors, ferrite beads, and preventing high-frequency noise interference.' },
    { name: 'Autonomous Fleet Management (VDA 5050 Protocol)', category: 'Fleet Software', demand: 41, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Standardized MQTT/JSON interface for AMR factory logistics dispatch and traffic intersection management.' },
    { name: 'ROS-Industrial & PLC Factory Integration', category: 'Industrial Robotics', demand: 40, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Connecting FANUC/KUKA/ABB robotic arms to ROS via industrial socket servers and safety gates.' },

    // TIER 4: Best Practices & Governance (39-44)
    { name: 'Hardware-in-the-Loop (HIL) Test Rigs', category: 'Testing', demand: 39, trend: 'up', priority: 'Low', status: 'Rising', desc: 'Automated test rigs with simulated motor loads, physical pin stimulation, and automated validation.' },
    { name: 'ISO 13849 & Functional Safety Standards', category: 'Safety & Compliance', demand: 38, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Safety Integrity Levels (SIL / PLd), emergency stop circuits, and dual-channel safety monitoring.' },
    { name: 'Engineering Bill of Materials (BOM) & Sourcing', category: 'Manufacturing', demand: 37, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Part lifecycle management, second-source components, and supply chain manufacturing cost optimization.' },
    { name: 'Robotics Commissioning & Site Calibration', category: 'Field Operations', demand: 36, trend: 'stable', priority: 'Low', status: 'Stable', desc: 'Camera-to-LiDAR extrinsic calibration, wheel radius tuning, and factory coordinate frame alignment.' },
    { name: 'Automated Regression Simulation in CI Pipelines', category: 'DevOps for Robotics', demand: 35, trend: 'rapid', priority: 'Low', status: 'Emerging', desc: 'Headless Gazebo automated simulation tests on pull requests to prevent navigation regressions.' },
  ];
}

// Exhaustive Company Pool by Domain
const TECH_COMPANIES_POOL = {
  data: [
    { name: 'Google India (AI & Search)', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', roleLevel: 'Data Scientist' },
    { name: 'Microsoft India - Data & AI', logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', roleLevel: 'Applied Scientist II' },
    { name: 'Amazon AWS AI Labs', logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120', roleLevel: 'Data Scientist' },
    { name: 'Swiggy Intelligence Labs', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', roleLevel: 'Decision Scientist' },
    { name: 'Fractal Analytics', logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120', roleLevel: 'Associate Data Scientist' },
    { name: 'Walmart Global Tech', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', roleLevel: 'Analytics Specialist' },
    { name: 'JPMorgan Chase & Co.', logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=120', roleLevel: 'Quantitative Strategist' },
    { name: 'Goldman Sachs', logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=120', roleLevel: 'Strats Data Analyst' },
    { name: 'Flipkart Analytics', logo: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&q=80&w=120', roleLevel: 'Data Scientist I' },
    { name: 'Zomato Machine Learning', logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=120', roleLevel: 'ML Specialist' },
    { name: 'Uber India Tech Center', logo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=120', roleLevel: 'Algorithms Engineer' },
    { name: 'CRED Data Platform', logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=120', roleLevel: 'Analytics Engineer' },
    { name: 'Zepto Labs', logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=120', roleLevel: 'Lead Data Analyst' },
    { name: 'Tiger Analytics', logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120', roleLevel: 'Senior Data Scientist' },
    { name: 'Mu Sigma', logo: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=120', roleLevel: 'Decision Scientist' },
    { name: 'LatentView Analytics', logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=120', roleLevel: 'Analytics Consultant' },
  ],
  ai_ml: [
    { name: 'NVIDIA AI Research', logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', roleLevel: 'AI Research Scientist' },
    { name: 'OpenAI Partner Hub', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', roleLevel: 'Foundation Model Specialist' },
    { name: 'Google DeepMind India', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', roleLevel: 'Research Engineer' },
    { name: 'Microsoft AI Core', logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', roleLevel: 'Applied Scientist' },
    { name: 'Meta AI (FAIR Labs)', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120', roleLevel: 'AI Systems Engineer' },
    { name: 'Anthropic Labs Partner', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', roleLevel: 'LLM Engineer' },
    { name: 'Swiggy Intelligence', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', roleLevel: 'Lead ML Engineer' },
    { name: 'Qualcomm AI Research', logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=120', roleLevel: 'Edge AI Engineer' },
    { name: 'Apple AI & ML', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', roleLevel: 'Machine Learning Engineer' },
    { name: 'Adobe Firefly AI', logo: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&q=80&w=120', roleLevel: 'Computer Vision Scientist' },
  ],
  swe: [
    { name: 'Google India', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', roleLevel: 'Software Engineer II' },
    { name: 'Microsoft IDC', logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', roleLevel: 'SDE II (Full Stack)' },
    { name: 'Amazon Development Center', logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120', roleLevel: 'SDE I / II' },
    { name: 'Razorpay Tech', logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120', roleLevel: 'Product Engineer' },
    { name: 'PhonePe Engineering', logo: 'https://images.unsplash.com/photo-1556742049-0a67c57750c9?auto=format&fit=crop&q=80&w=120', roleLevel: 'Platform Engineer' },
    { name: 'CRED Core Tech', logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=120', roleLevel: 'Software Craftsperson' },
    { name: 'Atlassian India', logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', roleLevel: 'Full Stack Engineer' },
    { name: 'Uber Core Platform', logo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=120', roleLevel: 'Backend SDE' },
    { name: 'Swiggy Bytes', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', roleLevel: 'SDE II' },
    { name: 'Zomato Engineering', logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=120', roleLevel: 'Software Engineer' },
    { name: 'Zerodha Tech', logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120', roleLevel: 'Systems Developer' },
    { name: 'Postman Labs', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', roleLevel: 'API Architect' },
    { name: 'Adobe India', logo: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&q=80&w=120', roleLevel: 'Computer Scientist' },
    { name: 'BrowserStack', logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120', roleLevel: 'Infrastructure SDE' },
  ],
  robotics: [
    { name: 'GreyOrange Robotics', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', roleLevel: 'Robotics Software Engineer' },
    { name: 'ABB Robotics India', logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120', roleLevel: 'Robotics Automation Lead' },
    { name: 'Tesla Autopilot & Optimus', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', roleLevel: 'Autonomy / Controls Engineer' },
    { name: 'Boston Dynamics Partner Hub', logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=120', roleLevel: 'Dynamic Systems Engineer' },
    { name: 'Qualcomm India', logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=120', roleLevel: 'Embedded Firmware Engineer' },
    { name: 'Intel Corporation', logo: 'https://images.unsplash.com/photo-1517430816045-df4b7de71b1d?auto=format&fit=crop&q=80&w=120', roleLevel: 'Robotics Platform Architect' },
    { name: 'Texas Instruments', logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=120', roleLevel: 'Hardware Applications Engineer' },
    { name: 'ISRO / DRDO Tech Labs', logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=120', roleLevel: 'Avionics & Autonomous Systems' },
    { name: 'Ather Energy', logo: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=120', roleLevel: 'Vehicle Intelligence Engineer' },
    { name: 'Ola Electric R&D', logo: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80&w=120', roleLevel: 'Embedded Controls Engineer' },
    { name: 'Honeywell Aerospace & Robotics', logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=120', roleLevel: 'Systems Control Engineer' },
    { name: 'Bosch India Engineering', logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=120', roleLevel: 'Autonomous Mobility Engineer' },
    { name: 'Tata Elxsi', logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=120', roleLevel: 'Robotics & ADAS Engineer' },
    { name: 'L&T Technology Services', logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=120', roleLevel: 'Industrial Automation Specialist' },
  ],
};

function generateSkillCompanyMappingsForRole(role: string, skills: BaseSkillDef[]): SkillToCompanyMapping[] {
  const r = (role || 'Data Scientist').toLowerCase();

  let pool = TECH_COMPANIES_POOL.data;
  if (r.includes('ai') || r.includes('generative') || r.includes('machine learning') || r.includes('llm')) {
    pool = TECH_COMPANIES_POOL.ai_ml;
  } else if (r.includes('robot') || r.includes('embed') || r.includes('hardware') || r.includes('iot')) {
    pool = TECH_COMPANIES_POOL.robotics;
  } else if (r.includes('full') || r.includes('software') || r.includes('developer') || r.includes('backend') || r.includes('frontend') || r.includes('cloud') || r.includes('devops') || r.includes('security')) {
    pool = TECH_COMPANIES_POOL.swe;
  }

  return skills.map((sk, idx) => {
    // Select 3-5 companies dynamically with offset to give variety across cards
    const startIdx = (idx * 2) % pool.length;
    const count = idx < 10 ? 5 : idx < 25 ? 4 : 3;
    const selectedCompanies: Array<{ name: string; logo: string; isMandatory: boolean; roleLevel: string }> = [];

    for (let i = 0; i < count; i++) {
      const comp = pool[(startIdx + i) % pool.length];
      const isMandatory = idx < 10 ? (i < 4) : idx < 25 ? (i < 2) : (i === 0);
      selectedCompanies.push({
        name: comp.name,
        logo: comp.logo,
        isMandatory,
        roleLevel: comp.roleLevel,
      });
    }

    // Interview focus based on category and skill
    let interviewFocus = `Live coding evaluation of ${sk.name}, architecture design trade-offs, scalability under high load, and debugging real-world production edge cases.`;
    if (sk.category.toLowerCase().includes('database') || sk.name.toLowerCase().includes('sql')) {
      interviewFocus = 'Complex SQL joins, window functions (ROW_NUMBER, DENSE_RANK, LAG/LEAD), query execution plans, indexing internals, transaction ACID semantics, and optimization.';
    } else if (sk.category.toLowerCase().includes('data analysis') || sk.name.toLowerCase().includes('pandas') || sk.name.toLowerCase().includes('excel')) {
      interviewFocus = 'Vectorized dataframe operations, cleaning messy data, exploratory multivariate analysis, memory efficiency, and automating business KPI reporting.';
    } else if (sk.category.toLowerCase().includes('core ml') || sk.name.toLowerCase().includes('learning')) {
      interviewFocus = 'Math behind gradient boosting vs random forest, regularization penalties (L1/L2), ROC-AUC / Precision-Recall tradeoffs, feature selection, and preventing data leakage.';
    } else if (sk.category.toLowerCase().includes('deep') || sk.name.toLowerCase().includes('pytorch') || sk.name.toLowerCase().includes('vision') || sk.name.toLowerCase().includes('nlp')) {
      interviewFocus = 'Autograd backpropagation, custom loss functions, attention matrix computation complexity, transfer learning, and tensor parallel inference acceleration.';
    } else if (sk.category.toLowerCase().includes('robot') || sk.name.toLowerCase().includes('ros') || sk.name.toLowerCase().includes('c++')) {
      interviewFocus = 'ROS2 node lifecycles, DDS QoS policies, smart pointers (unique_ptr vs shared_ptr), RAII memory safety, multi-threaded mutex synchronization, and real-time execution.';
    } else if (sk.category.toLowerCase().includes('embed') || sk.name.toLowerCase().includes('microcontroller') || sk.name.toLowerCase().includes('pcb')) {
      interviewFocus = 'Bare-metal register configuration, interrupt service routines (ISR), DMA ring buffers, hardware timer PWMs, schematic routing rules, and EMI decoupling.';
    } else if (sk.category.toLowerCase().includes('cloud') || sk.name.toLowerCase().includes('docker') || sk.name.toLowerCase().includes('devops')) {
      interviewFocus = 'Multi-stage container builds, Kubernetes pod deployment manifests, blue-green zero-downtime rollouts, CI/CD pipeline automation, and telemetry metrics.';
    }

    const marketCoverage = Math.min(99, Math.max(35, sk.demand));
    const companiesCount = Math.round(sk.demand * 0.92) + 14;

    return {
      skillName: sk.name,
      category: sk.category,
      companiesCount: companiesCount,
      percentageOfMarket: marketCoverage,
      sampleCompanies: selectedCompanies,
      keyInterviewFocus: interviewFocus,
    };
  });
}

export function getRoleOverviewData(role: string): {
  trendData: TrendPoint[];
  emergingSkills: EmergingSkill[];
  companyCriteria: CompanySkillCriteria[];
  skillCompanyMappings: SkillToCompanyMapping[];
} {
  const r = (role || 'Data Scientist').toLowerCase();
  const allSkillDefs = getRoleSkillDefinitions(role);
  const exhaustiveMappings = generateSkillCompanyMappingsForRole(role, allSkillDefs);

  if (r.includes('data') || r.includes('analytic') || r.includes('bi')) {
    return {
      trendData: [
        { month: 'Oct 2025', 'Python & Pandas': 78, 'SQL Optimization': 80, 'Machine Learning': 70, 'Generative AI & RAG': 45, 'Power BI / Tableau': 65 },
        { month: 'Nov 2025', 'Python & Pandas': 82, 'SQL Optimization': 82, 'Machine Learning': 74, 'Generative AI & RAG': 54, 'Power BI / Tableau': 68 },
        { month: 'Dec 2025', 'Python & Pandas': 85, 'SQL Optimization': 84, 'Machine Learning': 78, 'Generative AI & RAG': 62, 'Power BI / Tableau': 72 },
        { month: 'Jan 2026', 'Python & Pandas': 90, 'SQL Optimization': 88, 'Machine Learning': 83, 'Generative AI & RAG': 72, 'Power BI / Tableau': 76 },
        { month: 'Feb 2026', 'Python & Pandas': 94, 'SQL Optimization': 92, 'Machine Learning': 88, 'Generative AI & RAG': 82, 'Power BI / Tableau': 80 },
        { month: 'Mar 2026', 'Python & Pandas': 98, 'SQL Optimization': 96, 'Machine Learning': 94, 'Generative AI & RAG': 92, 'Power BI / Tableau': 85 },
      ],
      emergingSkills: [
        { id: 'em_d_1', name: 'LLM Fine-Tuning & RAG Pipelines', growthRate: '+48% YoY', demandPercentage: 92, status: 'Rapid Growth', whyItMatters: 'Deploying domain-adapted foundation models with vector embeddings and LangChain/LlamaIndex.', recommendedAction: 'Build a production document retrieval QA system with hybrid vector search and reranking.' },
        { id: 'em_d_2', name: 'Feature Stores & MLOps (MLflow / Feast)', growthRate: '+42% YoY', demandPercentage: 86, status: 'Rapid Growth', whyItMatters: 'Standardizing machine learning feature engineering, model registry, and automated inference.', recommendedAction: 'Set up an automated CI/CD model retraining pipeline with drift monitoring.' },
        { id: 'em_d_3', name: 'Real-time Streaming Analytics (Spark / Kafka)', growthRate: '+31% YoY', demandPercentage: 79, status: 'Growing', whyItMatters: 'Low-latency event stream processing and continuous feature aggregation for online prediction.', recommendedAction: 'Implement real-time windowed aggregations with structured streaming.' },
      ],
      companyCriteria: [
        { id: 'cc_d_1', companyName: 'Microsoft India - Data & AI', companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', industryTier: 'Tier 1 Tech', activeRole: role, openPositionsCount: 16, entryMandatorySkills: ['Python & Pandas', 'SQL & Advanced Query Optimization', 'Machine Learning & Scikit-Learn'], preferredAdvancedSkills: ['Deep Learning & PyTorch', 'Big Data Processing (PySpark)', 'MLOps & Model Tracking (MLflow)'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Advanced' },
        { id: 'cc_d_2', companyName: 'Fractal Analytics', companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120', industryTier: 'Unicorn', activeRole: role, openPositionsCount: 22, entryMandatorySkills: ['Python & Pandas', 'SQL & Advanced Query Optimization', 'Business Statistics'], preferredAdvancedSkills: ['Data Visualization (Power BI)', 'Generative AI & LLM RAG', 'Data Warehousing (Snowflake)'], hiringStatus: 'Hiring Peak', minProficiencyExpected: 'Intermediate' },
        { id: 'cc_d_3', companyName: 'Swiggy Intelligence Labs', companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', industryTier: 'Unicorn', activeRole: role, openPositionsCount: 9, entryMandatorySkills: ['Python & Pandas', 'Machine Learning & Scikit-Learn', 'Feature Engineering'], preferredAdvancedSkills: ['Real-Time Streaming (Kafka)', 'Vector Databases', 'Deep Learning & PyTorch'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Advanced' },
        { id: 'cc_d_4', companyName: 'Walmart Global Tech', companyLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', industryTier: 'Tier 1 Tech', activeRole: role, openPositionsCount: 14, entryMandatorySkills: ['SQL & Advanced Query Optimization', 'Python & Pandas', 'Exploratory Data Analysis'], preferredAdvancedSkills: ['Big Data Processing (PySpark)', 'Deep Learning & PyTorch', 'Docker'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Intermediate' },
      ],
      skillCompanyMappings: exhaustiveMappings,
    };
  }

  if (r.includes('ai') || r.includes('generative') || r.includes('machine learning') || r.includes('llm')) {
    return {
      trendData: [
        { month: 'Oct 2025', 'PyTorch': 75, 'HuggingFace Transformers': 65, 'RAG & Vector DBs': 42, 'CUDA & Triton': 40, 'Model Fine-Tuning': 50 },
        { month: 'Nov 2025', 'PyTorch': 79, 'HuggingFace Transformers': 70, 'RAG & Vector DBs': 52, 'CUDA & Triton': 48, 'Model Fine-Tuning': 58 },
        { month: 'Dec 2025', 'PyTorch': 84, 'HuggingFace Transformers': 77, 'RAG & Vector DBs': 64, 'CUDA & Triton': 57, 'Model Fine-Tuning': 66 },
        { month: 'Jan 2026', 'PyTorch': 88, 'HuggingFace Transformers': 83, 'RAG & Vector DBs': 75, 'CUDA & Triton': 68, 'Model Fine-Tuning': 74 },
        { month: 'Feb 2026', 'PyTorch': 93, 'HuggingFace Transformers': 89, 'RAG & Vector DBs': 85, 'CUDA & Triton': 77, 'Model Fine-Tuning': 82 },
        { month: 'Mar 2026', 'PyTorch': 97, 'HuggingFace Transformers': 94, 'RAG & Vector DBs': 94, 'CUDA & Triton': 86, 'Model Fine-Tuning': 89 },
      ],
      emergingSkills: [
        { id: 'em_ai_1', name: 'Multimodal Vision-Language Models', growthRate: '+55% YoY', demandPercentage: 94, status: 'Rapid Growth', whyItMatters: 'Joint visual-textual reasoning, CLIP embeddings, and vision transformer fine-tuning.', recommendedAction: 'Fine-tune open-weight vision models on custom OCR and spatial reasoning tasks.' },
        { id: 'em_ai_2', name: 'CUDA Kernel Optimization & TensorRT-LLM', growthRate: '+46% YoY', demandPercentage: 88, status: 'Rapid Growth', whyItMatters: 'High-throughput low-latency model inference on enterprise GPU clusters.', recommendedAction: 'Quantize transformer checkpoints into FP8/INT4 using TensorRT-LLM.' },
        { id: 'em_ai_3', name: 'Agentic AI & LangChain / AutoGen Frameworks', growthRate: '+42% YoY', demandPercentage: 84, status: 'Rapid Growth', whyItMatters: 'Autonomous multi-agent orchestration, tool calling, and long-term memory reasoning.', recommendedAction: 'Implement ReAct agent loops with structured tool invocation.' },
      ],
      companyCriteria: [
        { id: 'cc_ai_1', companyName: 'Anthropic Partner Lab', companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', industryTier: 'Unicorn', activeRole: role, openPositionsCount: 14, entryMandatorySkills: ['PyTorch & Neural Network Architecture', 'Python & Scientific Computing', 'Foundation Models & HuggingFace'], preferredAdvancedSkills: ['CUDA GPU Acceleration', 'RAG Architectures', 'MLOps & Triton'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Advanced' },
        { id: 'cc_ai_2', companyName: 'NVIDIA AI Research', companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', industryTier: 'Tier 1 Tech', activeRole: role, openPositionsCount: 18, entryMandatorySkills: ['PyTorch & Neural Network Architecture', 'CUDA GPU Acceleration', 'Foundation Models & HuggingFace'], preferredAdvancedSkills: ['Inference Optimization (TensorRT)', 'Distributed Model Training (Ray)', 'Custom CUDA Kernels'], hiringStatus: 'Hiring Peak', minProficiencyExpected: 'Advanced' },
      ],
      skillCompanyMappings: exhaustiveMappings,
    };
  }

  if (r.includes('full') || r.includes('software') || r.includes('developer') || r.includes('backend') || r.includes('frontend')) {
    return {
      trendData: [
        { month: 'Oct 2025', 'TypeScript': 80, 'React / Next.js': 82, 'Node.js / Express': 76, 'Docker & CI/CD': 65, 'Kafka / Microservices': 55 },
        { month: 'Nov 2025', 'TypeScript': 84, 'React / Next.js': 85, 'Node.js / Express': 80, 'Docker & CI/CD': 70, 'Kafka / Microservices': 60 },
        { month: 'Dec 2025', 'TypeScript': 88, 'React / Next.js': 89, 'Node.js / Express': 84, 'Docker & CI/CD': 75, 'Kafka / Microservices': 66 },
        { month: 'Jan 2026', 'TypeScript': 92, 'React / Next.js': 92, 'Node.js / Express': 88, 'Docker & CI/CD': 80, 'Kafka / Microservices': 72 },
        { month: 'Feb 2026', 'TypeScript': 95, 'React / Next.js': 94, 'Node.js / Express': 91, 'Docker & CI/CD': 85, 'Kafka / Microservices': 78 },
        { month: 'Mar 2026', 'TypeScript': 98, 'React / Next.js': 96, 'Node.js / Express': 94, 'Docker & CI/CD': 89, 'Kafka / Microservices': 84 },
      ],
      emergingSkills: [
        { id: 'em_swe_1', name: 'Next.js 15 Full Stack Server Actions', growthRate: '+44% YoY', demandPercentage: 91, status: 'Rapid Growth', whyItMatters: 'Full stack streaming SSR with edge rendering, server components, and secure server actions.', recommendedAction: 'Build zero-API-layer database actions with optimistic UI and React 19 hooks.' },
        { id: 'em_swe_2', name: 'High-Throughput Distributed Kafka Streams', growthRate: '+36% YoY', demandPercentage: 83, status: 'Growing', whyItMatters: 'Event-driven async microservices with idempotent handlers and exactly-once message delivery.', recommendedAction: 'Implement partitioned message pub/sub handling with dead-letter queue recovery.' },
      ],
      companyCriteria: [
        { id: 'cc_swe_1', companyName: 'Razorpay Tech', companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120', industryTier: 'Unicorn', activeRole: role, openPositionsCount: 20, entryMandatorySkills: ['TypeScript & JavaScript (ES6+)', 'React & Next.js 15', 'Node.js & Backend Runtime'], preferredAdvancedSkills: ['SQL & Relational Databases', 'Docker & Containerization', 'Kafka / Message Queues'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Advanced' },
        { id: 'cc_swe_2', companyName: 'Google India', companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120', industryTier: 'Tier 1 Tech', activeRole: role, openPositionsCount: 35, entryMandatorySkills: ['Data Structures & Algorithms', 'TypeScript & JavaScript', 'SQL & Relational Databases'], preferredAdvancedSkills: ['System Design & High-Scalability', 'Microservices', 'Kubernetes'], hiringStatus: 'Hiring Peak', minProficiencyExpected: 'Advanced' },
      ],
      skillCompanyMappings: exhaustiveMappings,
    };
  }

  // DEFAULT / ROBOTICS / EMBEDDED / ALL ROLES
  return {
    trendData: [
      { month: 'Oct 2025', 'ROS / ROS2': 75, 'Modern C++': 80, 'SLAM & Navigation': 68, 'Embedded C / STM32': 65, 'Gazebo / Isaac Sim': 52 },
      { month: 'Nov 2025', 'ROS / ROS2': 79, 'Modern C++': 83, 'SLAM & Navigation': 72, 'Embedded C / STM32': 70, 'Gazebo / Isaac Sim': 60 },
      { month: 'Dec 2025', 'ROS / ROS2': 84, 'Modern C++': 87, 'SLAM & Navigation': 78, 'Embedded C / STM32': 75, 'Gazebo / Isaac Sim': 68 },
      { month: 'Jan 2026', 'ROS / ROS2': 89, 'Modern C++': 90, 'SLAM & Navigation': 84, 'Embedded C / STM32': 80, 'Gazebo / Isaac Sim': 75 },
      { month: 'Feb 2026', 'ROS / ROS2': 94, 'Modern C++': 93, 'SLAM & Navigation': 88, 'Embedded C / STM32': 84, 'Gazebo / Isaac Sim': 82 },
      { month: 'Mar 2026', 'ROS / ROS2': 98, 'Modern C++': 96, 'SLAM & Navigation': 92, 'Embedded C / STM32': 90, 'Gazebo / Isaac Sim': 87 },
    ],
    emergingSkills: [
      { id: 'em_rob_1', name: 'ROS2 DDS & Nav2 Stack', growthRate: '+45% YoY', demandPercentage: 93, status: 'Rapid Growth', whyItMatters: 'Industry-standard distributed robotics communication and autonomous navigation stack.', recommendedAction: 'Build navigation costmaps and custom BT recovery behaviors for AMR chassis.' },
      { id: 'em_rob_2', name: 'Visual SLAM & LiDAR Fusion', growthRate: '+38% YoY', demandPercentage: 87, status: 'Rapid Growth', whyItMatters: 'Essential for mobile robots operating in GPS-denied indoor warehouse and industrial environments.', recommendedAction: 'Integrate real-time point cloud registration with extended Kalman filtering.' },
      { id: 'em_rob_3', name: 'NVIDIA Isaac Sim Photorealistic Simulation', growthRate: '+33% YoY', demandPercentage: 80, status: 'Growing', whyItMatters: 'GPU accelerated synthetic domain randomization for training robot vision policies.', recommendedAction: 'Construct photorealistic USD digital twins with PhysX 5 dynamics.' },
    ],
    companyCriteria: [
      { id: 'cc_rob_1', companyName: 'GreyOrange Robotics', companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', industryTier: 'Tier 1 Tech', activeRole: role, openPositionsCount: 14, entryMandatorySkills: ['ROS / ROS2', 'Modern C++ (C++17/20)', 'SLAM & Autonomous Navigation'], preferredAdvancedSkills: ['Gazebo Physics Simulation', 'Kinematics & MoveIt', 'FreeRTOS'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Intermediate' },
      { id: 'cc_rob_2', companyName: 'ABB Robotics', companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120', industryTier: 'Tier 1 Tech', activeRole: role, openPositionsCount: 8, entryMandatorySkills: ['Modern C++', 'ROS / ROS2', 'Kinematics & MoveIt'], preferredAdvancedSkills: ['LiDAR Point Clouds (PCL)', 'Embedded C', 'Computer Vision & OpenCV'], hiringStatus: 'Hiring Peak', minProficiencyExpected: 'Intermediate' },
      { id: 'cc_rob_3', companyName: 'Tesla Autopilot & Optimus', companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', industryTier: 'Unicorn', activeRole: role, openPositionsCount: 12, entryMandatorySkills: ['Modern C++', 'Sensor Fusion & Kalman Filtering', 'ROS / ROS2'], preferredAdvancedSkills: ['CUDA GPU Acceleration', 'Edge AI on NVIDIA Jetson', 'Hardware-in-the-Loop'], hiringStatus: 'Actively Hiring', minProficiencyExpected: 'Advanced' },
    ],
    skillCompanyMappings: exhaustiveMappings,
  };
}
