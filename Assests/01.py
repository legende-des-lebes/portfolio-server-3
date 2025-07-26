import bpy

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Create a cube
bpy.ops.mesh.primitive_cylinder_add(radius=1,depth=2,align="World", location=(0, 0, 1),scale=(1,1,1))
cube = bpy.context.active_object
cube.name = "My_Cylinder"



# Add material
mat = bpy.data.materials.new(name="RedMaterial")
mat.diffuse_color = (1, 0, 0, 1)  # RGBA
cube.data.materials.append(mat)
