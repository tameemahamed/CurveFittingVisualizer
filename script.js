let chart = null;
let rawData = [];
let headers = [];

// Helper to parse CSV
function parseCSV(csv) {
    const rows = csv.trim().split("\n").map(row => row.split(","));
    const headers = rows.shift(); // Extract headers
    const data = rows.map(row => row.map(value => parseFloat(value) || value)); // Convert to numbers when possible
    return { headers, data };
}

// Initialize Chart
function initializeChart(labels, datasets) {
    const ctx = document.getElementById("chartCanvas").getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: datasets,
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                },
            },
            scales: {
                x: {
                    type: "linear",
                    position: "bottom",
                    title: {
                        display: true,
                        text: "X-Axis",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Y-Axis",
                    },
                },
            },
        },
    });
}

// Fit Polynomial Regression
function polynomialRegression(x, y, degree) {
    const coeffs = [];
    const matrix = [];

    for (let i = 0; i <= degree; i++) {
        coeffs.push(
            x.reduce((acc, xi, idx) => acc + Math.pow(xi, i) * y[idx], 0)
        );
        const row = [];
        for (let j = 0; j <= degree; j++) {
            row.push(x.reduce((acc, xi) => acc + Math.pow(xi, i + j), 0));
        }
        matrix.push(row);
    }

    const math = window.math; // Assuming math.js is available
    const solution = math.lusolve(matrix, coeffs);
    return solution.map(row => row[0]);
}

// Evaluate Polynomial
function evaluatePolynomial(coeffs, x) {
    return coeffs.reduce((acc, coeff, idx) => acc + coeff * Math.pow(x, idx), 0);
}

// Event Listener for File Upload
document.getElementById("csvFileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const csv = event.target.result;
        const parsedData = parseCSV(csv);

        headers = parsedData.headers;
        rawData = parsedData.data;

        const xColumn = document.getElementById("xColumn");
        const yColumn = document.getElementById("yColumn");
        xColumn.innerHTML = "";
        yColumn.innerHTML = "";

        headers.forEach((header, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.text = header;
            xColumn.appendChild(option.cloneNode(true));
            yColumn.appendChild(option);
        });

        document.getElementById("columnSelector").style.display = "flex";
    };

    reader.readAsText(file);
});

// Event Listener for Data Selection
document.getElementById("loadData").addEventListener("click", () => {
    const xIndex = parseInt(document.getElementById("xColumn").value);
    const yIndex = parseInt(document.getElementById("yColumn").value);

    const selectedX = rawData.map(row => parseFloat(row[xIndex]));
    const selectedY = rawData.map(row => parseFloat(row[yIndex]));

    const dataPoints = selectedX.map((x, i) => ({ x, y: selectedY[i] }));

    initializeChart(null, [
        {
            label: "Data Points",
            data: dataPoints,
            backgroundColor: "blue",
        },
    ]);

    document.getElementById("polynomialControls").style.display = "flex";

    // Store for polynomial fitting
    window.selectedX = selectedX;
    window.selectedY = selectedY;
});

// Event Listener for Polynomial Degree
document.getElementById("polyDegree").addEventListener("input", e => {
    const degree = parseInt(e.target.value);
    document.getElementById("degreeValue").textContent = degree;

    const selectedX = window.selectedX || [];
    const selectedY = window.selectedY || [];

    if (!selectedX.length || !selectedY.length) return;

    const coeffs = polynomialRegression(selectedX, selectedY, degree);

    const minX = Math.min(...selectedX);
    const maxX = Math.max(...selectedX);
    const fitPoints = [];

    for (let x = minX; x <= maxX; x += (maxX - minX) / 100) {
        fitPoints.push({ x, y: evaluatePolynomial(coeffs, x) });
    }

    initializeChart(null, [
        {
            label: "Data Points",
            data: selectedX.map((x, i) => ({ x, y: selectedY[i] })),
            backgroundColor: "blue",
        },
        {
            label: `Polynomial Fit (Degree ${degree})`,
            data: fitPoints,
            type: "line",
            borderColor: "red",
            backgroundColor: "rgba(255,0,0,0.1)",
            fill: true,
        },
    ]);
});

// Download sample CSV on button click
document.getElementById("downloadSample").addEventListener("click", () => {
    const link = document.createElement('a');
    link.href = encodeURI('TestData/happiness score 2015.csv');
    // This sets the filename that the user will see
    link.download = 'happiness score 2015.csv';
    // Append, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
