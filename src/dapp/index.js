
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
let statuses = [
    "Unknown",
    "On Time",
    "Late - Airline",
    "Late - Weather",
    "Late - Technical",
    "Late - Other"
];
let statusColor = [
    "primary",
    "success",
    "danger",
    "secondary",
    "warning",
    "dark"
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
                        if (result == 'true') {
                            displayAlert('success', 'Operational Status', result);
                        } else {
                            displayAlert('danger', 'Operational Status', result);
                        }
                    }
            });
        }
        getOperationalStatus();

        function getFlights() {
            contract.getRegisteredFlights();
            let flightsContainer = DOM.elid('flights-container');
            while (flightsContainer.hasChildNodes()) {
                flightsContainer.removeChild(flightsContainer.firstChild);
            }
            if (contract.flights.length > 0) {
                contract.flights.forEach(function(flight) {
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

        DOM.elid('register-flight').addEventListener('click', () => {
            let flightNumber = DOM.elid('flight-number').value;
            let departureLocation = DOM.elid('departure-location').value;
            let arrivalLocation = DOM.elid('arrival-location').value;
            contract.registerFlight(flightNumber, departureLocation, arrivalLocation); 
        });
        
        // User-submitted transaction
        function getFlightStatus(airline, flight, flightKey, flightTimeStamp) {
            // Write transaction
            contract.fetchFlightStatus(airline, flight, flightTimeStamp, (error, result) => {
                if (error) {
                    displayAlert("danger", "Get Flight Status", error);
                } else {
                    contract.getFlightInformation(flightKey, (error, result) => {
                        switch(result.sStatusCode) {
                            case "0":
                                displayAlert('primary', "Flight Status", "Flight status unknown at this point. Check back in later.");
                                break;
                            case "10":
                                displayAlert('success', "Flight Status", "Flight landed on time.");
                                break;
                            case "20":
                                displayAlert('danger', "Flight Status", "Flight was late due to the airline.");
                                break;
                            case "30":
                                displayAlert('secondary', "Flight Status", "Flight late due to inclement weather.");
                                break;
                            case "40":
                                displayAlert('warning', "Flight Status", "Flight late due to a technical reason.");
                                break;
                            case "50":
                                displayAlert('dark', "Flight Status", "Flight is late for some reason, but it is not our fault...I swear.");
                                break;
                            default:
                                displayAlert("danger", "Flight Status", "We were unable to get the flight status.");
                                break;
                        }
                    });
                }
            });
        }

        function buyInsurance() {
            console.log("Buy Insurance");
        }

        function claimInsurance() {
            console.log("Claim Insurance");
        }

        function addFlightCard(flight, flightKey, airline, departure, arrival, status, timestamp) {
            let flightsContainer = DOM.elid("flights-container");
            let col = document.createElement('div');
            let card = document.createElement('div');
            let body = document.createElement('div');
            let h2 = document.createElement('h2');
            let h3 = document.createElement('h3');
            let hr = document.createElement('hr');
            let pDeparture = document.createElement('p');
            let pArrival = document.createElement('p');
            let statusIndex = parseInt(status)/10
            let cardClass = "bg-" + statusColor[statusIndex];
        
            col.classList = "col-sm-4";
            card.classList = "card " + cardClass;
            body.classList = "card-body";
            h2.classList = "card-title";
            h3.classList = "card-subtitle mb-2";
        
            h2.innerHTML = flight;
            h3.innerHTML = statuses[statusIndex];
            pDeparture.innerHTML = "From: " + departure;
            pArrival.innerHTML = "To: " + arrival;
        
            flightsContainer.appendChild(col);
            col.append(card);
            card.append(body);
            body.append(h2);
            body.append(h3);
            body.append(hr);
            body.append(pDeparture);
            body.append(pArrival);
        
            if (status == "0") {
                let insuranceButton = document.createElement("button");
                let flightStatusButton = document.createElement("button");
                let br = document.createElement("br");
        
                insuranceButton.classList = "btn btn-danger";
                flightStatusButton.classList = "btn btn-warning";
        
                insuranceButton.innerHTML = "Buy Insurance";
                flightStatusButton.innerHTML = "Get Flight Status";
        
                body.append(insuranceButton);
                body.append(br);
                body.append(flightStatusButton);
        
                flightStatusButton.addEventListener('click', () => {
                    getFlightStatus(airline, flight, flightKey, timestamp);
                });
                insuranceButton.addEventListener('click', buyInsurance);
                // Add Buy Insurance Button
            } else if (status == "20") {
                let pInsuranceMoney = document.createElement("p")
                let claimButton = document.createElement("button");
                claimButton.classList = "btn btn-success";
                pInsuranceMoney.innerHTML = "INSURANCE MONEY";
                claimButton.innerHTML = "Claim Insurance";
                body.append(pInsuranceMoney);
                body.append(claimButton);
                claimButton.addEventListener('click', claimInsurance());
                // If insurance not claimed
                    // Add Claim Button
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

