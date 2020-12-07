// Walls Columns Floors
// Foundation not implemented yet

export class Element {
  id: string;
  dbId: number;
  volume: number; // for column, wall and slab
  category: string; // Maybe a more detailed description of the element

  constructor(id: string, dbID: number, volume?: number, category?: string ) {
    this.id = id;
    this.dbId = dbID;
    this.volume = volume;
    this.category = category;
  }
}
