document.addEventListener('DOMContentLoaded', () => {
    const countySelect = document.getElementById('county-select');
    const zipcodeSelect = document.getElementById('zipcode-select');
    const searchButton = document.getElementById('search');
    const resultDiv = document.getElementById('result');
    const mapContainer = document.getElementById('map');
    let map, geojsonLayer, costChart, marker;

    // Coordinates for counties
    const countyCoordinates = {
        "Miami-Dade": [25.7617, -80.1918],
        "Broward": [26.1901, -80.3659],
        "Palm Beach": [26.7153, -80.0534],
        "Volusia": [29.0286, -81.3031],
        "Hillsborough": [27.9904, -82.3018],
        "Pinellas": [27.8764, -82.7778],
        "Sarasota": [27.3364, -82.5307],
        "Saint Johns": [29.8947, -81.3145],
        "Flagler": [29.4737, -81.2078],
        "Escambia": [30.6389, -87.3414],
    };

    // Formatter for currency
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    // Add custom Chart.js plugin for center text
    Chart.register({
        id: 'doughnutCenterText',
        beforeDraw(chart) {
            if (chart.config.type === 'doughnut') {
                const ctx = chart.ctx;
                const width = chart.width;
                const height = chart.height;

                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const text = currencyFormatter.format(total);

                ctx.save();
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#333';
                ctx.fillText(text, width / 2, height / 2);
                ctx.restore();
            }
        },
    });

    // Fetch counties and populate the dropdown
    async function loadCounties() {
        try {
            const response = await fetch('/api/counties');
            const data = await response.json();

            data.forEach((county) => {
                const option = document.createElement('option');
                option.value = county.county;
                option.textContent = county.county;
                countySelect.appendChild(option);
            });
        } catch (err) {
            console.error('Error loading counties:', err);
        }
    }

    // Fetch ZIP codes for the selected county
    countySelect.addEventListener('change', async () => {
        zipcodeSelect.innerHTML = '<option value="">Select ZIP Code</option>';
        const county = countySelect.value;

        if (county) {
            zipcodeSelect.disabled = false;

            try {
                const response = await fetch(`/api/zipcodes?county=${encodeURIComponent(county)}`);
                const data = await response.json();

                if (response.ok && data.length > 0) {
                    data.forEach((zipcode) => {
                        const option = document.createElement('option');
                        option.value = zipcode;
                        option.textContent = zipcode;
                        zipcodeSelect.appendChild(option);
                    });
                } else {
                    console.error('No ZIP codes found for the selected county');
                }
            } catch (err) {
                console.error('Error fetching ZIP codes:', err);
            }
        } else {
            zipcodeSelect.disabled = true;
        }
    });

    // Search button click handler
    searchButton.addEventListener('click', async () => {
        const county = countySelect.value;
        const zipcode = zipcodeSelect.value;

        if (!county || !zipcode) {
            resultDiv.innerHTML = `<p style="color: red;">Please select both a county and a ZIP code.</p>`;
            return;
        }

        try {
            const response = await fetch(`/api/update_insurance/${zipcode}?county=${encodeURIComponent(county)}`);
            const data = await response.json();

            if (response.ok) {
                resultDiv.innerHTML = `
                    <p><strong>Updated Insurance Cost:</strong> ${currencyFormatter.format(data.monthly_insurance_cost)}</p>
                    <p><strong>Monthly Property Tax:</strong> ${currencyFormatter.format(data.monthly_property_tax)}</p>
                    <p><strong>Monthly Interest:</strong> ${currencyFormatter.format(data.monthly_interest)}</p>
                `;
                updateChart(data);
                updateMap(county);
            } else {
                resultDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            resultDiv.innerHTML = `<p style="color: red;">An error occurred. Please try again later.</p>`;
        }
    });

    // Initialize Chart.js
    function updateChart(data) {
        const ctx = document.getElementById('cost-chart').getContext('2d');
        if (costChart) costChart.destroy(); // Destroy previous chart if exists

        costChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Insurance', 'Property Tax', 'Interest'],
                datasets: [
                    {
                        data: [
                            data.monthly_insurance_cost,
                            data.monthly_property_tax,
                            data.monthly_interest,
                        ],
                        backgroundColor: ['#5899ee', '#56e39f', '#ffc107'],
                    },
                ],
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return currencyFormatter.format(tooltipItem.raw);
                            },
                        },
                    },
                    legend: {
                        display: true,
                    },
                },
            },
        });
    }

    // Initialize Leaflet.js map
    function updateMap(county) {
        if (!map) {
            map = L.map('map').setView([27.994402, -81.760254], 7); // Default view for Florida
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);
        }

        // Clear previous layers and markers
        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }
        if (marker) {
            map.removeLayer(marker);
        }

        // Set map view to county coordinates and add a pin
        if (countyCoordinates[county]) {
            const [lat, lng] = countyCoordinates[county];
            map.setView([lat, lng], 10); // Zoom level 10

            // Add marker/pin
            marker = L.marker([lat, lng]).addTo(map).bindPopup(`County: ${county}`).openPopup();
        } else {
            console.warn(`Coordinates not found for county: ${county}`);
        }

        // Fetch GeoJSON for the selected county
        fetch(`/api/geojson/${county}`)
            .then((response) => response.json())
            .then((geojson) => {
                geojsonLayer = L.geoJSON(geojson, {
                    style: { color: 'blue', weight: 2 },
                }).addTo(map);

                // Fit bounds if no coordinates are available
                if (!countyCoordinates[county]) {
                    map.fitBounds(geojsonLayer.getBounds());
                }
            })
            .catch((err) => {
                console.error('Error loading GeoJSON data:', err);
            });
    }

    // Initial load
    loadCounties();
});

