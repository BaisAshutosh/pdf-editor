// Helper function to update file input display
function updateFileInputDisplay(fileInput) {
  const fileInputWrapper = fileInput.parentElement;
  const fileInputContent = fileInputWrapper.querySelector(".file-input-content");
  const fileInputText = fileInputContent.querySelector(".file-input-text");
  const fileInputSubtext = fileInputContent.querySelector(".file-input-subtext");
  const clearBtn = fileInputWrapper.querySelector(".btn-clear");

  if (fileInput.files.length > 0) {
    const fileNames = Array.from(fileInput.files)
      .map((f) => f.name)
      .join(", ");
    fileInputText.textContent = `✓ ${fileInput.files.length} file(s) selected`;
    fileInputSubtext.textContent = fileNames;
    fileInputContent.style.color = "#28a745";
    fileInputWrapper.style.borderColor = "#28a745";
    fileInputWrapper.style.background = "rgba(40, 167, 69, 0.05)";
    if (clearBtn) clearBtn.style.display = "block";
  } else {
    // Reset to default text based on input type
    const isMultiple = fileInput.hasAttribute("multiple");
    const defaultText = isMultiple
      ? "Click to select PDF files or drag and drop"
      : "Click to select a PDF file or drag and drop";
    fileInputText.textContent = defaultText;
    fileInputSubtext.textContent = isMultiple
      ? "Select multiple PDF files"
      : "Select a PDF file";
    fileInputContent.style.color = "inherit";
    fileInputWrapper.style.borderColor = "rgba(102, 126, 234, 0.3)";
    fileInputWrapper.style.background = "rgba(255, 255, 255, 0.5)";
    if (clearBtn) clearBtn.style.display = "none";
  }
}

