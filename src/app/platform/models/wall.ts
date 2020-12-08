import { Element } from './element';

export class Wall extends Element {
  sideArea: number;
  width: number;
  height: number;
  WDwF: number;
  WDwR: number;
  WDwC: number;
  WDwCR: number;
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

  constructor(
    id: string,
    dbId: number,
    viewerdbId: number,
    volume?: number,
    category?: string,
    sideArea?: number,
    width?: number,
    height?: number,
    WDwF?: number,
    WDwR?: number,
    WDwC?: number,
    WDwCR?: number,
    WDwS?: number,
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
    this.sideArea = sideArea;
    this.width = width;
    this.height = height;
    // First set with fixed values for PR & CS
    this.csF = csF;
    this.prF = prF;
    this.csR = csR;
    this.prR = prR;
    this.csC = csC;
    this.prC = prC;
    this.csS = csS;
    this.prS = prS;

    this.WDwF = WDwF;
    this.WDwR = WDwR;
    this.WDwC = WDwC;
    this.WDwCR = WDwCR;
    this.WDwS = WDwS;
  }
}
