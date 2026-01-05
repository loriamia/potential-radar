from openrank_analysis import batch_analysis_repos
import numpy as np
import pandas as pd

def standardize_data(raw_data_df, metrics, negative_metrics=None):
    """
    数据标准化函数（处理负向指标、极差过大问题，映射到[0,1]区间）
    参数:
        raw_data_df: 原始数据DataFrame
        metrics: 动态指标数组
        negative_metrics: 负向指标列表（数值越小越好）
    返回:
        standardized_df: 标准化后的DataFrame
    """
    if negative_metrics is None:
        negative_metrics = []
    standardized_data = np.zeros_like(raw_data_df[metrics].values, dtype=np.float64)
    raw_metric_data = raw_data_df[metrics].values

    for idx, metric in enumerate(metrics):
        col_data = raw_metric_data[:, idx].copy()
        # Z-Score标准化（消除量纲和极差影响）
        mean_val = np.mean(col_data)
        std_val = np.std(col_data)
        if std_val == 0:
            z_score = np.full_like(col_data, 0.5, dtype=np.float64)
        else:
            z_score = (col_data - mean_val) / std_val

        # 映射到[0,1]区间
        min_z = np.min(z_score)
        max_z = np.max(z_score)
        if max_z == min_z:
            standardized_col = np.full_like(z_score, 0.5, dtype=np.float64)
        else:
            standardized_col = (z_score - min_z) / (max_z - min_z)

        # 负向指标反向处理
        if metric in negative_metrics:
            standardized_col = 1 - standardized_col

        standardized_data[:, idx] = standardized_col

    standardized_df = pd.DataFrame(standardized_data, columns=metrics, index=raw_data_df.index)
    return standardized_df

def cal(data):
    result = 0.6 * data['activity'] + 0.4 * data["contributors_per_participant"]
    print(result)
    return result

if __name__ == "__main__":
    # 示例仓库和指标
    repo = "AdguardTeam/AdguardFilters"  # 单个仓库地址
    metrics = ["inactive_contributors", "contributors", "participants", "bus_factor",
                "issue_resolution_duration", "change_request_resolution_duration", 
                "activity", "issue_response_time", "change_request_response_time", "openrank"]

    # 调用batch_analysis_repos获取数据
    detailed_data = batch_analysis_repos(repo, metrics)

    # 计算各参数的三个月平均值
    data = {}
    for metric in metrics:
        data_list = detailed_data[metric]
        if data_list:
            avg = sum(data_list) / len(data_list)
            data[metric] = round(avg, 2)
        else:
            data[metric] = 0

    data["contributors_per_participant"] = data['contributors'] / data['participants'] if data['participants'] != 0 else 0
    print("各参数的三个月平均值:", data)
    cal(data)
