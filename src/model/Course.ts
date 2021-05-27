import Subject from './Subject'

export default class Course {
  name: string
  subjects: Subject[]

  constructor(name: string, subjects: Subject[]) {
    this.name = name
    this.subjects = subjects
  }
}
