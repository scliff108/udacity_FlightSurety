
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


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
            let select = DOM.elid('flight-number-status-select');
            while (select.hasChildNodes()) {
                select.removeChild(select.firstChild);
            }
            if (contract.flights.length > 0) {
                contract.flights.forEach(function(flight) {
                    addFlightToList(flight.sFlightKey, flight.sFlightNumber);
                });
            } else {
                addFlightToList("", "No Flights Available");
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
            let flight = DOM.elid('flight-number').value;
            contract.registerFlight(flight); 
            contract.getRegisteredFlights();
        });
        
        // User-submitted transaction
        DOM.elid('get-flight-status').addEventListener('click', () => {
            let select = DOM.elid('flight-number-status-select');
            let flight = select.options[select.selectedIndex].value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                if (error) {
                    displayAlert("danger", "Get Flight Status", error);
                } else {
                    contract.getFlightInformation(result.flight, (error, result) => {
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
                                    console.log("DEFAULT");
                                displayAlert("danger", "Flight Status", "We were unable to get the flight status.");
                        }
                    });
                }
            });
        });
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

function addFlightToList(value, text) {
    let select = DOM.elid('flight-number-status-select');
    let opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = text;
    select.appendChild(opt)
}
