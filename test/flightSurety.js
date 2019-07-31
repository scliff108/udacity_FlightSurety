var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    //await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSuretyData.getRegisteredAirlineCount();
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
  });

  it('(airline) cannot register a Flight using registerFlight() if it is not funded', async () => {
    
    // ARRANGE
    let flightName = "TEST FLIGHT";
    let departureTime = Date.now();
    let destination = "Djibouti, Djibouti"
    let flightKey = "";

    // ACT
    try {
        flightKey = await config.flightSuretyApp.registerFlight(flightName, departureTime, destination, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isFlightRegistered.call(web3.utils.toHex(flightKey));

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
  });

  // Can register an airline
  // Can only register airline once (cannot register twice)
  // Can fund an airline
  // Can register a flight
  // Can buy insurance for a flight
  // Can calculate refund
  // Can issue refund
  // Can withdraw refund
  // No refund if flight on time
  // No refund if flight late for weather
  // No refund if flight late for technical
  // No refund if flight late for other reason


  // MULTIPARTY CONSENSUS
  // Registering 5th airline requires voting process
  // Airline not registered if insufficient votes
  // Can register airline through voting porocess
});
