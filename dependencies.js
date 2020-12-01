window.Triangle = window.classes.Triangle =
    class Triangle extends Shape    // The simplest possible Shape – one triangle.  It has 3 vertices, each
    {
        constructor()                 // having their own 3D position, normal vector, and texture-space coordinate.
        {
            super("positions", "normals", "texture_coords");                       // Name the values we'll define per each vertex.
            // First, specify the vertex positions -- the three point locations of an imaginary triangle.
            // Next, supply vectors that point away from the triangle face.  They should match up with the points in
            // the above list.  Normal vectors are needed so the graphics engine can know if the shape is pointed at
            // light or not, and color it accordingly.  lastly, put each point somewhere in texture space too.
            this.positions = [Vec.of(0, 0, 0), Vec.of(1, 0, 0), Vec.of(0, 1, 0)];
            this.normals = [Vec.of(0, 0, 1), Vec.of(0, 0, 1), Vec.of(0, 0, 1)];
            this.texture_coords = [Vec.of(0, 0), Vec.of(1, 0), Vec.of(0, 1)];
            this.indices = [0, 1, 2];                         // Index into our vertices to connect them into a whole triangle.
            // A position, normal, and texture coord fully describes one "vertex".  What's the "i"th vertex?  Simply the combined data
            // you get if you look up index "i" of those lists above -- a position, normal vector, and tex coord together.  Lastly we
            // told it how to connect vertex entries into triangles.  Every three indices in "this.indices" traces out one triangle.
        }
    };


window.Square = window.classes.Square =
    class Square extends Shape              // A square, demonstrating two triangles that share vertices.  On any planar surface, the interior
        // edges don't make any important seams.  In these cases there's no reason not to re-use data of
    {                                       // the common vertices between triangles.  This makes all the vertex arrays (position, normals,
        constructor()                         // etc) smaller and more cache friendly.
        {
            super("positions", "normals", "texture_coords");                                   // Name the values we'll define per each vertex.
            this.positions.push(...Vec.cast([-1, -1, 0], [1, -1, 0], [-1, 1, 0], [1, 1, 0]));   // Specify the 4 square corner locations.
            this.normals.push(...Vec.cast([0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]));   // Match those up with normal vectors.
            this.texture_coords.push(...Vec.cast([0, 0], [1, 0], [0, 1], [1, 1]));   // Draw a square in texture coordinates too.
            this.indices.push(0, 1, 2, 1, 3, 2);                   // Two triangles this time, indexing into four distinct vertices.
        }
    };


window.Tetrahedron = window.classes.Tetrahedron =
    class Tetrahedron extends Shape                       // The Tetrahedron shape demonstrates flat vs smooth shading (a boolean argument
    {
        constructor(using_flat_shading)                   // selects which one).  It is also our first 3D, non-planar shape.
        {
            super("positions", "normals", "texture_coords");
            var a = 1 / Math.sqrt(3);
            if (!using_flat_shading)                                 // Method 1:  A tetrahedron with shared vertices.  Compact, performs better,
            {                                                         // but can't produce flat shading or discontinuous seams in textures.
                this.positions.push(...Vec.cast([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]));
                this.normals.push(...Vec.cast([-a, -a, -a], [1, 0, 0], [0, 1, 0], [0, 0, 1]));
                this.texture_coords.push(...Vec.cast([0, 0], [1, 0], [0, 1,], [1, 1]));
                this.indices.push(0, 1, 2, 0, 1, 3, 0, 2, 3, 1, 2, 3);  // Vertices are shared multiple times with this method.
            } else {
                this.positions.push(...Vec.cast([0, 0, 0], [1, 0, 0], [0, 1, 0],         // Method 2:  A tetrahedron with
                    [0, 0, 0], [1, 0, 0], [0, 0, 1],         // four independent triangles.
                    [0, 0, 0], [0, 1, 0], [0, 0, 1],
                    [0, 0, 1], [1, 0, 0], [0, 1, 0]));

                this.normals.push(...Vec.cast([0, 0, -1], [0, 0, -1], [0, 0, -1],        // This here makes Method 2 flat shaded, since values
                    [0, -1, 0], [0, -1, 0], [0, -1, 0],        // of normal vectors can be constant per whole
                    [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],        // triangle.  Repeat them for all three vertices.
                    [a, a, a], [a, a, a], [a, a, a]));

                this.texture_coords.push(...Vec.cast([0, 0], [1, 0], [1, 1],      // Each face in Method 2 also gets its own set of texture coords
                    [0, 0], [1, 0], [1, 1],      //(half the image is mapped onto each face).  We couldn't do this
                    [0, 0], [1, 0], [1, 1],      // with shared vertices since this features abrupt transitions
                    [0, 0], [1, 0], [1, 1]));  // when approaching the same point from different directions.

                this.indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);      // Notice all vertices are unique this time.
            }
        }
    };


window.Windmill = window.classes.Windmill =
    class Windmill extends Shape                     // Windmill Shape.  As our shapes get more complicated, we begin using matrices and flow
    {
        constructor(num_blades)                      // control (including loops) to generate non-trivial point clouds and connect them.
        {
            super("positions", "normals", "texture_coords");
            for (var i = 0; i < num_blades; i++)     // A loop to automatically generate the triangles.
            {                                                                                   // Rotate around a few degrees in the
                var spin = Mat4.rotation(i * 2 * Math.PI / num_blades, Vec.of(0, 1, 0));            // XZ plane to place each new point.
                var newPoint = spin.times(Vec.of(1, 0, 0, 1)).to3();   // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
                this.positions.push(newPoint,                           // Store this XZ position.                  This is point 1.
                    newPoint.plus([0, 1, 0]),         // Store it again but with higher y coord:  This is point 2.
                    Vec.of(0, 0, 0));      // All triangles touch this location.       This is point 3.

                // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!  Normal vectors are not points;
                // their perpendicularity constraint gives them a mathematical quirk that when applying matrices you have
                // to apply the transposed inverse of that matrix instead.  But right now we've got a pure rotation matrix,
                // where the inverse and transpose operations cancel out.
                var newNormal = spin.times(Vec.of(0, 0, 1).to4(0)).to3();
                this.normals.push(newNormal, newNormal, newNormal);
                this.texture_coords.push(...Vec.cast([0, 0], [0, 1], [1, 0]));
                this.indices.push(3 * i, 3 * i + 1, 3 * i + 2); // Procedurally connect the 3 new vertices into triangles.
            }
        }
    };

