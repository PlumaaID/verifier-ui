const mediatypeToExtension = (mediatype: string) => {
  switch (mediatype) {
    case "application/pdf":
      return "pdf";
    case "application/json":
      return "json";
    case "text/plain":
      return "txt";
    default:
      return "";
  }
};

function downloadFile(base64: string, mediatype: string, fileName: string) {
  const aElement = document.createElement("a");
  aElement.setAttribute("download", fileName);
  aElement.href = `data:${mediatype};base64,${base64}`;
  aElement.setAttribute("target", "_blank");
  aElement.click();
}

export { downloadFile, mediatypeToExtension };
