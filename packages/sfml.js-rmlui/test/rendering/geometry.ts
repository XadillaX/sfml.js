import {
  Mesh, Texture, TextureSource, Vertex, Geometry, GeometryReleaseMode,
  CompiledShader, type TexturedMesh, type TexturedMeshList,
  Spritesheet, SpritesheetList, type Sprite, type SpriteMap,
  type SpriteDefinitionList,
  type RenderManager,
} from '../../dist';

declare const manager: RenderManager;
const mesh = new Mesh(3, 3);
mesh.resize(4, 6);
const bytes: Uint8Array = mesh.vertices;
const indices: Int32Array = mesh.indices;
const count: number = mesh.vertexCount;
const valid: boolean = mesh.isValid;
const equal: boolean = mesh.equals(new Mesh());
const geometry: Geometry = manager.makeGeometry(mesh);
const texture: Texture = manager.loadTexture('image.png', 'document.rml');
const vertex: Vertex = mesh.getVertex(0);
vertex.position = { x: 3, y: 4 };
vertex.colour = { red: 128, green: 0, blue: 0, alpha: 128 };
vertex.texCoord = { x: 0, y: 1 };
const vertexFloats: Float32Array = vertex.positionView;
const vertexBytes: Uint8Array = vertex.colourView;
const uvFloats: Float32Array = vertex.texCoordView;
const vertexEqual: boolean = vertex.equals(new Vertex());
const source = new TextureSource('image.png', 'document.rml');
const sourcePath: string = source.getSource();
const definitionPath: string = source.getDefinitionSource();
const textured: TexturedMesh = { mesh, texture: source.getTexture(manager) };
const list: TexturedMeshList = [ textured ];
const sheets = new SpritesheetList();
const definitions: SpriteDefinitionList = [
  [ 'icon', { p0: { x: 0, y: 0 }, p1: { x: 16, y: 16 } }],
];
sheets.addSpriteSheet('sheet', 'image.png', 'doc.rml', 3, 0.5, definitions);
sheets.reserve(2, 4);
sheets.merge(sheets);
const sprite: Sprite | null = sheets.getSprite('icon');
const sprites: SpriteMap = new Map(sprite ? [[ 'icon', sprite ]] : []);
const standalone = new Spritesheet('s', 'image.png', 'doc.rml', 0, 1);
standalone.name = 'updated';
standalone.displayScale = 2;
standalone.definitionLineNumber = 4;
void [ sprites, sheets.numSpriteSheets(), sheets.numSprites() ];
// @ts-expect-error Sprite definitions require a name and rectangle pair.
sheets.addSpriteSheet('s', '', '', 0, 1, [ 'icon' ]);
void [ vertexFloats, vertexBytes, uvFloats, vertexEqual,
  sourcePath, definitionPath, list ];
// @ts-expect-error Vertex position requires vector fields.
vertex.position = [ 1, 2 ];
// @ts-expect-error TextureSource requires a render manager.
source.getTexture(texture);
geometry.render({ x: 0, y: 0 }, texture, new CompiledShader());
const snapshot: Mesh = geometry.getMesh();
const released: Mesh = geometry.release(GeometryReleaseMode.ClearMesh);
new Geometry().release();
new Texture().getDimensions();
const textureEqual: boolean = texture.equals(new Texture());
const invalidGeometry: 4294967295 = Geometry.invalidHandle();

// @ts-expect-error Geometry requires native Mesh storage.
manager.makeGeometry({ vertices: bytes, indices });
// @ts-expect-error Texture cannot stand in for a shader.
geometry.render({ x: 0, y: 0 }, undefined, texture);
// @ts-expect-error A render manager cannot be used as a texture.
geometry.render({ x: 0, y: 0 }, manager);
// @ts-expect-error Unknown native release mode.
geometry.release(2);
// @ts-expect-error Mesh sizes must be numeric.
mesh.resize('four', 6);
// @ts-expect-error Texture comparison requires another native Texture.
texture.equals(source);

void [
  count, valid, equal, snapshot, released, textureEqual, invalidGeometry,
];
