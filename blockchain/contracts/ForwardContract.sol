// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ForwardContract {
    struct Contract {
        uint256 id;
        address farmer;
        address buyer;
        string crop;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 totalValue;
        uint256 expiryDate;
        bool executed;
        bool cancelled;
        uint256 createdAt;
    }
    
    mapping(uint256 => Contract) public contracts;
    uint256 public contractCount;
    
    event ContractCreated(
        uint256 indexed contractId,
        address indexed farmer,
        string crop,
        uint256 quantity,
        uint256 pricePerUnit
    );
    
    event ContractExecuted(uint256 indexed contractId, address indexed buyer);
    event ContractCancelled(uint256 indexed contractId);
    
    // Create a new forward contract
    function createForwardContract(
        string memory _crop,
        uint256 _quantity,
        uint256 _pricePerUnit,
        uint256 _expiryDate
    ) public returns (uint256) {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_pricePerUnit > 0, "Price must be greater than 0");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        
        contractCount++;
        uint256 totalValue = _quantity * _pricePerUnit;
        
        contracts[contractCount] = Contract({
            id: contractCount,
            farmer: msg.sender,
            buyer: address(0),
            crop: _crop,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            totalValue: totalValue,
            expiryDate: _expiryDate,
            executed: false,
            cancelled: false,
            createdAt: block.timestamp
        });
        
        emit ContractCreated(contractCount, msg.sender, _crop, _quantity, _pricePerUnit);
        return contractCount;
    }
    
    // Execute contract (buyer accepts)
    function executeContract(uint256 _contractId) public payable {
        Contract storage c = contracts[_contractId];
        
        require(!c.executed, "Contract already executed");
        require(!c.cancelled, "Contract is cancelled");
        require(block.timestamp <= c.expiryDate, "Contract expired");
        require(msg.value >= c.totalValue, "Insufficient payment");
        
        c.buyer = msg.sender;
        c.executed = true;
        
        // Transfer funds to farmer
        payable(c.farmer).transfer(c.totalValue);
        
        // Refund excess payment
        if (msg.value > c.totalValue) {
            payable(msg.sender).transfer(msg.value - c.totalValue);
        }
        
        emit ContractExecuted(_contractId, msg.sender);
    }
    
    // Cancel contract (only farmer, before execution)
    function cancelContract(uint256 _contractId) public {
        Contract storage c = contracts[_contractId];
        
        require(msg.sender == c.farmer, "Only farmer can cancel");
        require(!c.executed, "Cannot cancel executed contract");
        require(!c.cancelled, "Already cancelled");
        
        c.cancelled = true;
        emit ContractCancelled(_contractId);
    }
    
    // Get contract details
    function getContract(uint256 _contractId) public view returns (
        address farmer,
        address buyer,
        string memory crop,
        uint256 quantity,
        uint256 pricePerUnit,
        uint256 totalValue,
        uint256 expiryDate,
        bool executed,
        bool cancelled
    ) {
        Contract memory c = contracts[_contractId];
        return (
            c.farmer,
            c.buyer,
            c.crop,
            c.quantity,
            c.pricePerUnit,
            c.totalValue,
            c.expiryDate,
            c.executed,
            c.cancelled
        );
    }
    
    // Get all contracts for a farmer
    function getFarmerContracts(address _farmer) public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](contractCount);
        uint256 counter = 0;
        
        for (uint256 i = 1; i <= contractCount; i++) {
            if (contracts[i].farmer == _farmer) {
                result[counter] = i;
                counter++;
            }
        }
        
        // Resize array
        uint256[] memory farmerContracts = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            farmerContracts[i] = result[i];
        }
        
        return farmerContracts;
    }
}
