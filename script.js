// Global variables
let properties = [];
let filteredProperties = [];
let map = null;
let markers = [];
let coordinateMap = null;
let selectedCoordinates = null;

// DOM elements
const csvFileInput = document.getElementById('csvFile');
const loadDefaultBtn = document.getElementById('loadDefault');
const downloadCSVBtn = document.getElementById('downloadCSV');
const viewMapBtn = document.getElementById('viewMap');
const tableViewBtn = document.getElementById('tableViewBtn');
const mapViewBtn = document.getElementById('mapViewBtn');
const addPropertyForm = document.getElementById('addPropertyForm');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const amenityFilter = document.getElementById('amenityFilter');
const locationFilter = document.getElementById('locationFilter');
const propertiesContainer = document.getElementById('propertiesContainer');
const mapContainer = document.getElementById('mapContainer');
const totalPropertiesSpan = document.getElementById('totalProperties');
const filteredPropertiesSpan = document.getElementById('filteredProperties');
const fileInfo = document.querySelector('.file-info');
const fileUploadArea = document.getElementById('fileUploadArea');
const getCoordinatesBtn = document.getElementById('getCoordinatesBtn');

// Event listeners
csvFileInput.addEventListener('change', handleFileUpload);
loadDefaultBtn.addEventListener('click', loadSampleData);
downloadCSVBtn.addEventListener('click', downloadCSV);
viewMapBtn.addEventListener('click', showMapView);
tableViewBtn.addEventListener('click', showTableView);
mapViewBtn.addEventListener('click', showMapView);
addPropertyForm.addEventListener('submit', handleAddProperty);
searchInput.addEventListener('input', applyFilters);
typeFilter.addEventListener('change', applyFilters);
amenityFilter.addEventListener('change', applyFilters);
locationFilter.addEventListener('change', applyFilters);

// Drag and drop event listeners
fileUploadArea.addEventListener('dragover', handleDragOver);
fileUploadArea.addEventListener('dragleave', handleDragLeave);
fileUploadArea.addEventListener('drop', handleDrop);
fileUploadArea.addEventListener('click', () => csvFileInput.click());

// Coordinate picker event listener
getCoordinatesBtn.addEventListener('click', openCoordinatePicker);

// File upload handler
function handleFileUpload(event) {
    console.log('File input changed:', event.target.files);
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    console.log('Processing file:', file.name);
    processFile(file);
}

