from openai import OpenAI
from config import QWEN_API_KEY, QWEN_BASE_URL
def call_qwen_model(prompt: str, system_prompt: str = "You are a helpful assistant.") -> str:
    """
    调用千问大模型API，返回模型回复内容
    :param prompt: 用户输入的提示词
    :param system_prompt: 系统角色提示词，默认是通用助手
    :return: 模型的回复文本（失败返回空字符串）
    """
    try:
        # 初始化OpenAI客户端（适配千问兼容模式）
        client = OpenAI(
            api_key = QWEN_API_KEY,
            base_url = QWEN_BASE_URL,
        )

        # 调用聊天接口
        completion = client.chat.completions.create(
            model="qwen-turbo",  # 可替换为qwen-turbo/qwen-max等模型
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,  # 随机性，0-1之间
            max_tokens=1024,  # 最大生成token数
        )

        # 提取并返回模型回复
        response_content = completion.choices[0].message.content
        return response_content

    except Exception as e:
        print(f"调用千问模型失败：{str(e)}")
        return ""

# 测试代码（可选，运行该文件时执行）
if __name__ == "__main__":
    # 注意：测试前需先设置环境变量 export DASHSCOPE_API_KEY="sk-xxx"
    result = call_qwen_model("分析一下这个开源仓库的潜力：owner/repo")
    print("千问模型回复：", result)