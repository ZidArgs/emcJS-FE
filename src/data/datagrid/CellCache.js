export default class CellCache {

    #rows = new Map();

    #columns = new Map();

    addCell(row, column, cell) {
        this.#addCellToRow(row, column, cell);
        this.#addCellToColumn(column, row, cell);
    }

    getCell(row, column) {
        return this.#rows.get(row)?.get(column);
    }

    getAllCellsForRow(row) {
        return this.#rows.get(row)?.entries() ?? [];
    }

    getAllCellsForColumn(column) {
        return this.#columns.get(column)?.entries() ?? [];
    }

    getAllCells() {
        const res = [];
        for (const [row, columns] of this.#rows) {
            for (const [column, cell] of columns) {
                res.push([
                    row,
                    column,
                    cell
                ]);
            }
        }
        return res;
    }

    removeCell(row, column) {
        this.#rows.get(row)?.delete(column);
        this.#columns.get(column)?.delete(row);
    }

    removeRow(row) {
        this.#rows.delete(row);
        for (const column of this.#columns.values()) {
            column.delete(row);
        }
    }

    removeColumn(column) {
        this.#columns.delete(column);
        for (const row of this.#rows.values()) {
            row.delete(column);
        }
    }

    #addCellToRow(row, column, cell) {
        if (this.#rows.has(row)) {
            const rowData = this.#rows.get(row);
            rowData.set(column, cell);
        } else {
            const rowData = new Map();
            rowData.set(column, cell);
            this.#rows.set(row, rowData);
        }
    }

    #addCellToColumn(column, row, cell) {
        if (this.#columns.has(column)) {
            const columnData = this.#columns.get(column);
            columnData.set(row, cell);
        } else {
            const columnData = new Map();
            columnData.set(row, cell);
            this.#columns.set(column, columnData);
        }
    }

}