window.Cube = window.classes.Cube =
class Cube extends Shape    // A cube inserts six square strips into its arrays.
{ constructor()  
    { super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )                    
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
        }
    }
}

window.Cube_Outline = window.classes.Cube_Outline =
    class Cube_Outline extends Shape {
        constructor() {
            super("positions", "colors"); // Name the values we'll define per each vertex.

            const white_c = Color.of(1, 1, 1, 1);
            //  TODO (Requirement 5).
            // When a set of lines is used in graphics, you should think of the list entries as
            // broken down into pairs; each pair of vertices will be drawn as a line segment.
            this.positions.push(...Vec.cast(
                [1, 1, 1], [1, 1, -1],
                [1, 1, -1],[-1, 1, -1],
                [-1, 1, -1], [-1, 1, 1],
                [-1, 1, 1], [1, 1, 1],

                [1, 1, 1], [1, -1, 1],
                [-1, -1, 1], [-1, 1, 1],
                [1, 1, -1], [1, -1, -1],
                [-1, 1, -1], [-1, -1, -1],

                [1, -1, 1], [-1, -1, 1],
                [-1, -1, 1], [-1, -1, -1],
                [-1, -1, -1], [1, -1, -1],
                [1, -1, -1], [1, -1, 1]
            ));

            this.colors = [ white_c, white_c, white_c, white_c, white_c, white_c, 
                            white_c, white_c, white_c, white_c, white_c, white_c, 
                            white_c, white_c, white_c, white_c, white_c, white_c, 
                            white_c, white_c, white_c, white_c, white_c, white_c
                            ];
            this.indexed = false;       // Do this so we won't need to define "this.indices".
        }
    };

window.Cube_Single_Strip = window.classes.Cube_Single_Strip =
    class Cube_Single_Strip extends Shape {
        constructor() {
            super("positions", "normals");

            // TODO (Extra credit part I)

            this.positions.push(...Vec.cast( [1, 1, 1], [1, -1, 1], [-1, -1, 1], [-1, 1, 1],
                                             [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]
            ));

            this.normals.push(...Vec.cast( [1, 1, 1], [1, -1, 1], [-1, -1, 1], [-1, 1, 1],
                                           [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]
            ));

            this.indices.push(0,1,2, 0,2,3, 0,1,4, 1,4,7, 0,3,5, 0,4,5, 2,3,5, 2,6,5, 5,6,7, 4,5,7, 1,2,7, 2,6,7);
        }
    };

window.Subdivision_Sphere = window.classes.Subdivision_Sphere =
    class Subdivision_Sphere extends Shape {
        // This Shape defines a Sphere surface, with nice uniform triangles.  A subdivision surface (see
        // Wikipedia article on those) is initially simple, then builds itself into a more and more
        // detailed shape of the same layout.  Each act of subdivision makes it a better approximation of
        // some desired mathematical surface by projecting each new point onto that surface's known
        // implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For each
        // face, connect the midpoints of each edge together to make more faces.  Repeat recursively until
        // the desired level of detail is obtained.  Project all new vertices to unit vectors (onto the
        // unit sphere) and group them into triangles by following the predictable pattern of the recursion.
        constructor(max_subdivisions) {
            super("positions", "normals", "texture_coords");                      // Start from the following equilateral tetrahedron:
            this.positions.push(...Vec.cast([0, 0, -1], [0, .9428, .3333], [-.8165, -.4714, .3333], [.8165, -.4714, .3333]));

            this.subdivideTriangle(0, 1, 2, max_subdivisions);  // Begin recursion.
            this.subdivideTriangle(3, 2, 1, max_subdivisions);
            this.subdivideTriangle(1, 0, 3, max_subdivisions);
            this.subdivideTriangle(0, 2, 3, max_subdivisions);

            for (let p of this.positions) {
                this.normals.push(p.copy());
                // Each point has a normal vector that simply goes to the point from the origin.

                // Textures are tricky.  A Subdivision sphere has no straight seams to which image
                // edges in UV space can be mapped.  The only way to avoid artifacts is to smoothly
                // wrap & unwrap the image in reverse - displaying the texture twice on the sphere.
                this.texture_coords.push(
                    Vec.of(Math.asin(p[0] / Math.PI) + .5, Math.asin(p[1] / Math.PI) + .5))
            }
        }

        subdivideTriangle(a, b, c, count) {
            // Recurse through each level of detail by splitting triangle (a,b,c) into four smaller ones.
            if (count <= 0) {
                this.indices.push(a, b, c);
                return;
            }  // Base case of recursion - we've hit the finest level of detail we want.

            var ab_vert = this.positions[a].mix(this.positions[b], 0.5).normalized(),     // We're not at the base case.  So, build 3 new
                ac_vert = this.positions[a].mix(this.positions[c], 0.5).normalized(),     // vertices at midpoints, and extrude them out to
                bc_vert = this.positions[b].mix(this.positions[c], 0.5).normalized();     // touch the unit sphere (length 1).

            var ab = this.positions.push(ab_vert) - 1,      // Here, push() returns the indices of the three new vertices (plus one).
                ac = this.positions.push(ac_vert) - 1,
                bc = this.positions.push(bc_vert) - 1;

            this.subdivideTriangle(a, ab, ac, count - 1);          // Recurse on four smaller triangles, and we're done.  Skipping every
            this.subdivideTriangle(ab, b, bc, count - 1);          // fourth vertex index in our list takes you down one level of detail,
            this.subdivideTriangle(ac, bc, c, count - 1);          // and so on, due to the way we're building it.
            this.subdivideTriangle(ab, bc, ac, count - 1);
        }
    };

window.Grid_Sphere = window.classes.Grid_Sphere =
class Grid_Sphere extends Shape                         // With lattitude / longitude divisions; this means singularities are at 
  { constructor( rows, columns, texture_range )         // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
      { super( "positions", "normals", "texture_coords" );
        const semi_circle_points = Array( rows ).fill( Vec.of( 0,0,1 ) ).map( (x,i,a) =>
                                    Mat4.rotation( i/(a.length-1) * Math.PI, Vec.of( 0,1,0 ) ).times( x.to4(1) ).to3() );
        
        Surface_Of_Revolution.insert_transformed_copy_into( this, [ rows, columns, semi_circle_points, texture_range ] );
      } }


