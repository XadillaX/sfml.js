import { Mesh, MeshUtilities, RenderBox, type VertexColour } from '../../src';

const mesh = new Mesh();
const colour: VertexColour = { red: 10, green: 20, blue: 30, alpha: 40 };
const box = new RenderBox(
  { x: 20, y: 30 }, { x: 0, y: 0 }, [ 1, 2, 3, 4 ], [ 4, 4, 4, 4 ]);
const commands: Float32Array = MeshUtilities.allocateCommands(10);
const stride: number = MeshUtilities.commandStride;
MeshUtilities.append(mesh, commands, 0);
MeshUtilities.generateQuad(mesh, { x: 1, y: 2 }, { x: 3, y: 4 }, colour);
MeshUtilities.generateQuad(mesh, { x: 1, y: 2 }, { x: 3, y: 4 }, colour,
  { x: 0, y: 0 }, { x: 0.5, y: 0.5 });
MeshUtilities.generateLine(mesh, { x: 1, y: 2 }, { x: 3, y: 4 }, colour);
MeshUtilities.generateBackground(mesh, box, colour);
MeshUtilities.generateBackgroundBorder(
  mesh, box, colour, [ colour, colour, colour, colour ]);

// @ts-expect-error Static native utility classes cannot be constructed.
new MeshUtilities();
// @ts-expect-error Commands are float32 views.
MeshUtilities.append(mesh, new Uint8Array(40));
// @ts-expect-error Borders have four colours.
MeshUtilities.generateBackgroundBorder(mesh, box, colour, [ colour ]);
// @ts-expect-error Native boxes are owned values.
MeshUtilities.generateBackground(mesh, { fillSize: [ 1, 2 ] }, colour);
void stride;
