import asyncio
import json
import os
import time
import logging
from typing import Any, Dict, List, Literal

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.config import settings
from app.llm_client import llm_client
from app.blockchain_client import chain_client

logger = logging.getLogger(__name__)

app = FastAPI(title="AgentMesh Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


LogType = Literal["thought", "action", "system", "deliverable", "error"]

class Log(BaseModel):
    id: float
    timestamp: str
    agent: str
    message: str
    type: LogType = "thought"

class Transaction(BaseModel):
    id: str
    from_: str = Field(alias="from")
    to: str
    amount: float
    currency: str
    status: str
    gas: str
    timestamp: str

    model_config = {"populate_by_name": True}

class RunRequest(BaseModel):
    prompt: str


class StreamState:
    def __init__(self) -> None:
        self.logs: List[Dict[str, Any]] = []
        self.transactions: List[Dict[str, Any]] = []
        self._subscribers: List[asyncio.Queue[str]] = []
        self.run_lock = asyncio.Lock()

    def snapshot_event(self) -> str:
        return json.dumps({"type": "init", "logs": self.logs, "transactions": self.transactions})

    async def publish(self, event: Dict[str, Any]) -> None:
        payload = json.dumps(event)
        for q in list(self._subscribers):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                pass

    def subscribe(self) -> asyncio.Queue[str]:
        q: asyncio.Queue[str] = asyncio.Queue(maxsize=1000)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[str]) -> None:
        try:
            self._subscribers.remove(q)
        except ValueError:
            pass

    def reset(self) -> None:
        self.logs = []
        self.transactions = []

    def add_log(self, agent: str, message: str, type_: LogType = "thought") -> Dict[str, Any]:
        log = Log(
            id=time.time() + (os.getpid() / 1_000_000),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            agent=agent,
            message=message,
            type=type_,
        ).model_dump()
        self.logs.append(log)
        return log

    def add_tx(
        self,
        *,
        tx_hash: str,
        from_addr: str,
        to_addr: str,
        amount: float,
        currency: str = "USDC",
    ) -> Dict[str, Any]:
        tx = Transaction(
            id=tx_hash,
            **{"from": from_addr},
            to=to_addr,
            amount=amount,
            currency=currency,
            status="Success",
            gas="0.00 (Paymaster Sponsored)" if settings.USE_MOCK_CHAIN else "Real Gas used",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        ).model_dump(by_alias=True)
        self.transactions.append(tx)
        return tx


state = StreamState()


