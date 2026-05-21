import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path)

class Settings:
    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Blockchain Settings
    KITE_PRIVATE_KEY: str = os.getenv("KITE_PRIVATE_KEY", "")
    KITE_WALLET_ADDRESS: str = os.getenv("KITE_WALLET_ADDRESS", "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
    KITE_RPC_URL: str = os.getenv("KITE_RPC_URL", "https://rpc-testnet.gokite.ai")
    KITE_CHAIN_ID: int = int(os.getenv("KITE_CHAIN_ID", "2368"))

    # Contract Addresses
    AGENT_PASSPORT_ADDRESS: str = os.getenv("AGENT_PASSPORT_ADDRESS", "")
    AGENT_REGISTRY_ADDRESS: str = os.getenv("AGENT_REGISTRY_ADDRESS", "")
    AGENT_ESCROW_ADDRESS: str = os.getenv("AGENT_ESCROW_ADDRESS", "")

    # Feature Toggles
    USE_MOCK_CHAIN: bool = os.getenv("USE_MOCK_CHAIN", "false").lower() == "true"

settings = Settings()
