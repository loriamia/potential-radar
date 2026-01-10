import json
import ssl
import urllib.request
import gzip
from datetime import datetime
from dateutil.relativedelta import relativedelta
from config import POTENTIAL_WEIGHTS, METRICS

# =========================
# 配置
# =========================

REQUEST_TIMEOUT = 10
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


# =========================
# 工具函数
# =========================

def last_n_months(n=6):
    end = datetime.now().replace(day=1)
    months = []
    for i in range(n):
        m = end - relativedelta(months=n - i)
        months.append(m.strftime("%Y-%m"))
    return months


def fetch_metric(repo, metric, months):
    owner, name = repo.split("/")
    url = f"https://oss.open-digger.cn/github/{owner}/{name}/{metric}.json"

    ssl_context = ssl._create_unverified_context()
    request = urllib.request.Request(url, headers=HEADERS)

    with urllib.request.urlopen(request, context=ssl_context, timeout=REQUEST_TIMEOUT) as resp:
        raw = resp.read()
        if resp.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)

        data = json.loads(raw.decode("utf-8"))

    time_series = data.get("avg", data)
    values = []

    for m in months:
        values.append(float(time_series.get(m, 0)))

    return values


# =========================
# 指标计算
# =========================

def calc_trend(values):
    if len(values) < 2:
        return 0.0
    return (values[-1] - values[0]) / (abs(values[0]) + 1e-6)


def calc_jump(values):
    if len(values) < 2:
        return 0.0
    return int(values[-1] > values[0])


# 新增：按切片计算单轮趋势数据
def calculate_trending_data_by_slice(detailed_data, slice_len):
    """
    根据切片长度计算趋势数据
    :param detailed_data: 原始详细指标数据
    :param slice_len: 切片长度（取前slice_len个数据）
    :return: 该切片对应的趋势数据
    """
    trending_data = {
        "activity_trend": calc_trend(detailed_data["activity"][:slice_len]),
        "participants_trend": calc_trend(detailed_data["participants"][:slice_len]),
        "contributors_jump": calc_jump(detailed_data["contributors"][:slice_len]),
        "bus_factor_jump": calc_jump(detailed_data["bus_factor"][:slice_len]),
        "issue_response_time_trend": -calc_trend(detailed_data["issue_response_time"][:slice_len]),
        "openrank_trend": calc_trend(detailed_data["openrank"][:slice_len])
    }
    return trending_data

# 新增：计算单轮潜力值
def calculate_single_potential(trending_data):
    """计算单个切片对应的潜力值"""
    potential = 0.0
    for k, w in POTENTIAL_WEIGHTS.items():
        potential += w * trending_data.get(k, 0.0)
    potential = (round(float(potential), 4) + 1) * 100
    return potential

# =========================
# 核心对外函数
# =========================

def compute_repo_potential(repo: str):
    months = last_n_months(6)

    detailed_data = {}
    for metric in METRICS:
        detailed_data[metric] = fetch_metric(repo, metric, months)

    # trending_data（与你之前实验一致）
    trending_data = {
        "activity_trend": calc_trend(detailed_data["activity"]),
        "participants_trend": calc_trend(detailed_data["participants"]),
        "contributors_jump": calc_jump(detailed_data["contributors"]),
        "bus_factor_jump": calc_jump(detailed_data["bus_factor"]),
        "issue_response_time_trend": -calc_trend(detailed_data["issue_response_time"]),
        "openrank_trend": calc_trend(detailed_data["openrank"])
    }

    # 潜力值（线性模型）
    # potential = 0.0
    # for k, w in POTENTIAL_WEIGHTS.items():
    #     potential += w * trending_data.get(k, 0.0)

        # 初始化潜力值数组，第一个元素为null
    potential_array = [None]
    # 获取数据长度（默认6个月）
    data_length = len(months)
    
    # 从第二个元素开始计算（切片长度从2到data_length）
    for slice_len in range(2, data_length + 1):
        # 计算当前切片的趋势数据
        trending_data = calculate_trending_data_by_slice(detailed_data, slice_len)
        # 计算当前切片对应的潜力值
        single_potential = calculate_single_potential(trending_data)
        # 加入潜力值数组
        potential_array.append(single_potential)

    # potential = (round(float(potential), 4) + 1) * 100

    return detailed_data, trending_data, potential_array
