export default class SubjectNode {
  key: number
  label: string
  data: number
  type: string

  constructor(key: number, label: string, data: number, type: string) {
    this.key = key
    this.label = label
    this.data = data
    this.type = type
  }
}
