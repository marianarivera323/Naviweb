const express = require('express');
const { Client } = require('pg'); // PostgreSQL client
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // For managing paths
const csv = require('csv-parser');

const app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON requests

// PostgreSQL connection setup
const db = new Client({
    connectionString: 'postgresql://neondb_owner:XynU2QBaz8NP@ep-lucky-mouse-a6tqt0yy.us-west-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }, // Allow SSL connections without validating certificate
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit if connection fails
    }
    console.log('Connected to PostgreSQL database.');
});

// Load and parse formula-data.csv
const formulaData = [];
const loadFormulaData = () => {
    const formulaPath = path.join(__dirname, 'formula-data.csv');
    if (!fs.existsSync(formulaPath)) {
        console.error(`Formula Data file not found: ${formulaPath}`);
        return;
    }

    fs.createReadStream(formulaPath)
        .pipe(csv())
        .on('data', (row) => {
            try {
                const county = row.County?.trim();
                const taxRate = parseFloat(row['Tax Rate']?.replace('%', '').trim()) / 100 || 0; // Convert percentage to decimal
                const avgInsurance = parseFloat(row['Insurance Average']?.replace('$', '').replace(',', '').trim()) || 0; // Convert to float

                if (county && taxRate && avgInsurance) {
                    formulaData.push({ county, taxRate, avgInsurance });
                } else {
                    console.warn(`Invalid or missing data in row:`, row);
                }
            } catch (err) {
                console.error('Error parsing row:', row, err);
            }
        })
        .on('end', () => {
            console.log('Formula Data loaded successfully:', formulaData);
        })
        .on('error', (err) => {
            console.error('Error reading formula-data.csv:', err);
        });
};

// API Endpoint: Update insurance costs based on ZIP and County
app.get('/api/update_insurance/:zip', async (req, res) => {
    const { zip } = req.params; // Extract ZIP code from route parameter
    const { county } = req.query; // Extract county from query parameters

    try {
        // Check if the county exists in formula-data.csv
        const formulaEntry = formulaData.find((entry) => entry.county.toLowerCase() === county.toLowerCase());

        if (!formulaEntry) {
            return res.status(404).json({ error: 'No data found for this county in Formula Data.' });
        }

        // Example estimated purchase price (this should be dynamic or passed by the frontend)
        const estimatedPurchasePrice = 300000; // Example value, replace as needed

        // Perform calculations using formula-data.csv
        const monthly_property_tax = (formulaEntry.taxRate * estimatedPurchasePrice) / 12;
        const monthly_insurance_cost = formulaEntry.avgInsurance * 1.1; // Increase by 10%
        const monthly_interest = (estimatedPurchasePrice * 0.05) / 12; // Example interest calculation (5% annual rate)

        // Respond with calculated data
        res.json({
            zipcode: zip,
            county,
            monthly_property_tax: parseFloat(monthly_property_tax.toFixed(2)),
            monthly_insurance_cost: parseFloat(monthly_insurance_cost.toFixed(2)),
            monthly_interest: parseFloat(monthly_interest.toFixed(2)),
        });
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// API Endpoint: Get available counties
app.get('/api/counties', async (req, res) => {
    try {
        const counties = formulaData.map((entry) => ({ county: entry.county }));
        res.json(counties);
    } catch (err) {
        console.error('Error fetching counties:', err);
        res.status(500).json({ error: 'Failed to fetch counties.' });
    }
});

// API Endpoint: Get ZIP codes for a selected county
app.get('/api/zipcodes', async (req, res) => {
    const { county } = req.query;

    if (!county) {
        return res.status(400).json({ error: 'County is required.' });
    }

    try {
        const result = await db.query('SELECT DISTINCT zipcode FROM dataset WHERE county = $1', [county]);
        const zipcodes = result.rows.map((row) => row.zipcode);
        res.json(zipcodes);
    } catch (err) {
        console.error('Error fetching ZIP codes:', err);
        res.status(500).json({ error: 'Failed to fetch ZIP codes.' });
    }
});

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Load Formula Data on server start
loadFormulaData();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// API Endpoint to get available counties
app.get('/api/counties', async (req, res) => {
    try {
        const query = 'SELECT DISTINCT county FROM dataset ORDER BY county';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching counties:', err);
        res.status(500).json({ error: 'Failed to fetch counties.' });
    }
});

app.get('/api/zipcodes', async (req, res) => {
    const { county } = req.query;

    if (!county) {
        return res.status(400).json({ error: 'County is required' });
    }

    try {
        const query = 'SELECT DISTINCT zipcode FROM dataset WHERE county = $1 ORDER BY zipcode';
        const result = await db.query(query, [county]);
        res.json(result.rows); // Should return an array of ZIP codes
    } catch (err) {
        console.error('Error fetching ZIP codes:', err);
        res.status(500).json({ error: 'Failed to fetch ZIP codes.' });
    }
});