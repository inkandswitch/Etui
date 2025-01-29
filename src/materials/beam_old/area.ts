import { Polygon } from "geom/polygon";
import { Id } from "materials/id";

// export class AreaDescriptor {
//   beams: Array<Id>;
//   uniqueId: string; // Use this to check if the area is the same as another area
//   polygon: Polygon;

//   constructor(beams: Array<Id>, polygon: Polygon) {
//     this.beams = beams;
//     this.uniqueId = this.beams.sort().join("-");
//     this.polygon = polygon;
//   }
// }

export interface AreaDescriptor {
  controlPoints: Id[];
  beams: Id[];
}

export class Area {
  id: Id;
  beams: Array<Id>;
  loopId: string; // Use this to check if the area is the same as another area

  constructor(beams: Array<Id>) {
    this.id = Id();
    this.beams = beams;
    this.loopId = this.beams.sort().join("-");
  }
}
