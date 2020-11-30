import { Element } from './element';

export class Wall extends Element {
    sideArea: number;
    width: number;
    height: number;
    WDwF: number;
    WDwR: number;
    WDwC: number;
    WDwS: number;
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

    constructor(id: string, dbID: string, volume?: number, category?: string, sideArea?: number, width?: number, height?: number,
                WDwF?: number, WDwR?: number, WDwC?: number, WDwS?: number,
                csF?: number, prF?: number, csR?: number, prR?: number, csC?: number, prC?: number, csS?: number, prS?: number) {
        super(id, dbID, volume, category);
        this.dbID = dbID;
        this.volume = volume;
        this.category = category;
        this.sideArea = sideArea;
        this.width = width;
        this.height = height;

        this.WDwF = (2 * (this.sideArea + this.width * this.height) * prF) / csF;
        this.WDwR = (0.17 * this.volume * prR) / csR; // ?* 0.17tons/m3
        this.WDwC = (this.volume * prC) / csC; // ?* tons
        this.WDwS = (2 * (this.sideArea + this.width * this.height) * prS) / csS;

        // First set with fixed values for PR & CS
        this.csR = csR;
        this.prR = prR;
        this.csC = csC;
        this.prC = prC;
        this.csS = csS;
        this.prS = prS;
    }
}
