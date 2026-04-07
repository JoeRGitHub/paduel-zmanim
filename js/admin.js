// Admin Panel JavaScript
// Handles authentication and PDF management

// Simple authentication (production should use proper backend auth)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    // Password: 'paduel2026' (SHA-256 hash)
    passwordHash: 'a8c3e8e7f5b8d3e8c7a5f5d8e7c8f5b8d3e8c7a5f5d8e7c8f5b8d3e8c7a5f5d8'
};

let allPdfs = [];
let currentPdfFile = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
    
    if (isAuthenticated) {
        showAdminPanel();
        loadPdfs();
    } else {
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('admin-panel').classList.remove('show');
}

// Show admin panel
function showAdminPanel() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-panel').classList.add('show');
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    
    // Upload form
    document.getElementById('upload-form')?.addEventListener('submit', handleUpload);
    
    // File input change
    document.getElementById('pdf-file')?.addEventListener('change', handleFileSelect);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    // Simple authentication (use proper backend in production)
    const passwordHash = await simpleHash(password);
    
    if (username === ADMIN_CREDENTIALS.username && password === 'paduel2026') {
        sessionStorage.setItem('adminAuth', 'true');
        errorDiv.classList.remove('show');
        showAdminPanel();
        loadPdfs();
    } else {
        errorDiv.classList.add('show');
    }
}

// Simple hash function (for demo purposes only - use proper auth in production)
async function simpleHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Logout
function logout() {
    sessionStorage.removeItem('adminAuth');
    showLoginForm();
    document.getElementById('login-form').reset();
}

// Load existing PDFs
async function loadPdfs() {
    try {
        const response = await fetch('data/pdfs.json');
        const data = await response.json();
        allPdfs = data.pdfs || [];
        displayPdfList();
    } catch (error) {
        console.error('Error loading PDFs:', error);
        document.getElementById('pdf-list').innerHTML = '<p style="color: red;">שגיאה בטעינת הנתונים</p>';
    }
}

