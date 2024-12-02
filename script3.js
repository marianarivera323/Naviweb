document.addEventListener('DOMContentLoaded', function () {
    const searchButton = document.getElementById('search');
    const messageDiv = document.getElementById('message');

    // Function to fetch insurance cost data
    const fetchInsuranceData = async (zipcode, county) => {
        try {
            const response = await fetch(`/api/update_insurance/${zipcode}?county=${county}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Update the DOM with the data received
            messageDiv.innerHTML = `
                <p>Updated Insurance Cost: $${data.updatedInsuranceCost.toFixed(2)}</p>
                <p>Monthly Property Tax: $${data.monthly_property_tax}</p>
                <p>Monthly Interest: $${data.monthly_interest}</p>
            `;
        } catch (error) {
            console.error('Error fetching data:', error);
            messageDiv.innerHTML = `<p style="color: red;">Failed to fetch data. Please try again.</p>`;
        }
    };

    // Attach event listener to the Search button
    searchButton.addEventListener('click', () => {
        const zipcode = document.getElementById('zipcode').value;
        const county = document.getElementById('county').value;

        if (!zipcode || !county) {
            messageDiv.innerHTML = `<p style="color: red;">Please enter both ZIP code and County.</p>`;
            return;
        }

        // Fetch data from the backend
        fetchInsuranceData(zipcode, county);
    });
});