// Process uploaded file
function processFile(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showMessage('Please select a valid CSV file.', 'error');
        return;
    }

    fileInfo.textContent = file.name;
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvData = e.target.result;
            properties = parseCSV(csvData);
            filteredProperties = [...properties];
            updateDisplay();
            showMessage(`Successfully loaded ${properties.length} properties from ${file.name}`, 'success');
        } catch (error) {
            showMessage('Error parsing CSV file: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Drag and drop handlers
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    fileUploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    fileUploadArea.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Load sample data (manual button click)
async function loadSampleData() {
    try {
        const response = await fetch('stays.csv');
        if (!response.ok) {
            throw new Error('Sample CSV file not found');
        }
        const csvData = await response.text();
        if (!csvData.trim()) {
            throw new Error('Sample CSV file is empty');
        }
        properties = parseCSV(csvData);
        filteredProperties = [...properties];
        updateDisplay();
        showMessage(`Successfully loaded ${properties.length} properties from stays.csv`, 'success');
    } catch (error) {
        // If fetch fails, show error message
        console.log('Could not load stays.csv:', error.message);
        showMessage(`Could not load stays.csv: ${error.message}`, 'error');
    }
}

// Load embedded sample data as fallback
function loadEmbeddedSampleData() {
    const sampleCSV = `name,url,type,amenities,description,price,location,latitude,longitude
Auckland Sky Tower Apartment,https://airbnb.com/rooms/123456,apartment,"parking,wifi,kitchen,gym",Modern apartment with stunning views of Auckland's skyline and harbor,120,Auckland,-36.8485,174.7633
Queenstown Lake House,https://booking.com/hotel/789012,house,"parking,wifi,kitchen",Charming house overlooking Lake Wakatipu with mountain views,150,Queenstown,-45.0312,168.6626
Bay of Islands Villa,https://vrbo.com/property/345678,villa,"parking,wifi,pool,kitchen",Luxurious beachfront villa with private pool and ocean access,230,Bay of Islands,-35.2167,174.2000
Wellington Boutique Hotel,https://airbnb.com/rooms/901234,hotel,"wifi,gym,pool",Elegant hotel in the heart of Wellington's cultural district,110,Wellington,-41.2924,174.7787
Christchurch Urban Condo,https://booking.com/hotel/567890,condo,"parking,wifi,kitchen,gym",Contemporary condo with modern amenities in the Garden City,95,Christchurch,-43.5321,172.6362
Rotorua Geothermal House,https://vrbo.com/property/234567,house,"parking,wifi,kitchen",Unique house near geothermal wonders with natural hot pools,130,Rotorua,-38.1368,176.2497
Dunedin Heritage Cottage,https://airbnb.com/rooms/678901,house,"parking,wifi,kitchen",Beautiful heritage cottage in the student quarter with character,80,Dunedin,-45.8788,170.5028
Tauranga Beach Apartment,https://booking.com/hotel/123789,apartment,"parking,wifi,kitchen,gym,pool",Luxurious beachfront apartment with ocean views and resort amenities,190,Tauranga,-37.6878,176.1651
Nelson Art Studio,https://vrbo.com/property/456123,apartment,"wifi,kitchen",Creative studio space in the heart of Nelson's art district,65,Nelson,-41.2706,173.2840
Wanaka Ski Lodge,https://airbnb.com/rooms/789456,hotel,"wifi,gym,pool",Mountain lodge with easy access to world-class skiing and hiking,160,Wanaka,-44.7032,169.1321`;

    try {
        properties = parseCSV(sampleCSV);
        filteredProperties = [...properties];
        updateDisplay();
        showMessage(`Successfully loaded ${properties.length} sample properties (embedded data)`, 'success');
    } catch (error) {
        showMessage('Error loading sample data: ' + error.message, 'error');
    }
}

// CSV parser
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'url', 'type'];
    
    // Check for required headers
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const properties = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const property = {};
        headers.forEach((header, index) => {
            property[header] = values[index].trim();
        });

        // Validate required fields
        if (property.name && property.url) {
            properties.push(property);
        }
    }

    return properties;
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Apply filters
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value;
    const selectedAmenity = amenityFilter.value;
    const selectedLocation = locationFilter.value;

    filteredProperties = properties.filter(property => {
        const matchesSearch = !searchTerm || 
            property.name.toLowerCase().includes(searchTerm) ||
            (property.description && property.description.toLowerCase().includes(searchTerm)) ||
            (property.location && property.location.toLowerCase().includes(searchTerm));
        
        const matchesType = !selectedType || 
            property.type.toLowerCase() === selectedType;
        
        const matchesAmenity = !selectedAmenity || 
            (property.amenities && property.amenities.toLowerCase().includes(selectedAmenity));
        
        const matchesLocation = !selectedLocation || 
            (property.location && property.location.toLowerCase().includes(selectedLocation));
        
        return matchesSearch && matchesType && matchesAmenity && matchesLocation;
    });

    updateDisplay();
}

