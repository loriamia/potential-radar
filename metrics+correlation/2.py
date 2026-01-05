import json
import ssl
import urllib.request
import gzip
import os
from typing import Dict, Optional

# ========================
# 基本配置
# ========================

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

REQUEST_TIMEOUT = 20
EPSILON = 1e-6

# 站在这个时间点做评估
EVAL_MONTH = "2025-06"

# 未来 3 个月
FUTURE_MONTHS = ["2025-07", "2025-08", "2025-09"]

# 输入 & 输出文件
REPO_LIST_FILE = "repos_snapshot.json"                 # 你已有的仓库列表
LABEL_OUTPUT_FILE = "label_openrank.json"    # y 的缓存文件


# ========================
# 工具函数
# ========================

def load_json(path: str, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def fetch_openrank(repo_full_name: str) -> Dict[str, float]:
    """
    拉取一个仓库的 openrank 全时间序列
    返回：{ "YYYY-MM": value }
    """
    owner, repo = repo_full_name.split("/")
    url = f"https://oss.open-digger.cn/github/{owner}/{repo}/openrank.json"

    ssl_context = ssl._create_unverified_context()
    request = urllib.request.Request(url, headers=HEADERS)

    with urllib.request.urlopen(
        request,
        context=ssl_context,
        timeout=REQUEST_TIMEOUT
    ) as response:
        raw_data = response.read()
        if response.headers.get("Content-Encoding") == "gzip":
            raw_data = gzip.decompress(raw_data)

        data = json.loads(raw_data.decode("utf-8"))

        if "avg" in data and isinstance(data["avg"], dict):
            return data["avg"]

        if isinstance(data, dict):
            return data

        raise ValueError("Invalid openrank data format")


def get_openrank_by_month(
    openrank_series: Dict[str, float],
    month: str
) -> Optional[float]:
    return openrank_series.get(month)


# ========================
# 主流程
# ========================

def main():
    repos = load_json(REPO_LIST_FILE, [])
    label_cache = load_json(LABEL_OUTPUT_FILE, [])
    # 已计算过的 repo 集合（避免重复）
    computed_repos = {item["repo"] for item in label_cache}

    # print(f"📦 已缓存 {len(computed_repos)} 个 repo 的 y")

    for repo in repos:
        if repo in computed_repos:
            continue

        # print(f"🔍 处理 {repo}")

        try:
            openrank_series = fetch_openrank(repo)

            openrank_t = get_openrank_by_month(openrank_series, EVAL_MONTH)
            openrank_t3 = get_openrank_by_month(openrank_series, FUTURE_MONTHS[-1])

            if openrank_t is None or openrank_t3 is None:
                # print(f"⚠️ 缺少关键月份 openrank，跳过 {repo}")
                continue

            y_growth = (openrank_t3 - openrank_t) / max(openrank_t, EPSILON)

            record = {
                "repo": repo,
                "t": EVAL_MONTH,
                "openrank_t": round(openrank_t, 4),
                "openrank_t_plus_3": round(openrank_t3, 4),
                "y_growth": round(y_growth, 6)
            }

            label_cache.append(record)
            save_json(LABEL_OUTPUT_FILE, label_cache)

            print(f"✅ y = {record['y_growth']}")

        except Exception as e:
            print(f"❌ {repo} 处理失败: {e}")

    print(f"\n🎉 完成，共生成 {len(label_cache)} 条 label")


if __name__ == "__main__":
    main()
