import pygame

# 初始化Pygame
pygame.init()

# 设置屏幕尺寸
screen_width, screen_height = 800, 600
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption("无引力状态下的球运动")

# 定义颜色
WHITE = (255, 255, 255)
RED = (255, 0, 0)

# 定义球体属性
ball_radius = 20
ball_x, ball_y = screen_width // 2, screen_height // 2  # 球的初始位置
velocity_x, velocity_y = 5.0, 7.0  # 初始速度

# 时间控制
clock = pygame.time.Clock()
fps = 60  # 帧率

# 主循环
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 更新球的位置
    ball_x += velocity_x
    ball_y += velocity_y

    # 边界碰撞检测
    # 水平方向反弹
    if ball_x - ball_radius < 0 or ball_x + ball_radius > screen_width:
        velocity_x = -velocity_x  # 反转水平速度
        ball_x = max(ball_radius, min(ball_x, screen_width - ball_radius))  # 防止超出边界

    # 垂直方向反弹
    if ball_y - ball_radius < 0 or ball_y + ball_radius > screen_height:
        velocity_y = -velocity_y  # 反转垂直速度
        ball_y = max(ball_radius, min(ball_y, screen_height - ball_radius))  # 防止超出边界

    # 清屏并绘制
    screen.fill(WHITE)
    pygame.draw.circle(screen, RED, (int(ball_x), int(ball_y)), ball_radius)

    # 更新显示
    pygame.display.flip()

    # 控制帧率
    clock.tick(fps)

# 退出Pygame
pygame.quit()
