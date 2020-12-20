export class Zone {
  id: string;
  dbIds: number[];
  level: string;
  wd: number; // work density
  trade: string; // formwork, reinforcement, concrete strip formwork

  constructor(
    id: string,
    dbIds?: number[],
    level?: string,
    wd?: number,
    trade?: string
  ) {
    this.id = id;
    this.dbIds = [];
    this.level = level;
    this.wd = wd;
    this.trade = trade;
  }
}
