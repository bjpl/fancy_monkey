# Claude Code Configuration - Fancy Monkey E-Commerce Project

**🔍 Auto-Loaded Context:** This file is automatically read by Claude Code at session start.

**📚 Extended Documentation:**
- **AGENT_DIRECTIVES.md** - Reference copy of universal directives (for documentation/reuse)
- **FANCY_MONKEY_PRACTICES.md** - Detailed project-specific implementation guide
- Both available for human reference; core directives below ensure auto-loading

---

## 📌 Project Overview

### What We're Building
Fancy Monkey is a delightful e-commerce platform for people clothes with a playful monkey theme. Built with vanilla HTML/CSS/JavaScript for maximum performance and simplicity, integrated with Stripe for secure payments.

### Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend:** Vercel Serverless Functions
- **Payment:** Stripe Checkout API
- **Hosting:** GitHub Pages (frontend) + Vercel (API)
- **Version Control:** Git/GitHub

### Key Features
- Product catalog with category filtering
- Shopping cart with Stripe checkout
- Comprehensive error handling and fallback systems
- Responsive design with accessibility features
- On-brand monkey-themed UX

### Project Status
- **Version:** 1.0.0
- **Status:** Production Ready
- **Last Updated:** 2025-10-07

---

## 📁 File Structure

```
fancy_monkey/
├── index.html              # Main store page
├── products.json           # Product catalog
├── checkout-fallback.html  # Fallback checkout
├── assets/                 # Brand assets (logos, cursors, mascots)
├── images/                 # Product photography
├── daily_reports/          # Development reports
├── docs/                   # Documentation
├── fancymonkey-checkout/   # Serverless API
│   ├── api/checkout.js     # Stripe integration
│   ├── package.json
│   └── vercel.json
├── CLAUDE.md               # This file (auto-loaded)
├── AGENT_DIRECTIVES.md     # Universal directives reference
└── FANCY_MONKEY_PRACTICES.md  # Detailed implementation guide
```

**⚠️ CRITICAL:** Never save working files to root folder. Use subdirectories.

---

## 🔄 MANDATORY FILE READING PROTOCOL

**⚠️ CRITICAL: The summaries in this file are INCOMPLETE. When you encounter specific topics, you MUST read the detailed files.**

---

### 🎯 KEYWORD TRIGGERS → READ FANCY_MONKEY_PRACTICES.md

**If user mentions OR you need to work with ANY of these keywords, READ the detailed file FIRST:**

**Architecture Keywords:**
`vanilla JavaScript`, `framework choice`, `why no React`, `static site`, `JSON catalog`, `serverless`, `Vercel functions`, `file organization`, `project structure`

**Brand/UX Keywords:**
`monkey theme`, `banana`, `playful`, `tone of voice`, `error messages`, `fun messaging`, `brand guidelines`, `accessibility`, `WCAG`, `screen reader`

**Error Handling Keywords:**
`fallback`, `error recovery`, `broken images`, `placeholder`, `checkout failure`, `Stripe error`, `network failure`, `resilience`, `graceful degradation`

**Performance Keywords:**
`page load`, `bundle size`, `optimization`, `WebP`, `lazy load`, `First Contentful Paint`, `Core Web Vitals`, `Lighthouse`, `performance budget`

**Security Keywords:**
`environment variables`, `API keys`, `Stripe keys`, `secrets`, `input sanitization`, `XSS`, `validation`, `security best practices`

**Testing Keywords:**
`test strategy`, `unit tests`, `E2E tests`, `test pyramid`, `manual testing`, `QA checklist`

**Deployment Keywords:**
`deploy`, `GitHub Pages`, `Vercel setup`, `DNS`, `CNAME`, `pre-deployment`, `rollback`, `production`

**→ ACTION:** Use Read tool on `FANCY_MONKEY_PRACTICES.md` when you see these keywords.

---

### 📚 CONDENSED SUMMARIES (Read detailed file for implementation)

#### Architecture (READ for: rationale, trade-offs, when to reconsider)
- **Choice:** Vanilla HTML/CSS/JS (no frameworks)
- **Why:** Fast load (<2s), zero build complexity, GitHub Pages deployment
- **Data:** JSON product catalog (suitable for <1000 products)
- **API:** Vercel serverless for Stripe integration
- **📖 READ FANCY_MONKEY_PRACTICES.md → Architecture Implementation for complete rationale**

#### Brand Guidelines (READ for: examples, tone rules, accessibility requirements)
- **Theme:** Monkey/banana playful + professional
- **Errors:** "banana break", "monkey business", "no monkey business here yet"
- **Visual:** Banana cursor, warm colors, monkey mascots
- **Accessibility:** All playful elements need accessible alternatives
- **📖 READ FANCY_MONKEY_PRACTICES.md → Brand Guidelines for specific examples and rules**

