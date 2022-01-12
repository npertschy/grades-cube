import Course from "./Course";

export default interface Group {
    id: number
    name: string
    pupils: number[]
    courses: Course[]
}