// Populate location dropdown from data
function populateLocationDropdown() {
    // Get unique locations from properties
    const locations = [...new Set(properties
        .map(property => property.location)
        .filter(location => location && location.trim() !== '')
    )].sort();
    
    // Clear existing options except the first one
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    
    // Add locations from data
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.toLowerCase();
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Update display
function updateDisplay() {
    totalPropertiesSpan.textContent = properties.length;
    filteredPropertiesSpan.textContent = filteredProperties.length;
    
    // Populate location dropdown when data changes
    populateLocationDropdown();

    if (filteredProperties.length === 0) {
        propertiesContainer.innerHTML = `
            <div class="no-data">
                <p>🔍 No properties match your current filters. Try adjusting your search criteria.</p>
            </div>
        `;
        
        // Update map if it's visible
        if (map && mapContainer.style.display !== 'none') {
            updateMap();
        }
        return;
    }

    propertiesContainer.innerHTML = `
        <table class="properties-table">
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Amenities</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredProperties.map(property => createPropertyRow(property)).join('')}
            </tbody>
        </table>
    `;
    
    // Update map if it's visible
    if (map && mapContainer.style.display !== 'none') {
        updateMap();
    }
    
    // Update statistics
    updateStats();
}

// Create property row
function createPropertyRow(property) {
    const amenities = property.amenities ? property.amenities.split(',').map(a => a.trim()) : [];
    const amenityTags = amenities.map(amenity => 
        `<span class="amenity-tag">${amenity}</span>`
    ).join('');

    const location = property.location ? escapeHtml(property.location) : '-';
    const price = property.price ? `£${escapeHtml(property.price)}/night` : '-';
    const type = escapeHtml(property.type || 'Property');

    return `
        <tr>
            <td>
                <div class="property-name">${escapeHtml(property.name)}</div>
            </td>
            <td>
                <span class="property-type">${type}</span>
            </td>
            <td>
                <div class="property-location">${location}</div>
            </td>
            <td>
                <div class="property-price">${price}</div>
            </td>
            <td>
                <div class="property-amenities">${amenityTags}</div>
            </td>
            <td class="property-actions">
                <button onclick="showPropertyDetails('${property.name}')" class="btn-details">
                    📋 Details
                </button>
                <a href="${property.url}" target="_blank" class="property-url">
                    🔗 View
                </a>
            </td>
        </tr>
    `;
}

// Open property in new tab
function openProperty(url) {
    window.open(url, '_blank');
}

// Show property details modal
function showPropertyDetails(propertyName) {
    const property = properties.find(p => p.name === propertyName);
    if (!property) return;
    
    const modal = document.getElementById('propertyModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalBookingLink = document.getElementById('modalBookingLink');
    
    // Set title
    modalTitle.textContent = property.name;
    
    // Set booking link
    modalBookingLink.href = property.url;
    
    // Create detailed content
    const amenities = property.amenities ? property.amenities.split(',').map(a => a.trim()) : [];
    const amenityItems = amenities.map(amenity => 
        `<span class="amenity-item">${escapeHtml(amenity)}</span>`
    ).join('');
    
    const coordinates = property.latitude && property.longitude ? 
        `${property.latitude}, ${property.longitude}` : 'Not provided';
    
    modalBody.innerHTML = `
        <div class="property-details">
            <div class="detail-section">
                <h3>🏠 Basic Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Property Name</div>
                        <div class="detail-value">${escapeHtml(property.name)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Type</div>
                        <div class="detail-value">${escapeHtml(property.type || 'Not specified')}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${escapeHtml(property.location || 'Not specified')}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Price per Night</div>
                        <div class="detail-value">${property.price ? `£${escapeHtml(property.price)}` : 'Not specified'}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section coordinates">
                <h3>📍 Coordinates</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Latitude</div>
                        <div class="detail-value">${property.latitude || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Longitude</div>
                        <div class="detail-value">${property.longitude || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Full Coordinates</div>
                        <div class="detail-value">${coordinates}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>🏷️ Amenities</h3>
                <div class="amenities-list">
                    ${amenityItems || '<span class="detail-value">No amenities listed</span>'}
                </div>
            </div>
            
            ${property.description ? `
            <div class="detail-section">
                <h3>📝 Description</h3>
                <div class="detail-value">${escapeHtml(property.description)}</div>
            </div>
            ` : ''}
            
            <div class="detail-section">
                <h3>🔗 Booking Information</h3>
                <div class="detail-item">
                    <div class="detail-label">Booking URL</div>
                    <div class="detail-value">
                        <a href="${property.url}" target="_blank" style="color: #667eea; word-break: break-all;">
                            ${escapeHtml(property.url)}
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>📱 QR Code</h3>
                <div class="qr-code-section">
                    <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
                        Scan this QR code to quickly access the booking page on your mobile device:
                    </p>
                    <div id="qrCodeContainer" style="text-align: center; margin: 20px 0;">
                        <canvas id="qrCodeCanvas" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 15px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Generate QR code with a small delay to ensure modal is rendered
    setTimeout(() => {
        generateQRCode(property.url);
    }, 100);
}

// Close property details modal
function closePropertyModal() {
    const modal = document.getElementById('propertyModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('propertyModal');
    if (event.target === modal) {
        closePropertyModal();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate QR code for URL
function generateQRCode(url) {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) {
        console.error('QR Code canvas not found');
        return;
    }
    
    // Check if qrcode library is loaded
    if (typeof qrcode === 'undefined') {
        console.error('QRCode library not loaded');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#dc3545';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Library Not Loaded', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Please refresh the page', canvas.width / 2, canvas.height / 2 + 10);
        return;
    }
    
    console.log('Generating QR code for URL:', url);
    
    // Set canvas size
    canvas.width = 200;
    canvas.height = 200;
    
    // Clear any existing QR code
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Show loading message
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generating QR Code...', canvas.width / 2, canvas.height / 2);
    
    try {
        // Create QR code using qrcode-generator library
        const qr = qrcode(0, 'M'); // 0 = auto, M = medium error correction
        qr.addData(url);
        qr.make();
        
        // Get QR code size
        const qrSize = qr.getModuleCount();
        const cellSize = Math.floor(200 / qrSize);
        const offset = Math.floor((200 - qrSize * cellSize) / 2);
        
        // Clear canvas and set background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 200, 200);
        
        // Draw QR code
        ctx.fillStyle = '#000000';
        for (let row = 0; row < qrSize; row++) {
            for (let col = 0; col < qrSize; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(
                        offset + col * cellSize,
                        offset + row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
        
        console.log('QR Code generated successfully');
        
    } catch (error) {
        console.error('QR Code generation error:', error);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#dc3545';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Generation Failed', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText(error.message || 'Unknown error', canvas.width / 2, canvas.height / 2 + 10);
    }
}

// Show message
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Handle add property form submission
function handleAddProperty(event) {
    event.preventDefault();
    
    const newProperty = {
        name: document.getElementById('propName').value.trim(),
        url: document.getElementById('propUrl').value.trim(),
        type: document.getElementById('propType').value,
        location: document.getElementById('propLocation').value.trim(),
        price: document.getElementById('propPrice').value.trim(),
        amenities: document.getElementById('propAmenities').value.trim(),
        description: document.getElementById('propDescription').value.trim(),
        latitude: document.getElementById('propLatitude').value.trim(),
        longitude: document.getElementById('propLongitude').value.trim()
    };
    
    // Validate required fields
    if (!newProperty.name || !newProperty.url || !newProperty.type) {
        showMessage('Please fill in all required fields (Name, URL, Type)', 'error');
        return;
    }
    
    // Add to properties array
    properties.push(newProperty);
    filteredProperties = [...properties];
    
    // Debug: Log the added property to see if coordinates are included
    console.log('Added property:', newProperty);
    console.log('All properties:', properties);
    
    // Update display
    updateDisplay();
    
    // Clear form
    addPropertyForm.reset();
    
    // Show success message
    showMessage(`Property "${newProperty.name}" added successfully!`, 'success');
}

// Download CSV function
function downloadCSV() {
    if (properties.length === 0) {
        showMessage('No properties to download', 'error');
        return;
    }
    
    // Create CSV content
    const headers = ['name', 'url', 'type', 'amenities', 'description', 'price', 'location', 'latitude', 'longitude'];
    
    // Debug: Log properties before CSV creation
    console.log('Properties being exported:', properties);
    
    const csvContent = [
        headers.join(','),
        ...properties.map(property => 
            headers.map(header => {
                let value = property[header] || '';
                // Handle empty coordinates specifically
                if ((header === 'latitude' || header === 'longitude') && value === '') {
                    value = '';
                }
                // Escape quotes and wrap in quotes if contains comma
                return value.includes(',') || value.includes('"') ? 
                    `"${value.replace(/"/g, '""')}"` : value;
            }).join(',')
        )
    ].join('\n');
    
    // Debug: Log the CSV content
    console.log('CSV content being downloaded:', csvContent);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stays.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage(`Downloaded ${properties.length} properties as stays.csv`, 'success');
}

