import React, { useState, useEffect } from "react";
import { FileWarning, ThumbsUp, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "../UI/button";

const PdfViewer = ({ currentPdfSource, subject, selectedSemester, selectedNoteType, isMobile }) => {
  const [pdfError, setPdfError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    setPdfError(false);

    // Ensure the PDF URL starts with "/"
    const formattedPdfUrl = currentPdfSource.startsWith("/")
      ? currentPdfSource
      : `/${currentPdfSource}`;

    setPdfUrl(formattedPdfUrl);
    console.log("🔹 Final PDF URL:", formattedPdfUrl);

    // Fetch to check if the PDF file exists
    fetch(formattedPdfUrl)
      .then((response) => {
        if (!response.ok) {
          console.error("❌ PDF Not Found:", formattedPdfUrl);
          setPdfError(true);
        }
      })
      .catch((error) => {
        console.error("❌ Error Fetching PDF:", error);
        setPdfError(true);
      });
  }, [currentPdfSource]);

  const handleRetry = () => {
    setPdfError(false);
  };

  if (pdfError) {
    return (
      <div className="w-full h-[400px] border border-input rounded-lg overflow-hidden flex flex-col items-center justify-center bg-muted/50">
        <div className="text-center p-6">
          <FileWarning className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">PDF Not Available</h3>
          <p className="text-sm text-muted-foreground">
            This content is currently being prepared. Please check back later or contact the developer.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedSemester === "semester1" ? "Semester 1" : "Semester 2"} -{" "}
            {selectedNoteType === "notes" ? "Notes" : "Handwritten Notes"}
          </p>
        </div>
        <Button onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-full ${isMobile ? "h-[calc(100vh-300px)]" : "h-[600px]"} border border-input rounded-lg overflow-hidden relative`}>
      <iframe
        src={pdfUrl}
        className="w-full h-full"
        title={`${subject.title} - ${selectedSemester} ${selectedNoteType}`}
        style={{ width: "100%", height: "100vh", border: "none" }}
       
      />
      <div className="flex justify-center gap-4 mt-4">
        <Button variant="outline" size="sm">
          <ThumbsUp className="w-4 h-4 mr-2" />
          Helpful
        </Button>
        <Button variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
      </div>
    </div>
  );
};

export default PdfViewer;
