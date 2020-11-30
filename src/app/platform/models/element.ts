// Walls Columns Floors
// Foundation not implemented yet

export class Element {
  id: string;
  dbID: string;
  volume: number; // for column, wall and slab
  category: string; // Maybe a more detailed description of the element

  constructor(id: string, dbID: string, volume?: number, category?: string ) {
    this.id = id;
    this.dbID = dbID;
    this.volume = volume;
    this.category = category;
  }
}
