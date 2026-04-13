// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract AgentRegistry {
    struct Registration {
        string role;
        uint256 baseRate;
    }
    mapping(address => Registration) public agents;
    event Registered(address indexed agent, string role, uint256 baseRate);
    
    function registerWorker(string calldata role, uint256 baseRate) external {
        agents[msg.sender] = Registration(role, baseRate);
        emit Registered(msg.sender, role, baseRate);
    }
}
