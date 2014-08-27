# Run this from within Blender to export edge data to the desired text file. Replace the
# strings on lines 5 and 16 to edit the object and output file, respectively.
import bpy

object = bpy.data.objects['ViewOcclusion'].data

# Generate an empty sublist for every vertex
out = [[] for i in object.vertices]

for edge in object.edges:
    
    # Doubly linked edge array

	#out[edge.vertices[0]].append(edge.vertices[1])
	#out[edge.vertices[1]].append(edge.vertices[0])
	

	# Singly linked edge array
	if edge.vertices[0] > edge.vertices[1]:
		out[edge.vertices[1]].append(edge.vertices[0])
	else:
		out[edge.vertices[0]].append(edge.vertices[1])


save = open('C:/Users/Monty/Desktop/Data/THREE/Models/Terrain/edgeExport.txt', 'w')
save.write(str(out))
save.close()

# Easier for unix "python exportsEdge.py > file.json"
# print(str(out))