window.Shape_From_File = window.classes.Shape_From_File = 
class Shape_From_File extends Shape          // A versatile standalone Shape that imports all its arrays' data from an .obj 3D model file.
{ constructor( filename )
    { super( "positions", "normals", "texture_coords" );
      this.load_file( filename );      // Begin downloading the mesh. Once that completes, return control to our parse_into_mesh function.
    }
  load_file( filename )
      { return fetch( filename )       // Request the external file and wait for it to load.
          .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
              else                return Promise.reject ( response.status )
            })
          .then( obj_file_contents => this.parse_into_mesh( obj_file_contents ) )
          .catch( error => { this.copy_onto_graphics_card( this.gl ); } )                     // Failure mode:  Loads an empty shape.
      }
  parse_into_mesh( data )                                           // Adapted from the "webgl-obj-loader.js" library found online:
    { var verts = [], vertNormals = [], textures = [], unpacked = {};   

      unpacked.verts = [];        unpacked.norms = [];    unpacked.textures = [];
      unpacked.hashindices = {};  unpacked.indices = [];  unpacked.index = 0;

      var lines = data.split('\n');

      var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;
      var FACE_RE = /^f\s/;      var WHITESPACE_RE = /\s+/;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var elements = line.split(WHITESPACE_RE);
        elements.shift();

        if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
        else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
        else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
        else if (FACE_RE.test(line)) {
          var quad = false;
          for (var j = 0, eleLen = elements.length; j < eleLen; j++)
          {
              if(j === 3 && !quad) {  j = 2;  quad = true;  }
              if(elements[j] in unpacked.hashindices) 
                  unpacked.indices.push(unpacked.hashindices[elements[j]]);
              else
              {
                  var vertex = elements[ j ].split( '/' );

                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);   unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);   
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                  
                  if (textures.length) 
                    {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                        unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }
                  
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);
                  
                  unpacked.hashindices[elements[j]] = unpacked.index;
                  unpacked.indices.push(unpacked.index);
                  unpacked.index += 1;
              }
              if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
          }
        }
      }
      for( var j = 0; j < unpacked.verts.length/3; j++ )
      {
        this.positions     .push( Vec.of( unpacked.verts[ 3*j ], unpacked.verts[ 3*j + 1 ], unpacked.verts[ 3*j + 2 ] ) );        
        this.normals       .push( Vec.of( unpacked.norms[ 3*j ], unpacked.norms[ 3*j + 1 ], unpacked.norms[ 3*j + 2 ] ) );
        this.texture_coords.push( Vec.of( unpacked.textures[ 2*j ], unpacked.textures[ 2*j + 1 ]  ));
      }
      this.indices = unpacked.indices;

      this.normalize_positions( false );
      this.copy_onto_graphics_card( this.gl );
      this.ready = true;
    }

  draw( graphics_state, model_transform, material )       // Cancel all attempts to draw the shape before it loads.
    { if( this.ready ) super.draw( graphics_state, model_transform, material );   }
}

window.Disk_Frag = window.classes.Disk_Frag =
class Disk_Frag extends Shape{
    constructor(columns, numSections){  // numSections = number of fragments in the entire disk
        super("positions", "normals", "texture_coords");
        
        var diskOuterTop = [];
        var diskOuterBot = [];
        var diskInnerTop = [];
        var diskInnerBot = [];

        var outerRing = 1;
        var innerRing = 0.2;
        var verticalScale = 0.05;

        var upVec = Vec.of(0,1,0);
        var downVec = Vec.of(0,-1,0);

        var max_texture_pos = 1/numSections;

        // iterate through and store points
        for(var i = 0; i < columns; i++){
            var maxRotation = 2*Math.PI/numSections;
            var rotation = Mat4.rotation(i*(maxRotation/(columns-1)), Vec.of(0,1,0));

            diskOuterTop.push((rotation.times(Vec.of(outerRing,verticalScale,0))).to3());
            diskOuterBot.push((rotation.times(Vec.of(outerRing,-1*verticalScale,0))).to3());
            diskInnerTop.push((rotation.times(Vec.of(innerRing,verticalScale,0))).to3());
            diskInnerBot.push((rotation.times(Vec.of(innerRing,-1*verticalScale,0))).to3());
        }

        // we need two of each position, each with a different normal
        // endpoints also need horizontal normals 

        // outer top ring
        for(var i = 0; i < columns; i++){
            this.positions.push(diskOuterTop[i]);
            this.normals.push(upVec);
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),1));
        }
        for(var i = 0; i < columns; i++){
            this.positions.push(diskOuterTop[i]);
            this.normals.push(Vec.of(diskOuterTop[i][0], 0, diskOuterTop[i][2]));
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),0.95));
            //this.texture_coords.push(Vec.of(1,1));
        }

        // outer bot ring
        for(var i = 0; i < columns; i++){
            this.positions.push(diskOuterBot[i]);
            this.normals.push(downVec);
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),1));
        }
        for(var i = 0; i < columns; i++){
            this.positions.push(diskOuterBot[i]);
            this.normals.push(Vec.of(diskOuterBot[i][0], 0, diskOuterBot[i][2]));
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),1));
            //this.texture_coords.push(Vec.of(1,1));

        }

        // inner top ring
        for(var i = 0; i < columns; i++){
            this.positions.push(diskInnerTop[i]);
            this.normals.push(upVec);
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),0));
        }
        for(var i = 0; i < columns; i++){
            this.positions.push(diskInnerTop[i]);
            this.normals.push(Vec.of(-1*diskInnerTop[i][0], 0, -1*diskInnerTop[i][2]));
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),0));
        }

        // inner bot ring
        for(var i = 0; i < columns; i++){
            this.positions.push(diskInnerBot[i]);
            this.normals.push(downVec);
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),0));
        }
        for(var i = 0; i < columns; i++){
            this.positions.push(diskInnerBot[i]);
            this.normals.push(Vec.of(-1*diskInnerBot[i][0], 0, -1*diskInnerBot[i][2]));
            this.texture_coords.push(Vec.of((max_texture_pos/(columns-1)*i),0));
        }

        // create outer face
        var offset1 = 0;
        var offset2 = 4*columns;
        this.addIndices(offset1, offset2, columns);

        // create inner face
        offset1 = 2*columns;
        offset2 = 6*columns;
        this.addIndices(offset1, offset2, columns);

        // create outer edge
        offset1 = columns;
        offset2 = 3*columns;
        this.addIndices(offset1, offset2, columns);

        // create inner edge
        offset1 = 5*columns;
        offset2 = 7*columns;
        this.addIndices(offset1, offset2, columns);

        // created edges if not full disk
        if(numSections != 1){
            offset1 = 8*columns;

            // normals of the starting end are outEdgeNormal X upVec
            var startNorm = this.normals[columns].cross(upVec);
            this.positions.push(this.positions[0], this.positions[2*columns], this.positions[4*columns], this.positions[6*columns]);
            this.normals.push(startNorm, startNorm, startNorm, startNorm);
            this.texture_coords.push(Vec.of(0,1), Vec.of(0,1), Vec.of(0,0), Vec.of(0,0));

            this.indices.push(offset1,offset1+1,offset1+2, offset1+1,offset1+2,offset1+3);

            offset1 += 4;
            // normals of the ending end are outEdgeNormal X downVec
            var endNorm = this.normals[2*columns-1].cross(downVec);
            this.positions.push(this.positions[columns-1], this.positions[3*columns-1], this.positions[5*columns-1], this.positions[7*columns-1]);
            this.normals.push(endNorm, endNorm, endNorm, endNorm);
            this.texture_coords.push(Vec.of(max_texture_pos,1), Vec.of(max_texture_pos,1), Vec.of(max_texture_pos,0), Vec.of(max_texture_pos,0));

            this.indices.push(offset1,offset1+1,offset1+2, offset1+1,offset1+2,offset1+3);
        }
    }

    addIndices(offset1, offset2, columns){
        var ind1 = offset1;
        var ind2 = offset2;
        for(var i = 0; i < columns-1; i++){
            this.indices.push(ind1, ind1+1, ind2);
            this.indices.push(ind1+1, ind2, ind2+1);
            ind1++;
            ind2++;
        }
    }
};

