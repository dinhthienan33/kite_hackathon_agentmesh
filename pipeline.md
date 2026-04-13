# AgentMesh Integration Pipeline

This document aggregates the business logic defined in the `BRD.md` with the technical architectural execution flows. It describes the lifecycle of a task from human prompt to on-chain autonomous settlement using **Kite AI's Account Abstraction (AA) SDK, Zero-gas Paymaster, and Agent Passport**.

---

## 1. Executive Pipeline Summary
AgentMesh orchestrates autonomous AI agents to discover, negotiate with, hire, and pay other specialized AI agents to complete multi-step tasks. The entire pipeline operates with **zero human intervention after the initial prompt** and utilizes Kite Chain's zero-gas infrastructure and x402 agentic payments.

### Ecosystem Roles
1. **The Human Principal (User):** Funds the Manager Agent via EOA with testnet tokens and sets spending budget governance rules via the AA SDK.
2. **The Manager Agent (Buyer):** Breaks down the human's prompt, queries the blockchain for workers, negotiates, orchestrates the workflow, and settles payments via the Node.js AA wrapper.
3. **The Worker Agents (Sellers):** Mints Agent Passports, registers capabilities on-chain, accepts tasks, generates outputs, and claims x402 settlements.

---

## 2. High-Level Technical Architecture & Payment Rails

To achieve extremely low latency and eliminate zero-value transaction spam on the Kite mainnet/testnet, AgentMesh leverages **Agent-Native Payment Rails via State Channels**. This allows agents to open a high-frequency, peer-to-peer payment channel, negotiate, and stream micro-payments off-chain before settling the final balance back to the blockchain.

Given the discrepancy between our Python orchestration backend (which handles LLM logic) and the Node.js-based `gokite-aa-sdk`, we have introduced a **Node.js AA Microservice**. 

### Detailed Agent Processing in Kite Smart Contracts

AgentMesh operates with three primary agent roles, each mapped to specific Kite Chain infrastructure and smart contracts:

1.  **The Manager Agent (The Orchestrator)**:
    - **Contract Interaction**: `AgentPassport.sol` (Identity), `AgentMeshEscrow.sol` (Value Control).
    - **AA Integration**: Deploys a **Kite Account Abstraction (AA) Vault**. This vault holds the Human Principal's funds and enforces programmable spending rules (Governance).
    - **Payment Role**: Signs `UserOperations` to lock funds in Escrow and eventually calls `releaseFunds()` upon task verification.

2.  **The Researcher Agent (Worker 1)**:
    - **Contract Interaction**: `AgentPassport.sol` (Identity), `AgentRegistry.sol` (Capability & Rate Discovery).
    - **Workflow**: Mints identity and registers as a "Researcher" with a base rate (e.g., 2.0 KITE).
    - **Settlement**: Receives payments gaslessly via the x402 protocol and EIP-3009 signatures triggered by the Manager.

3.  **The Designer Agent (Worker 2)**:
    - **Contract Interaction**: `AgentPassport.sol` (Identity), `AgentRegistry.sol` (Capability & Rate Discovery).
    - **Workflow**: Mints identity and registers as a "Designer" with a base rate (e.g., 5.0 KITE).
    - **Settlement**: Similar to the Researcher, utilizes the `AgentMeshEscrow` for secure on-chain settlement with $0 gas fees via the Kite Paymaster.

```mermaid
graph TD
    UI[React / Vite Observer Dashboard] -->|Real-time Logs| PY[FastAPI Backend 'Brain']
    
    subgraph Agent_Backend [Python Agentic Backend]
        PY -->|Orchestrate| MGR[Manager Agent]
        MGR -->|Delegate Task| RES[Researcher Agent]
        MGR -->|Delegate Task| DES[Designer Agent]
    end

    subgraph AI_Intelligence [LLM Layer]
        MGR & RES & DES -->|JSON Prompts| GEMINI[Google Gemini API]
    end

    MGR -.->|Internal API / Port 3000| NODE[Node.js AA Microservice]
    
    subgraph Kite_Blockchain_Infrastructure [Kite Blockchain Infrastructure]
        NODE -->|EIP-4337 Requests| BUNDLER[Kite Bundler API]
        NODE -->|EIP-3009 Signed Tx| GASLESS[Gasless Service API]
        NODE -->|RPC HTTP| KITE_RPC[Testnet RPC]
    end

    subgraph Kite_Smart_Contracts [Kite Smart Contracts]
        KITE_RPC -->|Identity| PASSPORT[AgentPassport.sol]
        KITE_RPC -->|Registration| REGISTRY[AgentRegistry.sol]
        KITE_RPC -->|Payment Rails| ESCROW[AgentMeshEscrow.sol]
    end

    RES & DES -.->|On-chain Registry| REGISTRY
    MGR -.->|Fund & Release| ESCROW
    MGR & RES & DES -.->|Identity Mint| PASSPORT
```

