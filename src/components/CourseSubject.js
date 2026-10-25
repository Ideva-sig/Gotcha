"use client";

import { createContext, useContext, useMemo } from "react";
import * as study from "@/lib/studyData";
import { resolvePhysicsTarget } from "@/lib/courseV3Client";

const SubjectContext = createContext("physics");
export function CourseSubject({ subject, children }) {
  return <SubjectContext.Provider value={subject}><div data-course-subject={subject}>{children}</div></SubjectContext.Provider>;
}
export function useCourseSubject() {
  return useContext(SubjectContext);
}
export function useCourseStudy() {
  const subject = useCourseSubject();
  return useMemo(() => ({
    subject,
    label: { math: "数学", chemistry: "化学" }[subject] || "物理",
    base: `/${subject}`,
    loadCourseV3Data: () => study.loadCourseV3Data(subject),
    saveCourseV3Data: (data) => study.saveCourseV3Data(data, subject),
    subscribeCourseV3: (cb) => study.subscribeCourseV3(cb, subject),
    markKpVisited: (id) => study.markKpVisited(id, subject),
    setEvidenceCheck: (id, i, checked) => study.setEvidenceCheck(id, i, checked, subject),
    recordAttempt: (attempt) => study.recordAttempt(attempt, subject),
    getLatestAttempt: (id, part) => study.getLatestAttempt(id, part, subject),
    getActiveMistakes: (questions) => study.getActiveMistakes(questions, subject),
    regradeChoiceAttempts: (questions) => study.regradeChoiceAttempts(questions, subject),
    getOrphanMistakes: (questions) => study.getOrphanMistakes(questions, subject),
    resolvePhysicsTarget: (id) => resolvePhysicsTarget(id, subject),
  }), [subject]);
}
