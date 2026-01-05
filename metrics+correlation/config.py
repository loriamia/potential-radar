# config.py 配置中心
import os
from datetime import datetime, timedelta

# GitHub Trending 地址  
GITHUB_SEARCH_API = "https://api.github.com/search/repositories"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_TRENDING_URL = "https://github.com/trending"
GITHUB_URLS = [
            #     "https://github.com/search?q=stars%3A%3C100+pushed%3A%3E2025-12-01+&type=repositories",
            #    "https://github.com/search?q=stars%3A%3C100+pushed%3A%3E2025-12-01+&type=repositories&p=2",
            #    "https://github.com/search?q=stars%3A%3C100+pushed%3A%3E2025-12-01+&type=repositories&p=3",
               "https://github.com/search?q=stars%3A%3C1000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc",
               "https://github.com/search?q=stars%3A%3C1000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc&p=2",
               "https://github.com/search?q=stars%3A%3C1000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc&p=3",
            #    "https://github.com/search?q=stars%3A%3C10000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc",
            #    "https://github.com/search?q=stars%3A%3C10000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc&p=2",
            #    "https://github.com/search?q=stars%3A%3C10000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc&p=3",
            #    "https://github.com/search?q=stars%3A%3C100000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc",
            #    "https://github.com/search?q=stars%3A%3C100000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc&p=2",
            #    "https://github.com/search?q=stars%3A%3C100000+pushed%3A%3E2025-12-01+&type=repositories&s=&o=desc&p=3"
               ]

SEARCH_QUEARYS = [
                    "stars:50..100 pushed:>2025-12-01",
                    "stars:100..200 pushed:>2025-12-01",
                    "stars:200..500 pushed:>2025-12-01",
                    "stars:500...1000 pushed:>2025-12-01",
                ]

OPENDIGGER_API_URL = "https://oss.x-lab.info/open_digger/github/metrics/activity"

# 自动计算【最近3个月】时间范围，无需手动修改
# end_date = datetime.now().strftime("%Y-%m-%d")
# start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
end_date = "2025-12-29"
start_date = "2025-09-29"
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

if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"

# 超时时间
REQUEST_TIMEOUT = 20

# 延迟时间
REQUEST_DELAY = 1

# 结果保存路径
RESULT_SAVE_PATH = "./repo_activity_result.json"

