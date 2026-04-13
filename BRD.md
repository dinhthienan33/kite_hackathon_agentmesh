# Business Requirements Document (BRD)
## Project Name: AgentMesh — The Decentralized A2A Marketplace
**Target Event:** Kite AI Global Hackathon 2026 — Powering the Agentic Economy  
**Organizers:** Encode Club × Kite AI | Ecosystem Partner: Google Cloud  
**Track:** Agentic Commerce  
**Duration:** 4 weeks (March 27 – April 26, 2026)  
**Final Submission Deadline:** April 26, 2026, 23:59 UTC-12  

---

## 1. Executive Summary
**AgentMesh** is a decentralized service marketplace native to the Kite AI blockchain. It enables autonomous AI agents to discover, negotiate with, hire, and pay other specialized AI agents to complete multi-step tasks — without human intervention. By combining Kite Chain's zero-gas infrastructure, x402 agentic payments, and Agent Account Abstraction (AA) SDK, AgentMesh creates a trustless, high-speed agentic economy that directly addresses the hackathon's core theme.

---

## 2. Hackathon Context & Alignment

### 2.1 Official Tracks
| Track | Description | Our Fit |
| :--- | :--- | :--- |
| **Agentic Commerce** | Build agents that act as buyers or sellers, managing transactions autonomously. | ✅ **Primary track.** AgentMesh is an autonomous agent marketplace. |
| Agentic Trading & Portfolio Management | Build agents that manage portfolios, trade, and optimize yield across DeFi. | Partial — could extend with a DeFi-yield Worker Agent. |
| Novel Track | Any other unique agentic AI applications leveraging Kite AI's infrastructure. | Fallback if scope pivots. |

### 2.2 Prize Pool ($10,000 USD)
| Place | Prize |
| :--- | :--- |
| 🥇 1st Place | $5,000 |
| 🥈 2nd Place (×2 teams) | $1,500 each |
| 🥉 3rd Place (×2 teams) | $1,000 each |

### 2.3 Judging Criteria
Understanding 성수 criteria is critical to maximizing our score:

| Criterion | Weight Signal | How AgentMesh Scores |
| :--- | :--- | :--- |
| **Agent Autonomy** | High | After initial prompt, zero human intervention until final output. |
| **Developer Experience** | High | Clean docs, easy setup (`npm run dev` + `uvicorn`), well-structured repo. |
| **Real-World Applicability** | Medium-High | Freelancer-like micro-task economy is immediately practical. |
| **Novelty / Creativity** | Medium-High | Multi-agent negotiation with on-chain settlement is a novel demo. |

### 2.4 Mandatory Requirements (from Hackathon Rules)
> [!IMPORTANT]
> Every submission **must** demonstrate all of the following:
> 1. An AI agent performing a task **and** settling on the Kite chain.
> 2. Executed **paid actions** (actual on-chain value transfer).
> 3. A **live, end-to-end demo** (not just slides).
> 4. Use of the Kite chain for **attestations**.

---

## 3. Project Objectives
* **Demonstrate A2A Commerce:** Prove that AI agents can autonomously coordinate and transact on Kite without human input.
* **Showcase Kite AI Infrastructure:** Successfully integrate **x402 Agentic Payments**, **Agent Account Abstraction (AA) SDK**, **Agent Passport**, and **Gasless (Paymaster)** infrastructure.
* **Maximize Judging Score:** Design every feature to directly address the four judging criteria.
* **Deliver a Working Prototype:** Submit a functional end-to-end demo with video, public GitHub repo, and live walkthrough by April 26, 2026.

---

## 4. Scope of Work (MVP for Hackathon)

### 🟢 In-Scope (To be built by April 26)
* Smart contracts for Agent Registry and Escrow on **Kite Testnet**.
* 3 distinct AI personas powered by LLMs (1 Manager Agent, 2 Worker Agents).
* Integration of Kite's **zero-gas infrastructure** via Paymaster / Gasless SDK.
* Automated **USDC (Testnet) settlement** via the **x402 Protocol**.
* **Agent Passport** minting for on-chain identity and attestation.
* A React frontend **Observer Dashboard** to visualize agent thought processes, outputs, and on-chain transactions in real time.

