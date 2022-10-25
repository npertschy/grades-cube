import type Column from '@/model/Column'
// import { type Ref, ref } from 'vue'

export function defaultColumns(): Column[] {
  return [
    {
      field: 'count',
      header: '#'
    },
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'oralSuggestion',
      header: 'Vorschlag',
      style: 'backgroundColor: lightcoral'
    },
    {
      field: 'oralOverall',
      header: 'Gesamt',
      style: 'backgroundColor: lightcoral'
    },
    {
      field: 'specialOverall',
      header: 'Gesamt',
      style: 'backgroundColor: lightblue'
    },
    {
      field: 'generalPartOverall',
      header: 'Gesamt'
    },
    {
      field: 'writtenOverall',
      header: 'Gesamt',
      style: 'backgroundColor: lightgreen'
    },
    {
      field: 'overall',
      header: 'Gesamt'
    }
  ]
}
