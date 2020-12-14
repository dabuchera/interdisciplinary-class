import { Column } from './platform/models/column';
import { Foundation } from './platform/models/foundation';
import { Slab } from './platform/models/slab';
import { Wall } from './platform/models/wall';

export class Utils {
    private static localStorageColumns = 'columns';
    private static localStorageFoundations = 'foundations';
    private static localStorageSlabs = 'slabs';
    private static localStorageWalls = 'walls';

    public static getColumns(): Column[] {
        return JSON.parse(localStorage.getItem(this.localStorageColumns));
    }

    public static setColumns(columns: Column[]): void {
        localStorage.setItem(this.localStorageColumns, JSON.stringify(columns));
    }

    public static getFoundations(): Foundation[] {
        return JSON.parse(localStorage.getItem(this.localStorageFoundations));
    }

    public static setFoundations(foundations: Foundation[]): void {
        localStorage.setItem(this.localStorageFoundations, JSON.stringify(foundations));
    }

    public static getSlabs(): Slab[] {
        return JSON.parse(localStorage.getItem(this.localStorageSlabs));
    }

    public static setSlabs(slabs: Slab[]): void {
        localStorage.setItem(this.localStorageSlabs, JSON.stringify(slabs));
    }

    public static getWalls(): Wall[] {
        return JSON.parse(localStorage.getItem(this.localStorageWalls));
    }

    public static setWalls(walls: Wall[]): void {
        localStorage.setItem(this.localStorageWalls, JSON.stringify(walls));
    }
}