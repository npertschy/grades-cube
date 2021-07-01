import SubjectNode from './SubjectNode'

export default class CourseNode {
  key: string
  label: string
  data: number
  type: string
  children: SubjectNode[]

  constructor(key: string, label: string, data: number, type: string, children: SubjectNode[]) {
    this.key = key
    this.label = label
    this.data = data
    this.type = type
    this.children = children
  }
}
