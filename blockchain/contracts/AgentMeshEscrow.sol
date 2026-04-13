// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract AgentMeshEscrow {
    mapping(bytes32 => uint256) public escrows;
    event Locked(bytes32 indexed taskId, uint256 amount);
    event Released(bytes32 indexed taskId, address to, uint256 amount);
    
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        require(msg.value <= 10 ether, "Exceeds spend limit");
        balances[msg.sender] += msg.value;
    }
    
    function lock(bytes32 taskId, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient deposit");
        balances[msg.sender] -= amount;
        escrows[taskId] = amount;
        emit Locked(taskId, amount);
    }
    
    function releaseFunds(bytes32 taskId, address to) external {
        uint256 amount = escrows[taskId];
        require(amount > 0, "No funds locked");
        escrows[taskId] = 0;
        payable(to).transfer(amount);
        emit Released(taskId, to, amount);
    }
}
