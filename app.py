from flask import Flask, request, render_template, send_file
import pikepdf
from pypdf import PdfReader, PdfWriter
import io
import zipfile
import fitz

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/merge", methods=["POST"])
def merge_pdf():
    files = request.files.getlist("files")
    writer = PdfWriter()
    for file in files:
        reader = PdfReader(file)
        for page in reader.pages:
            writer.add_page(page)
    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    output_buffer.seek(0)
    return send_file(
        output_buffer,
        as_attachment=True,
        download_name="merged.pdf",
        mimetype="application/pdf",
    )


@app.route("/split", methods=["POST"])
def split_pdf():
    file = request.files["file"]
    if file and file.filename.endswith(".pdf"):
        reader = PdfReader(file)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for i, page in enumerate(reader.pages):
                writer = PdfWriter()
                writer.add_page(page)
                pdf_bytes = io.BytesIO()
                writer.write(pdf_bytes)
                pdf_bytes.seek(0)
                split_filename = f"split_page_{i + 1}.pdf"
                zip_file.writestr(split_filename, pdf_bytes.read())
        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name="split_pages.zip",
            mimetype="application/zip",
        )
    return "Invalid file type", 400


@app.route("/sanitize", methods=["POST"])
def sanitize_pdf():
    file = request.files["file"]
    if not file or not file.filename.lower().endswith(".pdf"):
        return "Invalid file type", 400
    input_buffer = io.BytesIO(file.read())
    output_buffer = io.BytesIO()
    try:
        with pikepdf.open(input_buffer) as pdf:
            try:
                root = pdf.trailer["/Root"]
            except Exception:
                root = None

            DANGEROUS_KEYS = {
                "/JS",
                "/JavaScript",
                "/A",
                "/AA",
                "/OpenAction",
                "/Action",
                "/Launch",
                "/RichMedia",
                "/EmbeddedFiles",
                "/Filespec",
                "/URI",
                "/FS",
                "/Dest",
                "/GoToE",
                "/GoToR",
                "/XFA",
            }

            def clean_object(obj):
                """Iteratively remove dangerous keys from PDF objects using a stack.

                This avoids recursion overhead and repeated `str()` conversions
                by converting keys to strings once per key and using a seen set
                to prevent revisiting objects.
                """
                seen = set()
                stack = [(obj, 0)]
                while stack:
                    cur, depth = stack.pop()
                    if depth > 100:
                        continue

                    try:
                        obj_id = getattr(cur, "objgen", None) or id(cur)
                    except Exception:
                        obj_id = id(cur)

                    if obj_id in seen:
                        continue
                    seen.add(obj_id)

                    if isinstance(cur, pikepdf.Dictionary):
                        for k in list(cur.keys()):
                            try:
                                k_str = str(k)
                                if k_str in DANGEROUS_KEYS:
                                    try:
                                        del cur[k]
                                    except Exception:
                                        pass
                                    continue
                                try:
                                    child = cur[k]
                                    stack.append((child, depth + 1))
                                except Exception:
                                    continue
                            except Exception:
                                continue

                    elif isinstance(cur, pikepdf.Array):
                        for item in list(cur):
                            stack.append((item, depth + 1))

            for page in pdf.pages:
                clean_object(page)
                try:
                    for k in list(page.keys()):
                        try:
                            if str(k) == "/Annots":
                                try:
                                    del page[k]
                                except Exception:
                                    pass
                        except Exception:
                            continue
                except Exception:
                    pass
            if root is not None:
                clean_object(root)
                for top_key in ("/AcroForm", "/Outlines", "/Metadata", "/Names"):
                    try:
                        for k in list(root.keys()):
                            try:
                                if str(k) == top_key:
                                    try:
                                        del root[k]
                                    except Exception:
                                        pass
                            except Exception:
                                continue
                    except Exception:
                        pass

            pdf.save(output_buffer)
    except Exception as e:
        return f"Failed to sanitize PDF: {str(e)}", 500
    output_buffer.seek(0)
    return send_file(
        output_buffer,
        as_attachment=True,
        download_name="sanitized.pdf",
        mimetype="application/pdf",
    )


