const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function renderPdfToImg() {
  const pdfPath = path.join(__dirname, 'test_soituoi_out.pdf');
  const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');
  
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { margin: 0; padding: 0; background: white; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="pdf-canvas"></canvas>
  <script>
    const pdfData = atob("${pdfBase64}");
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise.then(async (pdf) => {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.getElementById('pdf-canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      window.pdfRenderDone = true;
    });
  </script>
</body>
</html>`;

  const htmlPath = path.join(__dirname, 'render_preview.html');
  fs.writeFileSync(htmlPath, htmlContent);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const outImgPath = path.join(__dirname, 'test_soituoi_render.png');

  // Run edge headless screenshot with delay to let pdf.js render
  const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outImgPath}" --window-size=900,1280 --virtual-time-budget=4000 "file://${htmlPath.replace(/\\/g, '/')}"`;
  console.log('Running:', cmd);
  execSync(cmd);
  console.log('Done rendering to', outImgPath);
}

renderPdfToImg().catch(console.error);
