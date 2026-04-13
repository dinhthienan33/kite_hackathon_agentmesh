// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract AgentPassport {
    uint256 public nextTokenId;
    event Minted(address indexed agent, uint256 indexed tokenId);
    
    function mint() external {
        emit Minted(msg.sender, nextTokenId);
        nextTokenId++;
    }
}