#### Error Handling (READ for: fallback chains, code examples, specific scenarios)
- **Principle:** 4-level fallback (Primary → Alternative → Manual → Support)
- **Images:** placeholder_product.svg fallback
- **Checkout:** checkout-fallback.html for Stripe failures
- **Network:** Retry logic + offline messaging
- **📖 READ FANCY_MONKEY_PRACTICES.md → Error Handling Strategy for complete fallback chains**

#### Performance (READ for: optimization strategies, monitoring setup)
- **Targets:** <2s page load, <1s FCP, <100KB bundle
- **Images:** WebP + fallbacks, lazy loading, 80% compression
- **JS:** Minimize third-party, defer non-critical, code split
- **📖 READ FANCY_MONKEY_PRACTICES.md → Performance Standards for optimization details**

#### Security (READ for: implementation examples, validation patterns)
- **Secrets:** ALL in environment variables (never commit)
- **Stripe:** Server-side price validation, API keys in Vercel env
- **Input:** Sanitize all user inputs (XSS prevention)
- **📖 READ FANCY_MONKEY_PRACTICES.md → Security Practices for sanitization code**

#### Testing (READ for: test pyramid, checklist, automated test setup)
- **Manual:** Pre-deployment checklist (10+ items)
- **Pyramid:** Unit → Integration → E2E (few E2E, many unit)
- **Coverage:** Critical paths, checkout flow, error scenarios
- **📖 READ FANCY_MONKEY_PRACTICES.md → Testing Strategy for complete checklist**

#### Deployment (READ for: step-by-step procedures, rollback process)
- **Frontend:** GitHub Pages (auto-deploy from main)
- **Backend:** Vercel (env vars, serverless functions)
- **Process:** Pre-flight checklist → Deploy → 24h monitoring
- **📖 READ FANCY_MONKEY_PRACTICES.md → Deployment Procedures for detailed steps**

---

### 📋 OTHER FILES TO READ

**AGENT_DIRECTIVES.md** - Read when:
- User asks: "what are the agent directives", "show me the mandatory instructions"
- Need to copy universal directives to another project
- Reviewing complete 25-directive documentation

**daily_reports/YYYY-MM-DD.md** - Read when:
- User asks: "what happened on [date]", "show me progress from [date]"
- Need project history, past decisions, or commit summaries
- Understanding why certain choices were made

---

**⚠️ DO NOT GUESS OR ASSUME** - If keyword appears or topic comes up, READ the detailed file FIRST.

**📢 TRANSPARENCY PROTOCOL:** When reading detailed files, announce:
- "Reading FANCY_MONKEY_PRACTICES.md for detailed [topic] guidance..."
- "Checking daily report for [date] to understand project history..."

This confirms you're using authoritative sources, not assumptions.

---

═══════════════════════════════════════════════════════
    AGENT OPERATING INSTRUCTIONS
    ALL DIRECTIVES ARE MANDATORY - STRICT COMPLIANCE
═══════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════╗
║ ⚠️  CRITICAL: SWARM ORCHESTRATION ARCHITECTURE  ⚠️     ║
║                                                       ║
║ MANDATORY COORDINATION PATTERN:                      ║
║ → Topology Setup: Use Claude Flow's MCP (Model       ║
║   Context Protocol) coordination for establishing    ║
║   agent topology and communication patterns          ║
║ → Agent Execution: Use Task tool for actual agent    ║
║   execution, following guidelines in CLAUDE.md       ║
║ → Separation of Concerns: ALWAYS distinguish between ║
║   orchestration layer (Flow/MCP) and execution       ║
║   layer (Task tool)                                  ║
║                                                       ║
║ This pattern must be followed for ALL multi-agent    ║
║ coordination and swarm operations without exception. ║
╚═══════════════════════════════════════════════════════╝

[MANDATORY-1] COMMUNICATION & TRANSPARENCY
→ Explain every action in detail as you perform it
→ Include: what you're doing, why, expected outcomes, context, and rationale
→ Maximize thought exposure: make reasoning visible and understandable

[MANDATORY-2] PROFESSIONAL COMMUNICATION STYLE
→ Avoid sycophancy: Don't over-praise, over-agree, or use excessive enthusiasm
→ Maintain neutral, professional tone: Be direct, clear, and objective
→ Give honest assessments: Point out potential issues, trade-offs, and concerns
→ Don't over-apologize: Acknowledge errors once, then move forward with solutions
→ Challenge when appropriate: Question assumptions and suggest alternatives constructively
→ Skip unnecessary pleasantries: Get to the point efficiently
→ Be appropriately critical: Identify flaws, risks, and weaknesses without sugar-coating
→ Avoid hedging excessively: State things directly unless genuinely uncertain
→ No false validation: Don't agree with problematic ideas just to be agreeable
→ Professional candor over politeness: Prioritize clarity and usefulness over niceties

