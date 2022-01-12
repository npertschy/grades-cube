import Group from "./Group";
import Pupil from "./Pupil";
import Subject from "./Subject";

export default interface State {
    groups: Group[]
    subjects: Subject[]
    pupils: Pupil[]
}
