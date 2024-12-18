// NOTE! Running this code requires a degree of trust. NEVER execute code you are not comfortable with
// This code will be documented to earn such trust!

// Function to retrieve an order and store its results.  It is asyncronous to speed execute when there are a lot of bundles.
async function fetchOrder(bundle, results) {
  try {
      // Request order information
      const response = await fetch(`/api/v1/order/${bundle}?all_tpkds=true`);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      // Wait for the response to come back
      const data = await response.json();
      // Store the results in the provided array 
      results.push(data);
  } catch (error) {
      console.error('Error fetching order:', error);
  }
}
//dump = document.createElement('textarea')
// Get all of the bundles out of the page.
bundles=JSON.parse(document.getElementById('user-home-json-data').innerText).gamekeys;
const results=[];
const requests = [];
//document.body.replaceChildren(dump)
// For every bundle, get the results.
for (let bundle of bundles) {
  requests.push(fetchOrder(bundle,results));
}
await Promise.all(requests);

// Prepare the results for download
const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);

// Create a download link
const a = document.createElement('a');
a.href = url;
a.download = 'results.json'; // File name
a.style.display = 'none';

// Trigger download
document.body.appendChild(a);
a.click();

// Clean up
document.body.removeChild(a);
URL.revokeObjectURL(url);