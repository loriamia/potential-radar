# config.py 配置中心
import os
from datetime import datetime, timedelta

# GitHub Trending 地址 
OPENDIGGER_API_URL = "https://oss.x-lab.info/open_digger/github/metrics/activity"

# 自动计算【最近3个月】时间范围，无需手动修改
end_date = datetime.now().strftime("%Y-%m-%d")
start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
# end_date = "2025-12-29"
# start_date = "2025-09-29"
TIME_RANGE = f"{start_date},{end_date}"

# 请求头，防爬+模拟浏览器 (补全配置，防止被拦截)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept": "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache"
}

# 超时时间
REQUEST_TIMEOUT = 20

# 延迟时间
REQUEST_DELAY = 1

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

QWEN_API_KEY = 'sk-e507bc9960a14a82a84a361961767157'
QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"