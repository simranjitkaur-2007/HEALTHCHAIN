// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title InsuranceClaim
/// @notice Records insurance claim submissions and decisions as immutable audit trail
contract InsuranceClaim {
    address public owner;

    struct Claim {
        string patientId;     // PAT-XXXXXX
        string treatmentId;   // UUID from Supabase
        uint256 amount;       // Claimed amount in paise (1 INR = 100 paise)
        bool approved;        // true = approved, false = rejected
        bool resolved;        // has a decision been made?
        uint256 submittedAt;  // Unix timestamp of submission
        uint256 resolvedAt;   // Unix timestamp of resolution (0 if pending)
    }

    uint256 public claimCounter;
    mapping(uint256 => Claim) public claims;                          // claimId => Claim
    mapping(string => uint256[]) public patientClaims;               // patientId => claimIds

    event ClaimSubmitted(uint256 indexed claimId, string patientId, uint256 amount, uint256 timestamp);
    event ClaimResolved(uint256 indexed claimId, bool approved, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Submit a new insurance claim — returns the claimId
    function submitClaim(
        string calldata patientId,
        string calldata treatmentId,
        uint256 amount
    ) external returns (uint256) {
        claimCounter++;
        claims[claimCounter] = Claim({
            patientId: patientId,
            treatmentId: treatmentId,
            amount: amount,
            approved: false,
            resolved: false,
            submittedAt: block.timestamp,
            resolvedAt: 0
        });
        patientClaims[patientId].push(claimCounter);
        emit ClaimSubmitted(claimCounter, patientId, amount, block.timestamp);
        return claimCounter;
    }

    /// @notice Resolve a claim (approve or reject) — only owner (insurer backend wallet)
    function resolveClaim(uint256 claimId, bool approved) external onlyOwner {
        require(claimId <= claimCounter, "Claim does not exist");
        require(!claims[claimId].resolved, "Claim already resolved");
        claims[claimId].approved = approved;
        claims[claimId].resolved = true;
        claims[claimId].resolvedAt = block.timestamp;
        emit ClaimResolved(claimId, approved, block.timestamp);
    }

    /// @notice Get claim details
    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }

    /// @notice Get all claim IDs for a patient
    function getPatientClaims(string calldata patientId)
        external
        view
        returns (uint256[] memory)
    {
        return patientClaims[patientId];
    }
}
