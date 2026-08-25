import type { Course } from "@/components/courses/Course";
import type { EvaluatedStudent, Grade } from "@/components/evaluations/EvaluatedStudent";
import type { Group } from "@/components/groups/Group";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Semester } from "@/components/schoolYears/Semester";
import {
  loadCoursesForSchoolYearAndSemester,
  loadStudentsForCourse as gatewayLoadStudentsForCourse,
  loadStudentsForGroup as gatewayLoadStudentsForGroup,
  loadPerformancesForCourse as gatewayLoadPerformancesForCourse,
  createPerformance as gatewayCreatePerformance,
  updatePerformance as gatewayUpdatePerformance,
  updateGrade as gatewayUpdateGrade,
  deletePerformance as gatewayDeletePerformance,
} from "@/views/evaluation/EvaluationGateway";
import type { Performance } from "@/components/evaluations/Performance";
import type { TreeNode } from "primevue/treenode";
import { ref } from "vue";
import { useStoreErrorHandling } from "@/components/errors/ErrorHandling";

const { runSafeWithThrow } = useStoreErrorHandling();

const treeItems = ref<TreeNode[]>([]);

async function loadTreeItems(schoolYear: SchoolYear, semester: Semester) {
  treeItems.value.length = 0;
  const courses = await loadCoursesForSchoolYearAndSemester(schoolYear, semester);
  const groupings = groupBy(courses, (course: Course) => course.group!.id);

  groupings.forEach((coursesOfGroup) => {
    const courseItems: TreeNode[] = [];
    coursesOfGroup.forEach((course: Course) => {
      courseItems.push({
        key: `${course.id!}`,
        label: course.subject!.name!,
        data: course,
        type: "course",
      });
    });

    const group = coursesOfGroup[0].group;
    const groupItem: TreeNode = {
      key: `${group!.id!}`,
      label: group!.name!,
      children: courseItems,
      data: group,
      type: "group",
    };
    treeItems.value.push(groupItem);
  });
}

function groupBy<T, K>(list: T[], keyGetter: (item: T) => K): Map<K, T[]> {
  const map = new Map();
  list.forEach((item: T) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (collection) {
      collection.push(item);
    } else {
      map.set(key, [item]);
    }
  });
  return map;
}

async function loadStudentsForCourse(course: Course): Promise<EvaluatedStudent[]> {
  return await gatewayLoadStudentsForCourse(course);
}

async function loadStudentsForGroup(group: Group): Promise<EvaluatedStudent[]> {
  const students = await gatewayLoadStudentsForGroup(group);
  return students.map((student): EvaluatedStudent => {
    return {
      student: student,
      grades: [],
    };
  });
}

async function loadPerformancesForCourse(course: Course) {
  return await gatewayLoadPerformancesForCourse(course);
}

async function createPerformance(
  newPerformance: Performance,
  students: EvaluatedStudent[],
) {
  await runSafeWithThrow(async () => {
    await gatewayCreatePerformance(
      newPerformance,
      students.map((student) => student.student),
    );
  }, "Leistung konnte nicht angelegt werden.");
}

async function updatePerformance(performance: Performance) {
  await runSafeWithThrow(async () => {
    await gatewayUpdatePerformance(performance);
  }, "Leistung konnte nicht aktualisiert werden.");
}

async function deletePerformance(performance: Performance) {
  await runSafeWithThrow(async () => {
    await gatewayDeletePerformance(performance);
  }, "Leistung konnte nicht gelöscht werden.");
}

async function updateGrade(grade: Grade) {
  await runSafeWithThrow(async () => {
    await gatewayUpdateGrade(grade);
  }, "Note konnte nicht aktualisiert werden.");
}

export function useEvaluations() {
  return {
    treeItems,
    loadTreeItems,
    loadStudentsForCourse,
    loadStudentsForGroup,
    loadPerformancesForCourse,
    createPerformance,
    updatePerformance,
    updateGrade,
    deletePerformance,
  };
}
