import json
import ssl
import urllib.request
import gzip
from datetime import datetime
from dateutil.relativedelta import relativedelta
import numpy as np

# =========================
# 配置
# =========================

REQUEST_TIMEOUT = 10
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# 使用你已经验证过的 Model B 权重（标准化特征）
POTENTIAL_WEIGHTS = {
    "activity_trend": 0.6717,
    "participants_trend": -0.2348,
    "bus_factor_jump": 0.1755,
    "issue_response_time_trend": 0.1356,
    "contributors_jump": 0.0100,
    "openrank_trend": 0.2
}

METRICS = [
    "activity",
    "participants",
    "contributors",
    "bus_factor",
    "issue_response_time",
    "openrank"
]

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
    potential = 0.0
    for k, w in POTENTIAL_WEIGHTS.items():
        potential += w * trending_data.get(k, 0.0)

    potential = (round(float(potential), 4) + 1) * 100

    return detailed_data, trending_data, potential
