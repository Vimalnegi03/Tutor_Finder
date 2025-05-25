'use client';

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../UI/tabs";

const SemesterTabs = ({
  showSemesterTabs,
  subject,
  selectedSemester,
  selectedNoteType,
  onSemesterChange,
  onNoteTypeChange,
}) => {
  const renderNoteTypeTabs = (semesterLabel) => (
    <Tabs value={selectedNoteType} onValueChange={onNoteTypeChange}>
      <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-2 rounded-lg shadow-md">
        <TabsTrigger
          value="notes"
          className="px-4 py-2 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="handwritten"
          className="px-4 py-2 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          Handwritten Notes
        </TabsTrigger>
      </TabsList>
      <TabsContent value="notes">
        {/* <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md shadow-md">
          Viewing <span className="font-semibold">{semesterLabel}</span> notes
        </p> */}
      </TabsContent>
      <TabsContent value="handwritten">
        {/* <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md shadow-md">
          Viewing <span className="font-semibold">{semesterLabel}</span> handwritten notes
        </p> */}
      </TabsContent>
    </Tabs>
  );

  if (showSemesterTabs) {
    return (
      <Tabs value={selectedSemester} onValueChange={onSemesterChange}>
        {/* <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-2 rounded-lg shadow-md">
          {subject.semesters.includes(1) && (
            <TabsTrigger
              value="semester1"
              className="px-4 py-2 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Semester 1
            </TabsTrigger>
          )}
          {subject.semesters.includes(2) && (
            <TabsTrigger
              value="semester2"
              className="px-4 py-2 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:bg-blue-500 hover:text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Semester 2
            </TabsTrigger>
          )}
        </TabsList> */}
        <TabsContent value="semester1">
          {renderNoteTypeTabs("Semester 1")}
        </TabsContent>
        <TabsContent value="semester2">
          {renderNoteTypeTabs("Semester 2")}
        </TabsContent>
      </Tabs>
    );
  }

  return renderNoteTypeTabs(selectedSemester);
};

export default SemesterTabs;
