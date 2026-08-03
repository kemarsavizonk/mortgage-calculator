# Mortgage Financing Blueprint

An interactive, single-page mortgage calculator for planning a Jamaican home purchase funded by a deposit, up to three National Housing Trust (NHT) loans, and a bank loan.

## Features

- Calculates monthly payments for each loan using fixed-rate amortization.
- Supports separate principal, annual interest rate, and repayment term inputs.
- Shows whether the proposed funding meets, exceeds, or falls short of the house price.
- Visualizes the funding mix and combined monthly-payment breakdown.
- Includes a reset button for restoring the default scenario.
- Runs entirely in the browser with no build step or application dependencies.

## Run locally

Open `mortgage-blueprint-calculator.html` in a modern browser.

For local HTTP hosting, use any static file server. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/mortgage-blueprint-calculator.html>.

## Calculation

For each loan, the calculator uses the standard fixed-rate monthly-payment formula:

```text
payment = principal × monthly_rate × (1 + monthly_rate)^months
          -------------------------------------------------------
                    (1 + monthly_rate)^months - 1
```

At a 0% interest rate, the principal is divided evenly across the repayment months.

## Project structure

```text
.
├── mortgage-blueprint-calculator.html  # Application markup, styles, and logic
├── README.md                            # Project documentation
└── .gitignore                           # Files excluded from version control
```

## Notes

- Amounts are displayed in Jamaican dollars (J$).
- Google Fonts are loaded from the web; the calculator itself has no package dependencies.
- Results are estimates for planning only. Actual NHT and bank offers may include fees, insurance, changing rates, or other terms not modeled here.

## License

No license has been specified.
