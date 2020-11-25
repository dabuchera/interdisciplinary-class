import { homedir } from 'os';

export class Element {
  _id: string;
  dbID: string;
  volume: number; // for column, wall and slab
  perimeter: number; // for column
  _length: number; // for column
  sideArea: number; // for wall
  width: number; // for wall
  height: number; // for wall
  area: number; // for slab
  thickness: number; // for slab
  //INPUTS
  csF: number; // crew size setting Formwork
  prF: number; // production setting Formwork
  // First set with fixed values for PR & CS
  csR: number; // crew size Reinforcing
  prR: number; // production rate Reinforcing
  csC: number; // crew size Concreting
  prC: number; // production rate Concreting
  csS: number; // crew size Stripping Formwork
  prS: number; // production rate Stripping Formwork
  // Working Densities
  //   wall
  WDwF: number;
  WDwR: number;
  WDwC: number;
  WDwS: number;
  //column
  WDcF: number;
  WDcR: number;
  WDcC: number;
  WDcS: number;
  //   slab
  WDsF: number;
  WDsR: number;
  WDsC: number;
  WDsS: number;

  constructor(
    //  version?: string,
    object?: Element,
    _id?: string,
    dbID?: string,
    volume?: number,
    perimeter?: number,
    _length?: number,
    sideArea?: number,
    width?: number,
    height?: number,
    area?: number,
    thickness?: number,
    csF?: number,
    prF?: number,
    // First set with fixed values for PR & CS
    csR?: number,
    prR?: number,
    csC?: number,
    prC?: number,
    csS?: number,
    prS?: number,
    //
    WDwF?: number,
    WDwR?: number,
    WDwC?: number,
    WDwS?: number,
    //
    WDcF?: number,
    WDcR?: number,
    WDcC?: number,
    WDcS?: number,
    //
    WDsF?: number,
    WDsR?: number,
    WDsC?: number,
    WDsS?: number
  ) {
    this._id = _id;
    this.dbID = dbID;
    this.volume = volume;
    this.perimeter = perimeter;
    this.sideArea = sideArea;
    this.width = width;
    this.height = height;
    this.area = area;
    this._length = length;
    this.thickness = thickness;
    this.csF = csF;
    this.prF = prF;
    // First set with fixes values for PR & CS
    this.csR = csR;
    this.prR = prR;
    this.csC = csC;
    this.prC = prC;
    this.csS = csS;
    this.prS = prS;

    this.WDwF = (2 * (this.sideArea + this.width * this.height) * prF) / csF;
    this.WDwR = (0.17 * this.volume * prR) / csR; //?* 0.17tons/m3
    this.WDwC = (this.volume * prC) / csC; //?* tons
    this.WDwS = (2 * (this.sideArea + this.width * this.height) * prS) / csS;

    this.WDcF = (this.perimeter * this._length * prF) / csF;
    this.WDcR = (0.11 * this.volume * prR) / csR;
    this.WDcC = (this.volume * prC) / csC;
    this.WDcS = (this.perimeter * this._length * prS) / csS;

    this.WDsF = ((this.area + this.perimeter * this.thickness) * prF) / csF;
    this.WDsR = (0.12 * this.volume * prR) / csR;
    this.WDsC = (this.volume * prC) / csC;
    this.WDsS = ((this.area + this.perimeter * this.thickness) * prS) / csS;
  }
}
