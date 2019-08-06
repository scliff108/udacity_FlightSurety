pragma solidity ^0.5.10;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20; // This is when payment process is triggered
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // Insurace Constants
    uint256 AIRLINE_REGISTRATION_FEE = 10 ether;
    uint256 MAX_INSURANCE_PLAN = 1 ether;
    uint256 INSURANCE_PAYOUT = 150; // Must divide by 100 to get percentage payout

    // Airline Registration Helpers
    uint256 AIRLINE_VOTING_THRESHOLD = 4;
    uint256 AIRLINE_REGISTRATION_REQUIRED_VOTES = 2;

    // Account used to deploy contract
    address private contractOwner;

    // Contract Operational
    bool private operational = true;

    // Airlines
    struct PendingAirline {
        bool isRegistered;
        bool isFunded;
    }

    mapping(address => address[]) public pendingAirlines;

    FlightSuretyData flightSuretyData;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address payable fSData) public {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(fSData);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires an Airline is not registered yet
    */
    modifier requireAirlineIsNotRegistered(address airline) {
        require(!flightSuretyData.isAirlineRegistered(airline), "Airline is already registered.");
        _;
    }

    /**
    * @dev Modifier that requires an Airline is not funded yet
    */
    modifier requireAirlineIsNotFunded(address airline) {
        require(!flightSuretyData.isAirlineFunded(airline), "Airline is already funded.");
        _;
    }

    /**
    * @dev Modifier that requires an Flight is not registered yet
    */
    modifier requireFlightIsNotRegistered(bytes32 flightKey) {
        require(!flightSuretyData.isFlightRegistered(flightKey), "Flight is already registered.");
        _;
    }


    /**
    * @dev Modifier that requires an Airline to be registered
    */
    modifier requireIsAirlineRegistered(address airline) {
        require(flightSuretyData.isAirlineRegistered(airline), "Airline is not registered.");
        _;
    }

    /**
    * @dev Modifier that requires an Airline to be funded
    */
    modifier requireIsAirlineFunded(address airline) {
        require(flightSuretyData.isAirlineFunded(airline), "Airline is not funded.");
        _;
    }

    /**
     * @dev Modifier that requires sufficient funding to fund an airline
     */
    modifier requireSufficientFunding(uint256 amount) {
        require(msg.value >= amount, "Insufficient Funds.");
        _;
    }

    /**
     * @dev Modifier that returns change after airline is funded
     */
    modifier calculateRefund() {
        _;
        uint refund = msg.value - AIRLINE_REGISTRATION_FEE;
        msg.sender.transfer(refund);
    }

    modifier requireFlightIsRegistered(bytes32 flightKey) {
        require(flightSuretyData.isFlightRegistered(flightKey), "Flight is not registered.");
        _;
    }

    modifier requireFlightIsNotLanded(bytes32 flightKey) {
        require(!flightSuretyData.isFlightLanded(flightKey), "Flight has already landed");
        _;
    }

    modifier requirePassengerNotInsuredForFlight(bytes32 flightKey, address passenger) {
        require(!flightSuretyData.isPassengerInsuredForFlight(flightKey, passenger), "Passenger is already insured for flight");
        _;
    }

    modifier requireLessThanMaxInsurance() {
        require(msg.value <= MAX_INSURANCE_PLAN, "Value exceeds max insurance plan.");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Check if the contract is operational
     */
    function isOperational() public view requireContractOwner returns(bool) {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    * @return Success/Failure, Votes cast for airline, current member count
    */
    function registerAirline(address airline)
        external
        requireIsOperational
        requireAirlineIsNotRegistered(airline) // Airline is not registered yet
        requireIsAirlineFunded(msg.sender) // Voter is a funded airline
        returns(bool success, uint256 votes, uint256 registeredAirlineCount)
    {
        // If less than required minimum airlines for voting process
        if (flightSuretyData.getRegisteredAirlineCount() <= AIRLINE_VOTING_THRESHOLD) {
            flightSuretyData.registerAirline(airline, msg.sender);
            return(success, 0, flightSuretyData.getRegisteredAirlineCount());
        } else {
            // Check for duplicates
            bool isDuplicate = false;
            for (uint256 i = 0; i < pendingAirlines[airline].length; i++) {
                if (pendingAirlines[airline][i] == msg.sender) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Duplicate vote, you cannot vote for the same airline twice.");
            pendingAirlines[airline].push(msg.sender);
            // Check if enough votes to register airline
            if (pendingAirlines[airline].length >= flightSuretyData.getRegisteredAirlineCount().div(AIRLINE_REGISTRATION_REQUIRED_VOTES)) {
                flightSuretyData.registerAirline(airline, msg.sender);
                return(true, pendingAirlines[airline].length, flightSuretyData.getRegisteredAirlineCount());
            }
            return(false, pendingAirlines[airline].length, flightSuretyData.getRegisteredAirlineCount());
        }
    }

    /**
     * @dev Fund a registered airline
     */
    function fundAirline()
        external
        payable
        requireIsOperational
        requireIsAirlineRegistered(msg.sender)
        requireAirlineIsNotFunded(msg.sender)
        requireSufficientFunding(AIRLINE_REGISTRATION_FEE)
        returns(bool)
    {
        address(uint160(address(flightSuretyData))).transfer(AIRLINE_REGISTRATION_FEE);
        return flightSuretyData.fundAirline(msg.sender, AIRLINE_REGISTRATION_FEE);
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight
    (
        string calldata flightNumber,
        uint256 timestamp,
        string calldata departureLocation,
        string calldata arrivalLocation
    )
        external
        requireIsOperational
        requireIsAirlineFunded(msg.sender)
    {
        bytes32 flightKey = getFlightKey(msg.sender, flightNumber, timestamp);
        flightSuretyData.registerFlight(
            flightKey,
            timestamp,
            msg.sender,
            flightNumber,
            departureLocation,
            arrivalLocation
        );
    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    )
        internal
        requireIsOperational
    {
        flightSuretyData.processFlightStatus(airline, flight, timestamp, statusCode);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
    (
        address airline,
        string calldata flight,
        uint256 timestamp,
        bytes32 flightKey
    )
        external
        requireFlightIsRegistered(flightKey)
        requireFlightIsNotLanded(flightKey)
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({requester: msg.sender, isOpen: true});

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function buyInsurance
    (
        bytes32 flightKey
    )
        public
        payable
        requireIsOperational
        requireFlightIsRegistered(flightKey)
        requireFlightIsNotLanded(flightKey)
        requirePassengerNotInsuredForFlight(flightKey, msg.sender)
        requireLessThanMaxInsurance()
    {
        address(uint160(address(flightSuretyData))).transfer(msg.value);
        flightSuretyData.buyInsurance(flightKey, msg.sender, msg.value, INSURANCE_PAYOUT);
    }

    function pay() external requireIsOperational {
        flightSuretyData.pay(msg.sender);
    }



    /********************************************************************************************/
    /*                                     ORACLE MANAGEMENT                                    */
    /********************************************************************************************/

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        // Account that requested status
        address requester;
        // If open, oracle responses are accepted
        bool isOpen;
        // Mapping key is the status code reported
        mapping(uint8 => address[]) responses;
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);
    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);
    event OracleRegistered(address oracle);
    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});

        emit OracleRegistered(msg.sender);
    }

    function getMyIndexes() external view returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    /* Called by oracle when a response is available to an outstanding request
     * For the response to be accepted, there must be a pending request that is open
     * and matches one of the three Indexes randomly assigned to the oracle at the
     * time of registration (i.e. uninvited oracles are not welcome)
     */
    function submitOracleResponse(uint8 index, address airline, string calldata flight, uint256 timestamp, uint8 statusCode) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
            (oracles[msg.sender].indexes[1] == index) ||
            (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns(uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    function () external payable {
    }

}

contract FlightSuretyData {
    function isOperational() public view returns(bool);
    function setOperatingStatus(bool mode) external;
    function isAirlineRegistered(address airline) public view returns(bool);
    function isAirlineFunded(address airline) public view returns(bool);
    function isFlightRegistered(bytes32 flightKey) public view returns(bool);
    function isFlightLanded(bytes32 flightKey) public view returns(bool);
    function isPassengerInsuredForFlight(bytes32 flightKey, address passenger) public view returns(bool);
    function registerAirline(address newAirline, address registeringAirline) external;
    function fundAirline(address airline, uint256 amount) external returns(bool);
    function getRegisteredAirlineCount() public view returns(uint256);
    function getFundedAirlineCount() public view returns(uint256);
    function registerFlight
    (
        bytes32 flightKey,
        uint256 timestamp,
        address airline,
        string memory flightNumber,
        string memory departureLocation,
        string memory arrivalLocation
    )
        public
        payable;
    function getCountRegisteredFlights() public view returns(uint256);
    function processFlightStatus(address airline, string calldata flight, uint256 timestamp, uint8 statusCode) external;
    function buyInsurance(bytes32 flightKey, address passenger, uint256 amount, uint256 payout) external payable;
    function creditInsurees(bytes32 flightKey) internal;
    function pay(address payable payoutAddress) external;
    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32);
    function fund() public payable;
}
