import tkinter as tk

# 创建主窗口
root = tk.Tk()
root.title("Calculator")
root.geometry("300x400")  # 设置窗口大小

# 显示屏幕
screen = tk.Entry(root, font=("Arial", 20), bd=10, insertwidth=2, width=14, borderwidth=4, justify="right")
screen.grid(row=0, column=0, columnspan=4)

# 定义按钮点击事件
def button_click(value):
    current = screen.get()
    if value == "=":
        try:
            result = eval(current)
            screen.delete(0, tk.END)
            screen.insert(0, str(result))
        except:
            screen.delete(0, tk.END)
            screen.insert(0, "Error")
    elif value == "C":
        screen.delete(0, tk.END)
    else:
        screen.insert(tk.END, value)

# 按钮的布局
buttons = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "C", "0", "=", "+"
]

# 动态生成按钮
row_val = 1
col_val = 0
for button in buttons:
    action = lambda x=button: button_click(x)
    tk.Button(
        root, text=button, padx=20, pady=20, font=("Arial", 14),
        command=action, bg="lightgray"
    ).grid(row=row_val, column=col_val)
    col_val += 1
    if col_val > 3:
        col_val = 0
        row_val += 1

# 运行主循环
root.mainloop()
