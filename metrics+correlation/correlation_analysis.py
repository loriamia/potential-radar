# correlation_analysis.py 相关性分析
import numpy as np

def analyze_correlations(metrics: list, result: dict):
    """
    分析各指标数组与最后一个指标的相关性
    :param metrics: 指标名称列表
    :param result: 字典，键为指标，值为该指标的值列表
    :return: dict 相关性结果，键为指标，值为与最后一个指标的相关系数
    """
    if len(metrics) < 2:
        print("❌ 指标数量不足，无法计算相关性")
        return {}
    
    last_metric = metrics[-1]
    last_values = np.array(result[last_metric])
    
    correlations = {}
    for metric in metrics[:-1]:  # 排除最后一个
        values = np.array(result[metric])
        if len(values) == len(last_values) and len(values) > 1:
            corr = np.corrcoef(values, last_values)[0, 1]
            correlations[metric] = float(round(corr, 4))
        else:
            correlations[metric] = None  # 数据长度不匹配或不足
    
    return correlations