// Helper function to create clear button handler
function createClearHandler(fileInputId) {
  return function (event) {
    event.preventDefault();
    event.stopPropagation();
    const fileInput = document.getElementById(fileInputId);
    fileInput.value = "";
    updateFileInputDisplay(fileInput);
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const mergeFiles = document.getElementById("mergeFile");
  const splitForm = document.getElementById("splitFile");
  const resultDiv = document.getElementById("result");
  const mergePdfFilesInput = document.getElementById("mergePdfFiles");
  const splitPdfFileInput = document.getElementById("splitPdfFile");
  const sanitize = document.getElementById("sanitizeFile");
  const sanitizePdfFileInput = document.getElementById("sanitizePdfFile");
  const encryptPdfFileInput = document.getElementById("encryptPdfFile");

  // Add change event listeners to all file inputs
  mergePdfFilesInput.addEventListener("change", function () {
    updateFileInputDisplay(this);
  });

  splitPdfFileInput.addEventListener("change", function () {
    updateFileInputDisplay(this);
  });

  sanitizePdfFileInput.addEventListener("change", function () {
    updateFileInputDisplay(this);
  });

  encryptPdfFileInput.addEventListener("change", function () {
    updateFileInputDisplay(this);
  });

  // Add clear button handlers
  const clearMergePdfFiles = document.getElementById("clearMergePdfFiles");
  const clearSplitPdfFile = document.getElementById("clearSplitPdfFile");
  const clearExtractPdfFile = document.getElementById("clearExtractPdfFile");
  const clearSanitizePdfFile = document.getElementById("clearSanitizePdfFile");
  const clearCompressPdfFiles = document.getElementById("clearCompressPdfFiles");
  const clearEncryptPdfFile = document.getElementById("clearEncryptPdfFile");

  if (clearMergePdfFiles) clearMergePdfFiles.addEventListener("click", createClearHandler("mergePdfFiles"));
  if (clearSplitPdfFile) clearSplitPdfFile.addEventListener("click", createClearHandler("splitPdfFile"));
  if (clearExtractPdfFile) clearExtractPdfFile.addEventListener("click", createClearHandler("extractPdfFile"));
  if (clearSanitizePdfFile) clearSanitizePdfFile.addEventListener("click", createClearHandler("sanitizePdfFile"));
  if (clearCompressPdfFiles) clearCompressPdfFiles.addEventListener("click", createClearHandler("compressPdfFiles"));
  if (clearEncryptPdfFile) clearEncryptPdfFile.addEventListener("click", createClearHandler("encryptPdfFile"));
  mergeFiles.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData();
    for (const file of mergePdfFilesInput.files) {
      formData.append("files", file);
    }

    fetch("/merge", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("Failed to merge PDFs");
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encodeURIComponent("merged.pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerHTML = "Merged PDF downloaded.";
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = "An error occurred during the merge.";
      });
  });

  // Handle split
  splitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (splitPdfFileInput.files.length !== 1) {
      resultDiv.innerHTML = "Please select exactly one PDF file to split.";
      return;
    }
    const formData = new FormData();
    formData.append("file", splitPdfFileInput.files[0]);
    fetch("/split", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("Failed to split PDF");
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encodeURIComponent("split_pages.zip");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerHTML = "Split ZIP downloaded.";
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = "An error occurred during the split.";
      });
  });

  // Handle sanitize
  sanitize.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("file", sanitizePdfFileInput.files[0]);

    fetch("/sanitize", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("Failed to merge PDFs");
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encodeURIComponent("sanitized.pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerHTML = "Merged PDF downloaded.";
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = "An error occurred during the merge.";
      });
  });

  // Handle extract pages
  const extractPagesForm = document.getElementById("extractPagesForm");
  const extractPdfFileInput = document.getElementById("extractPdfFile");
  const startPageInput = document.getElementById("startPage");
  const endPageInput = document.getElementById("endPage");
  const specificPagesInput = document.getElementById("specificPages");

  extractPdfFileInput.addEventListener("change", function () {
    updateFileInputDisplay(this);
  });

  extractPagesForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (extractPdfFileInput.files.length !== 1) {
      resultDiv.innerHTML =
        "Please select exactly one PDF file to extract pages.";
      return;
    }
    const formData = new FormData();
    formData.append("file", extractPdfFileInput.files[0]);
    if (startPageInput.value !== "") {
      formData.append("start_page", startPageInput.value);
    }
    if (endPageInput.value !== "") {
      formData.append("end_page", endPageInput.value);
    }
    if (specificPagesInput.value !== "") {
      formData.append("specific_pages", specificPagesInput.value);
    }
    fetch("/extract_pages", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("Failed to extract pages");
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encodeURIComponent("extracted.pdf");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerHTML = "Extracted PDF downloaded.";
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = "An error occurred during extraction.";
      });
  });

  // Handle compress
  const compressForm = document.getElementById("compressFile");
  const compressPdfFilesInput = document.getElementById("compressPdfFiles");
  const compressionRatioInput = document.getElementById("compressionRatio");

  compressPdfFilesInput.addEventListener("change", function () {
    updateFileInputDisplay(this);
  });

  compressForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (compressPdfFilesInput.files.length === 0) {
      resultDiv.innerHTML = "Please select at least one PDF file to compress.";
      return;
    }
    const formData = new FormData();
    for (const file of compressPdfFilesInput.files) {
      formData.append("files", file);
    }
    formData.append("compression_ratio", compressionRatioInput.value);
    fetch("/compress_pdf", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("Failed to compress PDFs");
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encodeURIComponent("compressed_files.zip");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerHTML = "Compressed ZIP downloaded.";
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = "An error occurred during compression.";
      });
  });

  // Handle encrypt
  const encryptForm = document.getElementById("encryptFile");
  const encryptPdfFilesInput = document.getElementById("encryptPdfFile");
  const encryptPasswordInput = document.getElementById("encryptPassword");

  encryptForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (encryptPdfFilesInput.files.length === 0) {
      resultDiv.innerHTML = "Please select at least one PDF file to encrypt.";
      return;
    }
    if (!encryptPasswordInput.value.trim()) {
      resultDiv.innerHTML = "Please enter a password.";
      return;
    }
    const formData = new FormData();
    for (const file of encryptPdfFilesInput.files) {
      formData.append("files", file);
    }
    formData.append("password", encryptPasswordInput.value);
    fetch("/encrypt_pdf", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw new Error("Failed to encrypt PDF");
        }
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = encodeURIComponent("encrypted_files.zip");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerHTML = "Encrypted PDF(s) downloaded.";
        encryptForm.reset();
      })
      .catch((error) => {
        console.error("Error:", error);
        resultDiv.innerHTML = "An error occurred during encryption.";
      });
  });
});
