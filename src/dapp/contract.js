import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
    }
    
    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    setOperatingStatus(mode, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .setOperatingStatus(mode)
            .send({from:self.owner})
                .then(console.log);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    registerAirline(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: this.airlines[0]}, callback)
                .then(console.log);
    }

    fundAirline(amount, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fundAirline()
            .send({from: this.airlines[0], value: this.web3.utils.toWei(amount, 'ether')})
                .then(console.log);
    }

    registerFlight(flightNumber, callback) {
        let self = this;
        let departure = Math.floor(Date.now() / 1000);
        console.log(departure);
        self.flightSuretyApp.methods
            .registerFlight(flightNumber, departure)
            .send({from: this.airlines[0], gas: 999999999})
                .then(console.log);
    }

    getRegisteredFlights() {
        let self = this;
        self.flightSuretyApp.methods
            .getRegisteredFlights()
            .call((error, flights) => {
                self.flights = [];
                if (error) {
                    console.log(error);
                } else {
                    for (let i = 0; i < flights.length; i++) {
                        self.flightSuretyData.methods.
                            flights(flights[i]).call(function(error, flight) {
                                if (error) {
                                    return error;
                                } else {
                                    self.flights.push(flight);
                                }
                            });
                    }
                }
            });
    }

    getFlightInformation(flight, callback) {
        let self = this;
        self.flightSuretyData.methods.flights(flight).call((error, flightInfo) => {
            callback(error, flightInfo);
        });
    }
}