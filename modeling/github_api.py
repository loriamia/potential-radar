# github_spider.py 爬取github trending仓库
import requests
from bs4 import BeautifulSoup
import time
import random
import json
from config import GITHUB_URLS, HEADERS, REQUEST_TIMEOUT, REQUEST_DELAY, GITHUB_SEARCH_API, SEARCH_QUEARYS

def get_github_trending_repos():
    """
    爬取GitHub Trending页面的仓库地址
    :return: list[str] 仓库地址列表，格式：["owner/repo", ...]
    """
    repo_list = []
    for github_url in GITHUB_URLS:
        # 添加延时防止限流，随机增加0-5秒
        time.sleep(REQUEST_DELAY + random.uniform(0, 5))
        try:
            # 发送请求
            response = requests.get(
                url=github_url,
                headers=HEADERS,
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()  # 抛出请求异常

            # 解析页面
            soup = BeautifulSoup(response.text, "html.parser")
            repo_items = soup.select("article.Box-row")  # 匹配仓库卡片

            num = 0
            max_repos = 30 if "trending" in github_url else 10  # trending 取30，search 取10
            # 提取仓库地址
            for item in repo_items:
                repo_a_tag = item.select_one("h2 a")
                if repo_a_tag and num < max_repos:
                    # 清洗地址：/owner/repo → owner/repo
                    repo_path = repo_a_tag.get("href").strip("/")
                    repo_list.append(repo_path)
                    num += 1

            print(f"✅ 成功爬取到 {len(repo_list)} 个Trending仓库地址")
            

        except Exception as e:
            print(f"❌ 爬取GitHub失败: {github_url} {str(e)}")
            continue
    
    return repo_list

def get_github_repos(n: int) -> list[str]:
    """
    使用 GitHub Search API 获取前 n 个仓库地址
    返回格式：["owner/repo", ...]
    """
    repos = []
    
    per_page = 100  # GitHub API 最大值

    # 计算每个 query 应获取的仓库数量
    per_query_limit = n // len(SEARCH_QUEARYS)

    for query in SEARCH_QUEARYS:
        page = 1
        query_repos = 0  # 该 query 已获取的仓库数量
        while len(repos) < n and query_repos < per_query_limit:
            params = {
                "q": query,
                "sort": "stars",
                "order": "desc",
                "per_page": per_page,
                "page": page
            }

            time.sleep(REQUEST_DELAY)  # 控制请求频率

            resp = requests.get(
                GITHUB_SEARCH_API,
                headers=HEADERS,
                params=params,
                timeout=20
            )
            resp.raise_for_status()

            data = resp.json()
            items = data.get("items", [])

            if not items:
                break  # 没有更多结果了

            for repo in items:
                repos.append(repo["full_name"])
                # print(f"✅ 获取仓库：{repo['full_name']}")
                query_repos += 1
                if len(repos) >= n or query_repos >= per_query_limit:
                    break

            page += 1

    with open("repos_snapshot.json", "w") as f:
        json.dump(repos, f, indent=2)
    return repos


# 测试爬虫
if __name__ == "__main__":
    # 目标GitHub搜索URL
    github_search_url = "https://github.com/search?q=stars%3A%3C100+pushed%3A%3E2025-12-01+&type=repositories"
    # 需要获取的前n个仓库（可自行修改n值，如10、20等）
    target_count = 400

    print(f"开始爬取GitHub搜索结果中前 {target_count} 个仓库...")
    repos = get_github_repos(target_count)