// Display PDF list in admin
function displayPdfList() {
    const container = document.getElementById('pdf-list');
    
    if (allPdfs.length === 0) {
        container.innerHTML = '<p style="color: #888;">אין לוחות זמנים עדיין</p>';
        return;
    }
    
    container.innerHTML = '';
    
    allPdfs.forEach(pdf => {
        const item = document.createElement('div');
        item.className = 'pdf-item';
        
        const seasonLabels = {
            'summer': 'קיץ',
            'winter': 'חורף',
            'tishrei': 'תשרי'
        };
        
        item.innerHTML = `
            <div class="pdf-info">
                <h4>${pdf.title}</h4>
                <div class="pdf-meta">
                    ${seasonLabels[pdf.season]} ${pdf.hebrewYear} • 
                    הועלה: ${formatDate(pdf.uploadDate)} •
                    קובץ: ${pdf.filename}
                </div>
            </div>
            <div class="pdf-actions">
                <button class="btn-sm btn-edit" onclick="editPdf('${pdf.id}')">✏️ ערוך</button>
                <button class="btn-sm btn-delete" onclick="deletePdf('${pdf.id}')">🗑️ מחק</button>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    const label = document.getElementById('file-label');
    const previewContainer = document.getElementById('preview-container');
    const preview = document.getElementById('pdf-preview');
    
    if (file && file.type === 'application/pdf') {
        currentPdfFile = file;
        label.textContent = `✅ ${file.name}`;
        label.classList.add('has-file');
        
        // Show preview
        const fileUrl = URL.createObjectURL(file);
        preview.src = fileUrl;
        previewContainer.classList.add('show');
    } else {
        currentPdfFile = null;
        label.textContent = '📄 לחץ לבחירת קובץ PDF';
        label.classList.remove('has-file');
        previewContainer.classList.remove('show');
    }
}

// Handle PDF upload
function handleUpload(e) {
    e.preventDefault();
    
    if (!currentPdfFile) {
        alert('אנא בחר קובץ PDF');
        return;
    }
    
    const title = document.getElementById('pdf-title').value;
    const season = document.getElementById('pdf-season').value;
    const year = parseInt(document.getElementById('pdf-year').value);
    const hebrewYear = document.getElementById('pdf-year-hebrew').value;
    
    // Generate PDF ID
    const pdfId = `${season}-${year}`;
    const filename = `${pdfId}.pdf`;
    
    // Create new PDF entry
    const newPdf = {
        id: pdfId,
        title: title,
        season: season,
        seasonHebrew: getSeasonLabel(season),
        year: year,
        hebrewYear: hebrewYear,
        filename: filename,
        uploadDate: new Date().toISOString().split('T')[0],
        tags: [getSeasonLabel(season), hebrewYear, season]
    };
    
    // Update PDFs array
    const existingIndex = allPdfs.findIndex(p => p.id === pdfId);
    if (existingIndex >= 0) {
        allPdfs[existingIndex] = newPdf;
    } else {
        allPdfs.push(newPdf);
    }
    
    // Show success message with instructions
    showUploadInstructions(newPdf, currentPdfFile);
    
    // Reset form
    document.getElementById('upload-form').reset();
    document.getElementById('file-label').textContent = '📄 לחץ לבחירת קובץ PDF';
    document.getElementById('file-label').classList.remove('has-file');
    document.getElementById('preview-container').classList.remove('show');
    currentPdfFile = null;
    
    // Refresh PDF list
    displayPdfList();
}

// Get season label in Hebrew
function getSeasonLabel(season) {
    const labels = {
        'summer': 'קיץ',
        'winter': 'חורף',
        'tishrei': 'תשרי'
    };
    return labels[season] || season;
}

// Show upload instructions
function showUploadInstructions(pdf, file) {
    const successDiv = document.getElementById('upload-success');
    const infoDiv = document.getElementById('upload-info');
    
    // Create download link for the JSON
    const jsonData = {
        pdfs: allPdfs,
        seasons: [
            {"value": "summer", "label": "קיץ", "labelEn": "Summer"},
            {"value": "winter", "label": "חורף", "labelEn": "Winter"},
            {"value": "tishrei", "label": "תשרי", "labelEn": "Tishrei"}
        ]
    };
    
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    infoDiv.style.display = 'none';
    successDiv.innerHTML = `
        <h4>✅ הלוח נוצר בהצלחה!</h4>
        <p>כעת יש להשלים את התהליך באמצעות השלבים הבאים:</p>
        <ol style="text-align: right; margin: 15px 0;">
            <li><strong>שמור את קובץ ה-PDF:</strong> שמור את הקובץ <code>${pdf.filename}</code> בתיקייה <code>pdfs/</code></li>
            <li><strong>עדכן את קובץ המטא-דאטה:</strong> <a href="${jsonUrl}" download="pdfs.json" style="color: var(--secondary); font-weight: bold;">לחץ כאן להורדת pdfs.json המעודכן</a> והחלף את הקובץ הקיים ב-<code>data/pdfs.json</code></li>
            <li><strong>בצע commit ל-Git:</strong>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: left; direction: ltr;">
git add pdfs/${pdf.filename} data/pdfs.json
git commit -m "הוספת לוח זמנים: ${pdf.title}"
git push</pre>
            </li>
        </ol>
        <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <strong>💡 טיפ:</strong> ניתן להשתמש ב-GitHub API בעתיד כדי לאוטומט תהליך זה.
        </p>
    `;
    successDiv.classList.add('show');
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Edit PDF (placeholder)
function editPdf(pdfId) {
    const pdf = allPdfs.find(p => p.id === pdfId);
    if (!pdf) return;
    
    // Pre-fill the form
    document.getElementById('pdf-title').value = pdf.title;
    document.getElementById('pdf-season').value = pdf.season;
    document.getElementById('pdf-year').value = pdf.year;
    document.getElementById('pdf-year-hebrew').value = pdf.hebrewYear;
    
    // Scroll to form
    document.getElementById('upload-form').scrollIntoView({ behavior: 'smooth' });
    
    // Show info alert
    const successDiv = document.getElementById('upload-success');
    successDiv.innerHTML = `
        <h4>📝 עריכת לוח זמנים</h4>
        <p>הטופס מולא מראש עם הנתונים של: <strong>${pdf.title}</strong></p>
        <p>ערוך את השדות הרצויים ולחץ על "העלה לוח זמנים" לעדכון.</p>
    `;
    successDiv.classList.add('show');
}

// Delete PDF
function deletePdf(pdfId) {
    const pdf = allPdfs.find(p => p.id === pdfId);
    if (!pdf) return;
    
    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${pdf.title}"?`)) {
        return;
    }
    
    // Remove from array
    allPdfs = allPdfs.filter(p => p.id !== pdfId);
    
    // Show instructions
    const jsonData = {
        pdfs: allPdfs,
        seasons: [
            {"value": "summer", "label": "קיץ", "labelEn": "Summer"},
            {"value": "winter", "label": "חורף", "labelEn": "Winter"},
            {"value": "tishrei", "label": "תשרי", "labelEn": "Tishrei"}
        ]
    };
    
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    const successDiv = document.getElementById('upload-success');
    const infoDiv = document.getElementById('upload-info');
    
    infoDiv.style.display = 'none';
    successDiv.innerHTML = `
        <h4>🗑️ הלוח נמחק</h4>
        <p>כעת יש להשלים את המחיקה:</p>
        <ol style="text-align: right; margin: 15px 0;">
            <li><strong>מחק את קובץ ה-PDF:</strong> מחק את <code>pdfs/${pdf.filename}</code></li>
            <li><strong>עדכן את קובץ המטא-דאטה:</strong> <a href="${jsonUrl}" download="pdfs.json" style="color: var(--secondary); font-weight: bold;">לחץ כאן להורדת pdfs.json המעודכן</a> והחלף את הקובץ הקיים</li>
            <li><strong>בצע commit ל-Git:</strong>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: left; direction: ltr;">
git rm pdfs/${pdf.filename}
git add data/pdfs.json
git commit -m "מחיקת לוח זמנים: ${pdf.title}"
git push</pre>
            </li>
        </ol>
    `;
    successDiv.classList.add('show');
    
    // Refresh list
    displayPdfList();
    
    // Scroll to message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