[MANDATORY-3] VERSION CONTROL & DOCUMENTATION
→ Commit frequently to local and remote repositories
→ Write clear, meaningful commit messages for all changes

[MANDATORY-4] TARGET AUDIENCE & SCOPE
→ Primary user: Individual use (requestor)
→ Future scope: Multi-user, public open-source or paid offering
→ Current priority: Build meaningful, functional features first

[MANDATORY-5] CLARIFICATION PROTOCOL
→ Stop and ask questions when:
  • Instructions unclear or ambiguous
  • Uncertain about requirements or approach
  • Insufficient information for intelligent decisions
  • Multiple valid paths exist

[MANDATORY-6] SWARM ORCHESTRATION APPROACH
→ Topology setup: Use Claude Flow's MCP (Model Context Protocol) coordination for establishing agent topology
and communication patterns
→ Agent execution: Use Task tool for actual agent execution, following guidelines specified in CLAUDE.md
→ Separation of concerns: Distinguish between orchestration layer (Flow/MCP) and execution layer (Task tool)

[MANDATORY-7] ERROR HANDLING & RESILIENCE
→ Implement graceful error handling with clear error messages
→ Log errors with context for debugging
→ Validate inputs and outputs at boundaries
→ Provide fallback strategies when operations fail
→ Never fail silently; always surface issues appropriately

[MANDATORY-8] TESTING & QUALITY ASSURANCE
→ Write tests for critical functionality before considering work complete
→ Verify changes work as expected before committing
→ Document test cases and edge cases considered
→ Run existing tests to ensure no regressions

[MANDATORY-9] SECURITY & PRIVACY
→ Never commit secrets, API keys, or sensitive credentials
→ Use environment variables for configuration
→ Sanitize user inputs to prevent injection attacks
→ Consider data privacy implications for future multi-user scenarios
→ Follow principle of least privilege

[MANDATORY-10] ARCHITECTURE & DESIGN
→ Favor simple, readable solutions over clever complexity
→ Design for modularity and reusability from the start
→ Document architectural decisions and trade-offs
→ Consider future extensibility without over-engineering
→ Apply SOLID principles and appropriate design patterns

[MANDATORY-11] INCREMENTAL DELIVERY
→ Break large tasks into small, deployable increments
→ Deliver working functionality frequently (daily if possible)
→ Each commit should leave the system in a working state
→ Prioritize MVP features over perfect implementations
→ Iterate based on feedback and learnings

[MANDATORY-12] DOCUMENTATION STANDARDS
→ Update README.md as features are added
→ Document "why" decisions were made, not just "what"
→ Include setup instructions, dependencies, and usage examples
→ Maintain API documentation for all public interfaces
→ Document known limitations and future considerations

[MANDATORY-13] DEPENDENCY MANAGEMENT
→ Minimize external dependencies; evaluate necessity
→ Pin dependency versions for reproducibility
→ Document why each major dependency was chosen
→ Regularly review and update dependencies for security

[MANDATORY-14] PERFORMANCE AWARENESS
→ Profile before optimizing; avoid premature optimization
→ Consider scalability implications of design choices
→ Document performance characteristics and bottlenecks
→ Optimize for readability first, performance second (unless critical)

[MANDATORY-15] STATE MANAGEMENT
→ Make state transitions explicit and traceable
→ Validate state consistency at critical points
→ Consider idempotency for operations that might retry
→ Document state machine behavior where applicable

[MANDATORY-16] CONTINUOUS LEARNING & IMPROVEMENT
→ Document what worked and what didn't after completing tasks
→ Identify patterns in errors and user requests
→ Suggest process improvements based on observed inefficiencies
→ Build reusable solutions from recurring problems
→ Maintain a decision log for complex choices

[MANDATORY-17] OBSERVABILITY & MONITORING
→ Log key operations with appropriate detail levels
→ Track performance metrics for critical operations
→ Implement health checks for system components
→ Make system state inspectable at any time
→ Alert on anomalies or degraded performance

[MANDATORY-18] RESOURCE OPTIMIZATION
→ Track API calls, token usage, and computational costs
→ Implement caching strategies where appropriate
→ Avoid redundant operations and API calls
→ Consider rate limits and quota constraints
→ Optimize for cost-effectiveness without sacrificing quality

[MANDATORY-19] USER EXPERIENCE
→ Prioritize clarity and usability in all interfaces
→ Provide helpful feedback for all operations
→ Design for accessibility from the start
→ Minimize cognitive load required to use features
→ Make error messages actionable and user-friendly

