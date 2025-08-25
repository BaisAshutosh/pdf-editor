from flask import Flask, request, render_template, send_file
import pikepdf
from pypdf import PdfReader, PdfWriter
import io
import zipfile
import fitz

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads/"


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
            root = pdf.trailer.get("/Root", {})
            for page in pdf.pages:
                if "/Annots" in page:
                    annots = page["/Annots"]
                    new_annots = []
                    for annot in annots:
                        try:
                            annot_obj = annot.get_object()
                            subtype = annot_obj.get("/Subtype", None)
                            if subtype in [
                                "/Link",
                                "/FileAttachment",
                                "/RichMedia",
                                "/Movie",
                                "/Sound",
                                "/3D",
                            ]:
                                for k in [
                                    "/A",
                                    "/Dest",
                                    "/FS",
                                    "/JS",
                                    "/S",
                                    "/URI",
                                    "/Launch",
                                    "/GoToE",
                                    "/GoToR",
                                ]:
                                    if k in annot_obj:
                                        del annot_obj[k]
                                continue
                            if "/JS" in annot_obj:
                                del annot_obj["/JS"]
                            if annot_obj.get("/S") == "/Launch":
                                del annot_obj["/S"]
                                continue
                            new_annots.append(annot)
                        except Exception:
                            continue
                    if new_annots:
                        page["/Annots"] = pikepdf.Array(new_annots)
                    else:
                        del page["/Annots"]
            for key in [
                "/OpenAction",
                "/AA",
                "/AdditionalActions",
                "/Action",
                "/JS",
                "/Launch",
                "/GoToE",
                "/GoToR",
            ]:
                if key in root:
                    del root[key]
            names = root.get("/Names")
            if names:
                for nkey in ["/JavaScript", "/EmbeddedFiles"]:
                    if nkey in names:
                        del names[nkey]
            if "/AcroForm" in root:
                acroform = root["/AcroForm"]
                if "/XFA" in acroform:
                    del acroform["/XFA"]
                if "/JS" in acroform:
                    del acroform["/JS"]
                del root["/AcroForm"]
            if "/Outlines" in root:

                def clean_outline(outline):
                    if "/A" in outline:
                        del outline["/A"]
                    if "/First" in outline:
                        clean_outline(outline["/First"])
                    if "/Next" in outline:
                        clean_outline(outline["/Next"])

                try:
                    clean_outline(root["/Outlines"])
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
                    page.compress_content_streams(level = compression_ratio)
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
        


if __name__ == "__main__":
    app.run()