@app.route("/extract_pages", methods=["POST"])
def extract_pages():
    file = request.files["file"]
    if not file or not file.filename.lower().endswith(".pdf"):
        return "Invalid file type", 400
    input_buffer = io.BytesIO(file.read())
    try:
        pdf = fitz.open(stream=input_buffer, filetype="pdf")
        start_page = int(request.form.get("start_page", 0)) - 1
        end_page = int(request.form.get("end_page", len(pdf)))
        specific_pages = request.form.get("specific_pages")
        temp_file = fitz.open()
        if specific_pages:
            pages = [
                int(p.strip()) - 1
                for p in specific_pages.split(",")
                if p.strip().isdigit()
            ]
            for i in pages:
                if 0 <= i < len(pdf):
                    temp_file.insert_pdf(pdf, from_page=i, to_page=i)
        else:
            for i in range(start_page, min(end_page, len(pdf))):
                temp_file.insert_pdf(pdf, from_page=i, to_page=i)
        output_buffer = io.BytesIO()
        temp_file.save(output_buffer)
        temp_file.close()
        pdf.close()
        output_buffer.seek(0)
        return send_file(
            output_buffer,
            as_attachment=True,
            download_name="extracted.pdf",
            mimetype="application/pdf",
        )
    except Exception as e:
        return f"Failed to extract pages: {str(e)}", 500


@app.post("/compress_pdf")
def compress_pdf():
    files = request.files.getlist("files")
    compression_ratio = int(request.form["compression_ratio"])
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file in files:
            writer = PdfWriter(clone_from=io.BytesIO(file.read()))
            for page in writer.pages:
                page.compress_content_streams(level=compression_ratio)
            pdf_bytes = io.BytesIO()
            writer.write(pdf_bytes)
            pdf_bytes.seek(0)
            split_filename = f"{file.filename}.pdf"
            zip_file.writestr(split_filename, pdf_bytes.read())
    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        as_attachment=True,
        download_name="compressed_pdf.zip",
        mimetype="application/zip",
    )


@app.post("/encrypt_pdf")
def encrypt_pdf():
    files = request.files.getlist("files")
    password = request.form.get("password", "")

    # Validation
    if not files or files[0].filename == "":
        return "No files selected", 400
    if not password:
        return "Password is required", 400
    if len(password) < 4:
        return "Password must be at least 4 characters", 400

    try:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for file in files:
                # Validate PDF
                if not file.filename.lower().endswith(".pdf"):
                    continue

                file_content = file.read()
                if not file_content:
                    continue

                try:
                    writer = PdfWriter(clone_from=io.BytesIO(file_content))
                    writer.encrypt(
                        user_password=password, owner_password=None, use_128bit=True
                    )
                    pdf_bytes = io.BytesIO()
                    writer.write(pdf_bytes)
                    pdf_bytes.seek(0)
                    encrypted_filename = f"encrypted_{file.filename}"
                    zip_file.writestr(encrypted_filename, pdf_bytes.read())
                except Exception as e:
                    return f"Failed to encrypt {file.filename}: {str(e)}", 400

        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name="encrypted_files.zip",
            mimetype="application/zip",
        )
    except Exception as e:
        return f"Encryption failed: {str(e)}", 500


@app.post("/remove_password")
def remove_password():
    files = request.files.getlist("files")
    password = request.form.get("password", "")

    # Validation
    if not files or files[0].filename == "":
        return "No files selected", 400
    if not password:
        return "Password is required", 400
    if len(password) < 4:
        return "Password must be at least 4 characters", 400

    try:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for file in files:
                # Validate PDF
                if not file.filename.lower().endswith(".pdf"):
                    continue

                file_content = file.read()
                if not file_content:
                    continue

                try:
                    reader = PdfReader(io.BytesIO(file_content))
                    if reader.is_encrypted:
                        reader.decrypt(password)
                    writer = PdfWriter()
                    for page in reader.pages:
                        writer.add_page(page)
                    pdf_bytes = io.BytesIO()
                    writer.write(pdf_bytes)
                    pdf_bytes.seek(0)
                    decrypted_filename = f"decrypted_{file.filename}"
                    zip_file.writestr(decrypted_filename, pdf_bytes.read())
                except Exception as e:
                    return (
                        f"Failed to remove password from {file.filename}: {str(e)}",
                        400,
                    )

        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name="decrypted_files.zip",
            mimetype="application/zip",
        )
    except Exception as e:
        return f"Decryption failed: {str(e)}", 500


if __name__ == "__main__":
    app.run()
