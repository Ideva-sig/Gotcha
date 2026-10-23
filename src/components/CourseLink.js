"use client";
import Link from "next/link";
import { forwardRef } from "react";
import { useCourseSubject } from "./CourseSubject";

// Existing physics URLs remain the default; shared course views opt in through the provider.
const CourseLink = forwardRef(function CourseLink({ href, ...props }, ref) {
  const subject = useCourseSubject();
  const target = typeof href === "string" && (subject === "math" || subject === "chemistry")
    ? href.replace(/^\/physics(?=\/|$)/, `/${subject}`) : href;
  return <Link {...props} href={target} ref={ref} />;
});
export default CourseLink;
