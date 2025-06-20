document.addEventListener('DOMContentLoaded', function () {
    const mergeFiles = document.getElementById('mergeFile');
    const splitForm = document.getElementById('splitFile');
    const resultDiv = document.getElementById('result');
    const mergePdfFilesInput = document.getElementById('mergePdfFiles');
    const splitPdfFileInput = document.getElementById('splitPdfFile');
    const sanitize = document.getElementById('sanitizeFile');
    const sanitizePdfFileInput = document.getElementById('sanitizePdfFile');

    // Handle merge
    mergeFiles.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData();
        for (const file of mergePdfFilesInput.files) {
            formData.append('files', file);
        }

        fetch('/merge', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('Failed to merge PDFs');
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = encodeURIComponent('merged.pdf');
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                resultDiv.innerHTML = 'Merged PDF downloaded.';
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.innerHTML = 'An error occurred during the merge.';
            });
    });

    // Handle split
    splitForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (splitPdfFileInput.files.length !== 1) {
            resultDiv.innerHTML = 'Please select exactly one PDF file to split.';
            return;
        }
        const formData = new FormData();
        formData.append('file', splitPdfFileInput.files[0]);
        fetch('/split', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('Failed to split PDF');
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = encodeURIComponent('split_pages.zip');
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                resultDiv.innerHTML = 'Split ZIP downloaded.';
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.innerHTML = 'An error occurred during the split.';
            });
    });

    // Handle sanitize
    sanitize.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append('file', sanitizePdfFileInput.files[0]);

        fetch('/sanitize', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('Failed to merge PDFs');
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = encodeURIComponent('sanitized.pdf');
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                resultDiv.innerHTML = 'Merged PDF downloaded.';
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.innerHTML = 'An error occurred during the merge.';
            });
    });

    // Handle extract pages
    const extractPagesForm = document.getElementById('extractPagesForm');
    const extractPdfFileInput = document.getElementById('extractPdfFile');
    const startPageInput = document.getElementById('startPage');
    const endPageInput = document.getElementById('endPage');
    const specificPagesInput = document.getElementById('specificPages');

    extractPagesForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (extractPdfFileInput.files.length !== 1) {
            resultDiv.innerHTML = 'Please select exactly one PDF file to extract pages.';
            return;
        }
        const formData = new FormData();
        formData.append('file', extractPdfFileInput.files[0]);
        if (startPageInput.value !== '') {
            formData.append('start_page', startPageInput.value);
        }
        if (endPageInput.value !== '') {
            formData.append('end_page', endPageInput.value);
        }
        if (specificPagesInput.value !== '') {
            formData.append('specific_pages', specificPagesInput.value);
        }
        fetch('/extract_pages', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('Failed to extract pages');
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = encodeURIComponent('extracted.pdf');
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                resultDiv.innerHTML = 'Extracted PDF downloaded.';
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.innerHTML = 'An error occurred during extraction.';
            });
    });
});