### 🔴 Out-of-Scope (Post-Hackathon Roadmap)
* Complex dispute resolution (AI arbiters).
* Cross-chain integration via LayerZero (noted in Kite ecosystem but deferred).
* Support for thousands of concurrent agents (demo will be limited scope).
* DeFi yield / trading features (potential stretch goal only).

---

## 5. User Personas
Even though the economy is *agentic*, there are distinct roles:

1. **The Human Principal (User)**  
   * *Goal:* Wants a complex task done (e.g., "Research a topic and design a graphic").  
   * *Action:* Funds the Manager Agent with testnet USDC and sets a governance rule (budget cap).

2. **The Manager Agent (Buyer)**  
   * *Goal:* Break down the human's prompt, discover worker agents on-chain, negotiate prices, orchestrate the workflow, and settle payments.

3. **The Worker Agents (Sellers — e.g., Researcher & Designer)**  
   * *Goal:* Register skills on-chain via Agent Passport, accept task parameters, deliver output, and get paid autonomously via x402.

---

## 6. Functional Requirements (FR)

### FR1: Agent Onboarding & Identity (Attestation)
* **FR1.1:** Every agent must mint an **Agent Passport** upon initialization using Kite's identity module — satisfying the attestation requirement.
* **FR1.2:** Worker agents must register their capabilities (e.g., text generation, image generation) and minimum base rate in the `AgentRegistry.sol` contract.

### FR2: Programmable Governance & Escrow
* **FR2.1:** The Human Principal must be able to deposit testnet USDC into the Manager Agent's smart wallet.
* **FR2.2:** The smart wallet must enforce programmable constraints (e.g., "Cannot spend > 10 USDC per task") using the **Agent AA SDK**.
* **FR2.3:** Funds for an agreed task must be locked in `AgentMeshEscrow.sol` until the task is marked "completed."

### FR3: Agent Discovery & Negotiation (Off-chain + On-chain)
* **FR3.1:** The Manager Agent must query the Kite Chain to discover registered agents matching required skills.
* **FR3.2:** The Manager Agent must send a structured bid payload to the Worker Agent.
* **FR3.3:** The Worker Agent LLM must evaluate the offer against its base rate and either accept or counter-offer.

### FR4: Execution & Settlement (Kite x402 Integration)
* **FR4.1:** Worker agents must deliver the final payload (e.g., JSON text or Image URL) back to the Manager Agent.
* **FR4.2:** Upon successful receipt, the Manager Agent must trigger `releaseFunds()`.
* **FR4.3:** The system must use **x402 Agentic Payments** to instantly transfer USDC to the worker's wallet — satisfying the "paid actions" requirement.
* **FR4.4:** The transaction must use Kite's **Gasless / Paymaster** integration so agents pay zero gas fees.

### FR5: Observer Dashboard (Frontend UI)
* **FR5.1:** The web app must display a live feed of the Manager Agent's "Thought Process" (e.g., "Searching for Designer…", "Negotiating…").
* **FR5.2:** The UI must display the final outputs generated by the Worker Agents.
* **FR5.3:** The UI must display a live transaction receipt showing block time (~1 sec) and Gas Fee ($0.00).
* **FR5.4:** The dashboard must be demo-ready for the live end-to-end walkthrough.

---

## 7. Non-Functional Requirements (NFR)
* **Performance:** Settlement must leverage Kite AI's ~1-second block time.
* **Cost Efficiency:** Gas fees must be zero for agents, fully handled by the Paymaster.
* **Reliability:** LLM prompts must return structured JSON to avoid breaking the execution pipeline.
* **Developer Experience:** Repository must have a clear README, easy local setup, and inline code comments — directly affects judging.

---

## 8. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Human Principal (Browser)                                  │
│  React/Vite Observer Dashboard                              │
└──────────────┬──────────────────────────────────────────────┘
               │  WebSocket / SSE
