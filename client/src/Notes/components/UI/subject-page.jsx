'use client';

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../UI/card";
// import { Header } from "./Header";
import NavigationBar from "../notesPage/NavigationBar";
import SemesterTabs from "../notesPage/SemesterTabs";
import PdfViewerSection from "../notesPage/PdfViewerSection";

export function SubjectPageJsx({ subject, onBack }) {
  const navigate = useNavigate();
  const { semesterId, noteType } = useParams();

  const [selectedSemester, setSelectedSemester] = useState(() => {
    return semesterId
      ? `semester${semesterId}`
      : (subject.semesters.includes(1) ? "semester1" : "semester2");
  });
  const [selectedNoteType, setSelectedNoteType] = useState(noteType || "notes");
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Update mobile state on resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Define PDF sources
  const pdfSources = {
    semester1: {
      notes: `/pdfs/${subject.file.toLowerCase()}-s1.pdf`,
      handwritten: `/pdfs/hwn/${subject.file.toLowerCase()}-s1.pdf`,
    },
    semester2: {
      notes: `/pdfs/${subject.file.toLowerCase()}-s2.pdf`,
       handwritten: `/pdfs/hwn/${subject.file.toLowerCase()}-s2.pdf`,
    },
  };
  
  const rawPdfSources = pdfSources; 

  // Handle semester change from SemesterTabs
  const handleSemesterChange = (value) => {
    setSelectedSemester(value);
    setSelectedNoteType("notes");
    const semester = value.replace("semester", "");
    navigate(`/subject/${subject.file}/semester/${semester}/notes`);
  };

  // Handle note type change from SemesterTabs
  const handleNoteTypeChange = (value) => {
    setSelectedNoteType(value);
    const semester = selectedSemester.replace("semester", "");
    navigate(`/subject/${subject.file}/semester/${semester}/${value}`);
  };

  const currentPdfSource = pdfSources[selectedSemester][selectedNoteType];
  const currentRawPdfSource = rawPdfSources[selectedSemester][selectedNoteType];

  // Update progress when viewing a note type
  useEffect(() => {
    const storedProgress = JSON.parse(localStorage.getItem("subjectProgress") || "{}");
    const updatedProgress = {
      ...storedProgress,
      [subject.file]: {
        ...storedProgress[subject.file],
        [selectedNoteType]: true,
      },
    };
    localStorage.setItem("subjectProgress", JSON.stringify(updatedProgress));
    window.dispatchEvent(
      new CustomEvent("progressUpdate", {
        detail: {
          subjectFile: subject.file,
          progress: {
            ...storedProgress[subject.file],
            [selectedNoteType]: true,
          },
        },
      })
    );
  }, [subject.file, selectedNoteType]);

  // Touch events for swipe gestures
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && selectedNoteType === "notes") {
      handleNoteTypeChange("handwritten");
    }
    if (isRightSwipe && selectedNoteType === "handwritten") {
      handleNoteTypeChange("notes");
    }
  };

  // Get the appropriate subject title (for example, if semester2 has a special title)
  const getSubjectTitle = () => {
    if (selectedSemester === "semester2" && subject.semester2Title) {
      return subject.semester2Title;
    }
    return subject.title;
  };

  // Breadcrumb items for NavigationBar
  const breadcrumbItems = [
    { label: "Home", onClick: onBack },
    { label: getSubjectTitle() },
    { label: selectedSemester === "semester1" ? "Semester 1" : "Semester 2" },
    { label: selectedNoteType === "notes" ? "Notes" : "Handwritten Notes" },
  ];

  const showSemesterTabs = subject.semesters.length > 1;

  return (
    <div
      className="flex flex-col min-h-screen bg-background text-foreground"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* <Header /> */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <NavigationBar
          onBack={onBack}
          breadcrumbItems={breadcrumbItems}
          subjectTitle={getSubjectTitle()}
        />
        <Card className="mb-8">
          <CardContent className="p-6">
            <SemesterTabs
              showSemesterTabs={showSemesterTabs}
              subject={subject}
              selectedSemester={selectedSemester}
              selectedNoteType={selectedNoteType}
              onSemesterChange={handleSemesterChange}
              onNoteTypeChange={handleNoteTypeChange}
            />
          </CardContent>
        </Card>
        <PdfViewerSection
          currentPdfSource={currentPdfSource}
          currentRawPdfSource={currentRawPdfSource}
          isMobile={isMobile}
          subject={subject}
          selectedSemester={selectedSemester}
          selectedNoteType={selectedNoteType}
        />
      </main>
    </div>
  );
}
