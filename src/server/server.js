import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
require('babel-polyfill');


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
const accounts = web3.eth.getAccounts();
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
let oracles = [];

async function registerOracles() {
  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  let accts = await accounts;
  let numberOfOracles = config.numOracles;
  if (accts.length < config.numOracles) {
    numberOfOracles = accts.length;
  }

  for (var i = 0; i < numberOfOracles; i++) {
    oracles.push(accts[i]);
    await flightSuretyApp.methods.registerOracle().send({
      from: accts[i],
      value: fee,
      gas: 999999999
    });
  }
}

async function submitOracleResponse(airline, flight, timestamp) {
  for (var i = 0; i < oracles.length; i++) {
    var statusCode = (Math.floor(Math.random() * Math.floor(4)) + 1) * 10 + 10;
    var indexes = await flightSuretyApp.methods.getMyIndexes().call({from: oracles[i]});
    for (var j = 0; j < indexes.length; j++) {
      try {
        await flightSuretyApp.methods.submitOracleResponse(
          indexes[j], airline, flight, timestamp, statusCode
        ).send({from: oracles[i], gas: 999999999});
      } catch(e) {
        // console.log(e);
      }
    }
  }
}

async function listenForEvents() {

  /****************************************************************
   ****************** FLIGHT SURETY APP EVENTS *******************
   ****************************************************************/
  flightSuretyApp.events.FlightStatusInfo({}, (error, event) => {
    logEvent(error, event, "FLIGHT STATUS REPORT");
  });

  flightSuretyApp.events.OracleReport({}, (error, event) => {
    logEvent(error, event, "ORACLE REPORT");
  });

  flightSuretyApp.events.OracleRegistered({}, (error, event) => {
    logEvent(error, event, "ORACLE REGISTERED");
  });

  flightSuretyApp.events.OracleRequest({}, async (error, event)  => {
    logEvent(error, event, "ORACLE REQUEST");
    if (!error) {
      await submitOracleResponse(
        event.returnValues[1], // airline
        event.returnValues[2], // flight
        event.returnValues[3] // timestamp
      );
    }
  });

  /****************************************************************
   ****************** FLIGHT SURETY DATA EVENTS *******************
   ****************************************************************/
  flightSuretyData.events.AirlineRegistered({}, (error, event) => {
    logEvent(error, event, "AIRLINE REGISTERED");
  });

  flightSuretyData.events.AirlineFunded({}, (error, event) => {
    logEvent(error, event, "AIRLINE FUNDED");
  });

  flightSuretyData.events.FlightRegistered({}, (error, event) => {
    logEvent(error, event, "FLIGHT REGISTERED");
  });

  flightSuretyData.events.ProcessedFlightStatus({}, (error, event) => {
    logEvent(error, event, "PROCESSED FLIGHT STATUS");
  });

  flightSuretyData.events.FlightStatusUnknown({}, (error, event) => {
    logEvent(error, event, "FLIGHT STATUS UNKNOWN");
  });

  flightSuretyData.events.PassengerInsured({}, (error, event) => {
    logEvent(error, event, "PASSENGER INSURED");
  });

  flightSuretyData.events.InsureeCredited({}, (error, event) => {
    logEvent(error, event, "INSUREE CREDITED");
  });

  flightSuretyData.events.FlightStatusUpdating({}, (error, event) => {
    logEvent(error, event, "FLIGHT STATUS UPDATING");
  });

  flightSuretyData.events.PayInsuree({}, (error, event) => {
    logEvent(error, event, "PAY INSUREE");
  });
}

function logEvent(error, event, title) {
  if (error) console.log(error);
  else {
    console.log('----- EVENT -----');
    console.log(title);
    console.log(event.returnValues);
    console.log('-----------------');
  }
}

registerOracles();
listenForEvents();

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;
