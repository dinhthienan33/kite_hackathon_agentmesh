# AgentMesh Test Case Report

## 1. Current Testing State

After scanning the repository, the following test coverage was observed:
- **Frontend:** Found `src/tests/agent.test.ts` which implements basic mocked unit tests for the agent registry, transaction object structure, and task breakdown logic using `vitest`.
- **Backend:** No existing automated tests were found for the FastAPI backend (e.g., no `pytest` configuration).
- **Smart Contracts:** No blockchain/smart-contract test suites found yet (e.g., Hardhat or Foundry).

---

## 2. Recommended Test Suites

Based on the Business Requirements Document (`BRD.md`), the following test cases should be implemented to ensure a successful prototype for the Kite AI Hackathon.

### Test Suite 1: Agent Onboarding & Identity (FR1)
*Covers identity minting and registry on the Kite Testnet.*

| ID | Title | Steps | Expected Result |
|---|---|---|---|
| **TC-1.1** | Mint Kite Agent Passport | 1. Initialize a new Agent instance.<br>2. Trigger Passport minting on `AgentPassport.sol`. | Smart contract emits a success event; Agent receives a unique decentralized ID (DID). |
| **TC-1.2** | Register Worker Capabilities | 1. Worker Agent defines text/image capabilities and base rate.<br>2. Submit transaction to `AgentRegistry.sol`. | On-chain registry reflects the correct metadata and minimum acceptable base rate. |

### Test Suite 2: Escrow, Governance & Settlement (FR2, FR4)
*Covers zero-gas transactions, x402 payments, and paymaster integration.*

| ID | Title | Steps | Expected Result |
|---|---|---|---|
| **TC-2.1** | Deposit Funds & Spend Limit | 1. Human deposits testnet USDC into Manager Agent wallet.<br>2. Set hard-coded limit to 10 USDC. | Wallet balance increments; attempts to allocate >10 USDC fail. |
| **TC-2.2** | Escrow Locking | 1. Manager agrees on task price with Worker.<br>2. Lock funds in `AgentMeshEscrow.sol`. | Funds are locked securely; neither party can withdraw without completing the workflow. |
| **TC-2.3** | Release x402 Payments (Zero-Gas) | 1. Worker delivers final payload.<br>2. Manager triggers `releaseFunds()`. | Worker receives USDC instantly. The transaction uses the ERC-4337 Paymaster, resulting in 0 gas fees for the worker. |

### Test Suite 3: Agent Discovery & Negotiation (FR3)
*Covers the Python backend and LLM intelligence.*

| ID | Title | Steps | Expected Result |
|---|---|---|---|
| **TC-3.1** | Query Relevant Agents | 1. Manager Agent parses a task "Design a logo".<br>2. Query Kite Chain for Designer agents. | System successfully filters and returns agents with matching designated skills. |
| **TC-3.2** | Accept Favorable Bid | 1. Manager sends a 5 USDC bid.<br>2. Worker (Base Rate: 2 USDC) evaluates via LLM. | Worker LLM analyzes the bid, determines it exceeds the base rate, and responds with ACT_ACCEPT. |
| **TC-3.3** | Reject Low-ball Bid | 1. Manager sends a 1 USDC bid.<br>2. Worker (Base Rate: 2 USDC) evaluates via LLM. | Worker LLM rejects the offer and optionally counter-offers. |

### Test Suite 4: Observer Dashboard UI (FR5)
*Covers the React Frontend.*

| ID | Title | Steps | Expected Result |
|---|---|---|---|
| **TC-4.1** | Render Live "Thought Process" | 1. Backend emits events (e.g., "Negotiating...") via SSE or WebSockets.<br>2. Observe dashboard UI. | The UI receives these events and renders them in the timeline dynamically without page reloads. |
| **TC-4.2** | Display Transaction Receipts | 1. A simulated on-chain payment occurs.<br>2. Dashboard captures the receipt output. | Receipt displays accurately, confirming block time (~1 second) and Zero Gas fee ($0.00). |
| **TC-4.3** | Final Output Render | 1. System completes an image generation task.<br>2. Asset is returned to Frontend. | Dashboard displays the finalized output file / image correctly visually. |

---

## 3. Next Implementation Steps
1. **Configure Backend Testing:** Install `pytest` and `httpx` and create a `tests/` folder in the `Backend` directory to test the FastAPI endpoints and LangChain logic.
2. **Expand Frontend Testing:** Add React Testing Library (`@testing-library/react`) to test the real-time event rendering in the dashboard.
3. **Smart Contract Testing:** Set up a lightweight Hardhat or Foundry environment to test the zero-gas paymaster constraints and escrow logic before deploying to the Kite Testnet.
