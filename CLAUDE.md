# Claude Code Configuration - Fancy Monkey E-Commerce Project

## Project Overview

Fancy Monkey is a delightful e-commerce platform for people clothes with a playful monkey theme. Built with vanilla HTML/CSS/JavaScript for maximum performance and simplicity, integrated with Stripe for secure payments.

**Tech Stack:**
- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+)
- Backend: Vercel Serverless Functions
- Payment: Stripe Checkout API
- Hosting: GitHub Pages (frontend) + Vercel (API)
- Version Control: Git/GitHub

**Key Features:**
- Product catalog with category filtering
- Shopping cart with Stripe checkout
- Comprehensive error handling and fallback systems
- Responsive design with accessibility features
- On-brand monkey-themed UX

---

## Development Guidelines

### Code Organization
- Keep HTML semantic and accessible
- Use component-based CSS architecture
- Write modular JavaScript functions
- Organize assets in appropriate folders
- Never commit to root folder (use subdirectories)

### File Structure
```
fancy_monkey/
├── index.html              # Main store page
├── products.json           # Product catalog
├── assets/                 # Brand assets
├── images/                 # Product images
├── fancymonkey-checkout/   # Serverless API
├── daily_reports/          # Development reports
└── docs/                   # Documentation
```

### Performance Standards
- Page load: < 2 seconds
- First Contentful Paint: < 1 second
- Optimize images (WebP + fallbacks)
- Minimize JavaScript bundle size
- Lazy load images when appropriate

---

════════════════════════════════════════════════════════
    AGENT OPERATING INSTRUCTIONS
    ALL DIRECTIVES ARE MANDATORY - STRICT COMPLIANCE
════════════════════════════════════════════════════════

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

[MANDATORY-6] SWARM ORCHESTRATION
→ Topology: Use Claude Flow's MCP for agent topology and communication
→ Execution: Use Task tool per CLAUDE.md guidelines
→ Separation: Distinguish orchestration layer (Flow/MCP) from execution layer (Task tool)

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

════════════════════════════════════════════════════════
    END INSTRUCTIONS - COMPLIANCE REQUIRED
════════════════════════════════════════════════════════

---

## Project-Specific Practices

### Fancy Monkey Brand Guidelines
- **Tone**: Playful, fun, professional
- **Errors**: Use monkey-themed messages (e.g., "banana break", "monkey business")
- **Visuals**: Banana cursor, monkey mascots, warm colors
- **Accessibility**: Ensure all playful elements have accessible alternatives

### Error Handling Strategy
1. **Never show broken state** - Always have fallbacks
2. **On-brand messaging** - Keep errors fun but informative
3. **Multiple fallback layers** - Primary → Secondary → Manual
4. **User guidance** - Always provide next steps

### Deployment Checklist
- [ ] All secrets in environment variables
- [ ] Error tracking configured
- [ ] Performance benchmarks met
- [ ] Mobile responsive verified
- [ ] Accessibility validated
- [ ] Cross-browser tested
- [ ] Stripe integration tested
- [ ] Fallback systems verified

---

## Quick Reference

### Essential Commands
```bash
# Development
npm run build          # Build project
npm run test           # Run tests
npm run lint           # Run linter

# Deployment
git push               # Push to GitHub
vercel deploy          # Deploy API to Vercel

# Daily Reports
# Reports auto-generated in /daily_reports
```

### File Organization Rules
- **NEVER** save working files to root folder
- Use appropriate subdirectories:
  - `/assets` - Brand assets
  - `/images` - Product images
  - `/daily_reports` - Development reports
  - `/docs` - Documentation
  - `/fancymonkey-checkout` - API code

### Environment Variables
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
VERCEL_URL=...
```

---

## Support & Resources

- **Main Repository**: GitHub (fancy_monkey)
- **API Hosting**: Vercel
- **Payment Processing**: Stripe
- **Documentation**: See `/docs` folder
- **Daily Reports**: See `/daily_reports` folder

---

**Last Updated**: 2025-10-07
**Project Status**: Production Ready
**Version**: 1.0.0
