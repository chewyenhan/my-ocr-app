import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.animation import FuncAnimation

# 参数设置
r_earth = 1     # 地球到太阳的距离（单位可任意，设为1）
r_moon = 0.2    # 月球到地球的距离（放大以便可视化）
T_moon = 0.1    # 月球公转周期（相对于地球周期，设为0.1表示地球绕太阳1圈，月球绕地球10圈）

# 创建图形和三维坐标系
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# 设置坐标轴范围
ax.set_xlim(-1.5, 1.5)
ax.set_ylim(-1.5, 1.5)
ax.set_zlim(-0.5, 0.5)

# 绘制太阳（固定不动）
ax.scatter([0], [0], [0], color='yellow', s=100, label='太阳')

# 绘制地球的轨道（固定圆形轨道）
theta = np.linspace(0, 2 * np.pi, 100)
x_orbit = r_earth * np.cos(theta)
y_orbit = r_earth * np.sin(theta)
z_orbit = np.zeros_like(theta)
ax.plot(x_orbit, y_orbit, z_orbit, 'b--', label='地球轨道')

# 初始化地球和月球的绘制对象
earth, = ax.plot([], [], [], 'bo', markersize=10, label='地球')
moon, = ax.plot([], [], [], 'go', markersize=5, label='月球')

# 更新函数，用于动画的每一帧
def update(t):
    # 计算地球的位置
    theta_earth = 2 * np.pi * t  # 地球的角度，t 从 0 到 1 表示一个完整周期
    x_earth = r_earth * np.cos(theta_earth)
    y_earth = r_earth * np.sin(theta_earth)
    z_earth = 0

    # 计算月球的位置（相对于地球）
    theta_moon = 2 * np.pi * t / T_moon  # 月球的角度
    x_moon = x_earth + r_moon * np.cos(theta_moon)
    y_moon = y_earth + r_moon * np.sin(theta_moon)
    z_moon = 0

    # 更新地球和月球的位置
    earth.set_data([x_earth], [y_earth])
    earth.set_3d_properties([z_earth])
    moon.set_data([x_moon], [y_moon])
    moon.set_3d_properties([z_moon])

    return earth, moon

# 创建动画
ani = FuncAnimation(fig, update, frames=np.linspace(0, 1, 100), interval=50, blit=False)

# 添加坐标轴标签和图例
ax.set_xlabel('X轴')
ax.set_ylabel('Y轴')
ax.set_zlabel('Z轴')
ax.legend()

# 显示动画
plt.show()