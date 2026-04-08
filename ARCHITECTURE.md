# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Home      │  │ NewAnalysis  │  │ AnalysisReport   │   │
│  │  (Dashboard)│  │   (Form)     │  │   (Results)      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ tRPC
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Analysis Router                      │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │   create    │  │     list     │  │    byId      │  │ │
│  │  │   delete    │  │    stats     │  │              │  │ │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Alert     │  │   Learning   │  │   Market Data    │   │
│  │   Router    │  │    Engine    │  │     Service      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Engine                           │
│                                                              │
│   ┌──────────────┐                                          │
│   │  Input Data  │                                          │
│   └──────┬───────┘                                          │
│          ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Market Context Enrichment               │   │
│   │   - Fetch live prices                               │   │
│   │   - Compare with market                             │   │
│   └─────────────────────────────────────────────────────┘   │
│          ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Learning Engine Optimization            │   │
│   │   - Analyze historical patterns                     │   │
│   │   - Optimize weights                                │   │
│   └─────────────────────────────────────────────────────┘   │
│          ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Five Analysis Engines (Parallel)        │   │
│   │                                                      │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│   │  │ Economic │ │ Financial│ │Comparative│            │   │
│   │  │  (20%)   │ │  (30%)   │ │  (20%)    │            │   │
│   │  └──────────┘ └──────────┘ └──────────┘            │   │
│   │  ┌──────────┐ ┌──────────┐                          │   │
│   │  │  Legal   │ │Productivity│                         │   │
│   │  │  (15%)   │ │  (15%)    │                         │   │
│   │  └──────────┘ └──────────┘                          │   │
│   └─────────────────────────────────────────────────────┘   │
│          ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Weighted Score Calculation              │   │
│   │   - Apply optimized weights                         │   │
│   │   - Calculate final score                           │   │
│   └─────────────────────────────────────────────────────┘   │
│          ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Decision Engine                         │   │
│   │   - Score >= 70: Execute                            │   │
│   │   - Score 45-70: Wait                               │   │
│   │   - Score < 45: Do Not Execute                      │   │
│   └─────────────────────────────────────────────────────┘   │
│          ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Executive Summary Generation            │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Users   │  │  Analyses    │  │  Investor Profiles   │   │
│  └──────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Alerts  │  │ Notifications│  │  Market Data Cache   │   │
│  └──────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User submits analysis request**
   - Input validation
   - Asset-specific data extraction

2. **Market data enrichment**
   - Fetch current prices from cache or external APIs
   - Compare user price with market price

3. **Learning optimization**
   - Analyze historical patterns for asset type + goal
   - Optimize engine weights if sufficient data exists

4. **Parallel analysis**
   - Run 5 engines simultaneously with LLM
   - Each engine returns score (0-100) + analysis

5. **Weighted calculation**
   - Apply optimized weights to engine scores
   - Calculate final confidence score

6. **Decision & summary**
   - Determine final decision based on score thresholds
   - Generate executive summary using LLM

7. **Storage & notification**
   - Save results to database
   - Notify user of completion

## Key Design Decisions

### Why 5 Engines?
Each engine focuses on a specific dimension:
- **Economic**: Market timing and macro trends
- **Financial**: Pure numbers and returns
- **Comparative**: Competitive positioning
- **Legal**: Risk mitigation
- **Productivity**: Practical usability

### Why Dynamic Weights?
Different asset types require different emphasis:
- Real estate needs more legal analysis
- Stocks need more financial analysis
- Daily-use vehicles need more productivity analysis

### Why Market Data Integration?
LLM alone cannot access real-time prices. Market data provides:
- Objective price validation
- Trend confirmation
- Alert triggers

## Performance Considerations

- **Parallel execution**: All 5 engines run simultaneously
- **Caching**: Market data cached for 15 minutes
- **Async processing**: Analysis runs in background
- **Polling**: Client polls for completion every 5 seconds