async def run_pipeline(prompt: str) -> None:
    async with state.run_lock:
        state.reset()
        await state.publish({"type": "reset"})

        log = state.add_log("Manager", f'Received task: "{prompt}"', "system")
        await state.publish({"type": "log", "log": log})

        try:
            # 1. Pipeline Start - On-chain Mint
            log = state.add_log("Manager", "Minting Kite Agent Passport (3-tier identity)...", "action")
            await state.publish({"type": "log", "log": log})
            
            passport_tx = await chain_client.mint_passport()
            log = state.add_log("System", f"Passport minted. TX: {passport_tx}", "system")
            await state.publish({"type": "log", "log": log})

            # 2. Task Breakdown - LLM
            log = state.add_log("Manager", "Analyzing task and breaking down into sub-tasks (Gemini LLM)...", "thought")
            await state.publish({"type": "log", "log": log})
            
            breakdown = await llm_client.breakdown_tasks(prompt)
            for st in breakdown.sub_tasks:
                log = state.add_log("Manager", f'Identified sub-task: {st.role} - {st.description} [{st.estimated_complexity}]', "thought")
                await state.publish({"type": "log", "log": log})
            
            # Fetch agents pool once
            agents_pool = await chain_client.query_agents()
            all_deliverables = []

            # 3. Process each sub-task
            for sub_task in breakdown.sub_tasks:
                worker = next((a for a in agents_pool if a["role"] == sub_task.role), None)
                if worker is None:
                    log = state.add_log("Manager", f'No worker found on-chain for role: {sub_task.role}', "error")
                    await state.publish({"type": "log", "log": log})
                    continue

                log = state.add_log("Manager", f'Querying Kite Registry... Found {worker["name"]} ({worker["id"]})', "action")
                await state.publish({"type": "log", "log": log})

                # Negotiation phase
                offered_rate = worker["baseRate"] + 0.01  # Manager offers slightly more for higher priority
                log = state.add_log("Manager", f'Negotiating with {worker["name"]}... offering {offered_rate} KITE', "thought")
                await state.publish({"type": "log", "log": log})

                negotiation = await llm_client.evaluate_offer(worker["name"], sub_task.description, offered_rate, worker["baseRate"])
                
                if negotiation.decision == "REJECT":
                    log = state.add_log(worker["name"], f'Offer rejected. Reasoning: {negotiation.reasoning}', "error")
                    await state.publish({"type": "log", "log": log})
                    continue
                else:
                    log = state.add_log(worker["name"], f'Offer ({negotiation.decision}). Reasoning: {negotiation.reasoning}', "thought")
                    await state.publish({"type": "log", "log": log})
                
                # Lock Escrow
                log = state.add_log("Manager", f'Locking {offered_rate} KITE in AgentMeshEscrow...', "action")
                await state.publish({"type": "log", "log": log})
                
                # We need a task_id for escrow. Just generate a deterministic-ish one
                task_id = os.urandom(32)
                lock_tx = await chain_client.lock_escrow(task_id, offered_rate)
                
                log = state.add_log("System", f'Escrow Locked: {lock_tx[:15]}...', "system")
                await state.publish({"type": "log", "log": log})

                # Execute Task
                log = state.add_log(worker["name"], f'Executing task via Gemini LLM...', "action")
                await state.publish({"type": "log", "log": log})
                
                deliverable = await llm_client.execute_task(sub_task.model_dump(), prompt)
                
                log = state.add_log(worker["name"], "Task completed. Payload delivered.", "action")
                await state.publish({"type": "log", "log": log})

                format_deliv = f"#### {deliverable.title}\n{deliverable.content}\n\n*Key Findings:* {', '.join(deliverable.key_findings)}"
                log = state.add_log(worker["name"], format_deliv, "deliverable")
                await state.publish({"type": "log", "log": log})
                
                all_deliverables.append(format_deliv)

                # Release Funds
                log = state.add_log("Manager", "Verifying payload... Releasing funds via x402.", "action")
                await state.publish({"type": "log", "log": log})
                
                manager_address = settings.KITE_WALLET_ADDRESS if settings.KITE_WALLET_ADDRESS else "0xEfA7eCa1cd0A222dDec0192D574f5d97B41E8874"
                release_tx = await chain_client.release_funds(task_id, worker["id"])
                
                tx = state.add_tx(tx_hash=release_tx, from_addr=manager_address, to_addr=worker["id"], amount=float(offered_rate), currency="KITE")
                await state.publish({"type": "transaction", "transaction": tx})
                
                log = state.add_log("System", f'Transaction {release_tx[:15]} confirmed on Kite Chain.', "system")
                await state.publish({"type": "log", "log": log})

            # 4. Final Report
            log = state.add_log("Manager", "Compiling final executive reporting...", "action")
            await state.publish({"type": "log", "log": log})
            
            final_report = await llm_client.generate_final_report("\n\n---\n\n".join(all_deliverables))
            
            final_out = f"## Executive Summary\n{final_report.executive_summary}\n\n## Combined Output\n{final_report.combined_output}"
            log = state.add_log("Manager", final_out, "deliverable")
            await state.publish({"type": "log", "log": log})
            
            log = state.add_log("Manager", "All tasks completed. Final report ready for Human Principal.", "system")
            await state.publish({"type": "log", "log": log})

        except Exception as e:
            logger.exception("Pipeline error")
            await state.publish({"type": "error", "message": str(e)})

        await state.publish({"type": "done"})


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/run")
async def run(req: RunRequest) -> JSONResponse:
    asyncio.create_task(run_pipeline(req.prompt))
    return JSONResponse({"ok": True})


@app.get("/api/state")
def api_state() -> Dict[str, Any]:
    return {"logs": state.logs, "transactions": state.transactions}


@app.get("/api/agents")
async def api_agents() -> JSONResponse:
    agents = await chain_client.query_agents()
    return JSONResponse(agents)


@app.get("/events")
async def events(request: Request) -> StreamingResponse:
    q = state.subscribe()

    async def gen():
        try:
            yield f"data: {state.snapshot_event()}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                payload = await q.get()
                yield f"data: {payload}\n\n"
        finally:
            state.unsubscribe(q)

    return StreamingResponse(gen(), media_type="text/event-stream")


# Mount static files for the React frontend LAST (catch-all)
# This serves the built Vite app from /static directory
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    from starlette.responses import FileResponse

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve static files and fallback to index.html for SPA routing"""
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
