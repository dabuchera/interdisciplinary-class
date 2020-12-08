import { Element } from './element';

export class Column extends Element {
  perimeter: number;
  length: number;
  WDcF: number;
  WDcR: number;
  WDcC: number;
  WDcCR: number;
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

  constructor(
    id: string,
    dbId: number,
    viewerdbId?: number,
    volume?: number,
    category?: string,
    perimeter?: number,
    length?: number,
    WDcF?: number,
    WDcR?: number,
    WDcC?: number,
    WDcCR?: number,
    WDcS?: number,
    csF?: number,
    prF?: number,
    csR?: number,
    prR?: number,
    csC?: number,
    prC?: number,
    csS?: number,
    prS?: number
  ) {
    super(id, dbId, viewerdbId, volume, category);
    this.dbId = dbId;
    this.viewerdbId = viewerdbId;
    this.volume = volume;
    this.category = category;
    this.perimeter = perimeter;
    this.length = length;
    // First set with fixed values for PR & CS
    this.csF = csF;
    this.prF = prF;
    this.csR = csR;
    this.prR = prR;
    this.csC = csC;
    this.prC = prC;
    this.csS = csS;
    this.prS = prS;

    this.WDcF = WDcF;
    this.WDcR = WDcR;
    this.WDcC = WDcC;
    this.WDcCR = WDcCR;
    this.WDcS = WDcS;
  }
}
