// Helper function to update file input display
function updateFileInputDisplay(fileInput) {
  const fileInputWrapper = fileInput.parentElement;
  const fileInputContent = fileInputWrapper.querySelector(
    ".file-input-content"
  );
  const fileInputText = fileInputContent.querySelector(".file-input-text");
  const fileInputSubtext = fileInputContent.querySelector(
    ".file-input-subtext"
  );
  const clearBtn = fileInputWrapper.querySelector(".btn-clear");

  if (fileInput.files.length > 0) {
    const fileNames = Array.from(fileInput.files)
      .map((f) => f.name)
      .join(", ");
    fileInputText.textContent = `✓ ${fileInput.files.length} file(s) selected`;
    fileInputSubtext.textContent = fileNames;
    fileInputWrapper.classList.add("selected");
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
    fileInputWrapper.classList.remove("selected");
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

// Helper: download a Blob as a file
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = encodeURIComponent(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Helper: set result message with optional type ('success'|'error')
function setResult(message, type) {
  const r = document.getElementById("result");
  if (!r) return;
  r.classList.remove("result-success", "result-error");
  if (type === "success") r.classList.add("result-success");
  if (type === "error") r.classList.add("result-error");
  r.innerHTML = message;
}

// Helper: post FormData and download the returned blob with consistent error handling
function postFormAndDownload(url, formData, filename, submitButton) {
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add("loading");
  }
  setResult("Processing...");

  return fetch(url, { method: "POST", body: formData })
    .then((response) => {
      if (response.ok) return response.blob();
      return response.text().then((text) => {
        throw new Error(
          `Server responded ${response.status} ${response.statusText}: ${
            text || "<unavailable>"
          }`
        );
      });
    })
    .then((blob) => {
      downloadBlob(blob, filename);
      setResult(`${filename} downloaded.`, "success");
      return blob;
    })
    .catch((err) => {
      console.error("Error:", err);
      setResult(`An error occurred: ${err.message || "Unknown error"}`, "error");
      throw err;
    })
    .finally(() => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
      }
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const mergeFiles = document.getElementById("mergeFile");
  const splitForm = document.getElementById("splitFile");
  // result element accessed lazily where needed
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
  const clearCompressPdfFiles = document.getElementById(
    "clearCompressPdfFiles"
  );
  const clearEncryptPdfFile = document.getElementById("clearEncryptPdfFile");
  const clearRemovePasswordPdfFile = document.getElementById(
    "clearRemovePasswordPdfFile"
  );

  if (clearMergePdfFiles)
    clearMergePdfFiles.addEventListener(
      "click",
      createClearHandler("mergePdfFiles")
    );
  if (clearSplitPdfFile)
    clearSplitPdfFile.addEventListener(
      "click",
      createClearHandler("splitPdfFile")
    );
  if (clearExtractPdfFile)
    clearExtractPdfFile.addEventListener(
      "click",
      createClearHandler("extractPdfFile")
    );
  if (clearSanitizePdfFile)
    clearSanitizePdfFile.addEventListener(
      "click",
      createClearHandler("sanitizePdfFile")
    );
  if (clearCompressPdfFiles)
    clearCompressPdfFiles.addEventListener(
      "click",
      createClearHandler("compressPdfFiles")
    );
  if (clearEncryptPdfFile)
    clearEncryptPdfFile.addEventListener(
      "click",
      createClearHandler("encryptPdfFile")
    );
  if (clearRemovePasswordPdfFile)
    clearRemovePasswordPdfFile.addEventListener(
      "click",
      createClearHandler("removePasswordPdfFile")
    );
  mergeFiles.addEventListener("submit", function (event) {
    event.preventDefault();
    const submitBtn = mergeFiles.querySelector('button[type="submit"]');
    const formData = new FormData();
    for (const file of mergePdfFilesInput.files) {
      formData.append("files", file);
    }

    postFormAndDownload("/merge", formData, "merged.pdf", submitBtn)
      .then(() => {
        mergeFiles.reset();
        if (mergePdfFilesInput) updateFileInputDisplay(mergePdfFilesInput);
      })
      .catch(() => {});
  });

  // Handle split
  splitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (splitPdfFileInput.files.length !== 1) {
      setResult("Please select exactly one PDF file to split.", "error");
      return;
    }
    const submitBtn = splitForm.querySelector('button[type="submit"]');
    const formData = new FormData();
    formData.append("file", splitPdfFileInput.files[0]);

    postFormAndDownload("/split", formData, "split_pages.zip", submitBtn)
      .then(() => {
        splitForm.reset();
        if (splitPdfFileInput) updateFileInputDisplay(splitPdfFileInput);
      })
      .catch(() => {});
  });

  // Handle sanitize
  sanitize.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!sanitizePdfFileInput || sanitizePdfFileInput.files.length !== 1) {
      setResult("Please select exactly one PDF file to sanitize.", "error");
      return;
    }
    const submitBtn = sanitize.querySelector('button[type="submit"]');
    const formData = new FormData();
    formData.append("file", sanitizePdfFileInput.files[0]);

    postFormAndDownload("/sanitize", formData, "sanitized.pdf", submitBtn)
      .then(() => {
        sanitize.reset();
        if (sanitizePdfFileInput) updateFileInputDisplay(sanitizePdfFileInput);
      })
      .catch(() => {});
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
      setResult("Please select exactly one PDF file to extract pages.", "error");
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
    const submitBtn = extractPagesForm.querySelector('button[type="submit"]');
    postFormAndDownload("/extract_pages", formData, "extracted.pdf", submitBtn)
      .then(() => {
        extractPagesForm.reset();
        if (extractPdfFileInput) updateFileInputDisplay(extractPdfFileInput);
      })
      .catch(() => {});
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
      setResult("Please select at least one PDF file to compress.", "error");
      return;
    }
    const formData = new FormData();
    for (const file of compressPdfFilesInput.files) {
      formData.append("files", file);
    }
    formData.append("compression_ratio", compressionRatioInput.value);
    const submitBtn = compressForm.querySelector('button[type="submit"]');
    postFormAndDownload(
      "/compress_pdf",
      formData,
      "compressed_files.zip",
      submitBtn
    )
      .then(() => {
        compressForm.reset();
        if (compressPdfFilesInput)
          updateFileInputDisplay(compressPdfFilesInput);
      })
      .catch(() => {});
  });

  // Handle encrypt
  const encryptForm = document.getElementById("encryptFile");
  const encryptPdfFilesInput = document.getElementById("encryptPdfFile");
  const encryptPasswordInput = document.getElementById("encryptPassword");

  encryptForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (encryptPdfFilesInput.files.length === 0) {
      setResult("Please select at least one PDF file to encrypt.", "error");
      return;
    }
    if (!encryptPasswordInput.value.trim()) {
      setResult("Please enter a password.", "error");
      return;
    }
    const formData = new FormData();
    for (const file of encryptPdfFilesInput.files) {
      formData.append("files", file);
    }
    formData.append("password", encryptPasswordInput.value);
    const submitBtn = encryptForm.querySelector('button[type="submit"]');
    postFormAndDownload(
      "/encrypt_pdf",
      formData,
      "encrypted_files.zip",
      submitBtn
    )
      .then(() => {
        encryptForm.reset();
        if (encryptPdfFilesInput) updateFileInputDisplay(encryptPdfFilesInput);
      })
      .catch(() => {});
  });

  // Handle remove password
  const removePasswordForm = document.getElementById("removePassword");
  const removePasswordPdfFilesInput = document.getElementById(
    "removePasswordPdfFile"
  );
  const removePasswordInput =
    document.getElementById("removePasswordPassword") ||
    (removePasswordForm &&
      removePasswordForm.querySelector(
        'input[type="password"], input[name="password"], input[id*="password"]'
      ));

  if (removePasswordPdfFilesInput) {
    removePasswordPdfFilesInput.addEventListener("change", function () {
      updateFileInputDisplay(this);
    });
  }

  if (removePasswordForm) {
    removePasswordForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (
        !removePasswordPdfFilesInput ||
        removePasswordPdfFilesInput.files.length === 0
      ) {
        setResult("Please select at least one PDF file to remove the password.", "error");
        return;
      }
      if (!removePasswordInput || !removePasswordInput.value.trim()) {
        setResult("Please enter the password.", "error");
        return;
      }

      const submitBtn = removePasswordForm.querySelector(
        'button[type="submit"]'
      );
      const formData = new FormData();
      for (const file of removePasswordPdfFilesInput.files) {
        formData.append("files", file);
      }
      formData.append("password", removePasswordInput.value);

      postFormAndDownload(
        "/remove_password",
        formData,
        "decrypted_files.zip",
        submitBtn
      )
        .then(() => {
          removePasswordForm.reset();
          if (removePasswordPdfFilesInput)
            updateFileInputDisplay(removePasswordPdfFilesInput);
        })
        .catch(() => {});
    });
  }
});
