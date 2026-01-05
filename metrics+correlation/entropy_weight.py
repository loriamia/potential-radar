import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def standardize_metric_data(all_metric_data, metrics, negative_metrics=None):
    """
    独立的指标标准化函数（可灵活调整单个指标规则）
    参数:
        all_metric_data: 所有样本（含基准）的原始指标数据 (ndarray: 样本数×指标数)
        metrics: 指标名称数组
        negative_metrics: 负向指标列表（数值越小越好）
    返回:
        standardized_data: 标准化后的数据 (映射到[0,1]区间)
    """
    if negative_metrics is None:
        negative_metrics = []
    row_num, col_num = all_metric_data.shape
    standardized_data = np.zeros_like(all_metric_data, dtype=np.float64)

    # 逐指标标准化（支持单独调整某一指标规则）
    for j in range(col_num):
        metric_name = metrics[j]
        col_data = all_metric_data[:, j].copy()

        # 处理极差过大：Z-Score + [0,1]映射（兼容极值场景）
        mean_val = np.mean(col_data)
        std_val = np.std(col_data)
        if std_val == 0:
            z_score_data = np.full_like(col_data, 0.5, dtype=np.float64)
        else:
            z_score_data = (col_data - mean_val) / std_val

        # Z-Score结果映射到[0,1]区间
        min_z = np.min(z_score_data)
        max_z = np.max(z_score_data)
        if max_z == min_z:
            standardized_col = np.full_like(z_score_data, 0.5, dtype=np.float64)
        else:
            standardized_col = (z_score_data - min_z) / (max_z - min_z)

        # 负向指标反向处理（保证评价逻辑一致性）
        if metric_name in negative_metrics:
            standardized_col = 1 - standardized_col

        standardized_data[:, j] = standardized_col

    return standardized_data

def pca_base_evaluation(raw_data, metrics, base_row_idx=-1, negative_metrics=None, n_components=None):
    """
    主成分分析法（PCA）：基于基准样本的贴近度评估+指标权重计算
    参数:
        raw_data: 原始字典数据
        metrics: 动态指标数组
        base_row_idx: 基准样本索引（默认-1，最后一行）
        negative_metrics: 负向指标列表
        n_components: 主成分数量（None表示保留所有主成分，也可指定数值/比例，如0.95表示保留95%信息）
    返回:
        raw_metric_weights: 原始指标的综合权重（权重和为1）
        pca_components: PCA主成分矩阵
        explained_variance_ratio: 主成分方差贡献率
        sample_indices: 待评估样本原始索引
    """
    # 1. 数据转换与拆分（样本+基准）
    df = pd.DataFrame(raw_data)
    metric_data = df[metrics].values.astype(np.float64)
    base_idx = base_row_idx if base_row_idx != -1 else len(metric_data) - 1
    base_data = metric_data[base_idx, :]  # 最后一行基准数据
    sample_data = np.delete(metric_data, base_idx, axis=0)  # 待评估样本
    sample_indices = np.delete(df.index, base_idx)  # 样本原始索引
    row_num, col_num = sample_data.shape

    # 2. 独立标准化所有数据（含基准，保证一致性）
    all_metric_data = metric_data
    standardized_all = standardize_metric_data(all_metric_data, metrics, negative_metrics)
    standardized_sample = np.delete(standardized_all, base_idx, axis=0)
    standardized_base = standardized_all[base_idx, :]  # 标准化后的基准

    # 3. PCA建模：提取主成分+计算方差贡献率
    # 初始化PCA
    pca = PCA(n_components=n_components)
    # 对标准化后的所有数据（含基准）进行PCA拟合
    pca.fit(standardized_all)
    # 主成分矩阵（每行对应一个主成分，每列对应一个原始指标）
    pca_components = pca.components_
    # 主成分方差贡献率（体现各主成分的重要性）
    explained_variance_ratio = pca.explained_variance_ratio_
    # 将样本和基准映射到主成分空间
    sample_pca = pca.transform(standardized_sample)
    base_pca = pca.transform(standardized_base.reshape(1, -1))[0]  # 基准的主成分映射结果

    # 4. 计算原始指标的综合权重
    # 逻辑：主成分权重（方差贡献率）× 主成分与原始指标的相关性（载荷绝对值），再归一化
    # 第一步：计算主成分载荷矩阵（主成分与原始指标的皮尔逊相关系数）
    loadings = pca_components.T * np.sqrt(pca.explained_variance_)
    # 第二步：以方差贡献率为权重，计算原始指标的加权载荷（体现指标重要性）
    weighted_loadings = np.abs(loadings) @ explained_variance_ratio
    # 第三步：归一化得到原始指标的综合权重（权重和为1）
    if np.sum(weighted_loadings) == 0:
        raw_metric_weights = np.full(col_num, 1/col_num, dtype=np.float64)
    else:
        raw_metric_weights = weighted_loadings / np.sum(weighted_loadings)

    return raw_metric_weights, pca_components, explained_variance_ratio, pca.explained_variance_, sample_indices

