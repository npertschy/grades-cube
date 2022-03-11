import type Group from './Group'
import type Pupil from './Pupil'
import type Subject from './Subject'

export default interface State {
  groups: Group[]
  subjects: Subject[]
  pupils: Pupil[]
}
