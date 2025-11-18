# pdf-editor
This is a python pdf editor which runs in local because I don't trust online editors and does not have money for paid apps(I also do not trust them either).

Please install python dependencies and you are all set. You can run app.py and go to the url to use the tool.

In this project I am trying to bring feature of different python libraries together for better use. I may be using different libraries currently but I will try to use common libraries moving forward.

This project currently support following features - 
1. PDF merging.
2. Split pdf - With this feature you can split all the pages of pdf and download them as zip.
3. Extract pdf - This feature is the extension of split feature, with this you can provide page number you want to extract, and it will extract that page number and merge it and provide you.
4. Sanitize pdf - with this feature I am trying to remove all harmful components that can affect user computer like executables bat, javascript files, embedded urls and any action/goto items. This feature still needs improvements because it is still not able to remove latex embedded action items and urls. I am trying to make it similar like ghost script but functionality is still not achieved yet completely but it can still remove most of the harmful components.
5. Compress pdf - compress one or more PDF files and download them as a ZIP. You can select multiple PDF files, set a compression ratio (1 = least compression / best quality, 9 = most compression / smallest size), and the app will return `compressed_pdf.zip` containing the compressed PDFs.
