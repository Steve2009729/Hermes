// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // BUG 1: REENTRANCY — ETH sent before balance updated
    // Attacker can call back into withdraw() before balance decrements
    // This is how the $60M DAO hack worked in 2016
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;  // TOO LATE — should come BEFORE the .call
    }

    // BUG 2: MISSING ACCESS CONTROL — anyone can drain the contract
    // No onlyOwner modifier — any wallet can call this and steal all funds
    function emergencyDrain() public {
        payable(msg.sender).transfer(address(this).balance);
    }

    // BUG 3: LOGIC ERROR — loop multiplies deposit incorrectly
    // msg.value is added count times instead of being split
    function batchDeposit(uint256 count) public payable {
        for (uint256 i = 0; i < count; i++) {
            balances[msg.sender] += msg.value;  // should be msg.value / count
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
