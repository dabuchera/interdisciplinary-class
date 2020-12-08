import { Element } from './element';

export class Foundation extends Element {
  area: number;
  thickness: number;
  perimeter: number;
  width: number;
  WDfF: number;
  WDfR: number;
  WDfC: number;
  WDfCR: number;
  WDfS: number;

  // INPUTS
  // While testing first set with fixed values for PR & CS
  csF: number; // crew size setting Formwork
  prF: number; // production setting Formwork
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
    area?: number,
    thickness?: number,
    perimeter?: number,
    width?: number,
    WDfF?: number,
    WDfR?: number,
    WDfC?: number,
    WDfCR?: number,
    WDfS?: number,
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
    this.area = area;
    this.thickness = thickness;
    this.perimeter = perimeter;
    this.width = width;
    // First set with fixed values for PR & CS
    this.csF = csF;
    this.prF = prF;
    this.csR = csR;
    this.prR = prR;
    this.csC = csC;
    this.prC = prC;
    this.csS = csS;
    this.prS = prS;

    this.WDfF = WDfF;
    this.WDfR = WDfR;
    this.WDfC = WDfC;
    this.WDfCR = WDfCR;
    this.WDfS = WDfS;
  }
}
