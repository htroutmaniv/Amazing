Project Title: A-Mazing
URL: https://www.youtube.com/watch?v=zBQz5bPfsr4
Description:

##How To run
In first bash window
cd client
npm run dev

In second bash window:
cd server
npm run dev

open client in browser at vite specified address

##Overview
My project aims to produce spherical labyrinths that can be navigable by a player. I sought to procedurally generate mazes which were
scalable in complexity, visually interesting, always solvable, and potentially of near infinite variation.

##The Concept
There are many ways to generate a maze but at least in my mind the most straightforward is to take a grid of tiles and build walls around each tile
carving a path. This is fairly straight forward. In order to take that methodology and implement it on a sphere things become more complex.
Because I have a background in 3d modeling I've long felt that a sphere lends itself to mapping planes onto its surface. A sphere is very
much just a rounded box. Because a box has 6 planar surfaces we can treat each plane like a grid for maze generation. Each grid must have it's edges mapped to it's neighboring edge. Once this is done the maze generation algorithm simply needs to run on each cell of each grid. Once we have
determined the openings (and thereby the walls) of each cell's sides in relation to it's neighbors we can use that information to generate walls on our sphere.

##The algorithm
I decided to use Prim's algorithm after a little research because I felt that it would generate mazes which looked complex and interesting
while logically being rather simple. I also chose Prim's because it produces mazes in which every cell is accessible and for the reason that prim's supports non rectangular mappings. Being that I am mapping the maze onto a sphere and there are lot's of complexities around the edges of each of the 6 grids I felt it was especially important that every tile be accessible. This also frees me to choose an arbitrary "end" for the maze. My approach is fairly simple, for each face I determine a number of divisions, this creates a grid of divisions X divisions for each of the 6 grids. (d _ d) _ 6 easy enough to structure as a multi-dimensional array of faces, columns, rows. A tile class object is initialized for each cell in the grid for the purpose of referencing neighbors, paths, and various other information about a given tile. The algorithm sets the initial starting tile and then adds all unvisited neighbors to the "frontier" that is the tiles which are not yet visited, a pool to pick from. A random tile from the frontier is chosen (I use a seeded random value for reproducability) once a frontier tile is chosen each of it's neighbors is analyzed, if the neighbor has previously been visited it is added to a pool of potential connections, else it is added to the frontier. The current tile is marked visited and a random visited neighbor is selected and both parties note their connection. A new tile is selected from the frontier and the process repeats until no tiles is left in the frontier.

##What happens next?
Once the tiles are initialized and their relationships established I pass the array of tiles to my three.js scene.
On the three side I generate a cubesphere, that is a cube of divisions, divisions, divisions. After the cube is generated it's various vertex positions are normalized into a sphere of specified radius.

##Wall generation
Because of the complexities of generating the wall meshes I did leverage AI heavily for this particular part of the code. The idea is simple enough, each tile from the tiles array maps to a corresponding face on the cubesphere, each face has 4 outer edges, these correspond with tile data for each edge indicating either a passage or not. This lets me create branched mappings of connected edges, those edges determine the centerline of the walls. Polyline offsetting is performed to create thickness off of the centerline, this creates the footprint of the walls. The footprint is extruded upward with consideration to the spherical radius of the upper wall and holes are sealed to create uniform surfaces without penetrating walls.
I will note that I first tried a different method by which I instantiated wall geometries along all the edges and oriented them but because the spherical mapping has some distortion in it this technique was not ideal, it led to gaps, penetrations, and waste which was neither performant or visually appealing and made corridor sizes inconsistent.
Bonus: The maze also looks very cool when nothing is turned into a sphere and you just have a cube maze.

Once everything is built I simply add a sphere for the character at a set grid point face 0, col 0, row 0, though the starting point could be arbitrary. I place the end point on the opposing side of the sphere for simplicity.

##Player control
Because of a general lack of physics in three.js and the complexity involved in doing collision detection in this environment I decided the best way to handle player control was to simply move them to tile centers which I calculate by generating points for the faces and spherizing them similarly to how the cubesphere is created but using central points rather than vertices of faces. After that we can look at a given tile's "top" neighbor or any other direction and simple move our player sphere to the corresponding position. This does come with it's own headaches though. Because I wanted the orientation to always be such that pressing 'w' moves you 'up' and the fact that transitioning into other faces can cause inversions of direction I needed to track these transitional states and invert what a tile's "top", "bottom" etc meant so by comparing new position to old position and checking neighbors I'm able to essentially just invert the controls in a way that provides consistent player movement across tiles. This can sometimes lead to the orientation of the sphere changing but I think it works still and simply adds to the difficulty of traversing the maze. Ideally I'd like to visually smooth this movement through some sort of position and camera lerping but time did not allow for that level of polish. If I were to take this project on in a more complete fashion I would likely prefer to use Unity and actual collision detection to simply rotate the sphere instead of move the player around it.

##Level tracking and user data
I wanted to implement a database and integrate front end back end communication. I created an sqlite database with 2 simple tables. The first tracks usernames & highest level reached. The second tracks scores where username, level, and score (as time in ms) is stored. This setup allows me to track individual stats as well as offer per user level selection and a multi-user high scores page with per level scoring. I ensured that user scores would only be updated if a score already exists or otherwise added. I decided to forgo passwords and logins for the sake of time though obviously having secure user registration and logins would prevent potential score data overrides, it was simply outside of the scope of my goals.

##UI
I'm not a big fan of implementing UI, it's just not my cup of tea and I find it tedious. As such I kept things monochrome and very simplistic. If I were to allot more time to this project I do think there are many UI and UX improvements to be made including the look and navigation of the maze and it's controls. Everything serves it's purpose and I think I minimized bugs though actual user testing would likely reveal some missed details here and there.

##Conclusion
In conclusion I think that my project illustrates many of the concepts covered in the course and beyond. I think there is ample room for additional development on a project like this and it could easily become a real website with things like campaign mode, random challenges, seed sharing, daily challenges, in depth leaderboards, user authentication and a billion visual improvements. I also think a hexagonal maze structure would map much nicer to a sphere without distortion and would be a wonderful future implementation. That said time management is also a vital development skill and I picked a scope and stuck to it yielding a workable and interesting demo. As a final note, I have long desired to develop a spherical maze and am greatly amused by it's success. Thank you all for the wonderful course!
