export class Zone {
  id: string;
  dbIds: number[];
  objects: any[];
  level: string;
  wd: number;
  wdF: number;
  wdR: number;
  wdC: number;
  wdCR: number;
  wdS: number; // work density
  trade: string; // formwork, reinforcement, concrete strip formwork

  constructor(
    id: string,
    dbIds?: number[],
    objects?: any[],
    level?: string,
    wd?: number,
    wdF?: number,
    wdR?: number,
    wdC?: number,
    wdCR?: number,
    wdS?: number,
    trade?: string
  ) {
    this.id = id;
    this.dbIds = [];
    this.objects = [];
    this.level = level;
    this.wd = wd;
    this.wdF = wdF;
    this.wdR = wdR;
    this.wdC = wdC;
    this.wdCR = wdCR;
    this.wdS = wdS;
    this.trade = trade;
  }
}
