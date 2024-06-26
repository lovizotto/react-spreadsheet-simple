import create, { StoreApi } from 'zustand'
import produce from 'immer'
import { ICell } from '../@types'
// @ts-ignore
import uuid from 'react-uuid'

export type SpreadSheetType = { [key: string]: ICell }

type SetState = StoreApi<IStore>['setState']
type GetState = StoreApi<IStore>['getState']

export interface IStore {
	activeGroup: ICell[]
	activeCell: ICell
	spreadsheet: SpreadSheetType
	setActiveCell: (activeCell: ICell) => void
	updateSpreadsheet: (spreadsheet: SpreadSheetType) => void
	updateCellsByReference: (cell: ICell) => void
	initFromLocalStorage: () => void
	spreadsheetId: string
	updateLocalStorage: (spreadsheet: SpreadSheetType) => void
}

const initialSpreadsheet: SpreadSheetType = {}

const initialActiveCell: ICell = {
	id: 'A1',
	value: '',
	reference: '',
	formula: '',
	status: 'default',
}

/**
 * TODO write test to this
 * @param set
 * @param get
 */
const _initFromLocalStorage = (set: SetState, get: GetState) => {
	let spreadsheetId = window.location.href.split('#')[1]
	if (!spreadsheetId) {
		spreadsheetId = uuid()
		window.location.href += '#' + spreadsheetId
	}

	set({ spreadsheetId })
	const storage = localStorage.getItem(spreadsheetId) || ''
	if (storage) {
		const storageSpreadsheet = JSON.parse(storage)
		get().updateSpreadsheet(storageSpreadsheet)
	}
}

export const useStore = create<IStore>((set, get) => ({
	spreadsheet: initialSpreadsheet,
	spreadsheetId: '',
	activeGroup: [],
	activeCell: initialActiveCell,
	setActiveCell: (activeCell: ICell) =>
		set(
			produce(draft => {
				for (const key in draft.spreadsheet) {
					draft.spreadsheet[key].status = 'default'
				}

				draft.spreadsheet[activeCell.id] = {
					...activeCell,
					status: activeCell.status,
				}

				draft.activeCell = activeCell
			})
		),
	updateSpreadsheet: (spreadsheet: SpreadSheetType) => {
		set({ spreadsheet })
		get().updateLocalStorage(spreadsheet)
	},
	updateCellsByReference: (newCell: ICell) => {
		/**
		 * Need performance improvements: Onˆ2 - horrible
		 * try some blockchain algorithm
		 */
		for (let i in get().spreadsheet) {
			if (get().spreadsheet[i].error) return
			if (get().spreadsheet[i].reference === newCell.id) {
				get().spreadsheet[i].value = newCell.value
				get().updateCellsByReference(get().spreadsheet[i])
			}
		}
	},
	initFromLocalStorage: () => _initFromLocalStorage(set, get),
	updateLocalStorage: (spreadsheet: SpreadSheetType) => {
		const storageSpreadsheet = JSON.stringify(spreadsheet)
		localStorage.setItem(get().spreadsheetId, storageSpreadsheet)
	},
}))