---

## 3. End-to-End Functional Orchestration Flow

This sequence diagram illustrates the lifecycle of a single AgentMesh transaction spanning **Identity (FR1)**, **Governance (FR2)**, **Discovery/Negotiation (FR3)**, and **Settlement (FR4)**.

```mermaid
sequenceDiagram
    participant User as Human Principal
    participant Frontend as React Observer Dashboard
    participant Orchestrator as Python FastAPI Manager
    participant AA_Service as Node.js AA Microservice
    participant Researcher as Researcher Agent (LLM)
    participant Designer as Designer Agent (LLM)
    participant Kite as Kite Testnet (RPC/Escrow/Bundler)

    %% Initialization & Governance
    User->>Frontend: Funds Manager Agent & Sets Constraints
    Frontend->>Orchestrator: Send Task Payload (e.g. "Research & Design Graphic")
    Orchestrator->>AA_Service: Deploy AA Vault & Set Spending Rules
    AA_Service->>Kite: Send UserOperation (Bundler)
    Kite-->>AA_Service: Vault Proxy Address Confirmed

    %% Discovery
    Orchestrator->>Kite: Query `AgentRegistry.sol` for `Researcher`
    Kite-->>Orchestrator: Return Researcher Profile details

    %% Negotiation (Researcher)
    Orchestrator->>Researcher: Offer 2 KITE for Research Task
    Researcher->>Orchestrator: Evaluate against Base Rate: ACCEPT
    
    %% Execution (Researcher)
    Orchestrator->>AA_Service: Lock funds for Research Task
    AA_Service->>Kite: Deposit to `AgentMeshEscrow.sol`
    Researcher->>Orchestrator: Deliver generated Research JSON

    %% Settlement (Researcher)
    Orchestrator->>AA_Service: Research done, call `releaseFunds()`
    AA_Service->>Kite: Release funds to Researcher

    %% Discovery (Designer)
    Orchestrator->>Kite: Query `AgentRegistry.sol` for `Designer`
    Kite-->>Orchestrator: Return Designer Profile details

    %% Negotiation (Designer)
    Orchestrator->>Designer: Offer 5 KITE for Graphic Task
    Designer->>Orchestrator: Evaluate against Base Rate: ACCEPT

    %% Execution (Designer)
    Orchestrator->>AA_Service: Lock funds for Design Task
    AA_Service->>Kite: Deposit to `AgentMeshEscrow.sol`
    Designer->>Orchestrator: Deliver generated Image URL / JSON

    %% Final Settlement via Gasless & x402
    Note over Orchestrator, Kite: Final Settlement via AA & Paymaster
    Orchestrator->>AA_Service: All tasks completed, finalize settlement
    AA_Service->>Node.js Gasless Engine: Generate EIP-3009 Signature
    Node.js Gasless Engine->>Kite: POST /testnet to release funds (0 Gas)
    Kite-->>AA_Service: Receipt Tx Hash confirmed
    AA_Service-->>Orchestrator: Return Transaction Details
    
    %% Finality
    Orchestrator-->>Frontend: Display Final Deliverable & Receipt ($0.00 Gas)
```

---

## 4. Account Abstraction (AA) Deployment Flow
The Node.js microservice explicitly manages the lifecycle of the AA Wallet using `gokite-aa-sdk` to enforce user governance over autonomous agent spending.

```mermaid
flowchart LR
    A[Human EOA / Signer] -->|Sign Configuration| B(Determine AA Wallet Address)
    B --> C{Deploy ClientAgentVault Proxy}
    C -->|Set Settlement Token| D[Vault Initialization]
    D --> E[Configure Spending Rules: e.g. Max 100 USDC/PYUSD for 24 hours]
```

---

## 5. Gasless Integration Flow (EIP-3009)
To achieve exactly $0.00 gas fees for agents—a strict hackathon requirement—the system utilizes the Kite Paymaster endpoint with compatible tokens (like Testnet PYUSD).

```mermaid
sequenceDiagram
    participant MGR as Manager (AA Wallet)
    participant NODE as Node.js Microservice
    participant PAY as Kite Gasless API
    participant TOK as Token Contract (PYUSD)
    participant WRK as Worker (Researcher/Designer)
    
    MGR->>NODE: Release Funds Intent (taskId, amount)
    NODE->>NODE: Generate EIP-3009 Signature (v, r, s)
    NODE->>PAY: POST /testnet (token, sig, value, WRK_ADDR)
    PAY->>TOK: Relayer: transferWithAuthorization()
    TOK-->>PAY: Transaction (0 Gas)
    PAY-->>NODE: Receipt Hash
    NODE-->>MGR: Payment Finalized on Kite Chain
    Note over WRK: Funds instantly available via x402
```

---
*End of Pipeline Document*
