from transformers import pipeline
import tkinter as tk
from tkinter import messagebox
import os

# 使用中文问答模型
qa_model = pipeline("question-answering", model="uer/roberta-base-chinese-extractive-qa")
context = "马来西亚国旗由14条红白条纹和一弯新月及14点星组成，红白颜色象征勇气与纯洁，象征14个州属；新月和星代表伊斯兰教和国家的团结。马来西亚于1957年8月31日从英国殖民统治下独立。独立宣言在吉隆坡的默迪卡广场宣读，由东姑阿都拉曼领导。东姑阿都拉曼是马来西亚首位总理，他在1955年领导联盟党赢得选举，为独立铺平道路。"

# 创建 GUI 窗口
root = tk.Tk()
root.title("马来西亚历史问答系统")
root.geometry("500x400")  # 增大窗口大小
root.configure(bg="#f0f0f0")  # 设置背景颜色为浅灰

# 创建标题标签
title_label = tk.Label(root, text="马来西亚历史问答系统", font=("宋体", 18, "bold"), bg="#f0f0f0", fg="#2c3e50")
title_label.pack(pady=20)

# 创建输入框和标签
question_frame = tk.Frame(root, bg="#f0f0f0")
question_frame.pack(pady=10)

question_label = tk.Label(question_frame, text="请输入你的问题：", font=("宋体", 12), bg="#f0f0f0", fg="#2c3e50")
question_label.pack(side=tk.LEFT, padx=5)

question_entry = tk.Entry(question_frame, width=40, font=("宋体", 12), bd=2, relief="groove")
question_entry.pack(side=tk.LEFT, padx=5)

# 创建答案标签
answer_label = tk.Label(root, text="答案：", font=("宋体", 12), bg="#f0f0f0", fg="#2c3e50", wraplength=450, justify="left")
answer_label.pack(pady=20)

def get_answer():
    question = question_entry.get()
    if question.lower() == "退出":
        root.quit()
    else:
        try:
            result = qa_model(question=question, context=context)
            answer = result['answer']
            answer_label.config(text=f"答案：{answer}")
            # 自动保存到桌面 results.txt
            desktop = os.path.join(os.path.expanduser("~"), "Desktop")
            results_path = os.path.join(desktop, "results.txt")
            with open(results_path, "a", encoding="utf-8") as f:
                f.write(f"问题：{question} 答案：{answer}\n")
            question_entry.delete(0, tk.END)  # 清空输入框
        except Exception as e:
            messagebox.showerror("错误", f"发生错误：{e}")

# 创建提交和退出按钮
button_frame = tk.Frame(root, bg="#f0f0f0")
button_frame.pack(pady=20)

submit_button = tk.Button(button_frame, text="提交", font=("宋体", 12), bg="#3498db", fg="white", padx=10, pady=5, command=get_answer)
submit_button.pack(side=tk.LEFT, padx=10)

exit_button = tk.Button(button_frame, text="退出", font=("宋体", 12), bg="#e74c3c", fg="white", padx=10, pady=5, command=root.quit)
exit_button.pack(side=tk.LEFT, padx=10)

root.mainloop()