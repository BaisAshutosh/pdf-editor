document.addEventListener('DOMContentLoaded', function () {
    const mergeFiles = document.getElementById('mergeFile');
    const splitForm = document.getElementById('splitFile');
    const resultDiv = document.getElementById('result');
    const mergePdfFilesInput = document.getElementById('mergePdfFiles');
    const splitPdfFileInput = document.getElementById('splitPdfFile');

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
});