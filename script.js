// DOM elements
const urlInput = document.getElementById('urlInput');
const generateBtn = document.getElementById('generateBtn');
const qrcodeContainer = document.getElementById('qrcode');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const feedback = document.getElementById('feedback');
const sizeSelect = document.getElementById('sizeSelect');
const ecSelect = document.getElementById('ecSelect');
const colorInput = document.getElementById('colorInput');
const previewNote = document.getElementById('previewNote');

let lastText = '';
let lastDataURL = '';

const QR = window.QRCode;

// Map qrcodejs error correction levels
const ecMap = {
  'L': QR.CorrectLevel.L,
  'M': QR.CorrectLevel.M,
  'Q': QR.CorrectLevel.Q,
  'H': QR.CorrectLevel.H
};

/**
 * @description Clears the QR code area and resets state.
 */
const clearQRCode = () => {
  qrcodeContainer.innerHTML = '';
  lastDataURL = '';
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
};

/**
 * @description Enables download/copy actions and sets feedback.
 */
const enableActions = () => {
  if (!lastDataURL) return;
  downloadBtn.disabled = false;
  copyBtn.disabled = false;
  previewNote.textContent = '';
  feedback.textContent = 'QR ready. You can download or copy the URL.';
};

/**
 * @description Tries to extract an image dataURL from the generated qrcode element.
 * Handles img, canvas, or table (fallback to html2canvas).
 */
const makeDataURLFromQR = async () => {
  // 1) If there's an <img> inside, use its src (qrcodejs with `use-canvas=false`)
  const img = qrcodeContainer.querySelector('img');
  if (img && img.src) {
    lastDataURL = img.src;
    enableActions();
    return;
  }

  // 2) If there's a <canvas> inside, convert to dataURL
  const canvas = qrcodeContainer.querySelector('canvas');
  if (canvas) {
    try {
      lastDataURL = canvas.toDataURL('image/png');
      enableActions();
    } catch (err) {
      feedback.textContent = 'Could not get image from canvas.';
    }
    return;
  }

  // 3) If nothing (e.g., a table was rendered), fallback to html2canvas
  if (window.html2canvas) {
    try {
      const canvasCaptured = await html2canvas(qrcodeContainer, {
        backgroundColor: null,
        scale: 2, // Capture at 2x resolution for better quality
      });
      lastDataURL = canvasCaptured.toDataURL('image/png');
      enableActions();
    } catch (err) {
      feedback.textContent = 'Could not capture QR as image (html2canvas failed).';
      console.error(err);
    }
    return;
  }

  feedback.textContent = 'Unable to generate downloadable image for this QR.';
};

/**
 * @description Generates the QR code using qrcodejs.
 */
const generateQRCode = (text, size, correctLevel, color) => {
  clearQRCode();
  
  // Create a new QR code instance
  // Note: qrcodejs will render a table, canvas, or img depending on its internal logic.
  new QR(qrcodeContainer, {
    text: text,
    width: parseInt(size, 10),
    height: parseInt(size, 10),
    correctLevel: ecMap[correctLevel] || QR.CorrectLevel.M,
    colorDark : color || "#000000",
    colorLight : "#ffffff" // Always white for light color
  });

  // Wait a short time for qrcodejs to finish rendering (especially the table-to-canvas-to-img path)
  setTimeout(makeDataURLFromQR, 200);
};

// --- Event Listeners ---

// Generate button click
generateBtn.addEventListener('click', () => {
  const text = urlInput.value.trim();
  if (!text) {
    feedback.textContent = 'Please enter a URL or text.';
    clearQRCode();
    previewNote.textContent = 'Your QR will appear here after you click Generate.';
    return;
  }
  
  const size = sizeSelect.value;
  const ecLevel = ecSelect.value;
  const color = colorInput.value;

  feedback.textContent = 'Generating QR...';
  lastText = text;
  generateQRCode(text, size, ecLevel, color);
});

// Download button handler
downloadBtn.addEventListener('click', () => {
  if (!lastDataURL) { 
    feedback.textContent = 'Nothing to download.'; 
    return; 
  }
  
  const a = document.createElement('a');
  a.href = lastDataURL;
  // Sanitize filename from input
  const raw = lastText || 'qr';
  const safe = raw.replace(/[^a-z0-9\-_.]/gi, '_').slice(0, 40) || 'qr';
  a.download = `${safe}.png`;
  
  document.body.appendChild(a);
  a.click();
  a.remove();
  feedback.textContent = 'Downloaded!';
});

// Copy URL (text) to clipboard
copyBtn.addEventListener('click', async () => {
  if (!lastText) { 
    feedback.textContent = 'Nothing to copy.'; 
    return; 
  }

  try {
    // Use modern Clipboard API
    await navigator.clipboard.writeText(lastText);
    feedback.textContent = 'Text copied to clipboard.';
  } catch (err) {
    // Fallback for older browsers (less reliable, but good to have)
    console.error('Copy failed with clipboard API, falling back.', err);
    feedback.textContent = 'Copy failed. Try manually copying the text.';
  }
});

// Optional: support enter key in input
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission if input was in a form
    generateBtn.click();
  }
});

// Initial setup
clearQRCode();