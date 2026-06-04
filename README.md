# Hypothesis Testing Tool

Students: Daphne Argel 11E and Alejandra Gutierrez 11E

## Project Purpose

The Hypothesis Testing Tool is a fully client-side high-school statistics web project. It helps students practice z-tests for means and proportions using both manual input and CSV data. The project includes automatic calculations, p-values, critical values, hypothesis decisions, contextual conclusions, and a normal distribution graph drawn with HTML Canvas.

## Files Included

- `index.html`: Main website structure.
- `style.css`: Responsive professional styling.
- `script.js`: All calculator, CSV parsing, statistics, and graph logic.
- `example_mean_data.csv`: Example CSV for mean testing.
- `example_proportion_data.csv`: Example CSV for proportion testing.
- `report.md`: APA-style report template and completed topic report.

## How to Run Locally

1. Download or clone the project folder.
2. Keep all files in the same folder.
3. Open `index.html` in a web browser.
4. No server, Node.js, or backend is required.

## How to Deploy on GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, the CSV files, `README.md`, and `report.md`.
3. Go to the repository Settings.
4. Select Pages.
5. Under Build and deployment, choose Deploy from a branch.
6. Select the main branch and root folder.
7. Save the settings.
8. Open the GitHub Pages link after it finishes publishing.

## How to Test Manual Mode

1. Open the website.
2. Select C8 Manual Mode.
3. Choose Mean Test or Proportion Test.
4. Adjust each parameter using both the slider and the number input box.
5. Change the test direction to left-tailed, right-tailed, or two-tailed.
6. Change alpha to 0.10, 0.05, or 0.01.
7. Confirm that the z statistic, p-value, critical value, decision, conclusion, and normal curve update automatically.

## How to Test CSV Mode

1. Select C9 CSV Mode.
2. Download one of the example CSV files from the page.
3. Upload the CSV file.
4. For mean data, select the benchmark column and test column.
5. For proportion data, select the group column, success column, benchmark group, and test group.
6. Change the test direction and alpha level.
7. Confirm that the table summary, z statistic, p-value, decision, conclusion, and graph update automatically.

## Notes

This project is designed to run locally and on GitHub Pages using only HTML, CSS, and JavaScript.