┌──────────────▼──────────────────────────────────────────────┐
│  Backend "Brain" (Python / FastAPI)                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Manager Agent │→→│ Worker Agent 1 │  │ Worker Agent 2   │  │
│  │ (Orchestrator)│  │ (Researcher)  │  │ (Designer)       │  │
│  └──────┬───────┘  └───────────────┘  └──────────────────┘  │
│         │  Gemini / OpenAI API                               │
└─────────┼───────────────────────────────────────────────────┘
          │  RPC (ethers / web3.py)
┌─────────▼───────────────────────────────────────────────────┐
│  Kite Testnet (Blockchain Layer)                             │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐  │
│  │ AgentPassport.sol│ │AgentMeshEscrow.sol│ │ Paymaster.sol│  │
│  │ (Identity/Attest)│ │ (Escrow + x402)  │ │ (Gasless)    │  │
│  └─────────────────┘ └──────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Kite Ecosystem Integrations
| Feature | Usage in AgentMesh |
| :--- | :--- |
| **x402 Protocol** | Autonomous USDC settlement between agents |
| **Agent Passport** | On-chain identity + attestation for each agent |
| **Agent AA SDK** | Programmable spending constraints on Manager wallet |
| **Gasless / Paymaster** | Zero-fee transactions for all agent operations |
| **Kite Testnet RPC** | All on-chain reads/writes |

---

## 9. Development Timeline (Hackathon Sprint)

*Current Date: March 31, 2026. Deadline: April 26, 2026.*

| Phase | Dates | Key Deliverables | Hackathon Milestone |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Mar 31 – Apr 6 | Deploy `AgentPassport.sol` and `AgentMeshEscrow.sol` on Kite Testnet. Verify contracts. Setup repo & README. | ✅ Apr 6 — Project creation & idea sharing |
| **Sprint 2** | Apr 7 – Apr 12 | Build Python/FastAPI "Brain" with Manager + Worker agents. Integrate Kite RPC for on-chain queries. | ✅ Apr 12 — Mid-Hackathon Checkpoint |
| **Sprint 3** | Apr 13 – Apr 20 | Build React Observer Dashboard. Integrate x402 payments, Gasless paymaster, and Agent Passport. End-to-end flow. | |
| **Sprint 4** | Apr 21 – Apr 26 | Polish UI, system testing, record demo video, finalize GitHub README + docs, submit. | ✅ Apr 26 — Final Submission |

---

## 10. Submission Checklist
- [ ] **Public GitHub Repository** — Clean code, README with setup instructions, architecture diagram.
- [ ] **Demo Video** — Shows full autonomous flow: prompt → agent negotiation → on-chain settlement → output.
- [ ] **Live End-to-End Demo** — Working prototype, not just slides.
- [ ] **Kite Chain Attestation** — Agent Passport minting visible on-chain.
- [ ] **Paid Actions on Kite** — Real testnet USDC transferred via x402.
- [ ] **Documentation** — Inline comments, API docs, clear developer onboarding (affects DX judging criterion).

---

## 11. Success Criteria (Mapped to Judging)
| Judging Criterion | How We Prove It |
| :--- | :--- |
| **Agent Autonomy** | After initial prompt, zero human intervention until final output delivery. Full pipeline is observable in the dashboard. |
| **Developer Experience** | One-command setup (`npm run dev` + `uvicorn`), comprehensive README, typed codebase. |
| **Real-World Applicability** | Micro-task freelancer economy — a tangible, scalable use case. |
| **Novelty / Creativity** | Multi-agent negotiation with LLM-powered bid evaluation and on-chain escrow settlement. |

---

## 12. Risk Register

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Kite Testnet instability | High | Cache mock responses; build a local-first fallback mode. |
| x402 / Paymaster SDK documentation gaps | Medium | Engage Kite AI Discord early; attend hackathon kickoff workshops. |
| LLM hallucination breaking JSON pipeline | Medium | Strict prompt engineering with JSON schema validation; retry logic. |
| Scope creep (adding DeFi / trading features) | Medium | Defer to post-hackathon; stay laser-focused on Agentic Commerce track. |
| Team coordination (remote hackathon) | Low | Daily async standups; shared task board. |