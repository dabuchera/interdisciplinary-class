import { Element } from './element';

export class Slab extends Element {
  area: number;
  thickness: number;
  perimeter: number;
  WDsF: number;
  WDsR: number;
  WDsC: number;
  WDsS: number;

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
    volume?: number,
    category?: string,
    area?: number,
    thickness?: number,
    perimeter?: number,
    WDsF?: number,
    WDsR?: number,
    WDsC?: number,
    WDsS?: number,
    csF?: number,
    prF?: number,
    csR?: number,
    prR?: number,
    csC?: number,
    prC?: number,
    csS?: number,
    prS?: number
  ) {
    super(id, dbId, volume, category);
    this.dbId = dbId;
    this.volume = volume;
    this.category = category;
    this.area = area;
    this.thickness = thickness;
    this.perimeter = perimeter;
    // First set with fixed values for PR & CS
    this.csF = csF;
    this.prF = prF;
    this.csR = csR;
    this.prR = prR;
    this.csC = csC;
    this.prC = prC;
    this.csS = csS;
    this.prS = prS;

    this.WDsF = WDsF;
    this.WDsR = WDsR;
    this.WDsC = WDsC;
    this.WDsS = WDsS;
  }
}
