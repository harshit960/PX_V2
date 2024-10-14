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
        console.log(tableHTML);

        // Create the complete HTML structure
        const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Exported Table</title>
        ${tailwindCDN} <!-- Tailwind CSS link -->
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
            <button onClick={exportTableAsHtml}>Export as html</button>

        </div>
    );
};

export default PdfGenerator;
