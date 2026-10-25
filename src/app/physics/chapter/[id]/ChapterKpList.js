"use client";

import Link from "@/components/CourseLink";
import { CourseText } from "@/components/CourseMarkdown";
import { useCourseStudy } from "@/components/CourseSubject";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { StatusTag, WeightTag } from "@/components/island/KpTags";
import {
  createEmptyCourseV3,
  getKpStatus,
  loadCourseV3Data,
  subscribeCourseV3,
} from "@/lib/studyData";
import styles from "./chapter.module.css";

export function ChapterKpList({ kps = [], questionsMap = {}, chapterId }) {
  const { loadCourseV3Data, subscribeCourseV3 } = useCourseStudy();
  const [studyData, setStudyData] = useState(() => createEmptyCourseV3());

  useEffect(() => {
    setStudyData(loadCourseV3Data());
    const unsub = subscribeCourseV3((next) => {
      setStudyData(next);
    });
    return unsub;
  }, []);

  return (
    <div className={`${styles.kpList} isl-rows`}>
      {kps.map((kp) => {
        const status = getKpStatus(kp, questionsMap, studyData);
        const code = kp.id.replace(/^MATH-[^-]+-/, "").replace(/^PHY-9-/, "").replace(/^PHY-/, "");


        return (
          <Link
            className={styles.kpCard}
            href={`/physics/kp/${kp.id}/`}
            key={kp.id}
          >
            <div className={styles.kpLeft}>
              <span className={styles.kpCode}>{code}</span>
              <span className={styles.kpTitle}><CourseText>{kp.title}</CourseText></span>
              {kp.textbook && (
                <span className={styles.kpTextbook}>({kp.textbook})</span>
              )}
            </div>
            <div className={styles.kpRight}>
              <WeightTag weight={kp.weight || "一般"} />
              <StatusTag status={status} />
              <Icon name="arrow-right" size={16} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
