import { ref } from "vue";
import type { Student } from "./Student";
import { loadAllStudents } from "@/components/students/StudentGateway";

const idCounter = ref(1);

const students = ref<Student[]>([
  {
    id: 0,
    firstName: undefined,
    lastName: undefined,
  },
]);

const all = await loadAllStudents();
all.forEach((loaded) => {
  students.value.push(loaded);
});

function addStudent(studentToAdd: Student, cleanup: () => void) {
  if (studentToAdd.id && studentToAdd.id > 0) {
    const index = students.value.findIndex((it) => {
      return it.id == studentToAdd.id;
    });

    students.value.splice(index, 1, studentToAdd);
  } else {
    students.value?.push({
      ...studentToAdd,
      id: idCounter.value,
    });

    idCounter.value++;
  }

  cleanup();
}

function formatStudent(item: Student) {
  return item.id === 0
    ? "Neuen Schüler anlegen"
    : item.firstName + " " + item.lastName;
}

function removeStudent(student: Student) {
  const index = students.value.findIndex((it) => {
    return it.id == student.id;
  });

  students.value.splice(index, 1);
}

export function useStudents() {
  return {
    students,
    addStudent,
    formatStudent,
    removeStudent,
  };
}