// Show table view
function showTableView() {
    propertiesContainer.style.display = 'block';
    mapContainer.style.display = 'none';
    tableViewBtn.classList.add('active');
    mapViewBtn.classList.remove('active');
}

// Show map view
function showMapView() {
    propertiesContainer.style.display = 'none';
    mapContainer.style.display = 'block';
    mapViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');
    
    if (!map) {
        initMap();
    } else {
        updateMap();
    }
}

// Initialize map
function initMap() {
    const mapDiv = document.getElementById('map');
    
    // Initialize Leaflet map
    map = L.map('map').setView([-40.9006, 174.8860], 6); // Center on New Zealand
    
    // Define tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        name: 'Street Map'
    });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        name: 'Satellite'
    });
    
    // Add layer control
    const baseMaps = {
        "Street Map": osmLayer,
        "Satellite": satelliteLayer
    };
    
    L.control.layers(baseMaps).addTo(map);
    
    // Add default layer
    osmLayer.addTo(map);
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    updateMap();
}

// Update map with current properties
function updateMap() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (filteredProperties.length === 0) {
        return;
    }
    
    // Add markers for each property
    const bounds = L.latLngBounds();
    
    filteredProperties.forEach(property => {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for property: ${property.name}`);
            return;
        }
        
        const location = property.location || 'Unknown Location';
        const price = property.price ? `£${property.price}/night` : 'Price not available';
        const amenities = property.amenities ? property.amenities.split(',').map(a => a.trim()).join(', ') : 'No amenities listed';
        
        // Create custom icon based on property type
        const iconColor = getPropertyTypeColor(property.type);
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: ${iconColor};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
            ">${getPropertyTypeIcon(property.type)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        
        // Create popup content
        const popupContent = `
            <div style="min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: 600; font-size: 16px; color: #333; margin-bottom: 8px;">
                    ${escapeHtml(property.name)}
                </div>
                <div style="color: #666; font-size: 14px; margin-bottom: 6px;">
                    📍 ${escapeHtml(location)}
                </div>
                <div style="color: #2e7d32; font-weight: 500; font-size: 14px; margin-bottom: 6px;">
                    ${price}
                </div>
                <div style="color: #667eea; font-size: 12px; margin-bottom: 8px; text-transform: capitalize;">
                    ${escapeHtml(property.type || 'Property')}
                </div>
                <div style="color: #666; font-size: 12px; margin-bottom: 10px;">
                    ${escapeHtml(amenities)}
                </div>
                <a href="${property.url}" target="_blank" style="
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                ">View Listing</a>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markers.push(marker);
        bounds.extend([lat, lng]);
    });
    
    // Fit map to show all markers
    if (markers.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

// Update statistics display
function updateStats() {
    const totalProperties = properties.length;
    const filteredCount = filteredProperties.length;
    
    document.getElementById('totalProperties').textContent = totalProperties;
    document.getElementById('filteredProperties').textContent = filteredCount;
}

// Get color for property type
function getPropertyTypeColor(type) {
    const colors = {
        'apartment': '#667eea',
        'hotel': '#e74c3c',
        'house': '#27ae60',
        'villa': '#f39c12',
        'condo': '#9b59b6'
    };
    return colors[type] || '#95a5a6';
}

// Get icon for property type
function getPropertyTypeIcon(type) {
    const icons = {
        'apartment': '🏢',
        'hotel': '🏨',
        'house': '🏠',
        'villa': '🏖️',
        'condo': '🏬'
    };
    return icons[type] || '🏠';
}

// Coordinate picker functions
function openCoordinatePicker() {
    const modal = document.getElementById('coordinateModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialize coordinate map if not already done
    if (!coordinateMap) {
        initCoordinateMap();
    }
}

function initCoordinateMap() {
    // Initialize Leaflet map for coordinate picking
    coordinateMap = L.map('coordinateMap').setView([-40.9006, 174.8860], 6); // Center on New Zealand
    
    // Define tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        name: 'Street Map'
    });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        name: 'Satellite'
    });
    
    // Add layer control
    const baseMaps = {
        "Street Map": osmLayer,
        "Satellite": satelliteLayer
    };
    
    L.control.layers(baseMaps).addTo(coordinateMap);
    
    // Add default layer
    osmLayer.addTo(coordinateMap);
    
    // Add click event listener to map
    coordinateMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        selectedCoordinates = { lat: lat, lng: lng };
        
        // Update display
        document.getElementById('selectedLat').textContent = lat.toFixed(6);
        document.getElementById('selectedLng').textContent = lng.toFixed(6);
        
        // Enable use button
        document.getElementById('useCoordsBtn').disabled = false;
        
        // Add marker at clicked location
        coordinateMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                coordinateMap.removeLayer(layer);
            }
        });
        
        L.marker([lat, lng]).addTo(coordinateMap);
    });
}