window.Cylinder = window.classes.Cylinder =
class Cylinder extends Shape{
    constructor(columns){
        super("positions", "normals", "texture_coords");
        var OuterTop = [];
        var OuterBot = [];

        var outerRing = 1;
        var verticalScale = 0.5;

        var upVec = Vec.of(0,1,0);
        var downVec = Vec.of(0,-1,0);

        // iterate through and store points
        for(var i = 0; i < columns; i++){
            var maxRotation = 2*Math.PI;
            var rotation = Mat4.rotation(i*(maxRotation/(columns-1)), Vec.of(0,1,0));

            OuterTop.push((rotation.times(Vec.of(outerRing,verticalScale,0))).to3());
            OuterBot.push((rotation.times(Vec.of(outerRing,-1*verticalScale,0))).to3());
        }

        // push top center point
        this.positions.push(Vec.of(0,verticalScale,0));
        this.normals.push(upVec);

        // outer top ring
        for(var i = 0; i < columns; i++){
            this.positions.push(OuterTop[i]);
            this.normals.push(upVec);
        }
        for(var i = 0; i < columns; i++){
            this.positions.push(OuterTop[i]);
            this.normals.push(Vec.of(OuterTop[i][0], 0, OuterTop[i][2]));
        }

        // push bot center point
        this.positions.push(Vec.of(0,-1*verticalScale,0));
        this.normals.push(downVec);

        // outer bot ring
        for(var i = 0; i < columns; i++){
            this.positions.push(OuterBot[i]);
            this.normals.push(downVec);
        }
        for(var i = 0; i < columns; i++){
            this.positions.push(OuterBot[i]);
            this.normals.push(Vec.of(OuterBot[i][0], 0, OuterBot[i][2]));
        }

        // add the top and bottom faces
        var offset1 = 1;
        var offset2 = 2*columns + 2;
        for(var i = 0; i < columns-1; i++){
            this.indices.push(0, offset1, offset1+1);
            this.indices.push(2*columns+1, offset2, offset2+1);
            offset1++;
            offset2++;
        }

        // add the outer edge
        var ind1 = columns + 1;
        var ind2 = 3*columns + 2;
        for(var i = 0; i < columns-1; i++){
            this.indices.push(ind1, ind1+1, ind2);
            this.indices.push(ind1+1, ind2, ind2+1);
            ind1++;
            ind2++;
        }
    }
}

window.Pyramid = window.classes.Pyramid =     // creates downward facing pyramid
class Pyramid extends Shape{                           // the center of the base of the prism is at (0,0,0)
    constructor(){
        super("positions", "normals", "texture_coords");
        
        // need four centers for apex 
        this.positions.push(Vec.of(1,0,1), Vec.of(1,0,-1), Vec.of(-1,0,-1), Vec.of(-1,0,1));
        this.normals.push(...Vec.cast([0,1,0], [0,1,0], [0,1,0], [0,1,0]));
        this.indices.push(0,1,2, 0,2,3);

        // make each side
        var normalVec = Vec.of(-1,-1,0);
        this.positions.push(Vec.of(-1,0,-1), Vec.of(-1,0,1), Vec.of(0,-1,0));
        this.normals.push(normalVec, normalVec, normalVec);
        this.indices.push(4,5,6);

        var normalVec = Vec.of(0,-1,1);
        this.positions.push(Vec.of(1,0,1), Vec.of(-1,0,1), Vec.of(0,-1,0));
        this.normals.push(normalVec, normalVec, normalVec);
        this.indices.push(7,8,9);

        var normalVec = Vec.of(1,-1,0);
        this.positions.push(Vec.of(1,0,1), Vec.of(1,0,-1), Vec.of(0,-1,0));
        this.normals.push(normalVec, normalVec, normalVec);
        this.indices.push(10,11,12);

        var normalVec = Vec.of(0,-1,-1);
        this.positions.push(Vec.of(1,0,-1), Vec.of(-1,0,-1), Vec.of(0,-1,0));
        this.normals.push(normalVec, normalVec, normalVec);
        this.indices.push(13,14,15);
    }
}

window.Needle = window.classes.Needle =
class Needle extends Shape{
    constructor(){
        super("positions", "normals", "texture_coords");

        var arm_transform = Mat4.translation(Vec.of(0,0.7,4)).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0)).times(Mat4.scale(Vec.of(0.15,8,0.15))));
        Cylinder.insert_transformed_copy_into(this, [15], arm_transform);

        var base_transform = Mat4.translation(Vec.of(0,0.35,0)).times(Mat4.scale(Vec.of(0.6,1.75,0.6)));             // draw the base separately in the scene
        Cylinder.insert_transformed_copy_into(this, [15], base_transform);

        var needle_cylinder_transform = Mat4.translation(Vec.of(0,0.7,8)).times(Mat4.scale(Vec.of(0.4,0.4,0.4)));
        Cylinder.insert_transformed_copy_into(this, [15], needle_cylinder_transform);

        var needle_transform = Mat4.translation(Vec.of(0,0.5,8)).times(Mat4.scale(Vec.of(0.05, 0.3, 0.05)));
        Pyramid.insert_transformed_copy_into(this, [], needle_transform);
    }
};


