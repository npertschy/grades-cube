import type { Group } from "@/components/groups/Group"
import type { SchoolYear } from "@/components/schoolYears/SchoolYear"
import type { Semester } from "@/components/schoolYears/Semester"
import type { Subject } from "@/components/subjects/Subject"

export type Course = {
    id: number | undefined
    group: Group | undefined
    semester: Semester | undefined
    subject: Subject | undefined
    schoolYear: SchoolYear | undefined
    days: object | undefined
}
