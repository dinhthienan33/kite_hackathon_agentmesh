import os
import json
import logging
from decimal import Decimal
from web3 import AsyncWeb3
from eth_account import Account

from app.config import settings

logger = logging.getLogger(__name__)

# Basic fallback ABIs if the artifacts are missing during mock development
FALLBACK_PASSPORT_ABI = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agent","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Minted","type":"event"},{"inputs":[],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"nextTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]'
FALLBACK_REGISTRY_ABI = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"agent","type":"address"},{"indexed":false,"internalType":"string","name":"role","type":"string"},{"indexed":false,"internalType":"uint256","name":"baseRate","type":"uint256"}],"name":"Registered","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"agents","outputs":[{"internalType":"string","name":"role","type":"string"},{"internalType":"uint256","name":"baseRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"role","type":"string"},{"internalType":"uint256","name":"baseRate","type":"uint256"}],"name":"registerWorker","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
FALLBACK_ESCROW_ABI = '[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"taskId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Locked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"taskId","type":"bytes32"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Released","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balances","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"taskId","type":"bytes32"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"lock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"taskId","type":"bytes32"},{"internalType":"address","name":"to","type":"address"}],"name":"releaseFunds","outputs":[],"stateMutability":"nonpayable","type":"function"}]'


class KiteChainClient:
    def __init__(self):
        self.use_mock = settings.USE_MOCK_CHAIN
        if self.use_mock:
            logger.info("Initializing KiteChainClient in MOCK mode.")
            return

        if not settings.KITE_PRIVATE_KEY:
            raise ValueError("KITE_PRIVATE_KEY is required when USE_MOCK_CHAIN=false")

        if not settings.AGENT_PASSPORT_ADDRESS or not settings.AGENT_REGISTRY_ADDRESS or not settings.AGENT_ESCROW_ADDRESS:
            raise ValueError("Smart contract addresses must be configured in .env when USE_MOCK_CHAIN=false (Have you run the deploy script?)")

        # Initialize Web3
        self.w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.KITE_RPC_URL))
        self.account = Account.from_key(settings.KITE_PRIVATE_KEY)
        self.chain_id = settings.KITE_CHAIN_ID
        
        # Initialize Contracts
        self.passport = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.AGENT_PASSPORT_ADDRESS) if settings.AGENT_PASSPORT_ADDRESS else None,
            abi=json.loads(FALLBACK_PASSPORT_ABI)
        )
        self.registry = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.AGENT_REGISTRY_ADDRESS) if settings.AGENT_REGISTRY_ADDRESS else None,
            abi=json.loads(FALLBACK_REGISTRY_ABI)
        )
        self.escrow = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.AGENT_ESCROW_ADDRESS) if settings.AGENT_ESCROW_ADDRESS else None,
            abi=json.loads(FALLBACK_ESCROW_ABI)
        )

    async def _send_transaction(self, tx_build) -> str:
        """Helper to sign and send a transaction"""
        nonce = await self.w3.eth.get_transaction_count(self.account.address)
        tx_build["nonce"] = nonce
        tx_build["chainId"] = self.chain_id
        
        # Estimate gas
        gas_estimate = await self.w3.eth.estimate_gas(tx_build)
        tx_build["gas"] = int(gas_estimate * 1.5)  # Add 50% buffer
        
        # We fetch the current gas price
        gas_price = await self.w3.eth.gas_price
        tx_build["gasPrice"] = gas_price
        
        signed_tx = self.w3.eth.account.sign_transaction(tx_build, private_key=self.account.key)
        tx_hash = await self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        # Wait for receipt
        receipt = await self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            raise Exception(f"Transaction failed: {receipt.transactionHash.hex()}")
            
        return tx_hash.hex()

    async def check_connection(self):
        if self.use_mock: return True
        return await self.w3.is_connected()

    async def mint_passport(self) -> str:
        if self.use_mock:
            return f"0xmock_passport_{os.urandom(4).hex()}"
            
        tx_build = await self.passport.functions.mint().build_transaction({
            'from': self.account.address
        })
        return await self._send_transaction(tx_build)

    async def query_agents(self) -> list:
        """Finds mocked agents for now, because Sol mapping iteration isn't supported trivially without events"""
        if self.use_mock:
            return [
                {"id": "0xEfA7eCa1cd0A222dDec0192D574f5d97B41E8874", "name": "PixelForge AI", "role": "Designer", "baseRate": 5.0},
                {"id": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "name": "DeepSearch AI", "role": "Researcher", "baseRate": 2.0},
            ]
        # In a real production system, you'd index 'Registered' events via The Graph or local DB.
        # Fallback to hardcoded addresses we deployed.
        return [
            {"id": "0xEfA7eCa1cd0A222dDec0192D574f5d97B41E8874", "name": "PixelForge AI", "role": "Designer", "baseRate": 5.0},
            {"id": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "name": "DeepSearch AI", "role": "Researcher", "baseRate": 2.0},
        ]

    async def lock_escrow(self, task_id: bytes, amount_usdc: float) -> str:
        if self.use_mock:
            return f"0xmock_lock_{os.urandom(4).hex()}"
        
        # Assuming KITE native token is deposited first, amounts in wei
        wei_amount = self.w3.to_wei(amount_usdc, 'ether')
        
        # If balance too low, deposit first (demo hack)
        current_balance = await self.escrow.functions.balances(self.account.address).call()
        if current_balance < wei_amount:
            dep_tx = await self.escrow.functions.deposit().build_transaction({
                'from': self.account.address,
                'value': wei_amount - current_balance
            })
            await self._send_transaction(dep_tx)

        tx_build = await self.escrow.functions.lock(task_id, wei_amount).build_transaction({
            'from': self.account.address
        })
        return await self._send_transaction(tx_build)

    async def release_funds(self, task_id: bytes, worker_address: str) -> str:
        if self.use_mock:
            return f"0xmock_release_{os.urandom(4).hex()}"
            
        worker_address_checksum = self.w3.to_checksum_address(worker_address)
        tx_build = await self.escrow.functions.releaseFunds(task_id, worker_address_checksum).build_transaction({
            'from': self.account.address
        })
        return await self._send_transaction(tx_build)

chain_client = KiteChainClient()
