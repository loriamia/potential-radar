# main.py 项目主入口
import json
import csv
from github_api import get_github_trending_repos,get_github_repos
from opendigger_analysis import batch_analysis_repos
from config import RESULT_SAVE_PATH, GITHUB_URLS
from correlation_analysis import analyze_correlations

def save_result_to_json(result: list, save_path: str):
    """将结果保存到本地json文件"""
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    print(f"\n✅ 结果已保存到本地文件: {save_path}")

def output_to_csv(result: dict, correlations: dict, filename: str):
    """将result和correlations输出为CSV表格，每一个数组为一行"""
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        # 写入 result 数据
        for metric, values in result.items():
            writer.writerow([metric] + values)
        # 空行分隔
        writer.writerow([])
        # 写入 correlations 数据
        for metric, corr in correlations.items():
            writer.writerow([f"correlation_{metric}", corr])
    print(f"\n✅ 结果和相关性已保存到CSV文件: {filename}")

if __name__ == "__main__":
    metrics = ["inactive_contributors","contributors",  "issue_resolution_duration", "change_request_resolution_duration", "activity", "issue_response_time", 
               "change_request_response_time", "openrank"]  # 示例指标数组

    print("=" * 50)
    print("开始爬取GitHub仓库并分析...")
    print("=" * 50)

    # 1. 爬取仓库地址
    # repo_list = get_github_trending_repos()
    # repo_list = get_github_repos(200)
    # if not repo_list:
    #     print("❌ 未爬取到任何仓库地址，程序终止")
    #     exit()

    # 使用保存的repo——list.json，方便复现
    repo_list = json.load(open("repos_snapshot.json"))

    # 2. 批量分析仓库，得到平均activity值的数组【核心结果】
    result = batch_analysis_repos(repo_list, metrics)

    # 修改 inactive_contributors 为 inactive_contributors / contributors
    # if "inactive_contributors" in result and "contributors" in result:
    #     inactive = result["inactive_contributors"]
    #     contrib = result["contributors"]
    #     if len(inactive) == len(contrib):
    #         result["inactive_contributors"] = [inactive[i] / contrib[i] if contrib[i] != 0 else 0 for i in range(len(inactive))]

    # 3. 打印最终结果数组
    print("\n" + "=" * 50)
    3
    print("📈 最终结果数组 (仓库+近3个月平均activity值):")
    print("=" * 50)
    print(result)



    # 在获取 result 后
    correlations = analyze_correlations(metrics, result)
    print("相关性分析结果:", correlations)
    
    # 4. 输出为CSV表格
    output_to_csv(result, correlations, "result.csv")
    # 4. 可选：保存结果到本地
    #save_result_to_json(activity_array, RESULT_SAVE_PATH)

    # 单独提取纯activity值的数组（按需）
    # only_activity_values = [item["avg_activity_3months"] for item in activity_array]
    # print("\n✨ 纯平均活跃度数值数组: ", only_activity_values)