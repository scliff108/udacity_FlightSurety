pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    // Airlines
    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 funds;
    }
    uint256 registeredAirlineCount = 0;
    uint256 fundedAirlineCount = 0;
    mapping(address => Airline) public airlines;

    // Flights
    struct Flight {
        bool isRegistered;
        address airline;
        uint8 statusCode;
        uint256 timeOfCreation;
        uint256 timeOfDeparture;
    }
    mapping(bytes32 => Flight) private flights;

    // Insurance Claims
    struct InsuranceClaim {
        address passenger;
        bytes32 flight;
        uint256 payoutAmount;
        uint256 payoutPercentage;
        bool credited;
    }

    // Flight Insurance Claims
    mapping(bytes32 => InsuranceClaim[]) private flightInsuranceClaims;

    // Passenger Insurance Claims
    mapping(address => InsuranceClaim[]) private passengerInsuranceClaims;

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address airlineAddress) public {
        contractOwner = msg.sender;
        airlines[airlineAddress] = Airline(true, false, 0);
    }
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    // Delinquent Airline (Cannot pay insurance claim)
    event airlineRegistered(address airline);
    event airlineFunded(address airline);

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

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool) {
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
    * @dev Check if airline is registered
    * @return Airline Registered (true/false)
    */
    function isAirlineRegistered(address airline) public view returns(bool) {
        return airlines[airline].isRegistered;
    }

    /**
    * @dev Check if airline is funded
    * @return Airline Funded (true/false)
    */
    function isAirlineFunded(address airline) public view returns(bool) {
        return airlines[airline].isFunded;
    }

    /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    */
    function registerAirline(
        address newAirline,
        address registeringAirline
    )
        external
        requireIsOperational
    {
        // Voting handled in FlightSuretyApp
        airlines[newAirline] = Airline(true, false, 0);
        registeredAirlineCount.add(1);
        emit airlineRegistered(newAirline);
    }

    /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    */
    function fundAirline(address airline) private requireIsOperational {
        // Money handled in FlightSuretyApp
        airlines[airline].isFunded = true;
        fundedAirlineCount.add(1);
        emit airlineFunded(airline);
    }

    /**
     * @dev Get the number of airlines already registered
     * @return Number of registered airlines
     */
    function getRegisteredAirlineCount() external returns(uint256) {
        return registeredAirlineCount;
    }

   /**
    * @dev Buy insurance for a flight
    */
    function buyInsurance(bytes32 flightKey, address passenger, uint256 amount, uint256 payout) external payable {
        // TODO
    }

    /**
    *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure{
        // TODO
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
    */
    function pay(address payoutAddress) external {
        // TODO
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function fund() public payable {

    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable {
        fund();
    }

}

