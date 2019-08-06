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
        this.account = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
    }
    
    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];
            this.account = accts[1];

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
            .call({from: self.owner}, callback);
    }

    setOperatingStatus(mode, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .setOperatingStatus(mode)
            .send({from:self.owner})
                .then(console.log);
    }

    fetchFlightStatus(airline, flight, timestamp, flightKey, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fetchFlightStatus(airline, flight, timestamp, flightKey)
            .send({ from: self.owner}, (error, result) => {
                callback(error, result);
            });
    }

    registerAirline(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: this.account})
                .then(console.log);
    }

    fundAirline(amount, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fundAirline()
            .send({from: this.account, value: this.web3.utils.toWei(amount, 'ether')})
                .then(console.log);
    }

    registerFlight(flightNumber, departureLocation, arrivalLocation, callback) {
        let self = this;
        let timestamp = Math.floor(Date.now() / 1000);
        self.flightSuretyApp.methods
            .registerFlight(flightNumber, timestamp, departureLocation, arrivalLocation)
            .send({from: this.account, gas: 999999999})
                .then(console.log);
    }

    async getRegisteredFlights() {
        let self = this;
        let countRegisteredFlights = parseInt(await self.flightSuretyData.methods.getCountRegisteredFlights().call());
        self.flights = [];

        for (let i = 0; i < countRegisteredFlights; i++) {
            let flightKey = await self.flightSuretyData.methods.registeredFlights(i).call();
            let flight = await self.flightSuretyData.methods.flights(flightKey).call();
            self.flights.push(flight)
        }
        self.flights.sort((a,b) => (a.sStatusCode > b.sStatusCode) ? 1 : ((b.sStatusCode > a.sStatusCode) ? -1 : 0));
        return self.flights;
    }

    getFlightInformation(flightKey) {
        let self = this;
        self.flightSuretyData.methods.flights(flightKey).call().then(console.log);
    }

    buyInsurance(flightKey, amount) {
        let self = this;
        self.flightSuretyApp.methods.buyInsurance(flightKey)
            .send({from: this.account, value: this.web3.utils.toWei(amount, 'ether'), gas: 999999999}).then(console.log);
    }

    calculateBalance(callback) {
        let self = this;
        self.flightSuretyData.methods.withdrawableFunds(this.account).call(callback)
    }

    withdraw(callback) {
        let self = this;
        self.flightSuretyApp.methods.pay().send({from: this.account, gas: 999999999}, callback);
    }
}