# main.py 项目主入口
import json
import csv
import os
from github_api import get_github_trending_repos,get_github_repos
from opendigger_analysis import batch_analysis_repos
from config import RESULT_SAVE_PATH, GITHUB_URLS
from correlation_analysis import analyze_correlations
from PCA import pca_with_metric_weight

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
    metrics = ["inactive_contributors","contributors", "participants", "bus_factor","issue_resolution_duration", "change_request_resolution_duration", "activity", "issue_response_time", 
               "change_request_response_time", "openrank"]  # 示例指标数组

    # print("=" * 50)
    # print("开始爬取GitHub仓库并分析...")
    # print("=" * 50)

    # 1. 爬取仓库地址
    # repo_list = get_github_trending_repos()
    # repo_list = get_github_repos(200)
    # if not repo_list:
    #     print("❌ 未爬取到任何仓库地址，程序终止")
    #     exit()

    # 使用保存的repo——list.json，方便复现
    repo_list = json.load(open("repos_snapshot.json"))

    # 2. 批量分析仓库，得到平均activity值的数组【核心结果】
    result_file = "result.json"
    if os.path.exists(result_file):
        print(f"从文件 {result_file} 加载result，避免重复计算...")
        with open(result_file, "r", encoding="utf-8") as f:
            result = json.load(f)
    else:
        print("计算result...")
        result = batch_analysis_repos(repo_list, metrics)
        save_result_to_json(result, result_file)

    # contributors:contributors/participants
    if "contributors" in result and "participants" in result:
        inactive = result["contributors"]
        contrib = result["participants"]
        metrics.insert(len(metrics) - 1, "contributors_per_participant")
        if len(inactive) == len(contrib):
            result["contributors_per_participant"] = [inactive[i] / contrib[i] if contrib[i] != 0 else 0 for i in range(len(inactive))]

    # 3. 打印最终结果数组
    print("\n" + "=" * 50)
    3
    # print("📈 最终结果数组 (仓库+近3个月平均activity值):")
    # print("=" * 50)
    # print(result)



    # 在获取 result 后
    correlations = analyze_correlations(metrics, result)
    print("相关性分析结果:", correlations)
    
    # 去掉result的最后一行（最后一个样本）和metrics的最后一个指标
    result_trimmed = {k: v[:-1] for k, v in result.items()}
    metrics_trimmed = metrics[:-1]
    
    # 再去掉"contributors"和"participants"
    result_trimmed = {k: v for k, v in result_trimmed.items() if k not in ["contributors", "participants", "openrank"]}
    metrics_trimmed = [m for m in metrics_trimmed if m not in ["contributors", "participants", "openrank"]]
    
    (pca_loadings_df, component_var_ratio, raw_metric_weights,
     pca_composite_scores, standardized_df) = pca_with_metric_weight(result_trimmed, metrics_trimmed)
    print("3. 原始指标的综合权重（主成分权重还原后，权重和为1）：")
    for metric, weight in sorted(raw_metric_weights.items(), key=lambda x: x[1], reverse=True):
        print(f"   {metric:<35}: {weight:.6f}")

    print("=" * 80)
    # 4. 输出为CSV表格
    # output_to_csv(result, correlations, "result.csv")
    # 4. 可选：保存结果到本地
    #save_result_to_json(activity_array, RESULT_SAVE_PATH)

    # 单独提取纯activity值的数组（按需）
    # only_activity_values = [item["avg_activity_3months"] for item in activity_array]
    # print("\n✨ 纯平均活跃度数值数组: ", only_activity_values)