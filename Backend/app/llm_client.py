import os
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger(__name__)

# --- Pydantic Schemas for Structured JSON Output ---

class SubTask(BaseModel):
    role: str = Field(description="The assigned role. Must be 'Researcher' or 'Designer'.")
    description: str = Field(description="Detailed description of the actionable task for this role.")
    estimated_complexity: str = Field(description="low, medium, or high")

class TaskBreakdown(BaseModel):
    analysis: str = Field(description="A brief reasoning of why these tasks were chosen.")
    sub_tasks: list[SubTask] = Field(description="List of exact tasks that the agents need to execute.")

class NegotiationResponse(BaseModel):
    decision: str = Field(description="ACCEPT, COUNTER, or REJECT")
    reasoning: str = Field(description="Why the agent made this decision based on their base rate.")

class Deliverable(BaseModel):
    title: str
    content: str
    key_findings: list[str] = Field(default_factory=list)

class FinalReport(BaseModel):
    executive_summary: str
    combined_output: str

# --- Gemini Client Wrapper ---

class GeminiClient:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set. LLM calls will fail.")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        # Using a fast model capable of structured outputs
        self.model = "gemini-2.5-flash"

    async def breakdown_tasks(self, prompt: str) -> TaskBreakdown:
        system_instruction = (
            "You are the Manager Agent. Break down the user's prompt into exactly 2 actionable sub-tasks. "
            "Assign one task to a 'Researcher' and one to a 'Designer'. "
            "Return structured JSON matching the TaskBreakdown schema."
        )
        # Use sync method in thread pool or async if available. google-genai supports async via client.aio
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=[prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=TaskBreakdown,
            ),
        )
        # The generated structured object is available because we use response_schema
        # If response.parsed exists use it, else parse from response.text
        return TaskBreakdown.model_validate_json(response.text)

    async def evaluate_offer(self, worker_name: str, task_desc: str, rate: float, base_rate: float) -> NegotiationResponse:
        system_instruction = (
            f"You are {worker_name}. You have been offered {rate} USDC to complete: {task_desc}. "
            f"Your minimum acceptable base rate is {base_rate} USDC. "
            "If the offer is >= base rate, you MUST accept. Otherwise, counter or reject."
        )
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=["Evaluate this offer and provide your decision."],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=NegotiationResponse,
            ),
        )
        return NegotiationResponse.model_validate_json(response.text)

    async def execute_task(self, sub_task: dict, prompt: str) -> Deliverable:
        system_instruction = (
            f"You are a specialized AI ({sub_task.get('role', 'Agent')}). "
            f"Your job is to generate a comprehensive deliverable based on the original prompt: '{prompt}'. "
            f"Focus entirely on fulfilling this specific sub-task goal: {sub_task.get('description', '')}."
        )
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=["Execute your assigned task. Be thorough, creative, and professional."],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=Deliverable,
            ),
        )
        return Deliverable.model_validate_json(response.text)

    async def generate_final_report(self, deliverables_text: str) -> FinalReport:
        system_instruction = (
            "You are the Manager Agent. You have received completed deliverables from your worker agents. "
            "Synthesize them into a final executive report for the Human Principal."
        )
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=[f"Synthesize the following deliverables:\n\n{deliverables_text}"],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=FinalReport,
            ),
        )
        return FinalReport.model_validate_json(response.text)

    async def execute_kite_payment(self, amount: float, recipient: str, reason: str) -> dict:
        """
        Kite Agent Passport MCP Tool equivalent.
        This provides the AI agent with the ability to call kite.pay(...) by proxying
        the request to the Node.js AA Microservice.
        """
        import httpx
        
        logger.info(f"Agent executing Kite payment of {amount} to {recipient} for '{reason}'")
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post("http://localhost:3000/api/kite/gasless/transfer", json={
                    "value": str(amount),
                    "to": recipient,
                    "reason": reason
                })
                return res.json()
        except Exception as e:
            logger.error(f"Kite Payment Execution failed: {e}")
            return {"success": False, "error": str(e)}

llm_client = GeminiClient()