function useSelectedCoordinates() {
    if (selectedCoordinates) {
        document.getElementById('propLatitude').value = selectedCoordinates.lat.toFixed(6);
        document.getElementById('propLongitude').value = selectedCoordinates.lng.toFixed(6);
        closeCoordinateModal();
        showMessage('Coordinates added to form!', 'success');
    }
}

function closeCoordinateModal() {
    const modal = document.getElementById('coordinateModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset selection
    selectedCoordinates = null;
    document.getElementById('selectedLat').textContent = 'Click on map';
    document.getElementById('selectedLng').textContent = 'Click on map';
    document.getElementById('useCoordsBtn').disabled = true;
}

// URL loader functions
function openUrlModal() {
    const modal = document.getElementById('urlModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Clear previous URL
    document.getElementById('csvUrl').value = '';
}

function closeUrlModal() {
    const modal = document.getElementById('urlModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function loadFromUrl() {
    const url = document.getElementById('csvUrl').value.trim();
    const loadBtn = document.getElementById('loadUrlBtn');
    
    if (!url) {
        showMessage('Please enter a valid URL', 'error');
        return;
    }
    
    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        showMessage('Please enter a valid URL format', 'error');
        return;
    }
    
    // Show loading state
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText.trim()) {
            throw new Error('The CSV file appears to be empty');
        }
        
        // Parse and load the CSV data
        const newProperties = parseCSV(csvText);
        
        if (newProperties.length === 0) {
            throw new Error('No valid data found in the CSV file');
        }
        
        // Replace current data
        properties = newProperties;
        filteredProperties = [...properties];
        updateDisplay();
        
        showMessage(`Successfully loaded ${newProperties.length} properties from URL!`, 'success');
        closeUrlModal();
        
    } catch (error) {
        console.error('Error loading CSV from URL:', error);
        showMessage(`Error loading CSV: ${error.message}`, 'error');
    } finally {
        // Reset button state
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load CSV';
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    // Try to load stays.csv, show message if no data exists
    try {
        const response = await fetch('stays.csv');
        if (response.ok) {
            const csvText = await response.text();
            if (csvText.trim()) {
                const csvProperties = parseCSV(csvText);
                if (csvProperties.length > 0) {
                    properties = csvProperties;
                    filteredProperties = [...properties];
                    updateDisplay();
                    showMessage(`Loaded ${csvProperties.length} properties from stays.csv`, 'success');
                    return;
                } else {
                    console.log('stays.csv is empty or has no valid data');
                    showMessage('stays.csv file is empty or contains no valid properties', 'error');
                    return;
                }
            } else {
                console.log('stays.csv is empty');
                showMessage('stays.csv file is empty', 'error');
                return;
            }
        } else if (response.status === 404) {
            // File not found - show message that data needs to be loaded
            console.log('stays.csv not found');
            showMessage('No data loaded. Please upload a CSV file or load sample data to get started.', 'error');
            return;
        } else {
            // Other HTTP error
            console.log(`Error loading stays.csv: ${response.status} ${response.statusText}`);
            showMessage(`Error loading stays.csv: ${response.status} ${response.statusText}`, 'error');
            return;
        }
    } catch (error) {
        // Network or parsing error
        console.log('Error loading stays.csv:', error.message);
        showMessage(`Error loading stays.csv: ${error.message}`, 'error');
        return;
    }
});