if __name__ == "__main__":
    # 原始数据
    raw_data = {
        'inactive_contributors': [0.0, 8.5, 23.25, 13.0, 25.0, 267.0, 12.0, 46.25, 4.75, 1.5, 19.0],
        'contributors': [0.3076923076923077, 0.0, 0.5, 0.5714285714285714, 0.0, 0.6031746031746031, 0, 0.0, 0.4117647058823529, 0.6060606060606061, 0.2727272727272727],
        'participants': [3.25, 1.0, 2.0, 1.75, 3.0, 15.75, 0.0, 1.25, 8.5, 8.25, 5.5],
        'bus_factor': [1.5, 0.0, 1.33, 1.0, 1.5, 8.5, 0.0, 1.0, 3.25, 5.0, 2.75],
        'issue_resolution_duration': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 13.0, 6.02, 2.0],
        'change_request_resolution_duration': [0.0, 0.0, 0.5, 0.34, 0.0, 2.4, 0.0, 30.0, 1.53, 1.27, 4.25],
        'activity': [6.01, 0.72, 4.0, 3.46, 3.03, 32.65, 0.0, 2.1, 19.16, 21.14, 10.99],
        'issue_response_time': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 10.56, 10.68, 1.0],
        'change_request_response_time': [5.75, 0.0, 6.17, 11.78, 2.5, 8.71, 0.0, 15.0, 6.94, 9.69, 6.03],
        'openrank': [4.24, 0.0, 3.41, 0.26, 0.9, 12.88, 0.0, 0.74, 2.32, 7.34, 2.43]
    }

    # 动态指标数组（可自由增删修改）
    metrics = [
        'inactive_contributors', 'contributors', 'participants', 'bus_factor',
        'issue_resolution_duration', 'change_request_resolution_duration',
        'activity', 'issue_response_time', 'change_request_response_time', 'openrank'
    ]

    # 自定义负向指标（耗时类/无效贡献类指标）
    negative_metrics = [
        'inactive_contributors', 'issue_resolution_duration',
        'change_request_resolution_duration', 'issue_response_time',
        'change_request_response_time'
    ]

    # 执行PCA基准评估（n_components=0.95 表示保留95%的信息，也可指定具体数值如3）
    metric_weights, pca_comps, var_ratio, explained_var, sample_indices = pca_base_evaluation(
        raw_data=raw_data,
        metrics=metrics,
        base_row_idx=-1,
        negative_metrics=negative_metrics,
        n_components=0.95
    )

    # 结果排序与输出
    print("=" * 80)
    print("【PCA基准评估结果】（以最后一行为基准，贴近度越接近1越优）")
    print("1. 原始指标综合权重（权重和为1，值越大表示指标越重要）：")
    for metric, weight in zip(metrics, metric_weights):
        print(f"{metric:<35}: {weight:.6f}")

    print("=" * 80)
    print("2. 主成分方差贡献率（体现各主成分的信息占比）：")
    # 计算载荷矩阵
    loadings = pca_comps.T * np.sqrt(explained_var)
    for i, ratio in enumerate(var_ratio):
        # 找到该主成分载荷绝对值最大的指标
        max_idx = np.argmax(np.abs(loadings[:, i]))
        main_metric = metrics[max_idx]
        print(f"第{i+1}主成分 (PC{i+1}): {ratio:.6f}（累计占比: {np.sum(var_ratio[:i+1]):.6f}，主要指标: {main_metric}）")

    print("=" * 80)
    print("3. PCA主成分矩阵（每行=1个主成分，每列=1个原始指标）：")
    pca_comp_df = pd.DataFrame(
        pca_comps,
        columns=metrics,
        index=[f"第{i+1}主成分" for i in range(len(var_ratio))]
    )
    print(pca_comp_df.round(4))
    print("=" * 80)