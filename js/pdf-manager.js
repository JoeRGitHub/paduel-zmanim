// PDF Manager - Handles loading, filtering, and displaying PDFs
let allPdfs = [];
let filteredPdfs = [];
let seasons = [];

// Load PDF data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadPdfs();
    populateFilters();
    displayPdfs(allPdfs);
    setupEventListeners();
});

// Load PDF metadata from JSON
async function loadPdfs() {
    try {
        const response = await fetch('data/pdfs.json');
        const data = await response.json();
        allPdfs = data.pdfs || [];
        seasons = data.seasons || [];
        filteredPdfs = [...allPdfs];
    } catch (error) {
        console.error('Error loading PDFs:', error);
        showError('שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.');
    }
}

// Populate filter dropdowns
function populateFilters() {
    const seasonFilter = document.getElementById('season-filter');
    const yearFilter = document.getElementById('year-filter');
    
    // Populate seasons
    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season.value;
        option.textContent = season.label;
        seasonFilter.appendChild(option);
    });
    
    // Get unique years and sort descending
    const years = [...new Set(allPdfs.map(pdf => pdf.year))].sort((a, b) => b - a);
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        const pdf = allPdfs.find(p => p.year === year);
        option.textContent = pdf ? pdf.hebrewYear : year;
        yearFilter.appendChild(option);
    });
}

// Setup event listeners for filters and search
function setupEventListeners() {
    const searchInput = document.getElementById('search');
    const seasonFilter = document.getElementById('season-filter');
    const yearFilter = document.getElementById('year-filter');
    
    searchInput.addEventListener('input', applyFilters);
    seasonFilter.addEventListener('change', applyFilters);
    yearFilter.addEventListener('change', applyFilters);
}

// Apply all filters
function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const selectedSeason = document.getElementById('season-filter').value;
    const selectedYear = document.getElementById('year-filter').value;
    
    filteredPdfs = allPdfs.filter(pdf => {
        // Search filter
        const matchesSearch = !searchTerm || 
            pdf.title.toLowerCase().includes(searchTerm) ||
            pdf.seasonHebrew.toLowerCase().includes(searchTerm) ||
            pdf.hebrewYear.includes(searchTerm) ||
            pdf.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        // Season filter
        const matchesSeason = !selectedSeason || pdf.season === selectedSeason;
        
        // Year filter
        const matchesYear = !selectedYear || pdf.year.toString() === selectedYear;
        
        return matchesSearch && matchesSeason && matchesYear;
    });
    
    displayPdfs(filteredPdfs);
}

// Reset all filters
function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('season-filter').value = '';
    document.getElementById('year-filter').value = '';
    applyFilters();
}

// Display PDFs in grid
function displayPdfs(pdfs) {
    const container = document.getElementById('pdf-container');
    
    if (pdfs.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>לא נמצאו תוצאות</h3>
                <p>נסה לשנות את הפילטרים או את מילות החיפוש</p>
            </div>
        `;
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'pdf-grid';
    
    pdfs.forEach(pdf => {
        const card = createPdfCard(pdf);
        grid.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(grid);
}

// Create a PDF card element
function createPdfCard(pdf) {
    const card = document.createElement('div');
    card.className = 'pdf-card';
    
    const seasonClass = pdf.season;
    const seasonLabel = pdf.seasonHebrew;
    const formattedDate = formatHebrewDate(pdf.uploadDate);
    
    card.innerHTML = `
        <div class="season-badge ${seasonClass}">${seasonLabel}</div>
        <h3>${pdf.title}</h3>
        <div class="year">${pdf.hebrewYear}</div>
        <div class="date">הועלה: ${formattedDate}</div>
        <div class="actions">
            <button class="view-btn" onclick="viewPdf('${pdf.id}')">צפייה</button>
            <button class="download-btn" onclick="downloadPdf('${pdf.id}')">הורדה</button>
        </div>
    `;
    
    return card;
}

// Format date to Hebrew
function formatHebrewDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// View PDF in modal
function viewPdf(pdfId) {
    const pdf = allPdfs.find(p => p.id === pdfId);
    if (!pdf) return;
    
    const modal = document.getElementById('pdf-modal');
    const modalTitle = document.getElementById('modal-title');
    const pdfViewer = document.getElementById('pdf-viewer');
    
    modalTitle.textContent = pdf.title;
    pdfViewer.src = `pdfs/${pdf.filename}`;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('pdf-modal');
    const pdfViewer = document.getElementById('pdf-viewer');
    
    modal.classList.remove('active');
    pdfViewer.src = '';
    document.body.style.overflow = '';
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Close modal on background click
document.getElementById('pdf-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'pdf-modal') {
        closeModal();
    }
});

// Download PDF
function downloadPdf(pdfId) {
    const pdf = allPdfs.find(p => p.id === pdfId);
    if (!pdf) return;
    
    const link = document.createElement('a');
    link.href = `pdfs/${pdf.filename}`;
    link.download = pdf.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show error message
function showError(message) {
    const container = document.getElementById('pdf-container');
    container.innerHTML = `
        <div class="no-results">
            <h3>⚠️ שגיאה</h3>
            <p>${message}</p>
        </div>
    `;
}
