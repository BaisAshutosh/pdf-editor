from flask import Flask, request, render_template, send_file
from pypdf import PdfReader, PdfWriter
import io
import zipfile

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


if __name__ == "__main__":
    app.run(debug=True)
