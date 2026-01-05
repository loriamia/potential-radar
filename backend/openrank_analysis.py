# opendigger_analysis.py 调用OpenDigger分析仓库活跃度
import json
import ssl
import urllib.request
import gzip
from config import HEADERS, REQUEST_TIMEOUT, TIME_RANGE, REQUEST_DELAY

def get_repo_metric(repo_full_name: str, metric: str):
    """
    调用OpenDigger API，获取单个仓库的指定指标值
    修复SSL报错 + 失败自动重试 + 关闭SSL校验
    :param repo_full_name: 仓库地址，格式 owner/repo
    :param metric: 指标名称，如 'activity', 'stars' 等
    :return: float 平均值或总值，无数据返回0
    """
    result = 0.0
    owner, repo = repo_full_name.split('/')  # 拆分所有者和仓库名
    # 构造数据接口 URL
    url = f"https://oss.open-digger.cn/github/{owner}/{repo}/{metric}.json"
    
    # 处理 SSL 证书问题（避免部分环境访问失败）
    ssl_context = ssl._create_unverified_context()
    
    # 从TIME_RANGE解析起始和结束日期（仅保留年月部分用于比较）
    start_date, end_date = TIME_RANGE.split(',')
    start_date = start_date[:7]  # 取"YYYY-MM"部分
    end_date = end_date[:7]
    
    # 失败重试机制
    try:
        # 构造请求对象并添加头信息
        request = urllib.request.Request(url, headers=HEADERS)
        
        # 发起请求并读取数据
        with urllib.request.urlopen(
            request, 
            context=ssl_context,
            timeout=REQUEST_TIMEOUT,
        ) as response:
            if response.getcode() != 200:
                raise Exception(f"请求失败，状态码：{response.getcode()}")
            
            # 读取数据，可能压缩
            raw_data = response.read()
            if response.headers.get('Content-Encoding') == 'gzip':
                raw_data = gzip.decompress(raw_data)
            
            # 解析 JSON 数据
            data = json.loads(raw_data.decode("utf-8"))
            
            # 根据指标处理数据
            if isinstance(data, dict):
                    # 检查是否有嵌套的 avg 键
                    time_data = data.get("avg", data)
                    if isinstance(time_data, dict):
                        # 时间序列数据，提取指定时间范围内的值
                        values = []
                        for date_key, value in time_data.items():
                            if '-' in date_key and len(date_key) == 7:  # YYYY-MM format
                                if start_date <= date_key <= end_date:
                                    values.append(value)
                        return values  # 返回近三个月的数据列表
                    else:
                        return [time_data] if isinstance(time_data, (int, float)) else []
            
            return []

    except Exception as e:
            print(f"❌ 仓库 {repo_full_name} {metric} 分析失败: {str(e)}")
            return None

# 其余代码保持不变...
def batch_analysis_repos(repo: str, metrics: list):
    """
    分析单个仓库，返回按指标分组的数据
    :param repo: 仓库地址，格式 owner/repo
    :param metrics: 指标名称列表，如 ['activity', 'stars']
    :return: dict 键为指标，值为该指标的值列表（近三个月数据）
    """
    result = {metric: [] for metric in metrics}
    for metric in metrics:
        value = get_repo_metric(repo, metric)
        if value is not None:
            result[metric] = value  # 直接赋值列表
    return result

if __name__ == "__main__":
    test_repo = "AdguardTeam/AdguardFilters"
    metrics = ["issue_response_time", "activity", "change_request_response_time", "openrank"]  # 示例指标数组
    results = {}
    for metric in metrics:
        value = get_repo_metric(test_repo, metric)
        # results[metric] = value", 
        print(f"仓库 {test_repo} {metric}: {value}")