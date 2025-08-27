// scripts/ocr_pdf_a_texto.js
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');

(async () => {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error('Uso: node scripts/ocr_pdf_a_texto.js <archivo.pdf>');
    process.exit(1);
  }

  const buffer = fs.readFileSync(archivo);
  const data = await pdfParse(buffer);

  // Si trae texto “normal”, úsalo
  if (data.text && data.text.trim().length > 50) {
    console.log(data.text);
    return;
  }

  // por si entregan un pdf escaneado, esto hace que lo transforme
  const worker = await createWorker('spa'); // o 'eng' si está en inglés
  const { data: { text } } = await worker.recognize(buffer);
  console.log(text);
  await worker.terminate();
})();
