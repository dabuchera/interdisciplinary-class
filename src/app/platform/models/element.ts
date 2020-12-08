// Walls Columns Floors
// Foundation not implemented yet

export class Element {
  id: string;
  dbId: number;
  viewerdbId: number;
  volume: number; // for column, wall and slab
  category: string; // Maybe a more detailed description of the element

  constructor(
    id: string,
    dbId: number,
    viewerdbId: number,
    volume?: number,
    category?: string
  ) {
    this.id = id;
    this.dbId = dbId;
    this.viewerdbId = viewerdbId;
    this.volume = volume;
    this.category = category;
  }
}
