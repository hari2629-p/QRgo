/**
 * QRgo - Custom QR Code Generator
 * Using qr-code-styling library for reliable generation
 */

class QRGenerator {
    constructor() {
        this.previewContainer = document.getElementById('preview-container');
        this.qrCode = null;
        this.logoImage = null;
        this.logoDataUrl = null;

        this.settings = {
            content: 'https://example.com',
            size: 300,
            fgColor: '#1a1a2e',
            bgColor: '#ffffff',
            transparent: false,
            errorCorrection: 'M',
            shape: 'square',
            gradient: false,
            gradientStart: '#667eea',
            gradientEnd: '#764ba2',
            logoSize: 25
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.generateQR();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);

                // Update nav
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Update sections
                document.getElementById('generator').classList.add('hidden');
                document.getElementById('history').classList.add('hidden');
                document.getElementById('features').classList.add('hidden');

                const targetSection = document.getElementById(targetId);
                if (targetSection) targetSection.classList.remove('hidden');

                if (targetId === 'history') {
                    this.renderHistory();
                }
            });
        });

        // Content input
        const contentInput = document.getElementById('qr-content');
        contentInput.addEventListener('input', (e) => {
            this.settings.content = e.target.value || 'https://example.com';
            this.debounceGenerate();
        });

        // Shape buttons
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.shape = btn.dataset.shape;
                this.generateQR();
            });
        });

        // Foreground color
        document.getElementById('fg-color').addEventListener('input', (e) => {
            this.settings.fgColor = e.target.value;
            this.generateQR();
        });

        // Background color
        document.getElementById('bg-color').addEventListener('input', (e) => {
            this.settings.bgColor = e.target.value;
            this.generateQR();
        });

        // Gradient toggle
        const gradientToggle = document.getElementById('gradient-toggle');
        const gradientColors = document.getElementById('gradient-colors');
        gradientToggle.addEventListener('change', (e) => {
            this.settings.gradient = e.target.checked;
            gradientColors.classList.toggle('hidden', !e.target.checked);
            this.generateQR();
        });

        // Gradient colors
        document.getElementById('gradient-start').addEventListener('input', (e) => {
            this.settings.gradientStart = e.target.value;
            this.generateQR();
        });
        document.getElementById('gradient-end').addEventListener('input', (e) => {
            this.settings.gradientEnd = e.target.value;
            this.generateQR();
        });

        // Transparent toggle
        document.getElementById('transparent-toggle').addEventListener('change', (e) => {
            this.settings.transparent = e.target.checked;
            this.generateQR();
        });

        // Logo upload
        const logoUpload = document.getElementById('logo-upload');
        const removeLogoBtn = document.getElementById('remove-logo');
        const logoSizeControl = document.getElementById('logo-size-control');

        logoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.logoDataUrl = event.target.result;
                    removeLogoBtn.classList.remove('hidden');
                    logoSizeControl.classList.remove('hidden');
                    document.querySelector('.file-label').textContent = file.name.substring(0, 15) + '...';
                    document.getElementById('error-correction').value = 'H';
                    this.settings.errorCorrection = 'H';
                    this.generateQR();
                };
                reader.readAsDataURL(file);
            }
        });

        removeLogoBtn.addEventListener('click', () => {
            this.logoDataUrl = null;
            logoUpload.value = '';
            removeLogoBtn.classList.add('hidden');
            logoSizeControl.classList.add('hidden');
            document.querySelector('.file-label').textContent = 'Upload Logo';
            this.generateQR();
        });

        // Logo size
        const logoSize = document.getElementById('logo-size');
        const logoSizeValue = document.getElementById('logo-size-value');
        logoSize.addEventListener('input', (e) => {
            this.settings.logoSize = parseInt(e.target.value);
            logoSizeValue.textContent = e.target.value + '%';
            this.generateQR();
        });

        // QR size
        const qrSize = document.getElementById('qr-size');
        const qrSizeValue = document.getElementById('qr-size-value');
        qrSize.addEventListener('input', (e) => {
            this.settings.size = parseInt(e.target.value);
            qrSizeValue.textContent = e.target.value + 'px';
            this.generateQR();
        });

        // Error correction
        document.getElementById('error-correction').addEventListener('change', (e) => {
            this.settings.errorCorrection = e.target.value;
            this.generateQR();
        });

        // Download buttons
        document.getElementById('download-png').addEventListener('click', () => this.downloadPNG());
        document.getElementById('download-svg').addEventListener('click', () => this.downloadSVG());
        document.getElementById('download-pdf').addEventListener('click', () => this.downloadPDF());

        // Clear history
        document.getElementById('clear-history').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all history?')) {
                localStorage.removeItem('qr_history');
                this.renderHistory();
                this.showToast('History cleared');
            }
        });
    }

    debounceGenerate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.generateQR();
            this.saveToHistory();
        }, 500); // Increased delay to verify user finished typing
    }

    saveToHistory() {
        const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: this.settings.content,
            settings: { ...this.settings },
            logoDataUrl: this.logoDataUrl
        };

        // Add to beginning
        history.unshift(newItem);

        // Limit to 50 items
        if (history.length > 50) history.pop();

        localStorage.setItem('qr_history', JSON.stringify(history));
    }

    renderHistory() {
        const historyList = document.getElementById('history-list');
        const history = JSON.parse(localStorage.getItem('qr_history') || '[]');

        // Update stats
        document.getElementById('total-codes').textContent = history.length;
        if (history.length > 0) {
            const lastDate = new Date(history[0].timestamp);
            document.getElementById('latest-time').textContent = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            document.getElementById('latest-time').textContent = '-';
        }

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>No history yet. Create your first QR code!</p>
                </div>`;
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-thumb" id="thumb-${item.id}"></div>
                <div class="history-details">
                    <div class="history-content" title="${item.content}">${item.content}</div>
                    <div class="history-meta">
                        Created: ${new Date(item.timestamp).toLocaleString()}
                    </div>
                </div>
                <div class="history-actions-item">
                    <button class="btn-sm" onclick="app.loadFromHistory(${item.id})">Load Settings</button>
                    <button class="btn-sm" style="color: var(--error); border-color: rgba(239, 68, 68, 0.3);" onclick="app.deleteHistoryItem(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');

        // Generate thumbnails
        history.forEach(item => {
            const container = document.getElementById(`thumb-${item.id}`);
            if (container) {
                // Use a simplified QR for thumbnail
                try {
                    const qr = new QRCodeStyling({
                        width: 60,
                        height: 60,
                        data: item.content,
                        dotsOptions: { color: item.settings.fgColor, type: 'square' },
                        backgroundOptions: { color: item.settings.transparent ? 'transparent' : item.settings.bgColor }
                    });
                    qr.append(container);
                } catch (e) { console.error(e); }
            }
        });
    }

    loadFromHistory(id) {
        const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
        const item = history.find(i => i.id === id);
        if (item) {
            this.settings = { ...item.settings };
            this.logoDataUrl = item.logoDataUrl;

            // Update UI inputs
            document.getElementById('qr-content').value = this.settings.content;
            document.getElementById('fg-color').value = this.settings.fgColor;
            document.getElementById('bg-color').value = this.settings.bgColor;
            document.getElementById('transparent-toggle').checked = this.settings.transparent;
            document.getElementById('gradient-toggle').checked = this.settings.gradient;

            if (this.settings.gradient) {
                document.getElementById('gradient-colors').classList.remove('hidden');
            } else {
                document.getElementById('gradient-colors').classList.add('hidden');
            }

            document.getElementById('gradient-start').value = this.settings.gradientStart;
            document.getElementById('gradient-end').value = this.settings.gradientEnd;

            // Update shape button state
            document.querySelectorAll('.shape-btn').forEach(btn => {
                if (btn.dataset.shape === this.settings.shape) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Handle logo UI
            const removeLogoBtn = document.getElementById('remove-logo');
            const logoSizeControl = document.getElementById('logo-size-control');
            if (this.logoDataUrl) {
                removeLogoBtn.classList.remove('hidden');
                logoSizeControl.classList.remove('hidden');
                document.querySelector('.file-label').textContent = 'Logo Loaded';
            } else {
                removeLogoBtn.classList.add('hidden');
                logoSizeControl.classList.add('hidden');
                document.querySelector('.file-label').textContent = 'Upload Logo';
            }

            // Switch to generator tab
            document.querySelector('[data-tab="generator"]').click();

            this.generateQR();
            this.showToast('Settings loaded from history');
        }
    }

    deleteHistoryItem(id) {
        if (!confirm('Delete this item?')) return;
        const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
        const newHistory = history.filter(i => i.id !== id);
        localStorage.setItem('qr_history', JSON.stringify(newHistory));
        this.renderHistory();
    }

    getDotsType() {
        switch (this.settings.shape) {
            case 'square': return 'square';
            case 'rounded': return 'rounded';
            case 'dots': return 'dots';
            case 'diamond': return 'classy';
            default: return 'square';
        }
    }

    getCornersSquareType() {
        switch (this.settings.shape) {
            case 'square': return 'square';
            case 'rounded': return 'extra-rounded';
            case 'dots': return 'dot';
            case 'diamond': return 'extra-rounded';
            default: return 'square';
        }
    }

    getCornersDotType() {
        switch (this.settings.shape) {
            case 'square': return 'square';
            case 'rounded': return 'dot';
            case 'dots': return 'dot';
            case 'diamond': return 'dot';
            default: return 'square';
        }
    }

    generateQR() {
        if (!this.settings.content) return;

        try {
            // Remove old QR code
            this.previewContainer.innerHTML = '';
            const checkerBg = document.createElement('div');
            checkerBg.className = 'checkered-bg';
            this.previewContainer.appendChild(checkerBg);

            // Build options
            const options = {
                width: this.settings.size,
                height: this.settings.size,
                type: 'canvas',
                data: this.settings.content,
                dotsOptions: {
                    type: this.getDotsType()
                },
                cornersSquareOptions: {
                    type: this.getCornersSquareType()
                },
                cornersDotOptions: {
                    type: this.getCornersDotType()
                },
                qrOptions: {
                    errorCorrectionLevel: this.settings.errorCorrection
                }
            };

            // Apply colors
            if (this.settings.gradient) {
                options.dotsOptions.gradient = {
                    type: 'linear',
                    rotation: Math.PI / 4,
                    colorStops: [
                        { offset: 0, color: this.settings.gradientStart },
                        { offset: 1, color: this.settings.gradientEnd }
                    ]
                };
                options.cornersSquareOptions.gradient = {
                    type: 'linear',
                    rotation: Math.PI / 4,
                    colorStops: [
                        { offset: 0, color: this.settings.gradientStart },
                        { offset: 1, color: this.settings.gradientEnd }
                    ]
                };
                options.cornersDotOptions.gradient = {
                    type: 'linear',
                    rotation: Math.PI / 4,
                    colorStops: [
                        { offset: 0, color: this.settings.gradientStart },
                        { offset: 1, color: this.settings.gradientEnd }
                    ]
                };
            } else {
                options.dotsOptions.color = this.settings.fgColor;
                options.cornersSquareOptions.color = this.settings.fgColor;
                options.cornersDotOptions.color = this.settings.fgColor;
            }

            // Background
            if (this.settings.transparent) {
                options.backgroundOptions = {
                    color: 'transparent'
                };
            } else {
                options.backgroundOptions = {
                    color: this.settings.bgColor
                };
            }

            // Logo
            if (this.logoDataUrl) {
                options.image = this.logoDataUrl;
                options.imageOptions = {
                    crossOrigin: 'anonymous',
                    margin: 5,
                    imageSize: this.settings.logoSize / 100
                };
            }

            // Create new QR code
            this.qrCode = new QRCodeStyling(options);

            // Append to container
            this.qrCode.append(this.previewContainer);

            // Assign ID to generated canvas
            const generatedCanvas = this.previewContainer.querySelector('canvas');
            if (generatedCanvas) generatedCanvas.id = 'qr-canvas';

            this.updateStatus('success', 'Ready to scan');
        } catch (error) {
            console.error('QR generation error:', error);
            this.updateStatus('error', 'Error generating QR code');
        }
    }

    updateStatus(type, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        if (statusDot && statusText) {
            statusDot.className = 'status-dot ' + type;
            statusText.textContent = message;
            statusText.style.color = type === 'success' ? 'var(--success)' :
                type === 'warning' ? 'var(--warning)' : 'var(--error)';
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    downloadPNG() {
        if (this.qrCode) {
            this.qrCode.download({ name: 'qrcode', extension: 'png' });
            this.showToast('PNG downloaded successfully!');
        }
    }

    downloadSVG() {
        if (this.qrCode) {
            this.qrCode.download({ name: 'qrcode', extension: 'svg' });
            this.showToast('SVG downloaded successfully!');
        }
    }

    async downloadPDF() {
        if (!this.qrCode) return;

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const qrSize = 80;
            const x = (pageWidth - qrSize) / 2;
            const y = (pageHeight - qrSize) / 2 - 20;

            // Add title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(24);
            pdf.text('QR Code', pageWidth / 2, 30, { align: 'center' });

            // Get the canvas from QR code
            const canvas = this.previewContainer.querySelector('canvas');
            if (canvas) {
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);
            }

            // Add content text
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            const contentText = this.settings.content.length > 50
                ? this.settings.content.substring(0, 50) + '...'
                : this.settings.content;
            pdf.text(contentText, pageWidth / 2, y + qrSize + 15, { align: 'center' });

            // Add footer
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            pdf.text('Generated with QRgo', pageWidth / 2, pageHeight - 20, { align: 'center' });

            pdf.save('qrcode.pdf');
            this.showToast('PDF downloaded successfully!');
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showToast('Error generating PDF');
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QRGenerator();
});
