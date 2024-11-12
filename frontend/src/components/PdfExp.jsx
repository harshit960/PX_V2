import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PdfGenerator = (props) => {
  //   const tableRef = useRef(null);
  const tableRef = props.tableRef;

  const exportTableAsHtml = () => {
    const tableHTML = tableRef.current.outerHTML;
    const tailwindCDN = `
     <script src="https://cdn.tailwindcss.com"></script>

  `;
    // Create the complete HTML structure
    const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Exported Table</title>
        ${tailwindCDN} <!-- Tailwind CSS link -->
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const elements = document.querySelectorAll('#Phase_Thread,#Sync_tr,#Notes_tr,#NextStp_tr,#TPSpecialist_tr,#Phase_tr,#Phase_Thread,#TPSpecialist_Thread,#StatusNextSteps_Thread,#InternalNotes_Thread,#Empty_Thread');
            elements.forEach(element => {
              if (element) {
                element.style.display = 'none';
              }
            });
          });
        </script>
      </head>
      <body class=""> <!-- Add padding or other body styles as needed -->
        ${tableHTML} <!-- The table HTML -->
      </body>
    </html>
  `;
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });

    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'table.html'; // Name of the file to download

    // Append the link to the body (required for Firefox)
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Clean up and remove the link
    document.body.removeChild(link);
  };

  return (
    <div>
      <button onClick={exportTableAsHtml}>HTML Export</button>

    </div>
  );
};

export default PdfGenerator;
