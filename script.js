  // Sample data structure: { name, item, price, timestamp }
        let records = [];
        let customers = [];
        
        // DOM elements
        const recordForm = document.getElementById('recordForm');
        const nameSelect = document.getElementById('nameSelect');
        const itemInput = document.getElementById('itemInput');
        const priceInput = document.getElementById('priceInput');
        const recordsList = document.getElementById('recordsList');
        const searchResults = document.getElementById('searchResults');
        const summaryResults = document.getElementById('summaryResults');
        const modalNameSelect = document.getElementById('modalNameSelect');
        const itemFilter = document.getElementById('itemFilter');
        const searchBtn = document.getElementById('searchBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const summarizeBtn = document.getElementById('summarizeBtn');
        const customerForm = document.getElementById('customerForm');
        const newCustomerName = document.getElementById('newCustomerName');
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', async function() {
            await loadRecords();
            await loadCustomerNames();
            displayAllRecords();
            
            // Form submission
            recordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                await addRecord();
            });
            
            // Customer form submission
            customerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                await addNewCustomer();
            });
            
            // Modal operations
            searchBtn.addEventListener('click', searchRecords);
            deleteBtn.addEventListener('click', deleteRecords);
            summarizeBtn.addEventListener('click', summarizeRecords);
        });
        
        // Load records from GitHub
        async function loadRecords() {
            try {
                const owner = 'streamifytv';
                const repo = 'KSI';
                const path = 'nasir.json';
                const token = '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'; // WARNING: Remove this before sharing code
                
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const fileData = await response.json();
                    const existingContent = decodeURIComponent(escape(atob(fileData.content)));
                    records = JSON.parse(existingContent || '[]');
                    console.log('Records loaded successfully');
                } else if (response.status === 404) {
                    records = [];
                    console.log("No existing file found, starting with empty records");
                } else {
                    throw new Error(`Failed to get file: ${(await response.json()).message}`);
                }
            } catch (error) {
                console.error('Failed to load records:', error);
                alert('Failed to load records. See console for details.');
            }
        }
        
        // Load customer names
        async function loadCustomerNames() {
            try {
                const owner = 'streamifytv';
                const repo = 'KSI';
                const path = 'customer.json';
                const token = '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'; // WARNING: Remove this before sharing code
                
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const fileData = await response.json();
                    const content = decodeURIComponent(escape(atob(fileData.content)));
                    customers = JSON.parse(content || '[]');
                    populateSelects();
                } else if (response.status === 404) {
                    customers = ["Nasir", "Jawad ali", "nihad", "jamalo", "ihtisham", "Sadam"];
                    populateSelects();
                } else {
                    throw new Error('Failed to fetch customer names');
                }
            } catch (error) {
                console.error('Error loading customer names:', error);
                customers = ["Nasir", "Jawad ali", "nihad", "jamalo", "ihtisham", "Sadam"];
                populateSelects();
            }
        }
        
        // Populate select elements with customer names
        function populateSelects() {
            nameSelect.innerHTML = '';
            modalNameSelect.innerHTML = '<option value="" selected disabled>Select a name</option>';
            
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer;
                option.textContent = customer;
                nameSelect.appendChild(option);
                
                const modalOption = option.cloneNode(true);
                modalNameSelect.appendChild(modalOption);
            });
        }
        
        // Add a new customer
        async function addNewCustomer() {
            const name = newCustomerName.value.trim();
            
            if (!name) {
                alert('Please enter a customer name');
                return;
            }
            
            if (customers.includes(name)) {
                alert('This customer already exists');
                return;
            }
            
            customers.push(name);
            
            try {
                await updateCustomerFile();
                populateSelects();
                newCustomerName.value = '';
                $('#addCustomerModal').modal('hide'); // Close the modal
                alert('Customer added successfully!');
            } catch (error) {
                console.error('Failed to add customer:', error);
                customers.pop(); // Remove the customer if update fails
                alert('Failed to add customer. See console for details.');
            }
        }
        
        // Update customer file on GitHub
        async function updateCustomerFile() {
            const owner = 'streamifytv';
            const repo = 'KSI';
            const path = 'customer.json';
            const token = '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'; // WARNING: Remove this before sharing code
            const message = 'Update customers via app';
            
            // First, get the current file SHA if it exists
            let sha = null;
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                console.log('No existing file or error getting SHA');
            }
            
            // Convert customers to JSON string
            const updatedContent = JSON.stringify(customers, null, 2);
            const contentBase64 = btoa(unescape(encodeURIComponent(updatedContent)));
            
            // Update or create the file
            const putResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: message,
                    content: contentBase64,
                    sha: sha
                })
            });
            
            if (!putResponse.ok) {
                const errorData = await putResponse.json();
                throw new Error(errorData.message || 'Failed to update file');
            }
        }
        
        // Add a new record
        async function addRecord() {
            const name = nameSelect.value;
            const item = itemInput.value;
            const price = priceInput.value ? parseFloat(priceInput.value) : null;
            const timestamp = new Date().toISOString();
            
            const newRecord = {
                name,
                item,
                price,
                timestamp
            };
            
            records.push(newRecord);
            
            try {
                await updateGitHubFile();
                displayAllRecords();
                recordForm.reset();
                alert('Record added successfully!');
            } catch (error) {
                console.error('Failed to add record:', error);
                records.pop(); // Remove the record if update fails
                alert('Failed to add record. See console for details.');
            }
        }
        
        // Update GitHub file
        async function updateGitHubFile() {
            const owner = 'streamifytv';
            const repo = 'KSI';
            const path = 'nasir.json';
            const token = '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'; // WARNING: Remove this before sharing code
            const message = 'Update records via app';
            
            // First, get the current file SHA if it exists
            let sha = null;
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                console.log('No existing file or error getting SHA');
            }
            
            // Convert records to JSON string
            const updatedContent = JSON.stringify(records, null, 2);
            const contentBase64 = btoa(unescape(encodeURIComponent(updatedContent)));
            
            // Update or create the file
            const putResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: message,
                    content: contentBase64,
                    sha: sha
                })
            });
            
            if (!putResponse.ok) {
                const errorData = await putResponse.json();
                throw new Error(errorData.message || 'Failed to update file');
            }
        }
        
        // Display all records
        function displayAllRecords() {
            if (records.length === 0) {
                recordsList.innerHTML = '<p>No records found.</p>';
                return;
            }
            
            recordsList.innerHTML = '';
            records.forEach((record, index) => {
                const recordCard = document.createElement('div');
                recordCard.className = 'record-card';
                recordCard.innerHTML = `
                    <strong>${record.name}</strong>: ${record.item} 
                    ${record.price ? `<b style="color:red">Rs: </b>${record.price}` : ''}
                    <small class="text-muted">${new Date(record.timestamp).toLocaleString()}</small>
                    <button class="btn btn-sm btn-danger float-end" onclick="deleteSingleRecord(${index})">×</button>
                `;
                recordsList.appendChild(recordCard);
            });
        }
        
        // Search records based on criteria
        function searchRecords() {
            const name = modalNameSelect.value;
            const itemFilterValue = itemFilter.value.toLowerCase();
            
            if (!name) {
                alert('Please select a name first');
                return;
            }
            
            const filteredRecords = records.filter(record => {
                const matchesName = record.name === name;
                const matchesItem = !itemFilterValue || record.item.toLowerCase().includes(itemFilterValue);
                return matchesName && matchesItem;
            });
            
            searchResults.innerHTML = '';
            
            if (filteredRecords.length === 0) {
                searchResults.innerHTML = '<p>No matching records found.</p>';
                return;
            }
            
            const resultsList = document.createElement('div');
            resultsList.className = 'list-group';
            
            filteredRecords.forEach((record, index) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'list-group-item';
                resultItem.innerHTML = `
                    ${record.item} 
                    ${record.price ? `- <b>Rs: </b>${record.price}` : ''}
                    <small class="text-muted">${new Date(record.timestamp).toLocaleString()}</small>
                `;
                resultsList.appendChild(resultItem);
            });
            
            searchResults.appendChild(resultsList);
            summaryResults.innerHTML = ''; // Clear summary if it exists
        }
        
        // Delete records based on criteria
        async function deleteRecords() {
            const name = modalNameSelect.value;
            const itemFilterValue = itemFilter.value.toLowerCase();
            
            if (!name) {
                alert('Please select a name first');
                return;
            }
            
            if (!confirm(`Are you sure you want to delete all records for ${name}${itemFilterValue ? ` matching "${itemFilterValue}"` : ''}?`)) {
                return;
            }
            
            const initialCount = records.length;
            records = records.filter(record => {
                const matchesName = record.name === name;
                const matchesItem = !itemFilterValue || record.item.toLowerCase().includes(itemFilterValue);
                return !(matchesName && matchesItem);
            });
            
            const deletedCount = initialCount - records.length;
            
            if (deletedCount > 0) {
                try {
                    await updateGitHubFile();
                    displayAllRecords();
                    searchResults.innerHTML = `<div class="alert alert-success">Deleted ${deletedCount} record(s).</div>`;
                    summaryResults.innerHTML = ''; // Clear summary if it exists
                } catch (error) {
                    console.error('Failed to delete records:', error);
                    alert('Failed to delete records. See console for details.');
                    await loadRecords(); // Reload records to undo changes
                }
            } else {
                searchResults.innerHTML = '<div class="alert alert-info">No records matched your criteria.</div>';
            }
        }
        
        // Summarize records for a name
        function summarizeRecords() {
            const name = modalNameSelect.value;
            
            if (!name) {
                alert('Please select a name first');
                return;
            }
            
            const nameRecords = records.filter(record => record.name === name);
            const totalPrice = nameRecords.reduce((sum, record) => sum + (record.price || 0), 0);
            const itemFilterValue = itemFilter.value.toLowerCase();
            
            const filteredRecords = itemFilterValue 
                ? nameRecords.filter(record => record.item.toLowerCase().includes(itemFilterValue))
                : nameRecords;
            
            const filteredTotal = filteredRecords.reduce((sum, record) => sum + (record.price || 0), 0);
            
            searchResults.innerHTML = ''; // Clear search results if they exist
            
            summaryResults.innerHTML = `
                <div class="summary-card">
                    <h5>Summary for ${name}</h5>
                    <p>Total records: ${nameRecords.length}</p>
                    <p>Total amount: <b>Rs: </b>${totalPrice}</p>
                    ${itemFilterValue ? `
                        <p>Filtered records: ${filteredRecords.length}</p>
                        <p>Filtered amount: ${filteredTotal}</p>
                    ` : ''}
                </div>
            `;
        }
        
        // Delete a single record by index
        async function deleteSingleRecord(index) {
            if (!confirm('Are you sure you want to delete this record?')) {
                return;
            }
            
            const recordToDelete = records[index];
            records.splice(index, 1);
            
            try {
                await updateGitHubFile();
                displayAllRecords();
                alert('Record deleted successfully!');
            } catch (error) {
                console.error('Failed to delete record:', error);
                records.splice(index, 0, recordToDelete); // Restore the record if update fails
                alert('Failed to delete record. See console for details.');
            }
        }
        
        // Make deleteSingleRecord available globally for onclick
        window.deleteSingleRecord = deleteSingleRecord;