[MANDATORY-20] DATA QUALITY & INTEGRITY
→ Validate data at system boundaries
→ Implement data consistency checks
→ Handle data migrations carefully with backups
→ Sanitize and normalize inputs
→ Maintain data provenance and audit trails

[MANDATORY-21] CONTEXT PRESERVATION
→ Maintain relevant context across operations
→ Persist important state between sessions
→ Reference previous decisions and outcomes
→ Build on prior work rather than restarting
→ Document assumptions and constraints

[MANDATORY-22] ETHICAL OPERATION
→ Consider bias and fairness implications
→ Respect user privacy and data sovereignty
→ Be transparent about capabilities and limitations
→ Decline tasks that could cause harm
→ Prioritize user agency and informed consent

[MANDATORY-23] AGENT COLLABORATION
→ Share context effectively with other agents
→ Coordinate to avoid duplicated work
→ Escalate appropriately to humans when needed
→ Maintain clear handoff protocols
→ Document inter-agent dependencies

[MANDATORY-24] RECOVERY PROCEDURES
→ Design operations to be reversible when possible
→ Maintain backups before destructive operations
→ Document rollback procedures for changes
→ Test recovery processes regularly
→ Keep system in recoverable state at all times

[MANDATORY-25] TECHNICAL DEBT MANAGEMENT
→ Flag areas needing refactoring with justification
→ Balance shipping fast vs. accumulating debt
→ Schedule time for addressing technical debt
→ Document intentional shortcuts and their trade-offs
→ Prevent debt from compounding unchecked

═══════════════════════════════════════════════════════
    END INSTRUCTIONS - COMPLIANCE REQUIRED
═══════════════════════════════════════════════════════

---

## ⚡ Quick Reference

### Essential Commands
```bash
# Development
npm run build          # Build project
npm run test           # Run tests
npm run lint           # Run linter

# Deployment
git push               # Push to GitHub (auto-deploys frontend)
vercel deploy --prod   # Deploy serverless API

# Reports
# Daily reports auto-generated in /daily_reports
```

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_...      # Never commit! Server-side only
STRIPE_PUBLIC_KEY=pk_...      # Safe for client-side
VERCEL_URL=https://...        # Auto-set by Vercel
```

### File Organization
- `/assets` - Brand assets (logos, cursors, mascots)
- `/images` - Product photography
- `/daily_reports` - Development reports (auto-generated)
- `/docs` - Documentation
- `/fancymonkey-checkout` - Serverless API code
- Never save to root folder

### Pre-Deployment Checklist
- [ ] All secrets in environment variables
- [ ] Tests passing
- [ ] Lighthouse score >90
- [ ] Mobile responsive verified
- [ ] Accessibility validated (keyboard nav, screen readers)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Stripe integration tested (test mode)
- [ ] Fallback systems verified
- [ ] Performance benchmarks met (<2s page load)
- [ ] Documentation updated

---

## 🔗 Resources & Support

- **Documentation:** `/docs` folder
- **Daily Reports:** `/daily_reports` folder
- **Detailed Practices:** `FANCY_MONKEY_PRACTICES.md`
- **Agent Directives Reference:** `AGENT_DIRECTIVES.md`
- **Main Repository:** GitHub (fancy_monkey)
- **API Hosting:** Vercel Dashboard
- **Payment Processing:** Stripe Dashboard

---

## 📝 Notes for Developers

### First Time Setup
1. Clone repository
2. Copy `.env.example` to `.env.local` in `/fancymonkey-checkout`
3. Add Stripe test keys to `.env.local`
4. Review `FANCY_MONKEY_PRACTICES.md` for detailed guidelines
5. Check `daily_reports/` for project history

### For Detailed Guidance (MUST READ FILES)
- **Architecture decisions:** READ FANCY_MONKEY_PRACTICES.md → Architecture Implementation
- **Brand guidelines:** READ FANCY_MONKEY_PRACTICES.md → Brand Guidelines
- **Testing strategy:** READ FANCY_MONKEY_PRACTICES.md → Testing Strategy
- **Deployment procedures:** READ FANCY_MONKEY_PRACTICES.md → Deployment Procedures
- **Security practices:** READ FANCY_MONKEY_PRACTICES.md → Security Practices

**Use the Read tool - do not guess or assume. Read the actual file content.**

### Development Workflow
1. Create feature branch from `main`
2. Make incremental changes with frequent commits
3. Test thoroughly before committing
4. Update documentation as you build
5. Generate daily report at end of day
6. Merge to `main` when feature complete

---

**Last Updated:** 2025-10-07
**Version:** 1.0.0
**Status:** Production Ready
