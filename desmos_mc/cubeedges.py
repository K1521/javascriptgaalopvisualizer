import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np

# Define the vertex positions (hF)
hF = np.array([
    [0, 0, 0],  # 0
    [0, 1, 0],  # 1
    [1, 1, 0],  # 2
    [1, 0, 0],  # 3
    [0, 0, 1],  # 4
    [0, 1, 1],  # 5
    [1, 1, 1],  # 6
    [1, 0, 1],  # 7
    [0.5, 0.5, 0.5]  # 8 - center
])

# Define edges from 'fo' as pairs of indices
fo = [
    0, 1, 0, 2, 0, 3, 1, 2, 2, 3,
    0, 4, 0, 7, 3, 7, 4, 7, 0, 5,
    1, 5, 4, 5, 1, 6, 2, 6, 5, 6,
    3, 6, 6, 7, 4, 6, 0, 8, 1, 8,
    2, 8, 3, 8, 4, 8, 5, 8, 6, 8,
    7, 8
]

# Reshape to pairs
edges = np.array(fo).reshape(-1, 2)

# Plotting
fig = plt.figure(figsize=(8, 8))
ax = fig.add_subplot(111, projection='3d')

# Plot vertices
ax.scatter(hF[:, 0], hF[:, 1], hF[:, 2], c='red', s=50)

# Annotate each vertex
for i, pos in enumerate(hF):
    ax.text(pos[0], pos[1], pos[2], f'{i}', color='black')

# Plot edges
for start_idx, end_idx in edges:
    start = hF[start_idx]
    end = hF[end_idx]
    ax.plot([start[0], end[0]], [start[1], end[1]], [start[2], end[2]], 'b')

# Set limits and labels
ax.set_xlim([-0.2, 1.2])
ax.set_ylim([-0.2, 1.2])
ax.set_zlim([-0.2, 1.2])
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')
ax.set_title('Visualization of 26 Cube Edges (fo)')

plt.tight_layout()
plt.show()
