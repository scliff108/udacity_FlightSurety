
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        function getOperationalStatus(){
                contract.isOperational((error, result) => {
                console.log(error,result);
                display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            });
        }
        getOperationalStatus();

        DOM.elid('get-operational').addEventListener('click', () => {
            getOperationalStatus();
        });

        DOM.elid('toggle-operational').addEventListener('click', () => {
            contract.isOperational(async (error, result) => {
                if (!error) {
                    if (result) {
                        contract.setOperatingStatus(false);
                        console.log("CURRENT MODE JUST SET TO FALSE");
                    } else if (!result) {
                        contract.setOperatingStatus(true);
                        console.log("CURRENT MODE JUST SET TO TRUE");
                    }
                }
            });
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid('fund-airline').addEventListener('click', () => {
            let amount = DOM.elid('funding-amount').value;
            contract.fundAirline(amount, (error, result) => {
                display('Airlines', 'Funded Airlines', [ { label: 'Transaction', error: error, value: result}])
            })
        })

        DOM.elid('register-airline').addEventListener('click', () => {
            let airline = DOM.elid('airline-address').value;
            if (airline) {
                contract.registerAirline(airline, (error, result) => {
                    display('Airlines', 'Registered Airlines', [ { label: 'Transaction', error: error, value: result} ])
                })
            }
        });
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







