import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use CDN matching the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        // Loop through each page to extract text
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            // @ts-ignore
            .map((item) => item.str)
            .join(' ');
          
          fullText += pageText + '\\n\\n';
        }
        
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = function (error) {
      reject(error);
    };

    fileReader.readAsArrayBuffer(file);
  });
}
