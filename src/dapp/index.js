
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import { ContractModuleFactory } from 'web3-eth-contract';
let statuses = [
    ["Unknown", "light", "eye"],
    ["On Time", "success", "thumbs-up",], 
    ["Late - Airline", "danger", "dollar-sign",], 
    ["Late - Weather", "secondary", "cloud-lightning",], 
    ["Late - Technical", "warning", "alert-triangle",], 
    ["Late - Other", "info", "alert-circle"] 
];

(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        function getOperationalStatus(){
                contract.isOperational((error, result) => {
                    if (error) {
                        displayAlert('danger', 'Operational Status', error);
                    } else {
                        let status = DOM.elid("operational-status");
                            let i = document.createElement("i");
                        if (result == true) {
                            i.setAttribute("data-feather", "thumbs-up");
                        } else {
                            i.setAttribute("data-feather", "thumbs-down");
                        }
                        status.innerHTML = result + " ";
                        status.append(i);
                        feather.replace();
                    }
            });
        }
        getOperationalStatus();

        async function getFlights() {
            let flights = await contract.getRegisteredFlights();
            let flightsContainer = DOM.elid('flights-container');
            while (flightsContainer.hasChildNodes()) {
                flightsContainer.removeChild(flightsContainer.firstChild);
            }
            if (flights.length > 0) {
                flights.forEach(function(flight) {
                    addFlightCard(
                        flight.sFlightNumber,
                        flight.sFlightKey,
                        flight.sAirline,
                        flight.sDepartureLocation,
                        flight.sArrivalLocation,
                        flight.sStatusCode,
                        flight.sTimestamp
                    );
                });
            }
        }
        getFlights();

        function calculateBalance() {
            contract.calculateBalance((error, result) => {
                let withdrawableFunds = DOM.elid('withdrawable-funds');
                if (!error) {
                    let balance = contract.web3.utils.fromWei(result, 'ether');
                    if (balance) {
                        withdrawableFunds.innerHTML = "You have " + balance + " ether to withdraw.";
                    }
                }
            });
        }
        calculateBalance();

        DOM.elid('refresh-flights').addEventListener('click', () => {
            getFlights();
        });

        DOM.elid('get-operational').addEventListener('click', () => {
            getOperationalStatus();
            getFlights();
        });

        DOM.elid('toggle-operational').addEventListener('click', () => {
            contract.isOperational(async (error, result) => {
                if (!error) {
                    if (result) {
                        contract.setOperatingStatus(false);
                    } else if (!result) {
                        contract.setOperatingStatus(true);
                    }
                }
            });
            getOperationalStatus();
        });

        DOM.elid('refresh-funds').addEventListener('click', () => {
            calculateBalance();
        });

        DOM.elid('withdraw-funds').addEventListener('click', () => {
            contract.withdraw((error, result) => {
                if (error) {
                    console.log(error)
                } else {
                    console.log(result);
                }
            });
        });

        DOM.elid('register-airline').addEventListener('click', () => {
            let airline = DOM.elid('airline-address').value;
            if (airline) {
                contract.registerAirline(airline);
            }
        });

        DOM.elid('fund-airline').addEventListener('click', () => {
            let amount = DOM.elid('funding-amount').value;
            contract.fundAirline(amount);
        });

        DOM.elid('register-flight').addEventListener('click', async() => {
            let flightNumber = DOM.elid('flight-number').value;
            let departureLocation = DOM.elid('departure-location').value;
            let arrivalLocation = DOM.elid('arrival-location').value;
            contract.registerFlight(flightNumber, departureLocation, arrivalLocation);
        });
        
        function getFlightStatus(airline, flight, flightKey, flightTimeStamp) {
            // Write transaction
            contract.fetchFlightStatus(airline, flight, flightTimeStamp, flightKey, (error, result) => {
                if (error) {
                    displayAlert("danger", "Get Flight Status", error);
                } else {
                    contract.getFlightInformation(flightKey);
                }
            });
        }

        function buyInsurance(flightKey, amount) {
            console.log("Buy Insurance: " + amount);
            contract.buyInsurance(flightKey, amount);
        }

        function addFlightCard(flight, flightKey, airline, departure, arrival, status, timestamp) {
            let flightsContainer = DOM.elid("flights-container");
            let col = document.createElement('div');
            let card = document.createElement('div');
            let body = document.createElement('div');
            let h2 = document.createElement('h2');
            let h3 = document.createElement('h3');
            let i = document.createElement('i');
            let hr = document.createElement('hr');
            let pDeparture = document.createElement('p');
            let pArrival = document.createElement('p');
            let statusIndex = parseInt(status)/10
            let cardClass = "bg-" + statuses[statusIndex][1];
        
            col.classList = "col-sm-4";
            card.classList = "card " + cardClass;
            body.classList = "card-body";
            h2.classList = "card-title";
            h3.classList = "card-subtitle mb-2";
            i.setAttribute("data-feather", statuses[statusIndex][2]);
        
            h2.innerHTML = flight;
            h3.innerHTML = statuses[statusIndex][0] + " ";
            pDeparture.innerHTML = "From: " + departure;
            pArrival.innerHTML = "To: " + arrival;
        
            flightsContainer.appendChild(col);
            col.append(card);
            card.append(body);
            body.append(h2);
            body.append(h3);
            h3.append(i);
            body.append(hr);
            body.append(pDeparture);
            body.append(pArrival);
            feather.replace();
        
            if (status == "0") {
                let insuranceInput = document.createElement("input");
                let insuranceLabel = document.createElement("label");
                let insuranceButton = document.createElement("button");
                let flightStatusButton = document.createElement("button");
                let br = document.createElement("br");

                insuranceInput.type = "number";
                insuranceInput.id = "amount-" + flightKey;
                insuranceInput.min = "0";
                insuranceInput.max = "1";
                insuranceInput.step = "0.1";
                insuranceInput.placeholder = "0-1";
                insuranceLabel.innerHTML = "ether";
                insuranceButton.classList = "btn btn-danger";
                flightStatusButton.classList = "btn btn-warning";
        
                insuranceButton.innerHTML = "Buy Insurance";
                flightStatusButton.innerHTML = "Get Flight Status";
        
                body.append(insuranceInput);
                body.append(insuranceLabel);
                body.append(br);
                body.append(insuranceButton);
                body.append(br);
                body.append(flightStatusButton);
        
                flightStatusButton.addEventListener('click', () => {
                    getFlightStatus(airline, flight, flightKey, timestamp);
                });
                insuranceButton.addEventListener('click', () =>{
                    buyInsurance(flightKey, DOM.elid("amount-" + flightKey).value);
                });
            }
        }
        
    });

})();


function displayAlert(type, heading, content) {
    let main = document.getElementsByTagName('main')[0];
    let alert = document.createElement('div');
    let button = document.createElement('button');
    let h2 = document.createElement('h2');
    let p = document.createElement('p');

    alert.className = "alert alert-" + type + ' alert-dismissable';
    button.setAttribute('type', 'button');
    button.className = "close";
    button.setAttribute('data-dismiss', 'alert');
    button.innerHTML = '&times';
    h2.className = "alert-heading";
    h2.innerHTML = heading;
    p.innerHTML = content;

    main.insertBefore(alert, main.firstChild);
    alert.appendChild(button);
    alert.appendChild(h2);
    alert.appendChild(p);
}
