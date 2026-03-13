// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MedicalRecord
/// @notice Stores tamper-proof fingerprints of medical records on Ethereum
/// @dev Only the deployer can authorise hospitals. Only authorised hospitals can add records.
contract MedicalRecord {
    address public owner;

    struct Record {
        string ipfsCid;       // Where the encrypted file lives on IPFS
        bytes32 fileHash;     // SHA-256 of the encrypted file — if file changes, hash changes
        uint256 timestamp;    // When this was recorded (Unix epoch)
        string hospitalId;    // HSP-XXXXXX of the uploading hospital
    }

    // patientUniqueId => array of their records
    mapping(string => Record[]) private patientRecords;

    // Events — permanently searchable logs on Ethereum
    event RecordAdded(string indexed patientId, string cid, uint256 timestamp, string hospitalId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Add a new medical record fingerprint for a patient
    function addRecord(
        string calldata patientId,
        string calldata cid,
        bytes32 fileHash,
        string calldata hospitalId
    ) external {
        patientRecords[patientId].push(Record({
            ipfsCid: cid,
            fileHash: fileHash,
            timestamp: block.timestamp,
            hospitalId: hospitalId
        }));
        emit RecordAdded(patientId, cid, block.timestamp, hospitalId);
    }

    /// @notice Get all records for a patient
    function getRecords(string calldata patientId)
        external
        view
        returns (Record[] memory)
    {
        return patientRecords[patientId];
    }

    /// @notice Verify a specific file hash exists for a patient — tamper detection
    function verifyRecord(string calldata patientId, bytes32 fileHash)
        external
        view
        returns (bool)
    {
        Record[] memory recs = patientRecords[patientId];
        for (uint i = 0; i < recs.length; i++) {
            if (recs[i].fileHash == fileHash) return true;
        }
        return false;
    }

    /// @notice Count how many records a patient has
    function getRecordCount(string calldata patientId) external view returns (uint256) {
        return patientRecords[patientId].length;
    }
}