window.Basic_Shader = window.classes.Basic_Shader =
    class Basic_Shader extends Shader             // Subclasses of Shader each store and manage a complete GPU program.  This Shader is
    {                                             // the simplest example of one.  It samples pixels from colors that are directly assigned
        material() {
            return {shader: this}
        }      // to the vertices.  Materials here are minimal, without any settings.
        map_attribute_name_to_buffer_name(name)        // The shader will pull single entries out of the vertex arrays, by their data fields'
        {                                              // names.  Map those names onto the arrays we'll pull them from.  This determines
            // which kinds of Shapes this Shader is compatible with.  Thanks to this function,
            // Vertex buffers in the GPU can get their pointers matched up with pointers to
            // attribute names in the GPU.  Shapes and Shaders can still be compatible even
            // if some vertex data feilds are unused.
            return {object_space_pos: "positions", color: "colors"}[name];      // Use a simple lookup table.
        }

        // Define how to synchronize our JavaScript's variables to the GPU's:
        update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {
            const [P, C, M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
                PCM = P.times(C).times(M);
            gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        }

        shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        {
            return `precision mediump float;
              varying vec4 VERTEX_COLOR;
      `;
        }

        vertex_glsl_code()           // ********* VERTEX SHADER *********
        {
            return `
        attribute vec4 color;
        attribute vec3 object_space_pos;
        uniform mat4 projection_camera_model_transform;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);      // The vertex's final resting place (in NDCS).
          VERTEX_COLOR = color;                                                               // Use the hard-coded color of the vertex.
        }`;
        }

        fragment_glsl_code()           // ********* FRAGMENT SHADER *********
        {
            return `
        void main()
        { gl_FragColor = VERTEX_COLOR;                                    // The interpolation gets done directly on the per-vertex colors.
        }`;
        }
    };


window.Phong_Shader = window.classes.Phong_Shader =
    class Phong_Shader extends Shader          // THE DEFAULT SHADER: This uses the Phong Reflection Model, with optional Gouraud shading.
        // Wikipedia has good defintions for these concepts.  Subclasses of class Shader each store
        // and manage a complete GPU program.  This particular one is a big "master shader" meant to
        // handle all sorts of lighting situations in a configurable way.
        // Phong Shading is the act of determining brightness of pixels via vector math.  It compares
        // the normal vector at that pixel to the vectors toward the camera and light sources.
        // *** How Shaders Work:
        // The "vertex_glsl_code" string below is code that is sent to the graphics card at runtime,
        // where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw
        // shapes will launch the vertex shader program once per vertex in the shape (three times per
        // triangle), sending results on to the next phase.  The purpose of this vertex shader program
        // is to calculate the final resting place of vertices in screen coordinates; each vertex
        // starts out in local object coordinates and then undergoes a matrix transform to get there.
        //
        // Likewise, the "fragment_glsl_code" string is used as the Fragment Shader program, which gets
        // sent to the graphics card at runtime.  The fragment shader runs once all the vertices in a
        // triangle / element finish their vertex shader programs, and thus have finished finding out
        // where they land on the screen.  The fragment shader fills in (shades) every pixel (fragment)
        // overlapping where the triangle landed.  It retrieves different values (such as vectors) that
        // are stored at three extreme points of the triangle, and then interpolates the values weighted
        // by the pixel's proximity to each extreme point, using them in formulas to determine color.
        // The fragment colors may or may not become final pixel colors; there could already be other
        // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the
        // new triangle is closer to the camera, and even if so, blending settings may interpolate some
        // of the old color into the result.  Finally, an image is displayed onscreen.
    {
        material(color, properties)     // Define an internal class "Material" that stores the standard settings found in Phong lighting.
        {
            return new class Material       // Possible properties: ambient, diffusivity, specularity, smoothness, texture.
            {
                constructor(shader, color = Color.of(0, 0, 0, 1), ambient = 0, diffusivity = 1, specularity = 1, smoothness = 40) {
                    Object.assign(this, {shader, color, ambient, diffusivity, specularity, smoothness});  // Assign defaults.
                    Object.assign(this, properties);                                                        // Optionally override defaults.
                }

                override(properties)                      // Easily make temporary overridden versions of a base material, such as
                {
                    const copied = new this.constructor();  // of a different color or diffusivity.  Use "opacity" to override only that.
                    Object.assign(copied, this);
                    Object.assign(copied, properties);
                    copied.color = copied.color.copy();
                    if (properties["opacity"] != undefined) copied.color[3] = properties["opacity"];
                    return copied;
                }
            }(this, color);
        }

        map_attribute_name_to_buffer_name(name)                  // We'll pull single entries out per vertex by field name.  Map
        {                                                        // those names onto the vertex array names we'll pull them from.
            return {object_space_pos: "positions", normal: "normals", tex_coord: "texture_coords"}[name];
        }   // Use a simple lookup table.
        shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        {
            return `precision mediump float;
        const int N_LIGHTS = 2;             // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];
        uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader 
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the 
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L[N_LIGHTS], H[N_LIGHTS];
        varying float dist[N_LIGHTS];
        
        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++)
              {
                float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                float diffuse  =      max( dot(N, L[i]), 0.0 );
                float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );

                result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
              }
            return result;
          }
        `;
        }

        vertex_glsl_code()           // ********* VERTEX SHADER *********
        {
            return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;

        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 inverse_transpose_modelview;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                         // Directly use original texture coords and interpolate between.
          
          if( COLOR_NORMALS )                                     // Bypass all lighting code if we're lighting up vertices some other way.
          { VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In "normals" mode, 
                                 N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // rgb color = xyz quantity.
                                 N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );     // Flash if it's negative.
            return;
          }
                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );

          for( int i = 0; i < N_LIGHTS; i++ )
          {            // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
            L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );
            H[i] = normalize( L[i] + E );
            
            // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
            dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
          }

          if( GOURAUD )                   // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader, 
          {                               // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed 
                                          // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
            VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
            VERTEX_COLOR.xyz += phong_model_lights( N );
          }
        }`;
        }

        fragment_glsl_code()           // ********* FRAGMENT SHADER *********
        {                            // A fragment is a pixel that's overlapped by the current triangle.
            // Fragments affect the final image or get discarded due to depth.
            return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec4 tex_color = texture2D( texture, f_tex_coord );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
        }

        // Define how to synchronize our JavaScript's variables to the GPU's:
        update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {                              // First, send the matrices to the GPU, additionally cache-ing some products of them we know we'll need:
            this.update_matrices(g_state, model_transform, gpu, gl);
            gl.uniform1f(gpu.animation_time_loc, g_state.animation_time / 1000);

            if (g_state.gouraud === undefined) {
                g_state.gouraud = g_state.color_normals = false;
            }    // Keep the flags seen by the shader
            gl.uniform1i(gpu.GOURAUD_loc, g_state.gouraud);                              // program up-to-date and make sure
            gl.uniform1i(gpu.COLOR_NORMALS_loc, g_state.color_normals);                              // they are declared.

            gl.uniform4fv(gpu.shapeColor_loc, material.color);    // Send the desired shape-wide material qualities
            gl.uniform1f(gpu.ambient_loc, material.ambient);    // to the graphics card, where they will tweak the
            gl.uniform1f(gpu.diffusivity_loc, material.diffusivity);    // Phong lighting formula.
            gl.uniform1f(gpu.specularity_loc, material.specularity);
            gl.uniform1f(gpu.smoothness_loc, material.smoothness);

            if (material.texture)                           // NOTE: To signal not to draw a texture, omit the texture parameter from Materials.
            {
                gpu.shader_attributes["tex_coord"].enabled = true;
                gl.uniform1f(gpu.USE_TEXTURE_loc, 1);
                gl.bindTexture(gl.TEXTURE_2D, material.texture.id);
            } else {
                gl.uniform1f(gpu.USE_TEXTURE_loc, 0);
                gpu.shader_attributes["tex_coord"].enabled = false;
            }

            if (!g_state.lights.length) return;
            var lightPositions_flattened = [], lightColors_flattened = [], lightAttenuations_flattened = [];
            for (var i = 0; i < 4 * g_state.lights.length; i++) {
                lightPositions_flattened.push(g_state.lights[Math.floor(i / 4)].position[i % 4]);
                lightColors_flattened.push(g_state.lights[Math.floor(i / 4)].color[i % 4]);
                lightAttenuations_flattened[Math.floor(i / 4)] = g_state.lights[Math.floor(i / 4)].attenuation;
            }
            gl.uniform4fv(gpu.lightPosition_loc, lightPositions_flattened);
            gl.uniform4fv(gpu.lightColor_loc, lightColors_flattened);
            gl.uniform1fv(gpu.attenuation_factor_loc, lightAttenuations_flattened);
        }

        update_matrices(g_state, model_transform, gpu, gl)                                    // Helper function for sending matrices to GPU.
        {                                                   // (PCM will mean Projection * Camera * Model)
            let [P, C, M] = [g_state.projection_transform, g_state.camera_transform, model_transform],
                CM = C.times(M),
                PCM = P.times(CM),
                inv_CM = Mat4.inverse(CM).sub_block([0, 0], [3, 3]);
            // Send the current matrices to the shader.  Go ahead and pre-compute
            // the products we'll need of the of the three special matrices and just
            // cache and send those.  They will be the same throughout this draw
            // call, and thus across each instance of the vertex shader.
            // Transpose them since the GPU expects matrices as column-major arrays.
            gl.uniformMatrix4fv(gpu.camera_transform_loc, false, Mat.flatten_2D_to_1D(C.transposed()));
            gl.uniformMatrix4fv(gpu.camera_model_transform_loc, false, Mat.flatten_2D_to_1D(CM.transposed()));
            gl.uniformMatrix4fv(gpu.projection_camera_model_transform_loc, false, Mat.flatten_2D_to_1D(PCM.transposed()));
            gl.uniformMatrix3fv(gpu.inverse_transpose_modelview_loc, false, Mat.flatten_2D_to_1D(inv_CM));
        }
    };

window.Movement_Controls = window.classes.Movement_Controls =
    class Movement_Controls extends Scene_Component    // Movement_Controls is a Scene_Component that can be attached to a canvas, like any
    {                                                  // other Scene, but it is a Secondary Scene Component -- meant to stack alongside other
                                                       // scenes.  Rather than drawing anything it embeds both first-person and third-person
                                                       // style controls into the website.  These can be uesd to manually move your camera or
                                                       // other objects smoothly through your scene using key, mouse, and HTML button controls
                                                       // to help you explore what's in it.
        constructor(context, control_box, canvas = context.canvas) {
            super(context, control_box);
            [this.context, this.roll, this.look_around_locked, this.invert] = [context, 0, true, true];                  // Data members
            [this.thrust, this.pos, this.z_axis] = [Vec.of(0, 0, 0), Vec.of(0, 0, 0), Vec.of(0, 0, 0)];
            // The camera matrix is not actually stored here inside Movement_Controls; instead, track
            // an external matrix to modify. This target is a reference (made with closures) kept
            // in "globals" so it can be seen and set by other classes.  Initially, the default target
            // is the camera matrix that Shaders use, stored in the global graphics_state object.
            this.target = function () {
                return context.globals.movement_controls_target()
            };
            context.globals.movement_controls_target = function (t) {
                return context.globals.graphics_state.camera_transform
            };
            context.globals.movement_controls_invert = this.will_invert = () => true;
            context.globals.has_controls = true;

            [this.radians_per_frame, this.meters_per_frame, this.speed_multiplier] = [1 / 200, 20, 1];

            // *** Mouse controls: ***
            this.mouse = {"from_center": Vec.of(0, 0)};                           // Measure mouse steering, for rotating the flyaround camera:
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
                Vec.of(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
            // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
            document.addEventListener("mouseup", e => {
                this.mouse.anchor = undefined;
            });
            canvas.addEventListener("mousedown", e => {
                e.preventDefault();
                this.mouse.anchor = mouse_position(e);
            });
            canvas.addEventListener("mousemove", e => {
                e.preventDefault();
                this.mouse.from_center = mouse_position(e);
            });
            canvas.addEventListener("mouseout", e => {
                if (!this.mouse.anchor) this.mouse.from_center.scale(0)
            });
        }

        show_explanation(document_element) {
        }

        make_control_panel()                                                        // This function of a scene sets up its keyboard shortcuts.
        {
            const globals = this.globals;
            this.control_panel.innerHTML += "Click and drag the scene to <br> spin your viewpoint around it.<br>";
            this.key_triggered_button("Forward", ["i"], () => this.thrust[2] = 1, undefined, () => this.thrust[2] = 0);
            this.new_line();
            this.key_triggered_button("Left", ["j"], () => this.thrust[0] = 1, undefined, () => this.thrust[0] = 0);
            this.key_triggered_button("Back", ["k"], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0);
            this.key_triggered_button("Right", ["l"], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0);
            this.new_line();
            this.new_line();
            this.key_triggered_button("Up", ["x"], () => this.thrust[1] = -1, undefined, () => this.thrust[1] = 0);
            this.new_line();
            this.key_triggered_button("Down", ["z"], () => this.thrust[1] = 1, undefined, () => this.thrust[1] = 0);
            this.new_line();
            this.live_string(box => box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2)
                + ", " + this.pos[2].toFixed(2));
            this.new_line();        // The facing directions are actually affected by the left hand rule:
            this.live_string(box => box.textContent = "Facing: " + ((this.z_axis[0] > 0 ? "West " : "East ")
                + (this.z_axis[1] > 0 ? "Down " : "Up ") + (this.z_axis[2] > 0 ? "North" : "South")));
            this.new_line();
        }

        first_person_flyaround(radians_per_frame, meters_per_frame, leeway = 70) {
            const sign = this.will_invert ? 1 : -1;
            const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());
            // Compare mouse's location to all four corners of a dead box.
            const offsets_from_dead_box = {
                plus: [this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway],
                minus: [this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway]
            };
            // Apply a camera rotation movement, but only when the mouse is past a minimum distance (leeway) from the canvas's center:
            if (!this.look_around_locked)
                for (let i = 0; i < 2; i++)      // Steer according to "mouse_from_center" vector, but don't
                {                                 // start increasing until outside a leeway window from the center.
                    let o = offsets_from_dead_box,                                          // The &&'s in the next line might zero the vectors out:
                        velocity = ((o.minus[i] > 0 && o.minus[i]) || (o.plus[i] < 0 && o.plus[i])) * radians_per_frame;
                    do_operation(Mat4.rotation(sign * velocity, Vec.of(i, 1 - i, 0)));   // On X step, rotate around Y axis, and vice versa.
                }
            if (this.roll != 0) do_operation(Mat4.rotation(sign * .1, Vec.of(0, 0, this.roll)));
            // Now apply translation movement of the camera, in the newest local coordinate frame.
            do_operation(Mat4.translation(this.thrust.times(sign * meters_per_frame)));
        }

        third_person_arcball(radians_per_frame) {
            const sign = this.will_invert ? 1 : -1;
            const do_operation = this.target()[this.will_invert ? "pre_multiply" : "post_multiply"].bind(this.target());
            const dragging_vector = this.mouse.from_center.minus(this.mouse.anchor);               // Spin the scene around a point on an
            if (dragging_vector.norm() <= 0) return;                                                // axis determined by user mouse drag.
            do_operation(Mat4.translation([0, 0, sign * 25]));           // The presumed distance to the scene is a hard-coded 25 units.
            do_operation(Mat4.rotation(radians_per_frame * dragging_vector.norm(), Vec.of(dragging_vector[1], dragging_vector[0], 0)));
            do_operation(Mat4.translation([0, 0, sign * -25]));
        }

        display(graphics_state, dt = graphics_state.animation_delta_time / 1000)    // Camera code starts here.
        {
            const m = this.speed_multiplier * this.meters_per_frame,
                r = this.speed_multiplier * this.radians_per_frame;
            this.first_person_flyaround(dt * r, dt * m);     // Do first-person.  Scale the normal camera aiming speed by dt for smoothness.
            if (this.mouse.anchor)                            // Also apply third-person "arcball" camera mode if a mouse drag is occurring.
                this.third_person_arcball(dt * r);

            const inv = Mat4.inverse(this.target());
            this.pos = inv.times(Vec.of(0, 0, 0, 1));
            this.z_axis = inv.times(Vec.of(0, 0, 1, 0));      // Log some values.
        }
    };

window.Body = window.classes.Body =
    class Body
    {                                   // **Body** can store and update the properties of a 3D body that incrementally
                                        // moves from its previous place due to velocities.  It conforms to the
                                        // approach outlined in the "Fix Your Timestep!" blog post by Glenn Fiedler.
      constructor( shape, material, size, moveable, aabb, breakable )
        { Object.assign( this, 
                 { shape, material, size, moveable, aabb, breakable } )
        }
      emplace( location_matrix, linear_velocity, angular_velocity, spin_axis = Vec.of( 0,0,0 ).randomized(1).normalized() )
        {                               // emplace(): assign the body's initial values, or overwrite them.
          this.center   = location_matrix.times( Vec.of( 0,0,0,1 ) ).to3();
          this.rotation = Mat4.translation( this.center.times( -1 ) ).times( location_matrix );
          this.previous = { center: this.center.copy(), rotation: this.rotation.copy() };
                                                  // drawn_location gets replaced with an interpolated quantity:
          this.drawn_location = location_matrix;
          this.temp_matrix = Mat4.identity();
          return Object.assign( this, { linear_velocity, angular_velocity, spin_axis } )
        }
      advance( time_amount ) 
        {                           // advance(): Perform an integration (the simplistic Forward Euler method) to
                                    // advance all the linear and angular velocities one time-step forward.
          this.previous = { center: this.center.copy(), rotation: this.rotation.copy() };
                                                     // Apply the velocities scaled proportionally to real time (time_amount):
                                                     // Linear velocity first, then angular:
          this.center = this.center.plus( this.linear_velocity.times( time_amount ) );
          this.rotation.pre_multiply( Mat4.rotation( time_amount * this.angular_velocity, this.spin_axis ) );
        }
      blend_rotation( alpha )         
        {                        // blend_rotation(): Just naively do a linear blend of the rotations, which looks
                                 // ok sometimes but otherwise produces shear matrices, a wrong result.
           return this.rotation.map( (x,i) => Vec.of( ...this.previous.rotation[i] ).mix( x, alpha ) );
        }
      blend_state( alpha )            
        {                             // blend_state(): Compute the final matrix we'll draw using the previous two physical
                                      // locations the object occupied.  We'll interpolate between these two states as 
                                      // described at the end of the "Fix Your Timestep!" blog post.
          this.drawn_location = Mat4.translation( this.previous.center.mix( this.center, alpha ) )
                                          .times( this.blend_rotation( alpha ) )
                                          .times( Mat4.scale( this.size ) );
        }
      check_if_colliding( b )
        {                                     
          if ( this == b ) 
            return false;                     // Nothing collides with itself.
                                              // Convert b coordinates to the frame of a
                                              // Shift the axis aligned bounding boxes from frame b to a
          let b_min_aabb = b.drawn_location.times( b.aabb[0].to4(1) ).to3();
          let b_max_aabb = b.drawn_location.times( b.aabb[1].to4(1) ).to3();
          
          let a_min_aabb = this.drawn_location.times( this.aabb[0].to4(1) ).to3();
          let a_max_aabb = this.drawn_location.times( this.aabb[1].to4(1) ).to3();
                                              // Check for intersections on the three axes          
          if ( a_max_aabb[0] < b_min_aabb[0] || a_min_aabb[0] > b_max_aabb[0] ) return false; 
          if ( a_max_aabb[1] < b_min_aabb[1] || a_min_aabb[1] > b_max_aabb[1] ) return false; 
          if ( a_max_aabb[2] < b_min_aabb[2] || a_min_aabb[2] > b_max_aabb[2] ) return false; 

          return true;
        }
      perform_action( b )
        {
            throw "Override this";
        }
    };

window.Simulation = window.classes.Simulation = 
    class Simulation extends Scene_Component
    {                                         // **Simulation** manages the stepping of simulation time.  Subclass it when making
                                              // a Scene that is a physics demo.  This technique is careful to totally decouple
                                              // the simulation from the frame rate (see below).
      constructor(context, control_box)
        { super(context, control_box);
          Object.assign( this, { time_accumulator: 0, time_scale: 1, t: 0, dt: 1/20, bodies: [], steps_taken: 0 } );            
        }
      simulate( frame_time )
        {                                     // simulate(): Carefully advance time according to Glenn Fiedler's 
                                              // "Fix Your Timestep" blog post.
                                              // This line gives ourselves a way to trick the simulator into thinking
                                              // that the display framerate is running fast or slow:
          frame_time = this.time_scale * frame_time;

                                              // Avoid the spiral of death; limit the amount of time we will spend 
                                              // computing during this timestep if display lags:
          this.time_accumulator += Math.min( frame_time, 0.1 );
                                              // Repeatedly step the simulation until we're caught up with this frame:
          while ( Math.abs( this.time_accumulator ) >= this.dt )
          {                                                       // Single step of the simulation for all bodies:
            this.update_state( this.dt );
            for( let b of this.bodies )
              b.advance( this.dt );
                                              // Following the advice of the article, de-couple 
                                              // our simulation time from our frame rate:
            this.t                += Math.sign( frame_time ) * this.dt;
            this.time_accumulator -= Math.sign( frame_time ) * this.dt;
            this.steps_taken++;
          }
                                                // Store an interpolation factor for how close our frame fell in between
                                                // the two latest simulation time steps, so we can correctly blend the
                                                // two latest states and display the result.
          let alpha = this.time_accumulator / this.dt;
          for( let b of this.bodies ) b.blend_state( alpha );
        }
      make_control_panel()
        {                       // make_control_panel(): Create the buttons for interacting with simulation time.
          this.key_triggered_button( "Speed up time", [ "Shift","T" ], () => this.time_scale *= 5           );
          this.key_triggered_button( "Slow down time",        [ "t" ], () => this.time_scale /= 5           ); this.new_line();
          this.live_string( box => { box.textContent = "Time scale: "  + this.time_scale                  } ); this.new_line();
          this.live_string( box => { box.textContent = "Fixed simulation time step size: "  + this.dt     } ); this.new_line();
          this.live_string( box => { box.textContent = this.steps_taken + " timesteps were taken so far." } );
        }
      display( program_state )
        {                                     // display(): advance the time and state of our whole simulation.
          if( true ) 
            this.simulate( program_state.animation_delta_time );
                                              // Draw each shape at its current location:
          for( let b of this.bodies )
            b.shape.draw( program_state, b.drawn_location, b.material );
        }
      update_state( dt )      // update_state(): Your subclass of Simulation has to override this abstract function.
        { throw "Override this" }
    };

window.Projectile = window.classes.Projectile = 
    class Projectile extends Body 
    {
        constructor( shape, material, size, moveable, aabb )
        { 
            super(shape, material, size, moveable, aabb, true); 
            this.cur_collision = undefined;
        }
        perform_action( b )
        {
            if(b.normal && this.cur_collision != b) {
                let new_linear_velocity = b.normal.times(-2 * this.linear_velocity.dot(b.normal)).plus(this.linear_velocity);
    
                let norm_dir = new_linear_velocity.normalized();
                let x_rot = Math.atan(norm_dir[1] / norm_dir[2]);
                let y_rot = Math.atan(norm_dir[0] / norm_dir[2]);

                let proj_transform = Mat4.translation(Vec.of(this.drawn_location[0][3], this.drawn_location[1][3], this.drawn_location[2][3]))
                                         .times(Mat4.rotation(-x_rot, Vec.of(1, 0, 0))
                                         .times(Mat4.rotation(y_rot, Vec.of(0, 1, 0))));

                super.emplace(proj_transform, new_linear_velocity, this.angular_velocity);

                this.cur_collision = b;
            }
        }

    }
 
window.Wall = window.classes.Wall =
    class Wall extends Body
    {
        constructor( shape, material, size, aabb , normal )
        {
            super(shape, material, size, false, aabb, false);
            this.normal = normal;
        }
        perform_action( b ) {}
    }

window.Frag = window.classes.Frag = 
    class Frac extends Body
    {
        constructor( shape, material, size, aabb)
        {
            super(shape, material, size, true, aabb, false);
        }
        perform_action( b )  
        {
            if(!b.breakable && b.linear_velocity.norm() == 0 && b.normal)
                this.linear_velocity = Vec.of(0, 0, 0);
        }
    }

window.Target = window.classes.Target = 
    class Target extends Body
    {
        constructor( shape, material, size, aabb )
        {
            super(shape, material, size, false, aabb, true);
        }
        perform_action( b ) {}
    }

window.Target_Frag = window.classes.Target_Frag =
    class Target_Frag extends Body
    {
        constructor( shape, material, size, aabb )
        {
            super(shape, material, size, true, aabb, false);
        }
        perform_action( b ) 
        {
            if(!b.breakable && b.linear_velocity.norm() == 0 && b.normal)
                this.linear_velocity = Vec.of(0, 0, 0);
        }
    }