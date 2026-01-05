import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

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

def pca_with_metric_weight(raw_data, metrics, negative_metrics=None, n_components=None):
    """
    主成分分析核心函数：
    1.  输出主成分关于指标的权重（载荷矩阵）
    2.  将主成分权重（方差贡献率）还原为原始指标的综合权重
    3.  计算样本主成分综合得分
    参数:
        raw_data: 原始字典数据
        metrics: 动态指标数组
        negative_metrics: 负向指标列表
        n_components: 主成分数量（None/数值/比例，如0.95）
    返回:
        pca_loadings: 主成分关于指标的权重（载荷矩阵，DataFrame）
        component_variance_ratio: 主成分方差贡献率（数组）
        raw_metric_weights: 原始指标的综合权重（字典，键为指标名，值为权重）
        pca_composite_scores: 样本主成分综合得分（数组）
        standardized_df: 标准化后的指标数据
    """
    # 1. 原始数据转换为DataFrame
    raw_data_df = pd.DataFrame(raw_data)
    if negative_metrics is None:
        negative_metrics = []

    # 2. 数据标准化
    standardized_df = standardize_data(raw_data_df, metrics, negative_metrics)
    standardized_data = standardized_df.values.astype(np.float64)

    # 3. PCA建模与训练
    pca = PCA(n_components=n_components)
    pca.fit(standardized_data)

    # 4. 获取主成分相关结果
    # 主成分关于指标的权重（载荷矩阵）：每行=主成分，每列=指标，值=该指标对主成分的权重
    pca_loadings = pca.components_
    # 主成分方差贡献率（主成分的权重）
    component_variance_ratio = pca.explained_variance_ratio_
    # 主成分特征值
    component_eigenvalues = pca.explained_variance_

    # 5. 格式化主成分载荷矩阵（DataFrame，更易查看）
    pca_loadings_df = pd.DataFrame(
        pca_loadings,
        columns=metrics,
        index=[f"主成分{i+1}" for i in range(len(component_variance_ratio))]
    )

    # 6. 将主成分权重还原为原始指标的综合权重
    # 步骤1：计算标准化载荷矩阵（载荷 * 根号(特征值)，反映指标与主成分的真实相关性）
    standardized_loadings = pca_loadings.T * np.sqrt(component_eigenvalues)
    # 步骤2：以主成分方差贡献率为权重，对标准化载荷取绝对值后加权求和
    weighted_loadings = np.abs(standardized_loadings) @ component_variance_ratio
    # 步骤3：归一化得到原始指标综合权重（权重和为1）
    if np.sum(weighted_loadings) == 0:
        raw_metric_weights_arr = np.full(len(metrics), 1/len(metrics), dtype=np.float64)
    else:
        raw_metric_weights_arr = weighted_loadings / np.sum(weighted_loadings)
    # 转换为字典（方便查看指标对应权重）
    raw_metric_weights = dict(zip(metrics, raw_metric_weights_arr))

    # 7. 计算样本主成分综合得分
    # 步骤1：将样本映射到主成分空间
    sample_pca_projection = pca.transform(standardized_data)
    # 步骤2：以主成分方差贡献率为权重，加权求和得到综合得分
    pca_composite_scores = sample_pca_projection @ component_variance_ratio

    return pca_loadings_df, component_variance_ratio, raw_metric_weights, pca_composite_scores, standardized_df

if __name__ == "__main__":
    # ---------------------- 配置参数 ----------------------
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

    # 动态指标数组（可自由修改、增删指标名）
    metrics = [
        'inactive_contributors', 'contributors', 'participants', 'bus_factor',
        'issue_resolution_duration', 'change_request_resolution_duration',
        'activity', 'issue_response_time', 'change_request_response_time', 'openrank'
    ]

    # 自定义负向指标（数值越小越好，可根据需求调整）
    negative_metrics = [
        'inactive_contributors', 'issue_resolution_duration',
        'change_request_resolution_duration', 'issue_response_time',
        'change_request_response_time'
    ]

    # ---------------------- 执行PCA分析 ----------------------
    (pca_loadings_df, component_var_ratio, raw_metric_weights,
     pca_composite_scores, standardized_df) = pca_with_metric_weight(
        raw_data=raw_data,
        metrics=metrics,
        negative_metrics=negative_metrics,
        n_components=0.95  # 保留95%的原始信息，自动确定主成分数量
    )

    # ---------------------- 输出结果 ----------------------
    print("=" * 80)
    print("1. 主成分关于指标的权重（载荷矩阵）：")
    print("   说明：每行对应1个主成分，每列对应1个指标，值越大表示该指标对该主成分的贡献越大")
    print(pca_loadings_df.round(4))

    print("=" * 80)
    print("2. 主成分方差贡献率（主成分自身的权重）：")
    for i, ratio in enumerate(component_var_ratio):
        cumulative_ratio = np.sum(component_var_ratio[:i+1])
        print(f"   主成分{i+1}：方差贡献率={ratio:.6f}，累计方差贡献率={cumulative_ratio:.6f}")

    print("=" * 80)
    print("3. 原始指标的综合权重（主成分权重还原后，权重和为1）：")
    for metric, weight in sorted(raw_metric_weights.items(), key=lambda x: x[1], reverse=True):
        print(f"   {metric:<35}: {weight:.6f}")

    print("=" * 80)
    print("4. 样本主成分综合得分：")
    score_df = pd.DataFrame({
        '样本序号': [f"样本{i+1}" for i in range(len(pca_composite_scores))],
        '主成分综合得分': pca_composite_scores.round(6)
    })
    print(score_df.sort_values(by='主成分综合得分', ascending=False))

    print("=" * 80)
    print("5. 标准化后的指标数据：")
    print(standardized_df.round(4))
    print("=" * 80)