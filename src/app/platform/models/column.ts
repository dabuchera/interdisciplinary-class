import { Element } from './element';

export class Column extends Element {
    perimeter: number;
    length: number;
    WDcF: number;
    WDcR: number;
    WDcC: number;
    WDcS: number;
    // INPUTS
    csF: number; // crew size setting Formwork
    prF: number; // production setting Formwork
    // First set with fixed values for PR & CS
    csR: number; // crew size Reinforcing
    prR: number; // production rate Reinforcing
    csC: number; // crew size Concreting
    prC: number; // production rate Concreting
    csS: number; // crew size Stripping Formwork
    prS: number; // production rate Stripping Formwork

    constructor(id: string, dbID: string, volume?: number, category?: string, perimeter?: number, length?: number,
                WDcF?: number, WDcR?: number, WDcC?: number, WDcS?: number,
                csF?: number, prF?: number, csR?: number, prR?: number, csC?: number, prC?: number, csS?: number, prS?: number) {
        super(id, dbID, volume, category);
        this.dbID = dbID;
        this.volume = volume;
        this.category = category;
        this.perimeter = perimeter;
        this.length = length;

        this.WDcF = (this.perimeter * this.length * prF) / csF;
        this.WDcR = (0.11 * this.volume * prR) / csR;
        this.WDcC = (this.volume * prC) / csC;
        this.WDcS = (this.perimeter * this.length * prS) / csS;

        // First set with fixed values for PR & CS
        this.csR = csR;
        this.prR = prR;
        this.csC = csC;
        this.prC = prC;
        this.csS = csS;
        this.prS = prS;
    }
}
